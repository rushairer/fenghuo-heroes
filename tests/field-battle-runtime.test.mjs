import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ensureFieldBattleRuntime,
  fieldBattleRuntimeSnapshot,
  reopenFieldBattleOrders,
  setFieldBattleOrder,
  setFieldBattlePhase,
  setFieldBattleSpeed,
} from '../src/game/field-battle-runtime.js'

function conflict(){return {kind:'field'}}

test('field battle runtime starts at speed selection and persists phase speed and command',()=>{
  const value=conflict()
  assert.deepEqual(fieldBattleRuntimeSnapshot(value),{
    phase:'speed',speed:null,order:null,ordersClosed:false,commandEpoch:0,
  })
  setFieldBattleSpeed(value,'fast')
  setFieldBattlePhase(value,'formation')
  setFieldBattlePhase(value,'battle')
  setFieldBattleOrder(value,{commandId:'wait'})
  assert.deepEqual(fieldBattleRuntimeSnapshot(value),{
    phase:'battle',speed:'fast',order:{commandId:'wait'},ordersClosed:false,commandEpoch:0,
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
  })
})
