import { CITIES, CITY_BY_ID } from './data.js'
import { WORLD_H, WORLD_W, cityWorldPoint } from './world.js'

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

export function armyAt(store, x, y, tolerance = 10, faction = store.humanFaction) {
  return ensureMarchState(store).find((army) =>
    army.faction === faction && Math.abs(army.x - x) <= tolerance && Math.abs(army.y - y) <= tolerance
  ) ?? null
}

export const MARCH_ADJACENCY_STEP = 8

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
  const city = CITY_BY_ID[from]
  if (!source || !city || source.owner !== store.humanFaction) throw new Error('必須從本國城池出陣。')
  if (!Array.isArray(route) || route.length < 2) throw new Error('請先用方框指定行軍路線。')

  const names = Array.isArray(officerNames)
    ? [...new Set(officerNames.map((name) => String(name).trim()).filter(Boolean))]
    : []
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

export function executeMarchTurn(store, days = 30) {
  const events = []
  const maxDays = Math.max(0, Math.floor(days))

  for (const army of ensureMarchState(store)) {
    if (army.status !== 'marching') continue

    const ration = dailyFoodFor(army.troops, army.officerCount)
    army.dailyFood = ration
    let steps = 0
    let foodConsumed = 0
    let starvingDays = 0

    while (steps < maxDays && army.routeIndex < army.route.length - 1) {
      steps++
      if (army.food >= ration) {
        army.food -= ration
        foodConsumed += ration
      } else {
        foodConsumed += Math.max(0, army.food)
        army.food = 0
        starvingDays++
      }

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
      foodConsumed,
      starvingDays,
      status: army.status,
    })
  }

  return events
}

export function advanceMarchArmies(store, days = 30) {
  const events = executeMarchTurn(store, days)
  if (events.length) store.addLog(`行軍部隊移動：${events.length}隊。`)
  store.save()
  return events.map((event) => event.armyId)
}

export function enemyCityNearArmy(store, armyId, tolerance = 24) {
  const army = ensureMarchState(store).find((item) => item.id === armyId)
  if (!army) return null
  return CITIES.find((city) => {
    const runtime = store.state.cities[city.id]
    if (!runtime || runtime.owner === army.faction) return false
    const point = cityWorldPoint(city)
    return Math.abs(point.x - army.x) <= tolerance && Math.abs(point.y - army.y) <= tolerance
  }) ?? null
}

export function beginSiegeFromArmy(store, armyId, targetCityId) {
  const armies = ensureMarchState(store)
  const army = armies.find((item) => item.id === armyId && item.faction === store.humanFaction)
  const target = store.state.cities[targetCityId]
  if (!army || !target || target.owner === army.faction) throw new Error('目前無可攻擊的敵城。')
  const near = enemyCityNearArmy(store, armyId)
  if (!near || near.id !== targetCityId) throw new Error('部隊尚未接近敵城。')
  army.status = 'besieging'
  store.pendingConflict = {
    kind: 'siege',
    armyId: army.id,
    from: army.from,
    target: targetCityId,
    attacker: army.faction,
    defender: target.owner,
    attackerTroops: army.troops,
    defenderTroops: target.troops,
    attackerOfficers: [...(army.officerNames ?? [])],
  }
  store.addLog(`${CITY_BY_ID[targetCityId].name}攻城準備。`)
  store.save()
  return store.pendingConflict
}

export function cancelSiegeFromArmy(store) {
  const conflict = store.pendingConflict
  if (!conflict || conflict.kind !== 'siege') return false
  const army = ensureMarchState(store).find((item) => item.id === conflict.armyId)
  if (army) army.status = 'waiting'
  store.pendingConflict = null
  store.addLog(`${CITY_BY_ID[conflict.target]?.name ?? conflict.target}中止攻城。`)
  store.save()
  return true
}
