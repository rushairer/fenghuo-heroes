import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createScenarioEvidenceTemplate,
  scenarioTemplateProgress,
} from '../src/game/scenario-evidence-template.js'

test('scenario template creates forty empty city-state slots without guessed values',()=>{
  const template=createScenarioEvidenceTemplate(189)
  assert.equal(template.scenarioYear,189)
  assert.equal(template.ownership.length,40)
  assert.equal(template.ownershipCoverage.itemCount,null)
  assert.equal(template.cityStates.length,40)
  assert.equal(template.officerAssignments.length,0)
  assert.ok(template.cityStates.every((record)=>
    record.gold===null&&record.food===null&&record.troops===null&&
    record.development===null&&record.rule===null&&record.defense===null&&
    record.training===null&&record.verified===false
  ))
})

test('scenario template progress counts only fully entered city-state records',()=>{
  const template=createScenarioEvidenceTemplate(189)
  Object.assign(template.cityStates[0],{
    gold:1,food:2,troops:3,development:4,rule:5,defense:6,training:7,
  })
  template.cityStates[1].gold=1
  template.ownership[0].factionId='liu'
  const progress=scenarioTemplateProgress(template)
  assert.equal(progress.ownershipSlots,40)
  assert.equal(progress.ownershipEntered,1)
  assert.equal(progress.cityStateSlots,40)
  assert.equal(progress.cityStatesEntered,1)
  assert.equal(progress.officerAssignments,0)
})

test('scenario template supports all target years and rejects unknown years',()=>{
  for(const year of [189,200,215]){
    assert.equal(createScenarioEvidenceTemplate(year).scenarioYear,year)
  }
  assert.throws(()=>createScenarioEvidenceTemplate(999),/Unknown target scenario/)
})
