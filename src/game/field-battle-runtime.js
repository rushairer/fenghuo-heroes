import { FIELD_BATTLE_COMMANDS, FIELD_BATTLE_TACTICS, fieldBattleCommandAvailable, fieldBattleCommandContext, fieldBattleTacticAvailable } from './field-battle-parity.js'
import { OBSERVED_BATTLE_SEGMENT_DAYS, advanceBattleDay, battleDayState } from './battle-time-parity.js'
import { normalizeFieldMoveDraft, validFieldMoveOrder } from './field-battle-move.js'
import { normalizeFormationDraft, normalizeFormationPlan } from './battle-formation.js'

const PHASES=new Set(['speed','formation','battle'])
const SPEEDS=new Set(['normal','fast'])
const COMMANDS=new Set(FIELD_BATTLE_COMMANDS.map((item)=>item.id))
const TACTICS=new Set(FIELD_BATTLE_TACTICS.map((item)=>item.id))

// Keep the last recorded destination per named participant. These are
// semantic observations of player input, not active simulated movement.
function recordedMoveOrders(conflict,records,order){
  const moves=new Map()
  for(const candidate of Array.isArray(records)?records:[]){
    const move=validFieldMoveOrder(conflict,candidate)
    if(move)moves.set(move.officerName,move)
  }
  // Legacy saves only retained the last command. Recover that move if present.
  if(order?.commandId==='move'&&order.move)moves.set(order.move.officerName,order.move)
  return [...moves.values()]
}

export function ensureFieldBattleRuntime(conflict) {
  if(!conflict||conflict.kind!=='field')throw new Error('部隊戰資料不存在。')
  const current=conflict.runtime&&typeof conflict.runtime==='object'?conflict.runtime:{}
  // A saved incomplete move or tactic is not a real accepted order.
  // Do not re-evaluate historical valid orders against today's conditions.
  const phase=PHASES.has(current.phase)?current.phase:'speed'
  const saved=current.order
  const move=saved?.commandId==='move'?validFieldMoveOrder(conflict,saved.move):null
  const order=phase==='battle'&&saved&&COMMANDS.has(saved.commandId)&&
    (saved.commandId!=='move'||move)&&
    (saved.commandId!=='strategy'||TACTICS.has(saved.tacticId))
    ?{
      commandId:saved.commandId,
      ...(saved.commandId==='strategy'?{tacticId:saved.tacticId}:{}),
      ...(move?{move}:{}),
    }:null
  const day=Math.min(OBSERVED_BATTLE_SEGMENT_DAYS,
    Math.max(1,Math.floor(Number(current.day)||1)))
  const carryoverPending=day>=OBSERVED_BATTLE_SEGMENT_DAYS
  conflict.runtime={
    phase,
    speed:SPEEDS.has(current.speed)?current.speed:null,
    order,
    recordedMoves:recordedMoveOrders(conflict,current.recordedMoves,order),
    ordersClosed:carryoverPending||Boolean(current.ordersClosed)||order?.commandId==='end',
    commandEpoch:Number.isSafeInteger(current.commandEpoch)&&current.commandEpoch>=0?current.commandEpoch:0,
    day,
    carryoverPending,
    ambush:Boolean(current.ambush),
    moveDraft:phase!=='battle'||carryoverPending||Boolean(current.ordersClosed)||order?.commandId==='end'
      ?null:normalizeFieldMoveDraft(conflict,current.moveDraft),
    formationPlan:normalizeFormationPlan(conflict,current.formationPlan),
    formationDraft:current.phase==='battle'
      ?null:normalizeFormationDraft(conflict,current.formationDraft),
  }
  return conflict.runtime
}

export function setFieldBattlePhase(conflict,phase) {
  const runtime=ensureFieldBattleRuntime(conflict)
  if(!PHASES.has(phase))throw new Error('未知的部隊戰階段。')
  runtime.phase=phase
  return runtime
}

