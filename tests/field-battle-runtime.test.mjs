import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ensureFieldBattleRuntime,
  advanceFieldBattleDayRuntime,
  fieldBattleRuntimeSnapshot,
  reopenFieldBattleOrders,
  setFieldBattleAmbush,
  setFieldBattleOrder,
  setFieldBattlePhase,
  setFieldBattleSpeed,
} from '../src/game/field-battle-runtime.js'

function conflict(){return {kind:'field'}}

test('field battle runtime starts at speed selection and persists phase speed and command',()=>{
  const value=conflict()
  assert.deepEqual(fieldBattleRuntimeSnapshot(value),{
    phase:'speed',speed:null,order:null,ordersClosed:false,commandEpoch:0,
    day:1,carryoverPending:false,ambush:false,
  })
  setFieldBattleSpeed(value,'fast')
  setFieldBattlePhase(value,'formation')
  setFieldBattlePhase(value,'battle')
  setFieldBattleOrder(value,{commandId:'wait'})
  assert.deepEqual(fieldBattleRuntimeSnapshot(value),{
    phase:'battle',speed:'fast',order:{commandId:'wait'},ordersClosed:false,commandEpoch:0,
    day:1,carryoverPending:false,ambush:false,
  })
})

test('end command closes ordering until a future calibrated battle-day boundary reopens it',()=>{
  const value=conflict()
  setFieldBattleOrder(value,{commandId:'end'})
  assert.equal(ensureFieldBattleRuntime(value).ordersClosed,true)
  reopenFieldBattleOrders(value)
  assert.equal(ensureFieldBattleRuntime(value).ordersClosed,false)
  assert.equal(ensureFieldBattleRuntime(value).commandEpoch,1)
})

test('invalid saved runtime values are sanitized instead of becoming fabricated commands',()=>{
  const value={kind:'field',runtime:{phase:'invented',speed:'warp',order:{commandId:'nuke'},ordersClosed:true,commandEpoch:-9}}
  assert.deepEqual(fieldBattleRuntimeSnapshot(value),{
    phase:'speed',speed:null,order:null,ordersClosed:true,commandEpoch:0,
    day:1,carryoverPending:false,ambush:false,
  })
})


test('battle-day runtime carries at observed day thirty without assigning a winner',()=>{
  const value=conflict()
  value.runtime={day:29,phase:'battle',speed:'normal',order:{commandId:'end'},ordersClosed:true}
  const state=advanceFieldBattleDayRuntime(value,1)
  assert.equal(state.day,30)
  assert.equal(state.shouldReturnToStrategy,true)
  assert.equal(value.runtime.carryoverPending,true)
  assert.equal(value.runtime.ordersClosed,true)
  assert.equal('winner' in value.runtime,false)
})

test('next battle day reopens commands and clears transient order and ambush before day thirty',()=>{
  const value=conflict()
  value.runtime={day:4,phase:'battle',speed:'normal',order:{commandId:'wait'},ordersClosed:true,ambush:true,commandEpoch:2}
  const state=advanceFieldBattleDayRuntime(value,1)
  assert.equal(state.day,5)
  assert.equal(value.runtime.ordersClosed,false)
  assert.equal(value.runtime.order,null)
  assert.equal(value.runtime.ambush,false)
  assert.equal(value.runtime.commandEpoch,3)
  setFieldBattleAmbush(value,true)
  assert.equal(value.runtime.ambush,true)
})
