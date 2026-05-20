// ============================================================
// DomesticSystem.ts — 内政8命令系统
// 对齐原版《乱世群英》：開發/調動/情報/福利/任命/税率/教育/運輸
// ============================================================

import type { CityId } from '../data/types'
import { gameState } from '../state/GameState'
import type { RuntimeCity } from '../state/GameState'
import { strategyOfficers } from '../data/officers'

// ---- 命令定义 ----
export interface DomesticCommand {
  id: string
  name: string
  icon: string
  cost: (cityId: CityId) => number
  description: string
}

export const DOMESTIC_COMMANDS: DomesticCommand[] = [
  {
    id: 'develop',
    name: '開 發',
    icon: '🌾',
    cost: (cid) => 200 + Math.floor(gameState.getCity(cid)?.land ?? 50),
    description: '開発農田，提升土地值，增加糧食收入。',
  },
  {
    id: 'transfer',
    name: '調 動',
    icon: '🔄',
    cost: () => 150,
    description: '調動武將和物資到相鄰己方城池。',
  },
  {
    id: 'intel',
    name: '情 報',
    icon: '🔍',
    cost: () => 200,
    description: '偵察周邊城池，獲取敵方兵力、武將等情報。',
  },
  {
    id: 'welfare',
    name: '福 利',
    icon: '🏠',
    cost: (cid) => 250 + Math.floor((100 - (gameState.getCity(cid)?.publicOrder ?? 70)) * 3),
    description: '安撫百姓、賑濟災民，提升治安和民心。',
  },
  {
    id: 'appoint',
    name: '任 命',
    icon: '📋',
    cost: () => 100,
    description: '任命武將為太守/先鋒/軍師等職位。',
  },
  {
    id: 'tax',
    name: '税 率',
    icon: '⚖',
    cost: () => 0,
    description: '設定稅率（薄稅/普通/重稅），影響每月收入和治安。',
  },
  {
    id: 'educate',
    name: '教 育',
    icon: '📖',
    cost: () => 400,
    description: '教育武將，提升政治/知力等能力值。',
  },
  {
    id: 'transport',
    name: '運 輸',
    icon: '🚚',
    cost: () => 100,
    description: '向相鄰城池運輸金錢、糧草或兵力。',
  },
]

// ---- 命令结果 ----
export interface CommandResult {
  success: boolean
  message: string
  effects: { label: string; value: string; delta: number }[]
}

// ---- 内政系统 ----
export class DomesticSystem {
  static execute(commandId: string, cityId: CityId): CommandResult {
    const city = gameState.getCity(cityId)
    if (!city) {
      return { success: false, message: '城池不存在', effects: [] }
    }

    const cmd = DOMESTIC_COMMANDS.find(c => c.id === commandId)
    if (!cmd) {
      return { success: false, message: '未知命令', effects: [] }
    }

    const cost = cmd.cost(cityId)
    if (cost > 0 && city.gold < cost) {
      return {
        success: false,
        message: `金錢不足！需要 ${cost} 金，當前 ${city.gold} 金`,
        effects: [],
      }
    }

    // 扣除金钱
    if (cost > 0) city.gold -= cost

    switch (commandId) {
      case 'develop': return DomesticSystem.doDevelop(city, cost)
      case 'transfer': return DomesticSystem.doTransfer(city)
      case 'intel': return DomesticSystem.doIntel(city)
      case 'welfare': return DomesticSystem.doWelfare(city, cost)
      case 'appoint': return DomesticSystem.doAppoint(city)
      case 'tax': return DomesticSystem.doTax(city)
      case 'educate': return DomesticSystem.doEducate(city, cost)
      case 'transport': return DomesticSystem.doTransport(city)
      default:
        return { success: false, message: '命令未實現', effects: [] }
    }
  }

  // ---- 開發 ----
  private static doDevelop(city: RuntimeCity, cost: number): CommandResult {
    const gain = 5 + Math.floor(Math.random() * 8)
    city.land += gain
    city.food += gain * 20
    return {
      success: true,
      message: `開發完成！土地 +${gain}，糧食增收`,
      effects: [
        { label: '土地', value: `${city.land}`, delta: gain },
        { label: '金錢', value: `${city.gold}`, delta: -cost },
      ],
    }
  }

  // ---- 調動 ----
  private static doTransfer(city: RuntimeCity): CommandResult {
    // 简化：从相邻己方城池调来少量兵力
    const neighbors = gameState.cities.filter(
      c => c.owner === gameState.playerFactionId && c.id !== city.id,
    )
    if (neighbors.length === 0) {
      return { success: false, message: '沒有可調動的己方城池', effects: [] }
    }
    const donor = neighbors[Math.floor(Math.random() * neighbors.length)]
    const amount = Math.min(500, donor.troops)
    if (amount < 100) {
      return { success: false, message: `${donor.name}兵力不足，無法調動`, effects: [] }
    }
    donor.troops -= amount
    city.troops += amount
    return {
      success: true,
      message: `從${donor.name}調動${amount}兵至${city.name}`,
      effects: [
        { label: '兵力', value: `${city.troops}`, delta: amount },
        { label: '來源', value: donor.name, delta: -amount },
      ],
    }
  }

  // ---- 情報 ----
  private static doIntel(city: RuntimeCity): CommandResult {
    // 简化：显示当前城池详细数据
    const officers = strategyOfficers.filter(
      o => o.location === city.id && o.faction === gameState.playerFactionId && !gameState.deployedOfficerIds.has(o.id),
    )
    return {
      success: true,
      message: [
        `${city.name} 詳細情報：`,
        `金錢:${city.gold} 糧草:${city.food} 兵力:${city.troops}`,
        `防禦:${city.defense} 治安:${city.publicOrder} 人口:${city.population}`,
        `武將:${officers.map(o => o.name).join('、') || '無'}`,
      ].join('\n'),
      effects: [
        { label: '金錢', value: `${city.gold}`, delta: 0 },
        { label: '兵力', value: `${city.troops}`, delta: 0 },
      ],
    }
  }

