import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canonicalScenarioReadinessReport,
  canonicalScenarioStartReadiness,
} from '../src/game/scenario-parity.js'
import { ZH_ROM_CANONICAL_CITY_SET } from '../src/game/original-data.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'


function completeScenarioEvidence(year=189){
  const source={id:`scenario-${year}`,kind:'direct-capture',ref:`scenario-${year}.png`}
  const ownership=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    factionId:index===0?'liu':index===1?'cao':'neutral',
    sourceId:source.id,
    frameRef:`frame#owner-${index}`,
    verified:true,
  }))
  const cityStates=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    gold:100+index,
    food:200+index,
    troops:3000+index,
    development:40+index,
    rule:70,
    defense:30,
    training:35,
    sourceId:source.id,
    frameRef:`frame#city-${index}`,
    verified:true,
  }))
  const officerAssignments=[
    {officer:'關羽',city:'代縣',sourceId:source.id,frameRef:'frame#officer-1',verified:true},
    {officer:'張飛',city:'代縣',sourceId:source.id,frameRef:'frame#officer-2',verified:true},
  ]
  return {
    status:'test-complete',
    scenarioYear:year,
    sources:[source],
    ownership,
    ownershipCoverage:{sourceId:source.id,frameRef:'frame#ownership',itemCount:40,verified:true},
    cityStates,
    cityStateCoverage:{sourceId:source.id,frameRef:'frame#cities',itemCount:40,verified:true},
    officerAssignments,
    officerCoverage:{sourceId:source.id,frameRef:'frame#officers',itemCount:2,verified:true},
  }
}

test('189 remains blocked until scenario ownership, economy and officer placement are captured',()=>{
  const evidence=completeCanonicalMapEvidence()
  const report=canonicalScenarioStartReadiness(189,evidence)
  assert.equal(report.mapGeometryReady,true)
  assert.equal(report.ownershipReady,false)
  assert.equal(report.economyReady,false)
  assert.equal(report.officerPlacementReady,false)
  assert.equal(report.ready,false)
  assert.ok(report.blockers.includes('ownership-189-unverified'))
  assert.ok(report.blockers.includes('city-economy-189-unverified'))
  assert.ok(report.blockers.includes('officer-placement-189-unverified'))
})

test('200 and 215 cannot inherit 189 ownership',()=>{
  const evidence=completeCanonicalMapEvidence()
  for(const year of [200,215]){
    const report=canonicalScenarioStartReadiness(year,evidence)
    assert.equal(report.ownershipReady,false)
    assert.equal(report.ownershipEvidenceStatus,'incomplete')
    assert.ok(report.blockers.includes(`ownership-${year}-unverified`))
  }
})

test('scenario readiness report covers all three Chinese-ROM target scenarios',()=>{
  const report=canonicalScenarioReadinessReport(completeCanonicalMapEvidence())
  assert.deepEqual(report.map((item)=>item.year),[189,200,215])
  assert.ok(report.every((item)=>item.ready===false))
})


test('189 readiness opens only when map, ownership, city-state and officer evidence are all complete',()=>{
  const mapEvidence=completeCanonicalMapEvidence()
  const scenarioEvidence=completeScenarioEvidence(189)
  const report=canonicalScenarioStartReadiness(189,mapEvidence,scenarioEvidence)
  assert.equal(report.mapGeometryReady,true)
  assert.equal(report.ownershipReady,true)
  assert.equal(report.ownershipEvidenceCount,40)
  assert.equal(report.economyReady,true)
  assert.equal(report.officerPlacementReady,true)
  assert.equal(report.cityStateEvidenceCount,40)
  assert.equal(report.officerAssignmentEvidenceCount,2)
  assert.equal(report.ready,true)
  assert.deepEqual(report.blockers,[])
})

test('200 can open its scenario gate from independent ownership/economy/officer evidence',()=>{
  const report=canonicalScenarioStartReadiness(
    200,
    completeCanonicalMapEvidence(),
    completeScenarioEvidence(200),
  )
  assert.equal(report.ownershipReady,true)
  assert.equal(report.ownershipEvidenceStatus,'source-backed-200')
  assert.equal(report.economyReady,true)
  assert.equal(report.officerPlacementReady,true)
  assert.equal(report.ready,true)
  assert.deepEqual(report.blockers,[])
})
