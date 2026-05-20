// ============================================================
// types.ts — 全局类型定义
// 从原项目迁移，去除战棋相关类型，保留策略层核心类型
// ============================================================

// ---- 基础标识 ----
export type CampaignMode = 'inspection' | 'march'
export type Difficulty = 'easy' | 'normal' | 'hard'
export type FactionId = 'cao' | 'liu' | 'sun' | 'yuan' | 'dong' | 'neutral'
export type CityId =
  | 'xiangping' | 'beiping' | 'jinyang' | 'nanpi' | 'pingyuan'
  | 'beihai' | 'xuchang' | 'luoyang' | 'ye' | 'puyang'
  | 'chenliu' | 'qiao' | 'xiapi' | 'guangling' | 'shouchun'
  | 'hefei' | 'lujiang' | 'wan' | 'runan' | 'xinye'
  | 'chengdu' | 'zitong' | 'jiangzhou' | 'yongan' | 'nanzhong'
  | 'yunnan' | 'hanzhong' | 'tianshui' | 'wuwei' | 'jianye'
  | 'wujun' | 'kuaiji' | 'jiangxia' | 'xiangyang' | 'jiangling'
  | 'wuling' | 'lingling' | 'guilin' | 'changsha' | 'chang_an'

export type RouteFeature = 'village' | 'supply' | 'pass' | 'ferry'
export type CampaignWeather = 'clear' | 'rain' | 'heat'
export type OfficerStatus = 'normal' | 'wounded' | 'captured'
export type TaxRate = 'light' | 'normal' | 'heavy'
export type MapDisplayMode = 'full' | 'compact' | 'faction'

// ---- 数据模型 ----
export type StrategyFaction = {
  id: FactionId
  name: string
  ruler: string
  color: number
  capital: CityId
  trait: string
}

export type StrategyCity = {
  id: CityId
  name: string
  region: string
  owner: FactionId
  x: number
  y: number
  gold: number
  food: number
  troops: number
  defense: number
  routes: CityId[]
  population?: number
  commerce?: number
  land?: number
  irrigation?: number
  disaster?: number
  publicOrder?: number
  manpower?: number
  garrisonCommanderId?: string
}

export type StrategyOfficer = {
  id: string
  name: string
  faction: FactionId
  location: CityId
  role: string
  war: number
  intel: number
  gov: number
  charm: number
  command: number
  loyalty: number
  troops?: number
  weapons?: number
  spear?: number
  bow?: number
  horse?: number
  armor?: number
  training?: number
  status?: OfficerStatus
  statusTurns?: number
  captorFactionId?: FactionId
  merit?: number
  salary?: number
  fatigue?: number
}

export type OfficerEquipment = {
  spear: number
  bow: number
  horse: number
  armor: number
}

// ---- 行军 ----
export type MarchArmy = {
  id: string
  factionId: FactionId
  sourceCityId: CityId
  targetCityId?: CityId
  leaderOfficerId: string
  officerIds: string[]
  officerTroops: Record<string, number>
  officerFood: Record<string, number>
  officerFatigue: Record<string, number>
  troops: number
  food: number
  morale: number
  position: {
    kind: 'city' | 'route'
    cityId?: CityId
    route?: [CityId, CityId]
    progress?: number
  }
  routePlan: CityId[]
  movePoints: number
  status: 'ready' | 'marching' | 'besieging' | 'retreating' | 'routed'
}

// ---- 攻城 ----
export type SiegeState = {
  attackerArmyId: string
  defenderCityId: CityId
  wallHp: number
  defenderInitialDefense: number
  defenderTroops: number
  defenderInitialTroops: number
  defenderMorale: number
  attackerTroops: number
  actionsRemaining: number
  surroundTurns: number
  turns: number
  lastAction?: 'assault' | 'surround' | 'fire' | 'challenge' | 'fieldBattle' | 'retreat'
  approachFeatures?: RouteFeature[]
}

// ---- 单挑 ----
export type DuelAction = 'attack' | 'guard' | 'evade' | 'focus' | 'special' | 'retreat'

export type DuelState = {
  attackerOfficerId: string
  defenderOfficerId: string
  attackerHp: number
  defenderHp: number
  attackerStamina: number
  defenderStamina: number
  attackerSpirit: number
  defenderSpirit: number
  round: number
  log: string[]
  outcome?: 'attackerWin' | 'defenderWin' | 'draw' | 'attackerRetreat'
}

// ---- 会战（军势对阵，非格子战棋） ----
export type FieldBattleFormation = 'balanced' | 'charge' | 'guard' | 'maneuver'

// ---- 外交 ----
export type DiplomacyCommandKind = 'alliance' | 'discord' | 'assassination' | 'fire' | 'intel' | 'borrow' | 'repay'

export type DiplomacyDebt = {
  factionId: FactionId
  principal: number
  dueYear: number
  dueMonth: number
}

// ---- 游戏阶段 ----
export type GamePhase =
  | 'title'
  | 'scenarioSetup'
  | 'rulerSelect'
  | 'inspectionMonth'
  | 'marchMonth'
  | 'inspect'
  | 'factions'
  | 'talent'
  | 'city'
  | 'heroes'
  | 'diplomacy'
  | 'deploy'
  | 'briefing'
  | 'monthReport'
  | 'siegeAction'
  | 'duel'
  | 'fieldBattle'
  | 'result'

// ---- 命令相关 ----
export type MilitaryAllocationKind = 'recruit' | 'weapon' | 'training'
export type RecruitScale = 'small' | 'medium' | 'large'
export type TrainingMode = 'single' | 'all'
export type TalentScope = 'local' | 'nearby' | 'all'
export type TransportTarget = 'expedition' | CityId
export type TransportAmount = 'small' | 'medium' | 'large'
export type MoveResourceKind = 'troops' | 'food' | 'gold'

export type CityPolicyDelta = {
  treasury?: number
  publicOrder?: number
  recruits?: number
  farms?: number
  walls?: number
  food?: number
  supplies?: number
  morale?: number
  intel?: number
  population?: number
  commerce?: number
  land?: number
  irrigation?: number
  disaster?: number
}

// ---- 常量 ----
export const MARCH_ROUTE_STEPS = 2
export const ASSET_BASE = import.meta.env.BASE_URL
