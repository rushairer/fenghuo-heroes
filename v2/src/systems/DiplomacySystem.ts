// ============================================================
// DiplomacySystem.ts — 外交7命令系统
// 对齐原版《乱世群英》：同盟/離間/暗殺/火計/情報/借款/還款
// ============================================================

import type { FactionId, DiplomacyCommandKind } from '../data/types'
import { gameState } from '../state/GameState'
import { strategyFactions } from '../data/factions'
import { strategyOfficers } from '../data/officers'

// ---- 命令定义 ----
export interface DiplomacyCommand {
  id: DiplomacyCommandKind
  name: string
  icon: string
  cost: number
  description: string
}

export const DIPLOMACY_COMMANDS: DiplomacyCommand[] = [
  {
    id: 'alliance', name: '同 盟', icon: '🤝',
    cost: 500,
    description: '與目標勢力結盟，有效期12個月。同盟期間互不攻擊。',
  },
  {
    id: 'discord', name: '離 間', icon: '🗡',
    cost: 400,
    description: '降低敵方武將忠誠度。忠誠過低可能倒戈來降。',
  },
  {
    id: 'assassination', name: '暗 殺', icon: '💀',
    cost: 600,
    description: '派遣刺客刺殺敵方武將。高風險高回報。',
  },
  {
    id: 'fire', name: '火 計', icon: '🔥',
    cost: 350,
    description: '在目標城池縱火，燒毀糧草、降低防禦。受天候影響。',
  },
  {
    id: 'intel', name: '情 報', icon: '🔭',
    cost: 200,
    description: '偵察目標勢力的兵力、金錢、武將等情報。',
  },
  {
    id: 'borrow', name: '借 款', icon: '💸',
    cost: 100,
    description: '向目標勢力借入金錢，需在期限內歸還。',
  },
  {
    id: 'repay', name: '還 款', icon: '💰',
    cost: 0,
    description: '歸還借款及利息。維護信用。',
  },
]

// ---- 结果 ----
export interface DiplomacyResult {
  success: boolean
  message: string
  effects: { label: string; value: string }[]
}

// ---- 外交系统 ----
export class DiplomacySystem {
  // 好感度追踪（势力ID → 好感 0-100）
  static relations: Record<string, number> = {}

  static init() {
    for (const f of strategyFactions) {
      if (f.id !== 'neutral' && DiplomacySystem.relations[f.id] === undefined) {
        DiplomacySystem.relations[f.id] = 50
      }
    }
  }

  static execute(command: DiplomacyCommandKind, targetFactionId: FactionId): DiplomacyResult {
    const targetFaction = strategyFactions.find(f => f.id === targetFactionId)
    if (!targetFaction) {
      return { success: false, message: '勢力不存在', effects: [] }
    }

    const cmd = DIPLOMACY_COMMANDS.find(c => c.id === command)
    if (!cmd) return { success: false, message: '未知命令', effects: [] }

    // 检查金钱
    const playerCities = gameState.getPlayerCities()
    const totalGold = playerCities.reduce((s, c) => s + c.gold, 0)
    if (cmd.cost > 0 && totalGold < cmd.cost) {
      return { success: false, message: `金錢不足！需要 ${cmd.cost} 金`, effects: [] }
    }

    // 扣除金钱
    if (cmd.cost > 0) {
      playerCities.sort((a, b) => b.gold - a.gold)
      let remaining = cmd.cost
      for (const city of playerCities) {
        const deduct = Math.min(city.gold, remaining)
        city.gold -= deduct
        remaining -= deduct
        if (remaining <= 0) break
      }
    }

    const rel = DiplomacySystem.relations[targetFactionId] ?? 50

    switch (command) {
      case 'alliance': return DiplomacySystem.doAlliance(targetFaction, rel)
      case 'discord': return DiplomacySystem.doDiscord(targetFaction, rel)
      case 'assassination': return DiplomacySystem.doAssassination(targetFaction, rel)
      case 'fire': return DiplomacySystem.doFire(targetFaction, rel)
      case 'intel': return DiplomacySystem.doIntel(targetFaction, rel)
      case 'borrow': return DiplomacySystem.doBorrow(targetFaction, rel)
      case 'repay': return DiplomacySystem.doRepay(targetFaction, rel)
      default:
        return { success: false, message: '命令未實現', effects: [] }
    }
  }

  // ---- 同盟 ----
  private static doAlliance(target: typeof strategyFactions[0], rel: number): DiplomacyResult {
    const threshold = 30 + Math.floor(Math.random() * 30)
    const success = rel >= threshold || Math.random() < 0.4
    DiplomacySystem.relations[target.id] = Math.min(100, rel + (success ? 20 : -5))
    return {
      success,
      message: success
        ? `與${target.name}結盟成功！好感 +20`
        : `${target.name}拒絕了同盟請求。好感 -5`,
      effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
    }
  }

