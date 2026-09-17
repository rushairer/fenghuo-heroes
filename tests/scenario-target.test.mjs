import test from 'node:test'
import assert from 'node:assert/strict'
import { SCENARIOS } from '../src/game/data.js'
import { TARGET_SCENARIOS, runtimeScenarioSupported, scenarioRulerOptions, targetScenario } from '../src/game/scenario-target.js'

test('runtime setup uses Chinese-ROM target ruler counts rather than Japanese counts',()=>{
  assert.deepEqual(TARGET_SCENARIOS.map(({year,selectableRulerCount})=>[year,selectableRulerCount]),[
    [189,7],[200,7],[215,3],
  ])
  assert.deepEqual(SCENARIOS.map(({year,selectableRulerCount})=>[year,selectableRulerCount]),[
    [189,7],[200,7],[215,3],
  ])
})

test('189 target setup maps its seven ruler names to stable runtime faction ids',()=>{
  assert.deepEqual(scenarioRulerOptions(189),[
    {ruler:'劉備',factionId:'liu'},
    {ruler:'曹操',factionId:'cao'},
    {ruler:'孫堅',factionId:'sun'},
    {ruler:'袁紹',factionId:'yuan'},
    {ruler:'董卓',factionId:'dong'},
    {ruler:'劉表',factionId:'liu_biao'},
    {ruler:'馬騰',factionId:'ma'},
  ])
})

test('later target scenarios expose their documented Chinese ruler lists',()=>{
  assert.deepEqual(scenarioRulerOptions(200).map((item)=>item.ruler),['劉備','曹操','孫權','袁紹','劉表','馬騰','劉璋'])
  assert.deepEqual(scenarioRulerOptions(215).map((item)=>item.ruler),['劉備','曹操','孫權'])
  assert.equal(scenarioRulerOptions(200).find((item)=>item.ruler==='劉璋')?.factionId,'liu_zhang')
  assert.equal(scenarioRulerOptions(215).find((item)=>item.ruler==='孫權')?.factionId,'sun')
})

test('only 189 may start until later opening ownership is verified',()=>{
  assert.equal(runtimeScenarioSupported(189),true)
  assert.equal(runtimeScenarioSupported(200),false)
  assert.equal(runtimeScenarioSupported(215),false)
  assert.equal(targetScenario(999),null)
})
