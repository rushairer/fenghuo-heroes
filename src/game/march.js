import { WORLD_H, WORLD_W, cityWorldPoint } from './world.js'
import { MARCH_RUNTIME_PROJECTION } from './march-runtime-projection.js'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

export function ensureMarchState(store) {
  store.assertState?.()
  if (!store?.state) throw new Error('行軍狀態不存在。')
  if (!Array.isArray(store.state.armies)) store.state.armies = []
  if (!Number.isInteger(store.state.nextArmyId)) store.state.nextArmyId = 1
  return store.state.armies
}

export function dailyFoodFor(troops, officerCount = 1) {
  return Math.floor(Math.max(0, troops) / 100) + Math.max(0, Math.floor(officerCount))
}

export function deployedOfficerNames(store, faction = store?.humanFaction) {
  const names=new Set()
  for(const army of ensureMarchState(store)){
    if(army.faction!==faction)continue
    for(const name of army.officerNames??[]){
      const normalized=String(name??'').trim()
      if(normalized)names.add(normalized)
    }
  }
  return names
}

export function armyAt(store, x, y, tolerance = 10, faction = store.humanFaction) {
  return ensureMarchState(store).find((army) =>
    army.faction === faction && Math.abs(army.x - x) <= tolerance && Math.abs(army.y - y) <= tolerance
  ) ?? null
}

export const MARCH_COMMAND_EVIDENCE = Object.freeze({
  source:'jp-manual-pages-24-25',
  conditionSemantics:'manual-confirmed',
  adjacencySemantics:'adjacent-on-original-map',
  enemyArmyAdjacencyProjection:`provisional-${MARCH_RUNTIME_PROJECTION.enemyArmyAdjacencyWorld}px-route-step`,
  enemyCityAdjacencyProjection:`provisional-${MARCH_RUNTIME_PROJECTION.enemyCityAdjacencyWorld}px-city-tolerance`,
  splitGroupingProjection:'same-map-point-engineering',
  villageProjection:'unimplemented',
})

export const MARCH_COMMAND_ORDER = Object.freeze([
  'move','split','supply','attack','siege','end',
])

export function marchCommandOptions({
  canSplit=false,
  inVillage=false,
  enemyArmyAdjacent=false,
  enemyCityAdjacent=false,
  enemyCityName='',
}={}) {
  const options=[Object.freeze({id:'move',label:'移動'})]
  if(canSplit)options.push(Object.freeze({id:'split',label:'分散'}))
  if(inVillage)options.push(Object.freeze({id:'supply',label:'補給'}))
  if(enemyArmyAdjacent)options.push(Object.freeze({id:'attack',label:'攻擊'}))
  if(enemyCityAdjacent){
    const suffix=enemyCityName?' '+enemyCityName:''
    options.push(Object.freeze({id:'siege',label:'攻城'+suffix}))
  }
  options.push(Object.freeze({id:'end',label:'結束'}))
  return Object.freeze(options)
}
export const MARCH_ADJACENCY_STEP = MARCH_RUNTIME_PROJECTION.enemyArmyAdjacencyWorld

export function friendlyArmyStack(store, armyId) {
  const armies = ensureMarchState(store)
  const army = armies.find((item) => item.id === armyId)
  if (!army) return Object.freeze([])
  return Object.freeze(
    armies.filter((item) =>
      item.faction === army.faction && item.x === army.x && item.y === army.y
    ),
  )
}

export function enemyArmyNearArmy(store, armyId, tolerance = MARCH_ADJACENCY_STEP) {
  const armies = ensureMarchState(store)
  const army = armies.find((item) => item.id === armyId)
  if (!army) return null
  return armies.find((item) => {
    if (item.id === army.id || item.faction === army.faction) return false
    const dx = Math.abs(item.x - army.x)
    const dy = Math.abs(item.y - army.y)
    return Math.max(dx, dy) > 0 && Math.max(dx, dy) <= tolerance
  }) ?? null
}

