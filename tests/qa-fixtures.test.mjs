import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  BATTLE_VISUAL_QA_STATES,
  MARCH_VISUAL_QA_STATES,
  clearVisualQaFixture,
  prepareVisualQaStore,
  qaEnemyCity,
  qaOwnedCity,
} from '../src/game/qa-fixtures.js'

function store(){
  const value=new GameStore(null)
  value.newGame({scenarioYear:189,humanFactions:['liu']})
  return value
}

test('march QA fixtures switch to the even-month march phase without inventing battle state',()=>{
  for(const qaState of MARCH_VISUAL_QA_STATES.slice(0,3)){
    const value=store()
    assert.equal(prepareVisualQaStore(value,qaState),true)
    assert.equal(value.state.month,2)
    assert.equal(value.mode,'march')
    assert.equal(value.pendingConflict,null)
  }
})

test('army-menu QA fixture creates a clearly marked local-only army',()=>{
  const value=store()
  assert.equal(prepareVisualQaStore(value,'army-menu'),true)
  const army=value.state.armies.find((item)=>item.id==='qa-army')
  assert.ok(army)
  assert.equal(army.qaFixture,true)
  assert.equal(army.faction,'liu')
  assert.equal(value.pendingConflict,null)
})

test('battle QA fixtures seed only the minimum conflict shape required by siege and duel scenes',()=>{
  for(const qaState of BATTLE_VISUAL_QA_STATES){
    const value=store()
    assert.equal(prepareVisualQaStore(value,qaState),true)
    assert.equal(value.state.month,2)
    assert.equal(value.pendingConflict?.qaFixture,true)
    assert.equal(value.pendingConflict?.kind,'siege')
    assert.ok(value.pendingConflict?.target)
    assert.notEqual(value.pendingConflict?.attacker,value.pendingConflict?.defender)
  }
})

test('fixture city selection uses runtime ownership only and makes no canonical-map claim',()=>{
  const value=store()
  const owned=qaOwnedCity(value)
  const enemy=qaEnemyCity(value)
  assert.equal(value.state.cities[owned.id].owner,'liu')
  assert.notEqual(value.state.cities[enemy.id].owner,'liu')
})

test('QA fixtures can be removed without touching ordinary game state',()=>{
  const value=store()
  prepareVisualQaStore(value,'duel-mode')
  clearVisualQaFixture(value)
  assert.equal(value.pendingConflict,null)
  assert.equal(value.state.armies.some((army)=>army.qaFixture),false)
  assert.equal(value.hasGame(),true)
})
