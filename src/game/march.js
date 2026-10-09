import { WORLD_H, WORLD_W, cityWorldPoint } from './world.js'
import { MARCH_RUNTIME_PROJECTION } from './march-runtime-projection.js'
import { openingOfficerListForCity } from './officer-roster.js'

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

// Protect the player-owned city ledger before any mutable march state is created.
// The existing 100-soldier garrison rule is a runtime constraint, not a claim
// about an unverified Chinese-ROM recruitment or casualty formula.
export function validateMarchAllocation(source,{troops,food,gold}){
  const wholeNonNegative=(value)=>Number.isSafeInteger(value)&&value>=0
  if(!source||!wholeNonNegative(source.troops)||!wholeNonNegative(source.food)||!wholeNonNegative(source.gold)){
    throw new Error('出發城的兵力、兵糧或軍資金資料無效。')
  }
  if(!Number.isSafeInteger(troops)||troops<100||troops>source.troops-100){
    throw new Error('出陣兵力不足：至少須留下100兵守城。')
  }
  if(!wholeNonNegative(food)||food>source.food){
    throw new Error('出陣兵糧必須是城內存量以內的整數。')
  }
  if(!wholeNonNegative(gold)||gold>source.gold){
    throw new Error('出陣軍資金必須是城內存量以內的整數。')
  }
  return Object.freeze({troops,food,gold})
}

function validatedRoute(route,start){
  if(!Array.isArray(route)||route.length<2)throw new Error('請先用方框指定行軍路線。')
  const points=route.map((point)=>{
    if(!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||
      point.x<0||point.x>WORLD_W||point.y<0||point.y>WORLD_H){
      throw new Error('行軍路線含有無效或超出地圖範圍的座標。')
    }
    return {x:Math.round(point.x),y:Math.round(point.y)}
  })
  if(points[0].x!==start.x||points[0].y!==start.y){
    throw new Error('行軍路線必須從部隊目前位置開始。')
  }
  // Each route node is one bounded movement step in the provisional runtime
  // projection. A distant destination can no longer be reached in one day.
  const step=MARCH_RUNTIME_PROJECTION.routeStepWorld
  for(let i=1;i<points.length;i++){
    const dx=Math.abs(points[i].x-points[i-1].x)
    const dy=Math.abs(points[i].y-points[i-1].y)
    if((dx===0&&dy===0)||Math.max(dx,dy)>step){
      throw new Error('行軍路線節點超出每格步長或重複。')
    }
  }
  return points
}

