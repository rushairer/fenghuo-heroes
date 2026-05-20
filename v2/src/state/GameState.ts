// ============================================================
// GameState.ts — 游戏运行时状态管理
// Phase 3：视察月核心状态
// ============================================================

import type { FactionId, CityId, Difficulty, CampaignMode, MarchArmy } from '../data/types'
import { strategyCities } from '../data/cities'

export interface RuntimeCity {
  id: CityId
  name: string
  region: string
  owner: FactionId
  gold: number
  food: number
  troops: number
  defense: number
  land: number       // 开垦值
  commerce: number   // 商业值
  irrigation: number // 灌溉值
  disaster: number   // 灾害值 (0-100)
  publicOrder: number // 治安 (0-100)
  population: number // 人口
}

export interface GameSnapshot {
  year: number
  month: number
  difficulty: Difficulty
  playerFactionId: FactionId
  mode: CampaignMode
  cities: RuntimeCity[]
}

export class GameState {
  year = 189
  month = 1
  difficulty: Difficulty = 'normal'
  playerFactionId: FactionId = 'cao'
  mode: CampaignMode = 'inspection'

  cities: RuntimeCity[] = []
  armies: MarchArmy[] = []
  deployedOfficerIds: Set<string> = new Set()

  constructor() {
    this.resetCities()
    this.mode = 'inspection'
  }

  // ============================================================
  // 初始化城池运行时数据
  // ============================================================
  resetCities() {
    this.cities = strategyCities.map(c => ({
      id: c.id,
      name: c.name,
      region: c.region,
      owner: c.owner,
      gold: c.gold,
      food: c.food,
      troops: c.troops,
      defense: c.defense,
      land: c.land ?? 50,
      commerce: c.commerce ?? 50,
      irrigation: c.irrigation ?? 50,
      disaster: c.disaster ?? 10,
      publicOrder: c.publicOrder ?? 70,
      population: c.population ?? 50000,
    }))
  }

  // ============================================================
  // 查询
  // ============================================================
  getCity(id: CityId): RuntimeCity | undefined {
    return this.cities.find(c => c.id === id)
  }

  getPlayerCities(): RuntimeCity[] {
    return this.cities.filter(c => c.owner === this.playerFactionId)
  }

  // ---- 军队管理 ----
  getArmy(id: string): MarchArmy | undefined {
    return this.armies.find(a => a.id === id)
  }

  getPlayerArmies(): MarchArmy[] {
    return this.armies.filter(a => a.factionId === this.playerFactionId)
  }

  addArmy(army: MarchArmy) {
    this.armies.push(army)
    for (const oid of army.officerIds) {
      this.deployedOfficerIds.add(oid)
    }
  }

  removeArmy(id: string) {
    const army = this.armies.find(a => a.id === id)
    if (army) {
      for (const oid of army.officerIds) {
        this.deployedOfficerIds.delete(oid)
      }
    }
    this.armies = this.armies.filter(a => a.id !== id)
  }

  getSnapshot(): GameSnapshot {
    return {
      year: this.year,
      month: this.month,
      difficulty: this.difficulty,
      playerFactionId: this.playerFactionId,
      mode: this.mode,
      cities: this.cities.map(c => ({ ...c })),
    }
  }

  // ============================================================
  // 月令推进
  // ============================================================
  advanceMonth() {
    this.month++
    if (this.month > 12) {
      this.month = 1
      this.year++
    }
    // 每月自然增长
    for (const city of this.cities) {
      city.gold += Math.floor(city.commerce * 2 + city.population * 0.001)
      city.food += Math.floor(city.land * 3 + city.irrigation * 2)
      if (city.disaster > 0) city.disaster = Math.max(0, city.disaster - 2)
      city.publicOrder = Math.min(100, city.publicOrder + 1)
      city.population += Math.floor(city.population * 0.002)
    }
  }

  // ---- 行军月切换 ----
  enterMarchMode() {
    this.mode = 'march'
  }

  endMarchMode() {
    this.mode = 'inspection'
    this.advanceMonth()
  }
}

// 全局单例
export const gameState = new GameState()