export function setFieldBattleSpeed(conflict,speed) {
  const runtime=ensureFieldBattleRuntime(conflict)
  if(!SPEEDS.has(speed))throw new Error('未知的戰鬥速度。')
  runtime.speed=speed
  return runtime
}

export function setFieldBattleOrder(conflict,order) {
  const runtime=ensureFieldBattleRuntime(conflict)
  if(!order||!COMMANDS.has(order.commandId))throw new Error('未知的部隊戰命令。')
  if(runtime.phase!=='battle')throw new Error('尚未進入部隊戰階段。')
  if(runtime.ordersClosed||runtime.carryoverPending){
    throw new Error('本日命令已結束，必須先進入下一個戰鬥日。')
  }
  if((order.commandId==='strategy'&&!TACTICS.has(order.tacticId))||
    (order.commandId!=='strategy'&&order.tacticId!=null)){
    throw new Error('計略命令和戰術不相符。')
  }
  const move=order.commandId==='move'?validFieldMoveOrder(conflict,order.move):null
  if(order.commandId==='move'&&!move){
    throw new Error('移動命令必須指定出征武將和合法的戰場目的地。')
  }
  if(order.commandId!=='move'&&order.move!=null){
    throw new Error('只有移動命令可以指定戰場目的地。')
  }
  const context=fieldBattleCommandContext(conflict,runtime)
  if(!fieldBattleCommandAvailable(order.commandId,context)){
    throw new Error('此命令目前條件未滿足。')
  }
  if(order.commandId==='strategy'&&!fieldBattleTacticAvailable(order.tacticId,context)){
    throw new Error('此計略目前條件未滿足。')
  }
  runtime.order={
    commandId:order.commandId,
    ...(TACTICS.has(order.tacticId)?{tacticId:order.tacticId}:{}),
    ...(move?{move}:{}),
  }
  if(move)runtime.recordedMoves=recordedMoveOrders(conflict,runtime.recordedMoves,runtime.order)
  runtime.ordersClosed=order.commandId==='end'
  runtime.moveDraft=null
  return runtime
}

// Retained for existing integration points, but an order window can only
// reopen by completing a real one-day transition. No same-day override.
export function reopenFieldBattleOrders(conflict) {
  advanceFieldBattleDayRuntime(conflict,1)
  return ensureFieldBattleRuntime(conflict)
}

export function fieldBattleRuntimeSnapshot(conflict) {
  const runtime=ensureFieldBattleRuntime(conflict)
  return Object.freeze({
    phase:runtime.phase,
    speed:runtime.speed,
    order:runtime.order?Object.freeze({...runtime.order}):null,
    ordersClosed:runtime.ordersClosed,
    commandEpoch:runtime.commandEpoch,
    day:runtime.day,
    carryoverPending:runtime.carryoverPending,
    ambush:runtime.ambush,
  })
}


export function setFieldBattleAmbush(conflict,active){
  const runtime=ensureFieldBattleRuntime(conflict)
  runtime.ambush=Boolean(active)
  return runtime
}

export function advanceFieldBattleDayRuntime(conflict,delta=1){
  const runtime=ensureFieldBattleRuntime(conflict)
  if(delta!==1)throw new Error('每次只能前進一個戰鬥日。')
  if(runtime.phase!=='battle'||!runtime.ordersClosed){
    throw new Error('必須先結束本日命令才能推進戰鬥日。')
  }
  if(runtime.carryoverPending||runtime.day>=OBSERVED_BATTLE_SEGMENT_DAYS){
    throw new Error('30日段落已結束，不能擅自重開下一日。')
  }
  const next=advanceBattleDay(runtime.day,delta)
  runtime.day=Math.max(1,next.day)
  runtime.carryoverPending=next.segmentComplete
  if(next.segmentComplete){
    runtime.ordersClosed=true
  }else{
    runtime.commandEpoch+=1
    runtime.ordersClosed=false
    runtime.order=null
    runtime.moveDraft=null
    runtime.ambush=false
  }
  return Object.freeze({...next})
}
