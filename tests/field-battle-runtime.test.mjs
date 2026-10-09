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

test('end command closes ordering; legacy reopen must actually advance a day',()=>{
  const value={kind:'field',runtime:{phase:'battle',speed:'normal',day:1}}
  assert.throws(()=>reopenFieldBattleOrders(value),/先結束本日命令/)
  setFieldBattleOrder(value,{commandId:'end'})
  assert.equal(ensureFieldBattleRuntime(value).ordersClosed,true)
  reopenFieldBattleOrders(value)
  assert.equal(ensureFieldBattleRuntime(value).day,2)
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

test('runtime rejects unclosed-day advancement and preserves current battle day',()=>{
  const value={kind:'field',runtime:{phase:'battle',speed:'normal',day:7}}
  const before=fieldBattleRuntimeSnapshot(value)
  assert.throws(()=>advanceFieldBattleDayRuntime(value,1),/先結束本日命令/)
  assert.deepEqual(fieldBattleRuntimeSnapshot(value),before)
  assert.throws(()=>advanceFieldBattleDayRuntime(value,0),/每次只能/)
  assert.throws(()=>advanceFieldBattleDayRuntime(value,2),/每次只能/)
  assert.equal(value.runtime.day,7)
})

test('end order prevents bypass via another order until explicitly advancing one day',()=>{
  const value={kind:'field',runtime:{phase:'battle',speed:'normal',day:4}}
  setFieldBattleOrder(value,{commandId:'end'})
  const before=fieldBattleRuntimeSnapshot(value)
  for(const commandId of ['move','wait','strategy','end']){
    assert.throws(()=>setFieldBattleOrder(value,{commandId}),/本日命令已結束/)
    assert.deepEqual(fieldBattleRuntimeSnapshot(value),before)
  }
  const next=advanceFieldBattleDayRuntime(value,1)
  assert.equal(next.day,5)
  assert.equal(value.runtime.ordersClosed,false)
  assert.equal(value.runtime.order,null)
  assert.equal(value.runtime.commandEpoch,1)
  assert.deepEqual(setFieldBattleOrder(value,{commandId:'wait'}).order,{commandId:'wait'})
})

test('tactics are only permitted with strategy orders and never attached to a saved wait',()=>{
  const value={kind:'field',runtime:{phase:'battle',speed:'normal',day:1}}
  assert.throws(()=>setFieldBattleOrder(value,{commandId:'wait',tacticId:'fire'}),/計略命令/)
  assert.throws(()=>setFieldBattleOrder(value,{commandId:'strategy',tacticId:'teleport'}),/計略命令/)
  assert.equal(value.runtime.order,null)
  setFieldBattleOrder(value,{commandId:'strategy',tacticId:'fire'})
  assert.deepEqual(value.runtime.order,{commandId:'strategy',tacticId:'fire'})
  value.runtime.order={commandId:'wait',tacticId:'chain'}
  assert.deepEqual(ensureFieldBattleRuntime(value).order,{commandId:'wait'})
})

test('day thirty closes the evidence boundary for all entry points',()=>{
  const value={kind:'field',runtime:{phase:'battle',speed:'normal',day:29,
    order:{commandId:'end'},ordersClosed:true}}
  const next=advanceFieldBattleDayRuntime(value,1)
  assert.equal(next.day,30)
  const before=fieldBattleRuntimeSnapshot(value)
  assert.equal(before.carryoverPending,true)
  assert.throws(()=>advanceFieldBattleDayRuntime(value,1),/30日段落/)
  assert.throws(()=>reopenFieldBattleOrders(value),/30日段落/)
  assert.throws(()=>setFieldBattleOrder(value,{commandId:'wait'}),/本日命令/)
  assert.deepEqual(fieldBattleRuntimeSnapshot(value),before)
})

test('out-of-range saved days clamp to thirty and cannot leak open command state',()=>{
  const value={kind:'field',runtime:{
    phase:'battle',day:9000,ordersClosed:false,
    carryoverPending:false,commandEpoch:Infinity,
  }}
  const snapshot=fieldBattleRuntimeSnapshot(value)
  assert.equal(snapshot.day,30)
  assert.equal(snapshot.carryoverPending,true)
  assert.equal(snapshot.ordersClosed,true)
  assert.equal(snapshot.commandEpoch,0)
})