export function queueMarch(store, {
  from,
  route,
  troops,
  food,
  gold,
  officerCount = 1,
  officerNames = [],
}) {
  store.assertState()
  if (store.mode !== 'march') throw new Error('偶數月才能下達行軍命令。')
  const source = store.state.cities[from]
  const city = store.mapProfile?.cityById?.[from]
  if (!source || !city || source.owner !== store.humanFaction) throw new Error('必須從本國城池出陣。')
  if (!Array.isArray(route) || route.length < 2) throw new Error('請先用方框指定行軍路線。')

  const names = Array.isArray(officerNames)
    ? [...new Set(officerNames.map((name) => String(name).trim()).filter(Boolean))]
    : []
  const deployed=deployedOfficerNames(store,store.humanFaction)
  const duplicate=names.find((name)=>deployed.has(name))
  if(duplicate)throw new Error(`${duplicate}已隨其他部隊出陣。`)
  const nOfficers = Math.max(1, names.length || Math.floor(officerCount))
  const nTroops = clamp(Math.floor(troops), 100, Math.max(100, source.troops - 100))
  const nFood = clamp(Math.floor(food), 0, source.food)
  const nGold = clamp(Math.floor(gold), 0, source.gold)
  if (source.troops - nTroops < 100) throw new Error('城內留守兵力不足。')

  source.troops -= nTroops
  source.food -= nFood
  source.gold -= nGold

  const start = cityWorldPoint(city)
  const normalized = route.map((point) => ({
    x: clamp(Math.round(point.x), 8, WORLD_W - 8),
    y: clamp(Math.round(point.y), 8, WORLD_H - 8),
  }))
  normalized[0] = { ...start }

  const army = {
    id: `army-${store.state.nextArmyId++}`,
    faction: store.humanFaction,
    from,
    x: start.x,
    y: start.y,
    route: normalized,
    routeIndex: 0,
    troops: nTroops,
    food: nFood,
    gold: nGold,
    officerCount: nOfficers,
    officerNames: names,
    dailyFood: dailyFoodFor(nTroops, nOfficers),
    starving: false,
    lastTurnFoodConsumed: 0,
    lastTurnStarvingDays: 0,
    starvingDaysTotal: 0,
    status: 'marching',
  }
  ensureMarchState(store).push(army)
  store.addLog(`${city.name}軍出陣。武將${nOfficers} 兵${nTroops} 米${nFood}`)
  store.save()
  return army
}

export function rerouteArmy(store, armyId, route) {
  const army = ensureMarchState(store).find((item) => item.id === armyId && item.faction === store.humanFaction)
  if (!army) throw new Error('找不到可操作的行軍部隊。')
  if(army.status==='engaged'||army.status==='besieging')throw new Error('戰鬥中的部隊不能變更行軍路線。')
  if (!Array.isArray(route) || route.length < 2) throw new Error('請指定新的行軍路線。')
  army.route = [
    { x: army.x, y: army.y },
    ...route.slice(1).map((point) => ({
      x: clamp(Math.round(point.x), 8, WORLD_W - 8),
      y: clamp(Math.round(point.y), 8, WORLD_H - 8),
    })),
  ]
  army.routeIndex = 0
  army.status = 'marching'
  store.addLog('行軍部隊已變更路線。')
  store.save()
  return army
}

export function executeMarchTurn(store, days = MARCH_RUNTIME_PROJECTION.executionDaysPerEvenMonth) {
  const events = []
  const maxDays = Math.max(0, Math.floor(days))

  for (const army of ensureMarchState(store)) {
    if (army.status !== 'marching') continue

    const ration = dailyFoodFor(army.troops, army.officerCount)
    army.dailyFood = ration
    let steps = 0
    let daysElapsed = 0
    let foodConsumed = 0
    let starvingDays = 0
    const routeNodeDays=MARCH_RUNTIME_PROJECTION.routeNodeDays

    while (
      daysElapsed + routeNodeDays <= maxDays &&
      army.routeIndex < army.route.length - 1
    ) {
      for(let day=0;day<routeNodeDays;day++){
        if (army.food >= ration) {
          army.food -= ration
          foodConsumed += ration
        } else {
          foodConsumed += Math.max(0, army.food)
          army.food = 0
          starvingDays++
        }
      }

      daysElapsed += routeNodeDays
      steps++
      army.routeIndex++
      const point = army.route[army.routeIndex]
      army.x = point.x
      army.y = point.y
    }

    army.lastTurnFoodConsumed = foodConsumed
    army.lastTurnStarvingDays = starvingDays
    army.starvingDaysTotal = Math.max(0, Math.floor(army.starvingDaysTotal ?? 0)) + starvingDays
    army.starving = starvingDays > 0
    if (army.routeIndex >= army.route.length - 1) army.status = 'waiting'

    events.push({
      armyId: army.id,
      steps,
      daysElapsed,
      foodConsumed,
      starvingDays,
      status: army.status,
    })
  }

  return events
}

export function advanceMarchArmies(store, days = MARCH_RUNTIME_PROJECTION.executionDaysPerEvenMonth) {
  const events = executeMarchTurn(store, days)
  if (events.length) store.addLog(`行軍部隊移動：${events.length}隊。`)
  store.save()
  return events.map((event) => event.armyId)
}

