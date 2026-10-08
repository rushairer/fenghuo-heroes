import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { scenarioRuntimeStartable } from '../src/game/scenario-runtime-support.js'
import { RUNTIME_SCAFFOLD_MAP_PROFILE } from '../src/game/runtime-map-scaffold.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'
import { completeCanonicalScenarioEvidence } from './fixtures/canonical-scenario-state.mjs'

test('production 189 scaffold remains the only runnable scenario without canonical evidence',()=>{
  assert.equal(scenarioRuntimeStartable(RUNTIME_SCAFFOLD_MAP_PROFILE,189),true)
  for(const year of [200,215,190]){
    assert.equal(scenarioRuntimeStartable(RUNTIME_SCAFFOLD_MAP_PROFILE,year),false)
  }
  // Legacy setup mocks without a profile preserve the 189-only behavior.
  assert.equal(scenarioRuntimeStartable(null,189),true)
  assert.equal(scenarioRuntimeStartable(null,200),false)
})

test('canonical map does not unlock unverified production 189/200/215 ledgers',()=>{
  const profile=buildCanonicalRuntimeMap(completeCanonicalMapEvidence())
  for(const year of [189,200,215]){
    assert.equal(scenarioRuntimeStartable(profile,year),false)
  }
})

test('each completed synthetic scenario unlocks its own canonical year, not another year',()=>{
  const profile=buildCanonicalRuntimeMap(completeCanonicalMapEvidence())
  for(const year of [189,200,215]){
    const evidence=completeCanonicalScenarioEvidence({year})
    assert.equal(scenarioRuntimeStartable(profile,year,{evidence}),true)
    const others=[189,200,215].filter((n)=>n!==year)
    for(const other of others){
      assert.equal(scenarioRuntimeStartable(profile,other,{evidence}),false)
    }
  }
})

test('unverified or incomplete ledger cannot be used to enable canonical setup',()=>{
  const profile=buildCanonicalRuntimeMap(completeCanonicalMapEvidence())
  const evidence=completeCanonicalScenarioEvidence({year:215})
  assert.equal(scenarioRuntimeStartable(profile,215,{evidence:{...evidence,ownership:[]}}),false)
  assert.equal(scenarioRuntimeStartable(profile,215,{evidence:{...evidence,cityStates:[]}}),false)
  assert.equal(scenarioRuntimeStartable(profile,215,{evidence:{...evidence,officerAssignments:[]}}),false)
  assert.equal(scenarioRuntimeStartable({id:'fake',canonical:false},215,{evidence}),false)
})
