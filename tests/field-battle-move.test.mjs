import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FIELD_MOVE_GRID,
  fieldMoveOfficers,
  initialFieldMoveDraft,
  normalizeFieldMoveDraft,
  transitionFieldMoveDraft,
  validFieldMoveOrder,
  validFieldMovePoint,
} from '../src/game/field-battle-move.js'
import {
  advanceFieldBattleDayRuntime,
  ensureFieldBattleRuntime,
  setFieldBattleOrder,
} from '../src/game/field-battle-runtime.js'

const conflict=()=>({
  kind:'field',
  attackerOfficers:['曹操','夏侯惇','曹操'],
  runtime:{phase:'battle',speed:'normal'},
})

test('field move must use actual battle officers, never fabricated units',()=>{
  const value=conflict()
  assert.deepEqual(fieldMoveOfficers(value),['曹操','夏侯惇'])
  assert.equal(initialFieldMoveDraft(value).officerIndex,0)
  assert.throws(()=>initialFieldMoveDraft({kind:'field',attackerOfficers:[]}),/缺少可選/)
  assert.equal(validFieldMoveOrder(value,{officerName:'孫權',target:{x:56,y:104}}),null)
  assert.equal(validFieldMoveOrder(value,{officerName:'曹操',target:{x:56,y:104}})?.officerName,'曹操')
})

test('officer selection cycles and B returns without committing a movement',()=>{
  const value=conflict()
  let draft=initialFieldMoveDraft(value)
  draft=transitionFieldMoveDraft(value,draft,'DOWN').draft
  assert.equal(draft.officerIndex,1)
  draft=transitionFieldMoveDraft(value,draft,'C').draft
  assert.equal(draft.phase,'destination')
  assert.equal(draft.officerName,'夏侯惇')
  draft=transitionFieldMoveDraft(value,draft,'B').draft
  assert.equal(draft.phase,'officer')
  assert.equal(draft.officerIndex,1)
  assert.equal(transitionFieldMoveDraft(value,draft,'B').status,'cancelled')
  assert.equal(value.runtime.order,undefined)
})

test('directional destination picks bounded engineering cursor points',()=>{
  const value=conflict()
  let draft=transitionFieldMoveDraft(value,initialFieldMoveDraft(value),'C').draft
  const origin=structuredClone(draft.target)
  draft=transitionFieldMoveDraft(value,draft,'RIGHT').draft
  assert.deepEqual(draft.target,{x:origin.x+FIELD_MOVE_GRID.step,y:origin.y})
  draft=transitionFieldMoveDraft(value,draft,'UP').draft
  assert.deepEqual(draft.target,{x:origin.x+FIELD_MOVE_GRID.step,y:origin.y-FIELD_MOVE_GRID.step})
  for(let i=0;i<60;i++)draft=transitionFieldMoveDraft(value,draft,'LEFT').draft
  assert.equal(draft.target.x,FIELD_MOVE_GRID.minX)
  for(let i=0;i<60;i++)draft=transitionFieldMoveDraft(value,draft,'DOWN').draft
  assert.equal(draft.target.y,FIELD_MOVE_GRID.maxY)
  assert.equal(validFieldMovePoint(draft.target),true)
  assert.equal(validFieldMovePoint({x:NaN,y:104}),false)
  assert.equal(validFieldMovePoint({x:57,y:104}),false)
  assert.equal(validFieldMovePoint({x:-8,y:104}),false)
})

test('accepted move persists officer and position without changing army troops or world location',()=>{
  const value=conflict()
  value.attackerTroops=3000
  const beforeTroops=value.attackerTroops
  let draft=initialFieldMoveDraft(value)
  draft=transitionFieldMoveDraft(value,draft,'C').draft
  draft=transitionFieldMoveDraft(value,draft,'RIGHT').draft
  const result=transitionFieldMoveDraft(value,draft,'C')
  assert.equal(result.status,'committed')
  assert.equal(result.order.commandId,'move')
  assert.deepEqual(result.order.move,{officerName:'曹操',target:{x:64,y:104}})
  assert.throws(()=>setFieldBattleOrder(value,{commandId:'move'}),/必須指定/)
  setFieldBattleOrder(value,result.order)
  assert.deepEqual(ensureFieldBattleRuntime(value).order,result.order)
  assert.equal(value.attackerTroops,beforeTroops)
  const loaded=structuredClone(value)
  assert.deepEqual(ensureFieldBattleRuntime(loaded).order,result.order)
})

test('battle runtime sanitizes malformed saved movement orders and stale drafts',()=>{
  const value=conflict()
  value.runtime.moveDraft={phase:'destination',officerIndex:9,officerName:'捏造',target:{x:0,y:0}}
  value.runtime.order={commandId:'move',move:{officerName:'捏造',target:{x:400,y:100}}}
  const state=ensureFieldBattleRuntime(value)
  assert.equal(state.moveDraft,null)
  assert.deepEqual(state.order,{commandId:'move'})
  assert.equal(normalizeFieldMoveDraft(value,{phase:'officer',officerIndex:99}),null)
  assert.equal(validFieldMoveOrder(value,{officerName:'曹操',target:{x:999,y:104}}),null)
  assert.throws(()=>setFieldBattleOrder(value,{
    commandId:'move',move:{officerName:'曹操',target:{x:999,y:104}},
  }),/合法的戰場目的地/)
})

test('the current move draft cannot be replayed once the battle day closes',()=>{
  const value=conflict()
  value.runtime.moveDraft=initialFieldMoveDraft(value)
  setFieldBattleOrder(value,{commandId:'end'})
  const runtime=ensureFieldBattleRuntime(value)
  assert.equal(runtime.ordersClosed,true)
  assert.equal(runtime.moveDraft,null)
  assert.throws(()=>setFieldBattleOrder(value,{
    commandId:'move',move:{officerName:'曹操',target:{x:56,y:104}},
  }),/本日命令已結束/)
  advanceFieldBattleDayRuntime(value)
  assert.equal(value.runtime.order,null)
  assert.equal(value.runtime.moveDraft,null)
})

test('saved destination stage is reconstructible after fresh runtime normalization',()=>{
  const value=conflict()
  let draft=initialFieldMoveDraft(value)
  draft=transitionFieldMoveDraft(value,draft,'DOWN').draft
  draft=transitionFieldMoveDraft(value,draft,'C').draft
  draft=transitionFieldMoveDraft(value,draft,'UP').draft
  value.runtime.moveDraft=draft
  const saved=structuredClone(value)
  const normalized=ensureFieldBattleRuntime(saved)
  assert.equal(normalized.moveDraft.phase,'destination')
  assert.equal(normalized.moveDraft.officerName,'夏侯惇')
  assert.deepEqual(normalized.moveDraft.target,{x:56,y:96})
})