  // ---- 離間 ----
  private static doDiscord(target: typeof strategyFactions[0], rel: number): DiplomacyResult {
    const caught = Math.random() < 0.35
    if (caught) {
      DiplomacySystem.relations[target.id] = Math.max(0, rel - 8)
      return {
        success: false,
        message: `離間失敗被識破！${target.name}好感 -8`,
        effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
      }
    }
    // 降低目标势力随机武将的忠诚
    const enemyOfficers = strategyOfficers.filter(o => o.faction === target.id)
    if (enemyOfficers.length === 0) {
      return { success: false, message: `${target.name}沒有可離間的武將`, effects: [] }
    }
    const victim = enemyOfficers[Math.floor(Math.random() * enemyOfficers.length)]
    const loyaltyDrop = 8 + Math.floor(Math.random() * 15)
    victim.loyalty = Math.max(0, victim.loyalty - loyaltyDrop)
    DiplomacySystem.relations[target.id] = Math.max(0, rel - 5)

    if (victim.loyalty < 30 && Math.random() < 0.25) {
      return {
        success: true,
        message: `離間成功！${victim.name}忠誠降至${victim.loyalty}，已倒戈來降！`,
        effects: [
          { label: '武將', value: victim.name },
          { label: '好感', value: `${DiplomacySystem.relations[target.id]}` },
        ],
      }
    }

    return {
      success: true,
      message: `離間成功！${victim.name}忠誠 -${loyaltyDrop}（現${victim.loyalty}）`,
      effects: [
        { label: '武將', value: victim.name },
        { label: '好感', value: `${DiplomacySystem.relations[target.id]}` },
      ],
    }
  }

  // ---- 暗殺 ----
  private static doAssassination(target: typeof strategyFactions[0], rel: number): DiplomacyResult {
    const success = Math.random() < 0.2
    DiplomacySystem.relations[target.id] = Math.max(0, rel + (success ? -30 : -20))
    if (success) {
      const targetCities = gameState.cities.filter(c => c.owner === target.id)
      if (targetCities.length > 0) {
        const city = targetCities[Math.floor(Math.random() * targetCities.length)]
        city.publicOrder = Math.max(0, city.publicOrder - 20)
      }
      return {
        success: true,
        message: `暗殺成功！${target.name}陷入混亂。好感 -30`,
        effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
      }
    }
    return {
      success: false,
      message: `暗殺失敗！${target.name}大怒。好感 -20`,
      effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
    }
  }

  // ---- 火計 ----
  private static doFire(target: typeof strategyFactions[0], rel: number): DiplomacyResult {
    const caught = Math.random() < 0.45
    if (caught) {
      DiplomacySystem.relations[target.id] = Math.max(0, rel - 12)
      return {
        success: false,
        message: `火計被發現！${target.name}好感 -12`,
        effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
      }
    }
    const targetCities = gameState.cities.filter(c => c.owner === target.id)
    if (targetCities.length > 0) {
      const city = targetCities[Math.floor(Math.random() * targetCities.length)]
      const foodLoss = Math.floor(city.food * (0.1 + Math.random() * 0.2))
      const defLoss = 2 + Math.floor(Math.random() * 4)
      city.food = Math.max(0, city.food - foodLoss)
      city.defense = Math.max(1, city.defense - defLoss)
      city.publicOrder = Math.max(0, city.publicOrder - 10)
      DiplomacySystem.relations[target.id] = Math.max(0, rel - 10)
      return {
        success: true,
        message: `${city.name}發生大火！糧草 -${foodLoss}，防禦 -${defLoss}，治安 -10`,
        effects: [
          { label: '目標', value: city.name },
          { label: '好感', value: `${DiplomacySystem.relations[target.id]}` },
        ],
      }
    }
    return { success: false, message: '目標勢力無城池可燒', effects: [] }
  }

  // ---- 情報 ----
  private static doIntel(target: typeof strategyFactions[0], rel: number): DiplomacyResult {
    const targetCities = gameState.cities.filter(c => c.owner === target.id)
    const totalTroops = targetCities.reduce((s, c) => s + c.troops, 0)
    const totalGold = targetCities.reduce((s, c) => s + c.gold, 0)
    const totalFood = targetCities.reduce((s, c) => s + c.food, 0)
    const relChange = rel > 60 ? 0 : -3
    if (relChange !== 0) DiplomacySystem.relations[target.id] = Math.max(0, rel + relChange)

    const info = [
      `${target.name}（${target.ruler}）情報：`,
      `城池：${targetCities.length}座`,
      `總兵力：${totalTroops.toLocaleString()}`,
      `總金錢：${totalGold.toLocaleString()}`,
      `總糧草：${totalFood.toLocaleString()}`,
    ].join('\n')
    return {
      success: true,
      message: info,
      effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
    }
  }

  // ---- 借款 ----
  private static doBorrow(target: typeof strategyFactions[0], rel: number): DiplomacyResult {
    const threshold = 50 + Math.floor(Math.random() * 20)
    const success = rel >= threshold
    if (success) {
      const amount = 500 + Math.floor(Math.random() * 1000)
      const capital = gameState.getPlayerCities()[0]
      if (capital) capital.gold += amount
      DiplomacySystem.relations[target.id] = Math.max(0, rel - 10)
      return {
        success: true,
        message: `從${target.name}借得 ${amount} 金。好感 -10`,
        effects: [
          { label: '獲得', value: `${amount}金` },
          { label: '好感', value: `${DiplomacySystem.relations[target.id]}` },
        ],
      }
    }
    DiplomacySystem.relations[target.id] = Math.max(0, rel - 3)
    return {
      success: false,
      message: `${target.name}拒絕了借款請求。好感 -3`,
      effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
    }
  }

  // ---- 還款 ----
  private static doRepay(target: typeof strategyFactions[0], rel: number): DiplomacyResult {
    DiplomacySystem.relations[target.id] = Math.min(100, rel + 15)
    return {
      success: true,
      message: `向${target.name}還款完畢。好感 +15`,
      effects: [{ label: '好感', value: `${DiplomacySystem.relations[target.id]}` }],
    }
  }
}
