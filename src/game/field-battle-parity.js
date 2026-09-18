export const FIELD_BATTLE_INPUT = Object.freeze({
  A: 'status-window',
  B: 'cancel-window',
  C: 'command-window',
  UP_DOWN_OUTSIDE_WINDOW: 'scroll-battlefield',
})

export const FIELD_BATTLE_COMMANDS = Object.freeze([
  Object.freeze({
    id:'directional-movement',
    label:'方向移動',
    detail:'follow-direction-symbol',
  }),
  Object.freeze({
    id:'enemy-commander',
    label:'敵將',
    detail:'move-toward-enemy-commander',
  }),
  Object.freeze({
    id:'wait',
    label:'待機',
    detail:'hold-position',
  }),
  Object.freeze({
    id:'retreat',
    label:'退卻',
    detail:'available-after-battle-has-progressed',
  }),
])

export const RETREAT_UNLOCK_TIMING = 'verified-later-in-battle-duration-unmeasured'

export function fieldBattleInputAction(button,{windowOpen=false}={}) {
  if(button==='A'&&!windowOpen)return FIELD_BATTLE_INPUT.A
  if(button==='B'&&windowOpen)return FIELD_BATTLE_INPUT.B
  if(button==='C'&&!windowOpen)return FIELD_BATTLE_INPUT.C
  if((button==='UP'||button==='DOWN')&&!windowOpen)return FIELD_BATTLE_INPUT.UP_DOWN_OUTSIDE_WINDOW
  return null
}

export function commandWindowPausesBattle() {
  return true
}

export function fieldBattleCommandAvailable(commandId,{retreatUnlocked=false}={}) {
  const command=FIELD_BATTLE_COMMANDS.find((item)=>item.id===commandId)
  if(!command)return false
  if(command.id==='retreat')return Boolean(retreatUnlocked)
  return true
}