export function enemyCityNearArmy(store, armyId, tolerance = MARCH_RUNTIME_PROJECTION.enemyCityAdjacencyWorld) {
  const army = ensureMarchState(store).find((item) => item.id === armyId)
  if (!army) return null
  return (store.mapProfile?.cities??[]).find((city) => {
    const runtime = store.state.cities[city.id]
    if (!runtime || runtime.owner === army.faction) return false
    const point = cityWorldPoint(city)
    return Math.abs(point.x - army.x) <= tolerance && Math.abs(point.y - army.y) <= tolerance
  }) ?? null
}

export function beginSiegeFromArmy(store, armyId, targetCityId) {
  if(store.pendingConflict)throw new Error('已有尚未結束的戰鬥。')
  const armies = ensureMarchState(store)
  const army = armies.find((item) => item.id === armyId && item.faction === store.humanFaction)
  const target = store.state.cities[targetCityId]
  if (!army || !target || target.owner === army.faction) throw new Error('目前無可攻擊的敵城。')
  const near = enemyCityNearArmy(store, armyId)
  if (!near || near.id !== targetCityId) throw new Error('部隊尚未接近敵城。')
  const previousArmyStatus=army.status??'waiting'
  army.status = 'besieging'
  store.pendingConflict = {
    kind: 'siege',
    previousArmyStatus,
    armyId: army.id,
    from: army.from,
    target: targetCityId,
    attacker: army.faction,
    defender: target.owner,
    attackerTroops: army.troops,
    defenderTroops: target.troops,
    attackerOfficers: [...(army.officerNames ?? [])],
  }
  store.addLog(`${store.mapProfile?.cityById?.[targetCityId]?.name??targetCityId}攻城準備。`)
  store.save()
  return store.pendingConflict
}

export function cancelSiegeFromArmy(store) {
  const conflict = store.pendingConflict
  if (!conflict || conflict.kind !== 'siege') return false
  const army = ensureMarchState(store).find((item) => item.id === conflict.armyId)
  if (army) army.status = conflict.previousArmyStatus ?? 'waiting'
  store.pendingConflict = null
  store.addLog(`${store.mapProfile?.cityById?.[conflict.target]?.name ?? conflict.target}中止攻城。`)
  store.save()
  return true
}


export function beginFieldBattleFromArmies(store, attackerArmyId, defenderArmyId) {
  const armies=ensureMarchState(store)
  const attacker=armies.find((item)=>item.id===attackerArmyId&&item.faction===store.humanFaction)
  const defender=armies.find((item)=>item.id===defenderArmyId&&item.faction!==store.humanFaction)
  if(!attacker||!defender)throw new Error('目前無可攻擊的敵行軍部隊。')
  if(store.pendingConflict)throw new Error('已有尚未結束的戰鬥。')
  const dx=Math.abs(defender.x-attacker.x)
  const dy=Math.abs(defender.y-attacker.y)
  if(Math.max(dx,dy)===0||Math.max(dx,dy)>MARCH_ADJACENCY_STEP)throw new Error('敵部隊尚未進入可攻擊範圍。')

  const previousArmyStatuses=Object.freeze({
    [attacker.id]:attacker.status??'waiting',
    [defender.id]:defender.status??'waiting',
  })
  attacker.status='engaged'
  defender.status='engaged'
  store.pendingConflict={
    kind:'field',
    armyId:attacker.id,
    attackerArmyId:attacker.id,
    defenderArmyId:defender.id,
    from:attacker.from,
    attacker:attacker.faction,
    defender:defender.faction,
    attackerTroops:attacker.troops,
    defenderTroops:defender.troops,
    attackerOfficers:[...(attacker.officerNames??[])],
    defenderOfficers:[...(defender.officerNames??[])],
    previousArmyStatuses,
    battleOrder:null,
    battleSpeed:null,
  }
  store.addLog('與敵行軍部隊接觸，進入部隊戰。')
  store.save()
  return store.pendingConflict
}

export function cancelFieldBattleFromArmies(store) {
  const conflict=store.pendingConflict
  if(!conflict||conflict.kind!=='field')return false
  const statuses=conflict.previousArmyStatuses??{}
  for(const army of ensureMarchState(store)){
    if(army.id===conflict.attackerArmyId||army.id===conflict.defenderArmyId){
      army.status=statuses[army.id]??'waiting'
    }
  }
  store.pendingConflict=null
  store.addLog('部隊戰中止；未套用未校準的戰鬥結果。')
  store.save()
  return true
}
