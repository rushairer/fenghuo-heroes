export const FIELD_BATTLE_INPUT = Object.freeze({
  A: 'status-window',
  B: 'cancel-window',
  C: 'command-window',
  DIRECTION_OUTSIDE_WINDOW: 'scroll-battlefield',
})

export const FIELD_BATTLE_COMMANDS = Object.freeze([
  Object.freeze({
    id:'move',
    label:'移動',
    detail:'select-unit-then-destination',
  }),
  Object.freeze({
    id:'strategy',
    label:'計略',
    detail:'enemy-within-two-day-movement-range',
  }),
  Object.freeze({
    id:'siege',
    label:'攻城',
    detail:'available-when-contacting-enemy-city',
  }),
  Object.freeze({
    id:'retreat',
    label:'退卻',
    detail:'availability-timing-still-unmeasured',
  }),
  Object.freeze({
    id:'wait',
    label:'待機',
    detail:'hold-position; forest-ambush-condition-documented',
  }),
  Object.freeze({
    id:'end',
    label:'結束',
    detail:'finish-orders-until-next-battle-day',
  }),
])

export const FIELD_BATTLE_TACTICS = Object.freeze([
  Object.freeze({id:'fire',label:'火計',detail:'morale-and-troop-damage; terrain-effect-documented'}),
  Object.freeze({id:'rockfall',label:'落石',detail:'mountain-to-plain-condition-documented'}),
  Object.freeze({id:'immobilize',label:'止足',detail:'mountain-or-forest-target; morale-down-and-stop'}),
  Object.freeze({id:'provoke',label:'挑發',detail:'draw-enemy-toward-own-unit'}),
  Object.freeze({id:'persuade',label:'說得',detail:'enemy-commander-defection-on-success'}),
  Object.freeze({id:'chain',label:'連環',detail:'selectable-when-enemy-is-in-river'}),
])

export const RETREAT_UNLOCK_TIMING = 'verified-later-in-battle-duration-unmeasured'

export function fieldBattleInputAction(button,{windowOpen=false}={}) {
  if(button==='A'&&!windowOpen)return FIELD_BATTLE_INPUT.A
  if(button==='B'&&windowOpen)return FIELD_BATTLE_INPUT.B
  if(button==='C'&&!windowOpen)return FIELD_BATTLE_INPUT.C
  if(['UP','DOWN','LEFT','RIGHT'].includes(button)&&!windowOpen)return FIELD_BATTLE_INPUT.DIRECTION_OUTSIDE_WINDOW
  return null
}

export function commandWindowPausesBattle() {
  return true
}

export function fieldBattleCommandAvailable(commandId,{
  retreatUnlocked=false,
  strategyAvailable=false,
  siegeAvailable=false,
  ordersClosed=false,
}={}) {
  const command=FIELD_BATTLE_COMMANDS.find((item)=>item.id===commandId)
  if(!command||ordersClosed)return false
  if(command.id==='strategy')return Boolean(strategyAvailable)
  if(command.id==='siege')return Boolean(siegeAvailable)
  if(command.id==='retreat')return Boolean(retreatUnlocked)
  return true
}

export function fieldBattleTacticAvailable(tacticId,{
  strategyAvailable=false,
  enemyTerrain=null,
  ownTerrain=null,
}={}) {
  const tactic=FIELD_BATTLE_TACTICS.find((item)=>item.id===tacticId)
  if(!tactic||!strategyAvailable)return false
  if(tactic.id==='chain')return enemyTerrain==='river'
  if(tactic.id==='rockfall')return ownTerrain==='mountain'&&enemyTerrain==='plain'
  if(tactic.id==='immobilize')return enemyTerrain==='mountain'||enemyTerrain==='forest'
  return true
}

export function fieldBattleOrder(commandId,context={}) {
  if(!fieldBattleCommandAvailable(commandId,context))return null
  return Object.freeze({commandId})
}

export function fieldBattleTacticOrder(tacticId,context={}) {
  if(!fieldBattleTacticAvailable(tacticId,context))return null
  return Object.freeze({commandId:'strategy',tacticId})
}

export function fieldBattleStatusProjection(conflict) {
  const side=(prefix)=>Object.freeze({
    troops:Math.max(0,Math.floor(Number(conflict?.[`${prefix}Troops`])||0)),
    attack:Number.isFinite(conflict?.[`${prefix}Attack`])?conflict[`${prefix}Attack`]:null,
    morale:Number.isFinite(conflict?.[`${prefix}Morale`])?conflict[`${prefix}Morale`]:null,
    officers:Object.freeze([...(conflict?.[`${prefix}Officers`]??[])]),
  })
  return Object.freeze({
    attacker:side('attacker'),
    defender:side('defender'),
  })
}
