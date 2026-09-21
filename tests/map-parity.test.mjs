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
  ZH_ROM_CITY_NAME_VARIANTS,
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


test('canonical map migration stays blocked while the evidence ledger is empty',()=>{
  const blocked=canonicalMapMigrationReadiness()
  assert.equal(blocked.ready,false)
  assert.equal(blocked.geometryReady,false)
  assert.equal(blocked.cityCoordinatesComplete,false)
  assert.equal(blocked.verifiedCityCoordinateCount,0)
  assert.equal(blocked.requiredCityCoordinateCount,40)
  assert.equal(blocked.cityNamesResolved,false)
  assert.equal(blocked.villageCoordinatesVerified,false)
  assert.equal(blocked.routeNetworkVerified,false)
})

test('canonical map migration opens only when every source-backed evidence gate is present',()=>{
  const source={id:'capture-full',kind:'direct-capture',ref:'capture-full.png'}
  const cityCoordinates=ZH_ROM_CANONICAL_CITY_SET.map((name,index)=>({
    name,
    x:(index*7)%320,
    y:(index*11)%224,
    space:'logical-320x224',
    sourceId:source.id,
    frameRef:`frame#city-${index}`,
    verified:true,
  }))
  const ownership189=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    factionId:index===0?'liu':'neutral',
    sourceId:source.id,
    frameRef:`frame#owner-${index}`,
    verified:true,
  }))
  const nameResolutions=ZH_ROM_CITY_NAME_VARIANTS
    .filter((item)=>item.status==='unresolved')
    .map((item,index)=>({
      ram:item.ram,
      numberedGuide:item.numberedGuide,
      chosen:item.ram,
      sourceId:source.id,
      frameRef:`frame#name-${index}`,
      verified:true,
    }))
  const complete={
    status:'test-fixture-complete',
    sources:[source],
    cityCoordinates,
    villages:[{x:12,y:14,space:'logical-320x224',sourceId:source.id,frameRef:'frame#village-1',verified:true}],
    villageCoverage:{sourceId:source.id,frameRef:'frame#villages',itemCount:1,verified:true},
    ownership189,
    routes:[{from:ZH_ROM_CANONICAL_CITY_SET[0],to:ZH_ROM_CANONICAL_CITY_SET[1],sourceId:source.id,frameRef:'frame#route-1',verified:true}],
    routeNetworkCoverage:{sourceId:source.id,frameRef:'frame#routes',itemCount:1,verified:true},
    nameResolutions,
  }
  const report=canonicalMapMigrationReadiness(complete)
  assert.equal(report.cityCoordinatesComplete,true)
  assert.equal(report.verifiedCityCoordinateCount,40)
  assert.equal(report.cityNamesResolved,true)
  assert.equal(report.villageCoordinatesVerified,true)
  assert.equal(report.legacyOwnership189EvidenceCount,40)
  assert.equal(report.routeNetworkVerified,true)
  assert.equal(report.geometryReady,true)
  assert.equal(report.ready,true)
})


test('canonical geometry readiness ignores legacy 189 ownership compatibility records',()=>{
  const source={id:'capture-geometry',kind:'direct-capture',ref:'capture-geometry.png'}
  const geometryOnly={
    status:'test-geometry-complete',
    sources:[source],
    cityCoordinates:ZH_ROM_CANONICAL_CITY_SET.map((name,index)=>({
      name,
      x:(index*7)%320,
      y:(index*11)%224,
      space:'logical-320x224',
      sourceId:source.id,
      frameRef:`frame#city-${index}`,
      verified:true,
    })),
    villages:[{x:12,y:14,space:'logical-320x224',sourceId:source.id,frameRef:'frame#village-1',verified:true}],
    villageCoverage:{sourceId:source.id,frameRef:'frame#villages',itemCount:1,verified:true},
    ownership189:[],
    routes:[{from:ZH_ROM_CANONICAL_CITY_SET[0],to:ZH_ROM_CANONICAL_CITY_SET[1],sourceId:source.id,frameRef:'frame#route-1',verified:true}],
    routeNetworkCoverage:{sourceId:source.id,frameRef:'frame#routes',itemCount:1,verified:true},
    nameResolutions:ZH_ROM_CITY_NAME_VARIANTS
      .filter((item)=>item.status==='unresolved')
      .map((item,index)=>({
        ram:item.ram,
        numberedGuide:item.numberedGuide,
        chosen:item.ram,
        sourceId:source.id,
        frameRef:`frame#name-${index}`,
        verified:true,
      })),
  }
  const report=canonicalMapMigrationReadiness(geometryOnly)
  assert.equal(report.geometryReady,true)
  assert.equal(report.ready,true)
  assert.equal(report.legacyOwnership189EvidenceCount,0)
})
