// ============================================================
// MilitarySystem.ts — 军事命令系统
// Phase 3.6：出征编成
// ============================================================

import type { CityId, MarchArmy } from '../data/types'
import { gameState } from '../state/GameState'
import { strategyCities } from '../data/cities'
import { strategyOfficers } from '../data/officers'
import { strategyFactions } from '../data/factions'

export interface MilitaryResult {
  success: boolean
  message: string
  effects: { label: string; value: string; delta: number }[]
}

// ---- 军事命令定义（视察月子命令网格） ----
export interface MilitaryCommand {
  id: string
  name: string
  icon: string
  cost: (cityId: CityId) => number
  description: string
}

export const MILITARY_COMMANDS: MilitaryCommand[] = [
  {
    id: 'conscript',
    name: '徵 兵',
    icon: '🛡',
    cost: (cid) => {
      const city = gameState.getCity(cid)
      return 400 + Math.floor((city?.troops ?? 0) * 0.1)
    },
    description: '為指定武將招募士兵。受太守魅力影響。',
  },
  {
    id: 'weapon',
    name: '武 器',
    icon: '⚔',
    cost: () => 500,
    description: '購置武器裝備，提升部隊戰力。',
  },
  {
    id: 'intel',
    name: '情 報',
    icon: '🔭',
    cost: () => 200,
    description: '偵察相鄰敵城的兵力、防禦、武將情報。',
  },
  {
    id: 'recruit_officer',
    name: '人 材',
    icon: '👥',
    cost: () => 300,
    description: '搜索並登用在野武將或低忠誠武將。',
  },
  {
    id: 'defense',
    name: '防 衛',
    icon: '🏰',
    cost: (cid) => 200 + Math.floor((gameState.getCity(cid)?.defense ?? 50) * 2),
    description: '加強城防工事，提升城池防禦力。',
  },
  {
    id: 'train',
    name: '訓 練',
    icon: '🏋',
    cost: () => 300,
    description: '訓練士兵。可單獨訓練或全軍訓練。',
  },
  {
    id: 'deploy',
    name: '出 征',
    icon: '⚔',
    cost: () => 0,
    description: '編成出征部隊，向目標城池進軍。',
  },
]

export class MilitarySystem {
  /**
   * 执行视察月军事子命令（非出征类）
   */
  static execute(commandId: string, cityId: CityId): MilitaryResult {
    const city = gameState.getCity(cityId)
    if (!city) return { success: false, message: '城池不存在', effects: [] }
    if (city.owner !== gameState.playerFactionId) return { success: false, message: '只能對己方城池執行軍事命令', effects: [] }

    const cmd = MILITARY_COMMANDS.find(c => c.id === commandId)
    if (!cmd) return { success: false, message: '未知命令', effects: [] }

    const cost = cmd.cost(cityId)
    if (cost > 0 && city.gold < cost) {
      return { success: false, message: `金錢不足！需要 ${cost} 金，當前 ${city.gold} 金`, effects: [] }
    }

    if (cost > 0) city.gold -= cost

    switch (commandId) {
      case 'conscript': return MilitarySystem.doConscript(city)
      case 'weapon': return MilitarySystem.doWeapon(city)
      case 'intel': return MilitarySystem.doIntel(city)
      case 'recruit_officer': return MilitarySystem.doRecruitOfficer(city)
      case 'defense': return MilitarySystem.doDefense(city)
      case 'train': return MilitarySystem.doTrain(city)
      default:
        return { success: false, message: '此命令需在子面板中操作', effects: [] }
    }
  }

  // ---- 徵兵 ----
  private static doConscript(city: import('../state/GameState').RuntimeCity): MilitaryResult {
    if (city.population < 1000) {
      return { success: false, message: '人口不足，無法徵兵', effects: [] }
    }
    const soldiers = 500 + Math.floor(Math.random() * 1000)
    const popCost = 200 + Math.floor(soldiers * 0.3)
    city.troops += soldiers
    city.population -= popCost
    return {
      success: true,
      message: `徵兵成功！兵力 +${soldiers}，人口 -${popCost}`,
      effects: [
        { label: '兵力', value: `${city.troops}`, delta: soldiers },
        { label: '人口', value: `${city.population}`, delta: -popCost },
      ],
    }
  }

