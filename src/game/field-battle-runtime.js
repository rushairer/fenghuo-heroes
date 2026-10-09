import { FIELD_BATTLE_COMMANDS, FIELD_BATTLE_TACTICS } from './field-battle-parity.js'
import { OBSERVED_BATTLE_SEGMENT_DAYS, advanceBattleDay, battleDayState } from './battle-time-parity.js'

const PHASES=new Set(['speed','formation','battle'])
const SPEEDS=new Set(['normal','fast'])
const COMMANDS=new Set(FIELD_BATTLE_COMMANDS.map((item)=>item.id))
const TACTICS=new Set(FIELD_BATTLE_TACTICS.map((item)=>item.id))

export function ensureFieldBattleRuntime(conflict) {
  if(!conflict||conflict.kind!=='field')throw new Error('部隊戰資料不存在。')
  const current=conflict.runtime&&typeof conflict.runtime==='object'?conflict.runtime:{}
  const order=current.order&&COMMANDS.has(current.order.commandId)
    ?{
      commandId:current.order.commandId,
      ...(current.order.commandId==='strategy'&&TACTICS.has(current.order.tacticId)
        ?{tacticId:current.order.tacticId}:{}),
    }
    :null
  const day=Math.min(OBSERVED_BATTLE_SEGMENT_DAYS,
    Math.max(1,Math.floor(Number(current.day)||1)))
  const carryoverPending=day>=OBSERVED_BATTLE_SEGMENT_DAYS
  conflict.runtime={
    phase:PHASES.has(current.phase)?current.phase:'speed',
    speed:SPEEDS.has(current.speed)?current.speed:null,
    order,
    ordersClosed:carryoverPending||Boolean(current.ordersClosed),
    commandEpoch:Number.isSafeInteger(current.commandEpoch)&&current.commandEpoch>=0?current.commandEpoch:0,
    day,
    carryoverPending,
    ambush:Boolean(current.ambush),
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
  if(runtime.ordersClosed||runtime.carryoverPending){
    throw new Error('本日命令已結束，必須先進入下一個戰鬥日。')
  }
  if(order.tacticId!=null&&(order.commandId!=='strategy'||!TACTICS.has(order.tacticId))){
    throw new Error('計略命令和戰術不相符。')
  }
  runtime.order={
    commandId:order.commandId,
    ...(TACTICS.has(order.tacticId)?{tacticId:order.tacticId}:{}),
  }
  runtime.ordersClosed=order.commandId==='end'
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
    runtime.ambush=false
  }
  return Object.freeze({...next})
}
