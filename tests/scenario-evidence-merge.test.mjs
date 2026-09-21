import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeScenarioEvidenceBundles } from '../src/game/scenario-evidence-merge.js'
import { createScenarioEvidenceTemplate } from '../src/game/scenario-evidence-template.js'

test('merge combines separate ownership city-state and officer batches for one scenario',()=>{
  const ownership=createScenarioEvidenceTemplate(189)
  ownership.sources=[{id:'owner-cap',kind:'direct-capture',ref:'owner.png'}]
  ownership.ownership[0]={
    ...ownership.ownership[0],
    factionId:'liu',
    sourceId:'owner-cap',
    frameRef:'owner#1',
    verified:true,
  }

  const state=createScenarioEvidenceTemplate(189)
  state.sources=[{id:'state-cap',kind:'direct-capture',ref:'state.png'}]
  state.cityStates[0]={
    ...state.cityStates[0],
    gold:100,food:200,troops:3000,development:40,rule:70,defense:30,training:35,
    sourceId:'state-cap',
    frameRef:'state#1',
    verified:true,
  }

  const officers={
    scenarioYear:189,
    status:'capture-in-progress',
    sources:[{id:'officer-cap',kind:'direct-capture',ref:'officers.png'}],
    officerAssignments:[{
      officer:'劉備',
      role:'ruler',
      city:'襄平',
      sourceId:'officer-cap',
      frameRef:'officer#liu',
      verified:true,
    }],
  }

  const merged=mergeScenarioEvidenceBundles(ownership,state,officers)
  assert.equal(merged.scenarioYear,189)
  assert.equal(merged.ownership.length,40)
  assert.equal(merged.cityStates.length,40)
  assert.equal(merged.ownership[0].factionId,'liu')
  assert.equal(merged.cityStates[0].gold,100)
  assert.deepEqual(merged.officerAssignments,[{
    officer:'劉備',
    role:'ruler',
    city:'襄平',
    sourceId:'officer-cap',
    frameRef:'officer#liu',
    verified:true,
  }])
  assert.equal(merged.sources.length,3)
})

test('merge promotes verification only when substantive scenario evidence agrees',()=>{
  const a=createScenarioEvidenceTemplate(189)
  const b=createScenarioEvidenceTemplate(189)
  a.ownership[0]={...a.ownership[0],factionId:'liu',sourceId:'cap',frameRef:'cap#1',verified:false}
  b.ownership[0]={...b.ownership[0],factionId:'liu',sourceId:'cap',frameRef:'cap#1',verified:true}
  const merged=mergeScenarioEvidenceBundles(a,b)
  assert.equal(merged.ownership[0].verified,true)
})

test('merge rejects contradictory ownership or city-state values for the same city',()=>{
  const a=createScenarioEvidenceTemplate(189)
  const b=createScenarioEvidenceTemplate(189)
  a.ownership[0]={...a.ownership[0],factionId:'liu'}
  b.ownership[0]={...b.ownership[0],factionId:'cao'}
  assert.throws(()=>mergeScenarioEvidenceBundles(a,b),/merge conflict/)

  const c=createScenarioEvidenceTemplate(189)
  const d=createScenarioEvidenceTemplate(189)
  c.cityStates[0]={...c.cityStates[0],gold:100}
  d.cityStates[0]={...d.cityStates[0],gold:101}
  assert.throws(()=>mergeScenarioEvidenceBundles(c,d),/merge conflict/)
})

test('merge rejects one officer assigned to conflicting cities or roles',()=>{
  const a={
    scenarioYear:189,
    officerAssignments:[{officer:'甲',role:'ruler',city:'代縣',verified:false}],
  }
  const b={
    scenarioYear:189,
    officerAssignments:[{officer:'甲',role:'officer',city:'信都',verified:false}],
  }
  assert.throws(()=>mergeScenarioEvidenceBundles(a,b),/officer:甲/)
})

test('merge refuses cross-scenario batches',()=>{
  assert.throws(
    ()=>mergeScenarioEvidenceBundles(
      createScenarioEvidenceTemplate(189),
      createScenarioEvidenceTemplate(200),
    ),
    /exactly one scenario year/,
  )
})

test('merge never keeps compiled ready status as editable evidence status',()=>{
  const bundle=createScenarioEvidenceTemplate(189)
  bundle.status='ready-for-scenario-start'
  const merged=mergeScenarioEvidenceBundles(bundle)
  assert.equal(merged.status,'capture-in-progress')
})