  // ---- 武器 ----
  private static doWeapon(city: import('../state/GameState').RuntimeCity): MilitaryResult {
    const gain = 2 + Math.floor(Math.random() * 3)
    city.defense += gain
    return {
      success: true,
      message: `武器購置完成！防禦 +${gain}`,
      effects: [
        { label: '防禦', value: `${city.defense}`, delta: gain },
      ],
    }
  }

  // ---- 情報（侦察相邻敌城） ----
  private static doIntel(city: import('../state/GameState').RuntimeCity): MilitaryResult {
    const staticCity = strategyCities.find(c => c.id === city.id)
    if (!staticCity) return { success: false, message: '城池數據異常', effects: [] }

    const enemyNeighbors = staticCity.routes
      .map(rid => gameState.getCity(rid))
      .filter(c => c && c.owner !== gameState.playerFactionId)

    if (enemyNeighbors.length === 0) {
      return { success: true, message: '周邊沒有敵方城池。', effects: [] }
    }

    const lines = enemyNeighbors.map(c => {
      if (!c) return ''
      const f = strategyFactions.find(ff => ff.id === c.owner)
      return `${c.name}（${f?.name ?? '?'}）兵力:${c.troops} 防禦:${c.defense}`
    })

    return {
      success: true,
      message: `${city.name}周邊敵情：\n${lines.join('\n')}`,
      effects: [],
    }
  }

  // ---- 人材 ----
  private static doRecruitOfficer(_city: import('../state/GameState').RuntimeCity): MilitaryResult {
    const found = Math.random() < 0.35
    if (found) {
      return {
        success: true,
        message: '搜索成功！發現了一位在野武將，已加入麾下。',
        effects: [{ label: '人材', value: '在野武將', delta: 1 }],
      }
    }
    return {
      success: true,
      message: '搜索未果，本次未發現可用人才。',
      effects: [],
    }
  }

  // ---- 防衛 ----
  private static doDefense(city: import('../state/GameState').RuntimeCity): MilitaryResult {
    const gain = 5 + Math.floor(Math.random() * 8)
    city.defense += gain
    return {
      success: true,
      message: `城防加強完成！防禦 +${gain}`,
      effects: [
        { label: '防禦', value: `${city.defense}`, delta: gain },
      ],
    }
  }

  // ---- 訓練 ----
  private static doTrain(city: import('../state/GameState').RuntimeCity): MilitaryResult {
    const gain = 3 + Math.floor(Math.random() * 5)
    city.troops = Math.floor(city.troops * (1 + gain * 0.005))
    return {
      success: true,
      message: `訓練完成！部隊戰力提升，有效兵力微增`,
      effects: [
        { label: '兵力', value: `${city.troops}`, delta: gain * 10 },
      ],
    }
  }

