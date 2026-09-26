import { FIELD_BATTLE_COMMANDS, FIELD_BATTLE_TACTICS } from './field-battle-parity.js'

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
      ...(TACTICS.has(current.order.tacticId)?{tacticId:current.order.tacticId}:{}),
    }
    :null
  conflict.runtime={
    phase:PHASES.has(current.phase)?current.phase:'speed',
    speed:SPEEDS.has(current.speed)?current.speed:null,
    order,
    ordersClosed:Boolean(current.ordersClosed),
    commandEpoch:Math.max(0,Math.floor(Number(current.commandEpoch)||0)),
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
  runtime.order={
    commandId:order.commandId,
    ...(TACTICS.has(order.tacticId)?{tacticId:order.tacticId}:{}),
  }
  runtime.ordersClosed=order.commandId==='end'
  return runtime
}

export function reopenFieldBattleOrders(conflict) {
  const runtime=ensureFieldBattleRuntime(conflict)
  runtime.commandEpoch+=1
  runtime.ordersClosed=false
  return runtime
}

export function fieldBattleRuntimeSnapshot(conflict) {
  const runtime=ensureFieldBattleRuntime(conflict)
  return Object.freeze({
    phase:runtime.phase,
    speed:runtime.speed,
    order:runtime.order?Object.freeze({...runtime.order}):null,
    ordersClosed:runtime.ordersClosed,
    commandEpoch:runtime.commandEpoch,
  })
}