export function deployedOfficerNames(store, faction = store?.humanFaction) {
  const names=new Set()
  // Queries must not initialize army state: rejected dispatches are atomic.
  const armies=Array.isArray(store?.state?.armies)?store.state.armies:[]
  for(const army of armies){
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
  sources:Object.freeze(['jp-manual-pages-24-25','zh-hk-manual-pages-24-25']),
  conditionSemantics:'manual-confirmed',
  targetAttackTransition:'zh-hk-manual-immediate-field-battle',
  japaneseAttackTransition:'jp-manual-after-march-orders',
  adjacencySemantics:'adjacent-on-original-map',
  enemyArmyAdjacencyProjection:`provisional-${MARCH_RUNTIME_PROJECTION.enemyArmyAdjacencyWorld}px-route-step`,
  enemyCityAdjacencyProjection:`provisional-${MARCH_RUNTIME_PROJECTION.enemyCityAdjacencyWorld}px-city-tolerance`,
  splitGroupingProjection:'same-map-point-engineering',
  villageProjection:'map-profile-evidence',
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

export function canSplitArmy(store,armyId){
  return friendlyArmyStack(store,armyId).length>=2
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
  if(store.pendingConflict)throw new Error('戰鬥尚未結束，不能編成新的行軍部隊。')
  if (store.mode !== 'march') throw new Error('偶數月才能下達行軍命令。')
  const source = store.state.cities[from]
  const city = store.mapProfile?.cityById?.[from]
  if (!source || !city || source.owner !== store.humanFaction) throw new Error('必須從本國城池出陣。')
  if (!Array.isArray(route) || route.length < 2) throw new Error('請先用方框指定行軍路線。')

  if(!Array.isArray(officerNames)||officerNames.some((name)=>typeof name!=='string')){
    throw new Error('出陣武將名單格式無效。')
  }
  const names=[...new Set(officerNames.map((name)=>name.trim()).filter(Boolean))]
  const deployed=deployedOfficerNames(store,store.humanFaction)
  const duplicate=names.find((name)=>deployed.has(name))
  if(duplicate)throw new Error(`${duplicate}已隨其他部隊出陣。`)
  const roster=openingOfficerListForCity(store,from)
  if(roster.cityAssignmentVerified&&!names.length){
    throw new Error('已校準城池出陣必須選擇實際駐城武將。')
  }
  // Even the provisional 189 scaffold must not accept made-up commanders.
  // The fallback only grants membership in this faction's opening roster;
  // it must never imply verified officer-to-city placement.
  if(names.length&&(roster.cityAssignmentVerified||roster.rows.length)){
    const allowed=new Set(roster.rows.map((row)=>row.name))
    const displaced=names.find((name)=>!allowed.has(name))
    if(displaced)throw new Error(roster.cityAssignmentVerified
      ?`${displaced}不在目前的出發城駐守。`
      :`${displaced}不屬於本勢力的暫定開局武將名冊。`)
  }
  const nOfficers=names.length||officerCount
  if(!Number.isSafeInteger(nOfficers)||nOfficers<1){
    throw new Error('出陣武將人數必須是有效正整數。')
  }
  const start = cityWorldPoint(city)
  const normalized = validatedRoute(route,start)
  const allocation = validateMarchAllocation(source,{troops,food,gold})
  const nTroops=allocation.troops
  const nFood=allocation.food
  const nGold=allocation.gold

  // All checks are complete. Persist the whole command or roll back its
  // city debit, army creation, ID sequence and log on a storage failure.
  const state=store.state
  const hadArmies=Object.hasOwn(state,'armies')
  const originalArmies=state.armies
  const oldArmyCount=Array.isArray(originalArmies)?originalArmies.length:0
  const hadNextId=Object.hasOwn(state,'nextArmyId')
  const oldNextId=state.nextArmyId
  const hadLog=Object.hasOwn(state,'log')
  const oldLog=Array.isArray(state.log)?[...state.log]:state.log
  let army
  try{
    const armies=ensureMarchState(store)
    source.troops-=nTroops
    source.food-=nFood
    source.gold-=nGold
    army={
      id:`army-${state.nextArmyId++}`,
      faction:store.humanFaction,
      from,
      x:start.x,
      y:start.y,
      route:normalized,
      routeIndex:0,
      troops:nTroops,
      food:nFood,
      gold:nGold,
      officerCount:nOfficers,
      officerNames:names,
      dailyFood:dailyFoodFor(nTroops,nOfficers),
      starving:false,
      lastTurnFoodConsumed:0,
      lastTurnStarvingDays:0,
      starvingDaysTotal:0,
      status:'marching',
    }
    armies.push(army)
    store.addLog(`${city.name}軍出陣。武將${nOfficers} 兵${nTroops} 米${nFood}`)
    store.save()
  }catch(error){
    source.troops+=nTroops
    source.food+=nFood
    source.gold+=nGold
    if(hadArmies){
      if(Array.isArray(originalArmies))originalArmies.length=oldArmyCount
      state.armies=originalArmies
    }else delete state.armies
    if(hadNextId)state.nextArmyId=oldNextId
    else delete state.nextArmyId
    if(hadLog)state.log=oldLog
    else delete state.log
    throw error
  }
  return army
}

export function rerouteArmy(store, armyId, route) {
  store.assertState?.()
  if(store.pendingConflict)throw new Error('戰鬥尚未結束，不能重新指定行軍路線。')
  if(store.mode!=='march')throw new Error('只有行軍月能調整行軍路線。')
  const army=(Array.isArray(store.state?.armies)?store.state.armies:[])
    .find((item)=>item.id===armyId&&item.faction===store.humanFaction)
  if(!army)throw new Error('找不到可操作的行軍部隊。')
  if(army.status==='engaged'||army.status==='besieging')throw new Error('戰鬥中的部隊不能變更行軍路線。')
  const normalized=validatedRoute(route,{x:army.x,y:army.y})
  const oldRoute=army.route,oldIndex=army.routeIndex,oldStatus=army.status
  const oldLog=Array.isArray(store.state.log)?[...store.state.log]:store.state.log
  try{
    army.route=normalized
    army.routeIndex=0
    army.status='marching'
    store.addLog('行軍部隊已變更路線。')
    store.save()
  }catch(error){
    army.route=oldRoute
    army.routeIndex=oldIndex
    army.status=oldStatus
    store.state.log=oldLog
    throw error
  }
  return army
}

export function executeMarchTurn(store, days = MARCH_RUNTIME_PROJECTION.executionDaysPerEvenMonth) {
  store.assertState()
  if(store.pendingConflict)throw new Error('戰鬥尚未結束，不能移動其他部隊。')
  if(store.mode!=='march')throw new Error('只有行軍月可以結算行軍移動。')
  if(!Number.isSafeInteger(days)||days<0)throw new Error('行軍日數必須是非負整數。')
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
  if(army.status==='engaged'||army.status==='besieging'){
    throw new Error('已進入戰鬥的部隊不可重複發動攻城。')
  }
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
    defenderDefense:Number.isFinite(target.defense)?target.defense:null,
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
  if([attacker,defender].some((army)=>army.status==='engaged'||army.status==='besieging')){
    throw new Error('戰鬥中的部隊不可重複發動攻擊。')
  }
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