  /**
   * 出征：从sourceCity出兵攻击targetCity
   */
  static deploy(sourceCityId: CityId, targetCityId: CityId, troopCount: number): MilitaryResult {
    const source = gameState.getCity(sourceCityId)
    const target = gameState.getCity(targetCityId)

    if (!source || !target) {
      return { success: false, message: '城池不存在', effects: [] }
    }
    if (source.owner !== gameState.playerFactionId) {
      return { success: false, message: '只能从己方城池出兵', effects: [] }
    }
    if (target.owner === gameState.playerFactionId) {
      return { success: false, message: '不能攻击己方城池', effects: [] }
    }
    if (troopCount < 500) {
      return { success: false, message: '出征兵力至少需要500', effects: [] }
    }
    if (troopCount > source.troops) {
      return { success: false, message: `兵力不足！当前 ${source.troops}，需要 ${troopCount}`, effects: [] }
    }

    // 扣除兵力
    source.troops -= troopCount

    // 简化的战斗计算
    const attackPower = troopCount * (1 + source.defense / 100) * (0.8 + Math.random() * 0.4)
    const defensePower = target.troops * (1 + target.defense / 100) * (0.8 + Math.random() * 0.4)

    if (attackPower > defensePower * 1.2) {
      // 胜利
      const losses = Math.floor(troopCount * (0.2 + Math.random() * 0.3))
      const remaining = troopCount - losses
      target.owner = gameState.playerFactionId
      target.troops = remaining
      target.publicOrder = Math.max(20, target.publicOrder - 20)
      target.gold = Math.max(0, target.gold - Math.floor(target.gold * 0.3))

      // 归还剩余兵力
      source.troops += remaining

      return {
        success: true,
        message: `攻占${target.name}！损失 ${losses} 兵力，剩余 ${remaining} 撤回${source.name}`,
        effects: [
          { label: '占领', value: target.name, delta: 1 },
          { label: '损失', value: `${losses}`, delta: -losses },
        ],
      }
    } else if (attackPower > defensePower * 0.6) {
      // 平手
      const losses = Math.floor(troopCount * (0.4 + Math.random() * 0.3))
      const remaining = troopCount - losses
      source.troops += remaining
      target.troops = Math.max(0, target.troops - Math.floor(target.troops * 0.3))

      return {
        success: false,
        message: `攻打${target.name}未果，双方各有损失。损失 ${losses} 兵力`,
        effects: [
          { label: '损失', value: `${losses}`, delta: -losses },
        ],
      }
    } else {
      // 失败
      const losses = Math.floor(troopCount * (0.5 + Math.random() * 0.3))
      const remaining = troopCount - losses
      source.troops += remaining

      return {
        success: false,
        message: `攻打${target.name}大败！损失 ${losses} 兵力`,
        effects: [
          { label: '损失', value: `${losses}`, delta: -losses },
        ],
      }
    }
  }

  /** 获取可攻击的城池 */
  static getAttackableCities(): { city: ReturnType<typeof gameState.getCity>; distance: number }[] {
    const staticCities = strategyCities
    const result: { city: ReturnType<typeof gameState.getCity>; distance: number }[] = []

    for (const sc of staticCities) {
      const city = gameState.getCity(sc.id)
      if (!city || city.owner === gameState.playerFactionId) continue

      // 简单距离计算（找最近的己方城池距离）
      const playerCities = gameState.getPlayerCities()
      let minDist = Infinity
      for (const pc of playerCities) {
        const psc = staticCities.find(c => c.id === pc.id)
        if (!psc) continue
        const dist = Math.sqrt((sc.x - psc.x) ** 2 + (sc.y - psc.y) ** 2)
        if (dist < minDist) minDist = dist
      }
      result.push({ city, distance: Math.floor(minDist) })
    }
    return result.sort((a, b) => a.distance - b.distance)
  }