  // ---- 福利 ----
  private static doWelfare(city: RuntimeCity, cost: number): CommandResult {
    const orderGain = 8 + Math.floor(Math.random() * 12)
    const popGain = 200 + Math.floor(Math.random() * 500)
    city.publicOrder = Math.min(100, city.publicOrder + orderGain)
    city.population += popGain
    return {
      success: true,
      message: `福利實施完成！治安 +${orderGain}，人口 +${popGain}`,
      effects: [
        { label: '治安', value: `${city.publicOrder}`, delta: orderGain },
        { label: '人口', value: `${city.population}`, delta: popGain },
        { label: '金錢', value: `${city.gold}`, delta: -cost },
      ],
    }
  }

  // ---- 任命 ----
  private static doAppoint(city: RuntimeCity): CommandResult {
    const officers = strategyOfficers.filter(
      o => o.location === city.id && o.faction === gameState.playerFactionId && !gameState.deployedOfficerIds.has(o.id),
    )
    if (officers.length === 0) {
      return { success: false, message: '城中沒有可任命的武將', effects: [] }
    }
    // 简化：随机选一个武将提升忠诚
    const target = officers[Math.floor(Math.random() * officers.length)]
    const loyaltyGain = 5 + Math.floor(Math.random() * 10)
    target.loyalty = Math.min(100, target.loyalty + loyaltyGain)
    return {
      success: true,
      message: `任命${target.name}，忠誠度 +${loyaltyGain}`,
      effects: [
        { label: '武將', value: target.name, delta: loyaltyGain },
        { label: '忠誠', value: `${target.loyalty}`, delta: loyaltyGain },
      ],
    }
  }

  // ---- 税率 ----
  private static doTax(city: RuntimeCity): CommandResult {
    // 简化：循环切换税率 (light → normal → heavy → light)
    const currentTax = city.publicOrder >= 60 ? 'normal' : city.publicOrder >= 40 ? 'heavy' : 'light'
    const nextTax = currentTax === 'light' ? 'normal' : currentTax === 'normal' ? 'heavy' : 'light'
    const taxLabels: Record<string, string> = { light: '薄稅', normal: '普通', heavy: '重稅' }

    let goldDelta = 0, orderDelta = 0
    if (nextTax === 'light') {
      goldDelta = -100
      orderDelta = 10
    } else if (nextTax === 'normal') {
      goldDelta = 200
      orderDelta = 0
    } else {
      goldDelta = 500
      orderDelta = -15
    }

    city.gold += goldDelta
    city.publicOrder = Math.max(0, Math.min(100, city.publicOrder + orderDelta))

    return {
      success: true,
      message: `稅率調整為「${taxLabels[nextTax]}」${goldDelta >= 0 ? `增收${goldDelta}金` : `減免${-goldDelta}金`}${orderDelta !== 0 ? `，治安${orderDelta > 0 ? '+' : ''}${orderDelta}` : ''}`,
      effects: [
        { label: '稅率', value: taxLabels[nextTax], delta: 0 },
        { label: '金錢', value: `${city.gold}`, delta: goldDelta },
        { label: '治安', value: `${city.publicOrder}`, delta: orderDelta },
      ],
    }
  }

  // ---- 教育 ----
  private static doEducate(city: RuntimeCity, cost: number): CommandResult {
    const officers = strategyOfficers.filter(
      o => o.location === city.id && o.faction === gameState.playerFactionId && !gameState.deployedOfficerIds.has(o.id),
    )
    if (officers.length === 0) {
      return { success: false, message: '城中沒有可教育的武將', effects: [] }
    }
    // 简化：提升一个武将的知力
    const target = officers[Math.floor(Math.random() * officers.length)]
    const gain = 1 + Math.floor(Math.random() * 3)
    target.intel = Math.min(100, target.intel + gain)
    return {
      success: true,
      message: `${target.name}完成教育，知力 +${gain}`,
      effects: [
        { label: '武將', value: target.name, delta: gain },
        { label: '知力', value: `${target.intel}`, delta: gain },
        { label: '金錢', value: `${city.gold}`, delta: -cost },
      ],
    }
  }

  // ---- 運輸 ----
  private static doTransport(city: RuntimeCity): CommandResult {
    // 简化：向相邻己方城池运送物资
    const neighbors = gameState.cities.filter(
      c => c.owner === gameState.playerFactionId && c.id !== city.id,
    )
    if (neighbors.length === 0) {
      return { success: false, message: '沒有可運輸的目標城池', effects: [] }
    }
    const target = neighbors[Math.floor(Math.random() * neighbors.length)]
    const goldAmt = Math.min(300, city.gold)
    const foodAmt = Math.min(500, city.food)
    if (goldAmt + foodAmt === 0) {
      return { success: false, message: '物資不足，無法運輸', effects: [] }
    }
    city.gold -= goldAmt
    city.food -= foodAmt
    target.gold += goldAmt
    target.food += foodAmt
    return {
      success: true,
      message: `向${target.name}運輸：金錢 ${goldAmt}、糧草 ${foodAmt}`,
      effects: [
        { label: '目標', value: target.name, delta: 0 },
        { label: '金錢', value: `${goldAmt}`, delta: -goldAmt },
        { label: '糧草', value: `${foodAmt}`, delta: -foodAmt },
      ],
    }
  }
}
