import test from 'node:test'
import assert from 'node:assert/strict'
import { auditScenarioEvidenceBundle } from '../src/game/scenario-evidence-audit.js'
import { createScenarioEvidenceTemplate } from '../src/game/scenario-evidence-template.js'
import { ZH_ROM_CANONICAL_CITY_SET } from '../src/game/original-data.js'

const source={id:'scenario-189',kind:'direct-capture',ref:'scenario-189.png'}

function completeEvidence(){
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
    scenarioYear:189,
    sources:[source],
    ownership,
    ownershipCoverage:{sourceId:source.id,frameRef:'frame#ownership',itemCount:40,verified:true},
    cityStates,
    cityStateCoverage:{sourceId:source.id,frameRef:'frame#cities',itemCount:40,verified:true},
    officerAssignments,
    officerCoverage:{sourceId:source.id,frameRef:'frame#officers',itemCount:2,verified:true},
  }
}

test('empty scenario template reports city-state and officer coverage blockers without fake values',()=>{
  const audit=auditScenarioEvidenceBundle(createScenarioEvidenceTemplate(189))
  assert.equal(audit.ready,false)
  assert.equal(audit.ownershipReady,false)
  assert.equal(audit.economyReady,false)
  assert.equal(audit.officerPlacementReady,false)
  assert.equal(audit.missingOwnership.length,40)
  assert.equal(audit.missingCityStates.length,40)
  assert.equal(audit.invalidCityStates.length,0)
  assert.ok(audit.blockers.includes('ownership-coverage-unverified'))
  assert.ok(audit.blockers.includes('city-state-coverage-unverified'))
  assert.ok(audit.blockers.includes('officer-placement-coverage-unverified'))
})

test('complete source-backed scenario fixture clears all audit blockers',()=>{
  const audit=auditScenarioEvidenceBundle(completeEvidence())
  assert.equal(audit.ready,true)
  assert.equal(audit.ownershipReady,true)
  assert.equal(audit.economyReady,true)
  assert.equal(audit.officerPlacementReady,true)
  assert.deepEqual(audit.blockers,[])
  assert.equal(audit.missingOwnership.length,0)
  assert.equal(audit.missingCityStates.length,0)
  assert.equal(audit.verified.ownership,40)
  assert.equal(audit.verified.cityStates,40)
  assert.equal(audit.verified.officerAssignments,2)
})

test('partially entered city state reports the exact missing numeric fields',()=>{
  const template=createScenarioEvidenceTemplate(189)
  template.sources=[source]
  template.cityStates[0]={
    ...template.cityStates[0],
    gold:100,
    sourceId:source.id,
    frameRef:'frame#partial',
    verified:true,
  }
  const audit=auditScenarioEvidenceBundle(template)
  assert.equal(audit.invalidCityStates.length,1)
  assert.equal(audit.invalidCityStates[0].city,'襄平')
  assert.ok(audit.invalidCityStates[0].errors.includes('invalid-food'))
  assert.ok(audit.invalidCityStates[0].errors.includes('invalid-troops'))
})

test('invalid officer assignment reports missing officer and unknown city independently',()=>{
  const template=createScenarioEvidenceTemplate(189)
  template.sources=[source]
  template.officerAssignments=[{
    officer:'',
    city:'北平',
    sourceId:source.id,
    frameRef:'frame#officer',
    verified:true,
  }]
  const audit=auditScenarioEvidenceBundle(template)
  assert.equal(audit.invalidOfficerAssignments.length,1)
  assert.ok(audit.invalidOfficerAssignments[0].errors.includes('missing-officer'))
  assert.ok(audit.invalidOfficerAssignments[0].errors.includes('unknown-city'))
})


test('partially entered ownership reports missing faction without counting the city as verified',()=>{
  const template=createScenarioEvidenceTemplate(189)
  template.sources=[source]
  template.ownership[0]={
    ...template.ownership[0],
    sourceId:source.id,
    frameRef:'frame#owner-partial',
    verified:true,
  }
  const audit=auditScenarioEvidenceBundle(template)
  assert.equal(audit.invalidOwnership.length,1)
  assert.equal(audit.invalidOwnership[0].city,'襄平')
  assert.ok(audit.invalidOwnership[0].errors.includes('missing-faction'))
  assert.equal(audit.verified.ownership,0)
  assert.equal(audit.ownershipReady,false)
})