  /**
   * 出征编成：创建MarchArmy对象（不立即战斗）
   */
  static deployArmy(
    sourceCityId: CityId,
    targetCityId: CityId,
    troopCount: number,
  ): { success: boolean; army?: MarchArmy; message: string; effects: { label: string; value: string; delta: number }[] } {
    const source = gameState.getCity(sourceCityId)
    const target = gameState.getCity(targetCityId)

    if (!source || !target) {
      return { success: false, message: '城池不存在', effects: [] }
    }
    if (source.owner !== gameState.playerFactionId) {
      return { success: false, message: '只能从己方城池出兵', effects: [] }
    }
    if (target.owner === gameState.playerFactionId) {
      return { success: false, message: '不能攻击己方城池', effects: [] }
    }
    if (troopCount < 500) {
      return { success: false, message: '出征兵力至少需要500', effects: [] }
    }
    if (troopCount > source.troops) {
      return { success: false, message: `兵力不足！当前 ${source.troops}，需要 ${troopCount}`, effects: [] }
    }

    // 找出城中可用武将（排除已出征的）
    const available = strategyOfficers.filter(
      o => o.location === sourceCityId && o.faction === gameState.playerFactionId && !gameState.deployedOfficerIds.has(o.id),
    )
    if (available.length === 0) {
      return { success: false, message: '城中没有可出征的武将', effects: [] }
    }

    // 主将 = 统率最高
    available.sort((a, b) => b.command - a.command)
    const leader = available[0]
    const officerIds = available.map(o => o.id)

    // 兵力均分
    const perOfficer = Math.floor(troopCount / officerIds.length)
    const remainder = troopCount - perOfficer * officerIds.length
    const officerTroops: Record<string, number> = {}
    for (let i = 0; i < officerIds.length; i++) {
      officerTroops[officerIds[i]] = perOfficer + (i === 0 ? remainder : 0)
    }

    // 粮草：从城中拨出，尽量充足
    const totalFood = Math.min(source.food, troopCount * 2)
    const perFood = Math.floor(totalFood / officerIds.length)
    const foodRemainder = totalFood - perFood * officerIds.length
    const officerFood: Record<string, number> = {}
    for (let i = 0; i < officerIds.length; i++) {
      officerFood[officerIds[i]] = perFood + (i === 0 ? foodRemainder : 0)
    }
    source.food -= totalFood

    // 扣除兵力
    source.troops -= troopCount

    const armyId = `army_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const army: MarchArmy = {
      id: armyId,
      factionId: gameState.playerFactionId,
      sourceCityId,
      targetCityId,
      leaderOfficerId: leader.id,
      officerIds,
      officerTroops,
      officerFood,
      officerFatigue: Object.fromEntries(officerIds.map(id => [id, 0])),
      troops: troopCount,
      food: totalFood,
      morale: 100,
      position: { kind: 'city', cityId: sourceCityId },
      routePlan: [],
      movePoints: 0,
      status: 'ready',
    }

    gameState.addArmy(army)

    const targetStatic = strategyCities.find(c => c.id === targetCityId)
    return {
      success: true,
      army,
      message: `从${source.name}出征编成完成，目标${targetStatic?.name ?? target.name}，主将${leader.name}，${officerIds.length}名武将率${troopCount}兵`,
      effects: [
        { label: '出征', value: `${troopCount}兵`, delta: -troopCount },
        { label: '粮草', value: `${totalFood}`, delta: -totalFood },
      ],
    }
  }

  /**
   * BFS寻路：城市邻接图最短路径
   */
  static computeRoute(fromCityId: CityId, toCityId: CityId): CityId[] {
    if (fromCityId === toCityId) return []

    // 构建双向邻接表
    const adj = new Map<CityId, Set<CityId>>()
    for (const city of strategyCities) {
      if (!adj.has(city.id)) adj.set(city.id, new Set())
      for (const r of city.routes) {
        adj.get(city.id)!.add(r)
        if (!adj.has(r)) adj.set(r, new Set())
        adj.get(r)!.add(city.id)
      }
    }

    // BFS
    const parent = new Map<CityId, CityId>()
    const visited = new Set<CityId>([fromCityId])
    const queue: CityId[] = [fromCityId]

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === toCityId) {
        // 重建路径
        const path: CityId[] = []
        let node: CityId | undefined = toCityId
        while (node && node !== fromCityId) {
          path.unshift(node)
          node = parent.get(node)
        }
        return path
      }
      for (const neighbor of adj.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor)
          parent.set(neighbor, current)
          queue.push(neighbor)
        }
      }
    }
    return [] // 无法到达
  }

  /**
   * 执行行军：沿routePlan移动部队（Phase 4.1：瞬移到目的地）
   */
  static executeMarch(armyId: string): { success: boolean; message: string; effects: { label: string; value: string; delta: number }[] } {
    const army = gameState.getArmy(armyId)
    if (!army) return { success: false, message: '军队不存在', effects: [] }
    if (army.status !== 'ready') return { success: false, message: '军队当前无法移动', effects: [] }
    if (army.routePlan.length === 0) return { success: false, message: '未设定目的地', effects: [] }

    const destCityId = army.routePlan[army.routePlan.length - 1]
    const dest = gameState.getCity(destCityId)
    if (!dest) return { success: false, message: '目标城池不存在', effects: [] }

    // 查主将command属性
    const leader = strategyOfficers.find(o => o.id === army.leaderOfficerId)
    const commandBonus = leader ? 1 + leader.command / 100 : 1

    // 到达己方城池：部队驻扎
    if (dest.owner === gameState.playerFactionId) {
      dest.troops += army.troops
      gameState.removeArmy(armyId)
      return {
        success: true,
        message: `部队抵达${dest.name}，${army.troops}兵驻扎`,
        effects: [
          { label: '驻扎', value: dest.name, delta: army.troops },
        ],
      }
    }

    // 到达敌方城池：战斗
    const attackPower = army.troops * commandBonus * (0.8 + Math.random() * 0.4)
    const defensePower = dest.troops * (1 + dest.defense / 100) * (0.8 + Math.random() * 0.4)

    if (attackPower > defensePower * 1.2) {
      // 胜利
      const losses = Math.floor(army.troops * (0.2 + Math.random() * 0.3))
      const remaining = army.troops - losses
      dest.owner = gameState.playerFactionId
      dest.troops = remaining
      dest.publicOrder = Math.max(20, dest.publicOrder - 20)
      dest.gold = Math.max(0, dest.gold - Math.floor(dest.gold * 0.3))
      gameState.removeArmy(armyId)
      const destStatic = strategyCities.find(c => c.id === destCityId)
      return {
        success: true,
        message: `攻占${destStatic?.name ?? dest.name}！损失${losses}兵力，剩余${remaining}驻守`,
        effects: [
          { label: '占领', value: destStatic?.name ?? dest.name, delta: 1 },
          { label: '损失', value: `${losses}`, delta: -losses },
        ],
      }
    } else if (attackPower > defensePower * 0.6) {
      // 平手：退回出发城
      const losses = Math.floor(army.troops * (0.4 + Math.random() * 0.3))
      const remaining = army.troops - losses
      const source = gameState.getCity(army.sourceCityId)
      if (source) source.troops += remaining
      dest.troops = Math.max(0, dest.troops - Math.floor(dest.troops * 0.3))
      gameState.removeArmy(armyId)
      return {
        success: false,
        message: `攻打${dest.name}未果，双方各有损失。损失${losses}兵力，残部退回${source?.name ?? '出发城'}`,
        effects: [
          { label: '损失', value: `${losses}`, delta: -losses },
        ],
      }
    } else {
      // 失败：退回出发城
      const losses = Math.floor(army.troops * (0.5 + Math.random() * 0.3))
      const remaining = army.troops - losses
      const source = gameState.getCity(army.sourceCityId)
      if (source) source.troops += remaining
      gameState.removeArmy(armyId)
      return {
        success: false,
        message: `攻打${dest.name}大败！损失${losses}兵力，残部退回${source?.name ?? '出发城'}`,
        effects: [
          { label: '损失', value: `${losses}`, delta: -losses },
        ],
      }
    }
  }

  /**
   * 撤回军队：部队和粮草退回出发城
   */
  static recallArmy(armyId: string): { success: boolean; message: string } {
    const army = gameState.getArmy(armyId)
    if (!army) return { success: false, message: '军队不存在' }
    if (army.factionId !== gameState.playerFactionId) return { success: false, message: '只能撤回己方军队' }

    const source = gameState.getCity(army.sourceCityId)
    if (source) {
      source.troops += army.troops
      source.food += army.food
    }
    gameState.removeArmy(armyId)
    return { success: true, message: `军队已撤回${source?.name ?? '出发城'}` }
  }
}
