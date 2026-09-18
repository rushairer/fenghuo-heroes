export const BATTLE_TACTICAL_EVIDENCE = Object.freeze({
  source:'jp-manual-page-30',
  commandSemantics:'manual-confirmed',
  twoDayRangeProjection:'unimplemented',
  castleContactProjection:'unimplemented',
  terrainProjection:'unimplemented',
})

export const BATTLE_TACTICAL_COMMAND_ORDER = Object.freeze([
  'move','tactics','siege','retreat','wait','end',
])

export const BATTLE_TACTICS = Object.freeze([
  Object.freeze({
    id:'fire',
    label:'火計',
    effect:'reduce-enemy-morale-and-troops',
    terrainCondition:'manual-layout-needs-disambiguation',
  }),
  Object.freeze({
    id:'rockfall',
    label:'落石',
    effect:'damage-enemy-unit',
    ownTerrain:'mountain',
    enemyTerrain:'plain',
  }),
  Object.freeze({
    id:'immobilize',
    label:'止足',
    effect:'reduce-morale-and-stop-movement-temporarily',
    enemyTerrain:Object.freeze(['mountain','forest']),
  }),
  Object.freeze({
    id:'provoke',
    label:'挑發',
    effect:'draw-enemy-toward-own-unit',
  }),
  Object.freeze({
    id:'persuade',
    label:'說得',
    effect:'turn-enemy-officer-and-unit',
  }),
  Object.freeze({
    id:'chain',
    label:'連環',
    effect:'reduce-morale-and-stop-movement-temporarily',
    enemyTerrain:'river',
  }),
])

export function battleTacticalCommandOptions({
  enemyWithinTwoDayMove=false,
  touchingEnemyCastle=false,
}={}) {
  const options=[Object.freeze({id:'move',label:'移動'})]
  if(enemyWithinTwoDayMove)options.push(Object.freeze({id:'tactics',label:'計略'}))
  if(touchingEnemyCastle)options.push(Object.freeze({id:'siege',label:'攻城'}))
  options.push(
    Object.freeze({id:'retreat',label:'退卻'}),
    Object.freeze({id:'wait',label:'待機'}),
    Object.freeze({id:'end',label:'結束'}),
  )
  return Object.freeze(options)
}

export function tacticAvailable(tacticId,{ownTerrain=null,enemyTerrain=null}={}) {
  const tactic=BATTLE_TACTICS.find((item)=>item.id===tacticId)
  if(!tactic)return false

  // The indexed manual text does not preserve enough page layout to assign
  // the terrain sentence immediately following 火計 with certainty.
  if(tactic.id==='fire')return null
  if(tactic.ownTerrain&&tactic.ownTerrain!==ownTerrain)return false
  if(Array.isArray(tactic.enemyTerrain)&&!tactic.enemyTerrain.includes(enemyTerrain))return false
  if(typeof tactic.enemyTerrain==='string'&&tactic.enemyTerrain!==enemyTerrain)return false
  return true
}

export function waitCommandOutcome({terrain=null,troops=0}={}) {
  const count=Math.max(0,Math.floor(Number(troops)||0))
  if(terrain==='forest'&&count>0&&count<=5000){
    return Object.freeze({state:'ambush',manualConfirmed:true})
  }
  return Object.freeze({state:'waiting',manualConfirmed:true})
}

export const RETREAT_RESULT = Object.freeze({
  leavesBattleScreen:true,
  returnsAsMarchingArmyNearCastle:true,
  casualtyFormula:'none-in-manual-command-description',
})

export const END_COMMAND_RESULT = Object.freeze({
  commandWindowLockedUntilNextBattleDay:true,
})
