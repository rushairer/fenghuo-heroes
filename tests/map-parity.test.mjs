import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES } from '../src/game/data.js'
import {
  RUNTIME_MAP_PARITY,
  assertRuntimeMapNotClaimedCanonical,
  canonicalMapMigrationReadiness,
  runtimeMapParityReport,
} from '../src/game/map-parity.js'
import {
  ZH_189_START_CITY_EVIDENCE,
  ZH_ROM_CANONICAL_CITY_SET,
} from '../src/game/original-data.js'

test('runtime map is explicitly quarantined as a provisional scaffold',()=>{
  assert.equal(RUNTIME_MAP_PARITY.parityComplete,false)
  assert.equal(RUNTIME_MAP_PARITY.cityIdentity,'provisional-scaffold')
  assert.equal(RUNTIME_MAP_PARITY.geometry,'provisional-scaffold')
  assert.equal(RUNTIME_MAP_PARITY.ownership189,'provisional-scaffold')
})

test('runtime scaffold city identities demonstrably differ from the Chinese-ROM target',()=>{
  const report=runtimeMapParityReport()
  assert.equal(CITIES.length,40)
  assert.equal(ZH_ROM_CANONICAL_CITY_SET.length,40)
  assert.equal(report.cityIdentityMatchesTarget,false)
  for(const fakeOfTarget of ['北平','南皮','鄴','平原'])assert.ok(report.unexpectedRuntime.includes(fakeOfTarget))
  for(const requiredTarget of ['代縣','信都','濮陽','番禺','龍編'])assert.ok(report.missingTarget.includes(requiredTarget))
  assert.deepEqual(assertRuntimeMapNotClaimedCanonical(),report)
})

test('evidence layer records Liu Bei at Dai County without forcing that fact onto the wrong geometry',()=>{
  assert.deepEqual(ZH_189_START_CITY_EVIDENCE.map(({factionId,ruler,city,evidence})=>({factionId,ruler,city,evidence})),[
    {factionId:'liu',ruler:'劉備',city:'代縣',evidence:'observed-play-record'},
  ])
  const runtimeLiuCities=CITIES.filter((city)=>city.owner==='liu').map((city)=>city.name)
  assert.equal(runtimeLiuCities.includes('代縣'),false)
})


test('canonical map migration cannot open before every evidence gate is satisfied',()=>{
  const blocked=canonicalMapMigrationReadiness()
  assert.equal(blocked.ready,false)
  assert.equal(blocked.cityCoordinatesComplete,false)
  assert.equal(blocked.verifiedCityCoordinateCount,0)
  assert.equal(blocked.requiredCityCoordinateCount,40)
  assert.equal(blocked.cityNamesResolved,false)
  assert.equal(blocked.villageCoordinatesVerified,false)
  assert.equal(blocked.ownership189Verified,false)

  const syntheticCoordinates=ZH_ROM_CANONICAL_CITY_SET.map((name,index)=>({
    name,
    x:index,
    y:index+1,
  }))
  const stillBlocked=canonicalMapMigrationReadiness({
    cityCoordinates:syntheticCoordinates,
    villageCoordinatesVerified:true,
    ownership189Verified:true,
  })
  assert.equal(stillBlocked.cityCoordinatesComplete,true)
  assert.equal(stillBlocked.ready,false)
  assert.ok(stillBlocked.unresolvedNameVariants.length>=2)
})
