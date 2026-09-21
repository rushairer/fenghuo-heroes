import { ensureMarchState } from './march.js'
import { cityWorldPoint } from './world.js'

export const MARCH_VISUAL_QA_STATES = Object.freeze([
  'march-compose',
  'march-officers',
  'march-route-prompt',
  'army-menu',
])

export const BATTLE_VISUAL_QA_STATES = Object.freeze([
  'siege-speed',
  'siege-formation',
  'duel-mode',
  'duel-manual',
])

export function isMarchVisualQaState(value) {
  return MARCH_VISUAL_QA_STATES.includes(value)
}

export function isBattleVisualQaState(value) {
  return BATTLE_VISUAL_QA_STATES.includes(value)
}

function firstCityByOwner(store, predicate) {
  const faction=store?.humanFaction
  return (store?.mapProfile?.cities??[]).find((city)=>predicate(store?.state?.cities?.[city.id]?.owner,faction))??null
}

export function qaOwnedCity(store) {
  return firstCityByOwner(store,(owner,faction)=>owner===faction)
}

export function qaEnemyCity(store) {
  return firstCityByOwner(store,(owner,faction)=>Boolean(owner)&&owner!==faction)
}

export function prepareVisualQaStore(store, qaState) {
  if(!store?.hasGame?.())return false
  if(!isMarchVisualQaState(qaState)&&!isBattleVisualQaState(qaState))return true

  store.state.month=2
  store.state.activeHumanIndex=0
  ensureMarchState(store)

  if(qaState!=='army-menu'&&!isBattleVisualQaState(qaState))return true

  const source=qaOwnedCity(store)
  const target=qaEnemyCity(store)
  if(!source||!target)return false

  const sourcePoint=cityWorldPoint(source)
  const targetPoint=cityWorldPoint(target)
  const armies=ensureMarchState(store)
  const existing=armies.find((army)=>army.id==='qa-army')
  const army=existing??{
    id:'qa-army',
    faction:store.humanFaction,
    from:source.id,
    x:sourcePoint.x,
    y:sourcePoint.y,
    route:[{...sourcePoint}],
    routeIndex:0,
    troops:3000,
    food:900,
    gold:100,
    officerCount:1,
    officerNames:[store.state.openingRosters?.[store.humanFaction]?.ruler].filter(Boolean),
    dailyFood:31,
    starving:false,
    status:'waiting',
    qaFixture:true,
  }
  if(!existing)armies.push(army)

  if(isBattleVisualQaState(qaState)){
    army.x=Math.max(8,targetPoint.x-8)
    army.y=targetPoint.y
    army.route=[{x:army.x,y:army.y}]
    army.routeIndex=0
    army.status='besieging'
    store.pendingConflict={
      kind:'siege',
      armyId:army.id,
      from:source.id,
      target:target.id,
      attacker:army.faction,
      defender:store.state.cities[target.id].owner,
      attackerTroops:army.troops,
      defenderTroops:store.state.cities[target.id].troops,
      attackerOfficers:[...(army.officerNames??[])],
      qaFixture:true,
    }
  }

  return true
}

export function clearVisualQaFixture(store) {
  if(!store?.state)return
  if(store.pendingConflict?.qaFixture)store.pendingConflict=null
  if(Array.isArray(store.state.armies)){
    store.state.armies=store.state.armies.filter((army)=>!army?.qaFixture)
  }
}
