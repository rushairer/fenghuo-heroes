import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SIEGE_RUNTIME_EVIDENCE,
  ensureSiegeRuntime,
  queueSiegeAttackIntent,
  setSiegePhase,
  setSiegeSpeed,
  siegeRuntimeSnapshot,
} from '../src/game/siege-runtime.js'

function conflict(){
  return {kind:'siege',defenderDefense:42}
}

test('siege runtime persists preparation speed and defense snapshot',()=>{
  const value=conflict()
  assert.deepEqual(siegeRuntimeSnapshot(value),{
    phase:'speed',
    speed:null,
    attackOrders:0,
    defenseRateSnapshot:42,
    lastAttackIntent:null,
  })
  setSiegeSpeed(value,'fast')
  setSiegePhase(value,'formation')
  setSiegePhase(value,'siege')
  assert.equal(ensureSiegeRuntime(value).speed,'fast')
  assert.equal(ensureSiegeRuntime(value).phase,'siege')
})

test('siege attack records semantic intent without fabricating defense loss or entry probability',()=>{
  const value=conflict()
  setSiegePhase(value,'siege')
  const first=queueSiegeAttackIntent(value)
  const second=queueSiegeAttackIntent(value)
  assert.deepEqual(first,{
    sequence:1,
    effect:'lower-defense-rate',
    numericDelta:null,
    entryBattleProbability:null,
  })
  assert.equal(second.sequence,2)
  assert.equal(value.runtime.defenseRateSnapshot,42)
  assert.equal(SIEGE_RUNTIME_EVIDENCE.numericDefenseDelta,'unverified')
  assert.equal(SIEGE_RUNTIME_EVIDENCE.entryBattleProbability,'unverified')
})

test('siege attack is unavailable before entering siege phase',()=>{
  const value=conflict()
  assert.throws(()=>queueSiegeAttackIntent(value),/尚未進入攻城階段/)
})
