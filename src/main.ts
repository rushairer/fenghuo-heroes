import Phaser from 'phaser'
import './style.css'
import { createCampaignSnapshot, validateCampaignSnapshot, type CampaignSnapshot, type CampaignSnapshotMeta, type StartableFactionId, type SerializableDiplomacyDebt } from './domain/campaignSnapshot'

type Faction = 'player' | 'enemy'
type TerrainType = 'plain' | 'forest' | 'hill' | 'water' | 'fort'
type UnitClass = 'vanguard' | 'archer' | 'strategist' | 'medic' | 'soldier' | 'commander'
type Phase = 'title' | 'scenarioSetup' | 'rulerSelect' | 'inspectionMonth' | 'marchMonth' | 'inspect' | 'factions' | 'talent' | 'city' | 'heroes' | 'diplomacy' | 'deploy' | 'briefing' | 'monthReport' | 'playerSelect' | 'moveTarget' | 'actionTarget' | 'enemyTurn' | 'result'

type GridPosition = {
  x: number
  y: number
}

type UnitStats = {
  maxHp: number
  hp: number
  atk: number
  def: number
  mag: number
  res: number
  move: number
  range: number
  speed: number
}

type Skill = {
  id: string
  name: string
  type: 'damage' | 'heal'
  damageType?: 'physical' | 'magic'
  power: number
  range: number
}

type CampaignMode = 'inspection' | 'march'
type Difficulty = 'easy' | 'normal' | 'hard'
type FactionId = 'cao' | 'liu' | 'sun' | 'yuan' | 'dong' | 'neutral'
type CityId =
  | 'xiangping'
  | 'beiping'
  | 'jinyang'
  | 'nanpi'
  | 'pingyuan'
  | 'beihai'
  | 'xuchang'
  | 'luoyang'
  | 'ye'
  | 'puyang'
  | 'chenliu'
  | 'qiao'
  | 'xiapi'
  | 'guangling'
  | 'shouchun'
  | 'hefei'
  | 'lujiang'
  | 'wan'
  | 'runan'
  | 'xinye'
  | 'chengdu'
  | 'zitong'
  | 'jiangzhou'
  | 'yongan'
  | 'nanzhong'
  | 'yunnan'
  | 'hanzhong'
  | 'tianshui'
  | 'wuwei'
  | 'jianye'
  | 'wujun'
  | 'kuaiji'
  | 'jiangxia'
  | 'xiangyang'
  | 'jiangling'
  | 'wuling'
  | 'lingling'
  | 'guilin'
  | 'changsha'
  | 'chang_an'

type Unit = {
  id: string
  name: string
  title: string
  faction: Faction
  classId: UnitClass
  level: number
  exp: number
  stats: UnitStats
  skills: string[]
  position: GridPosition
  hasMoved: boolean
  hasActed: boolean
  alive: boolean
  palette: {
    primary: number
    secondary: number
    portrait: number
  }
}

type TerrainTile = {
  type: TerrainType
  walkable: boolean
  moveCost: number
  defenseBonus: number
  attackBonus: number
  healPerTurn: number
}

type StrategyFaction = {
  id: FactionId
  name: string
  ruler: string
  color: number
  capital: CityId
  trait: string
}

type StrategyCity = {
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
}

type StrategyOfficer = {
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

type OfficerEquipment = {
  spear: number
  bow: number
  horse: number
  armor: number
}

type MarchArmy = {
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

const MARCH_ROUTE_STEPS = 2
const ASSET_BASE = import.meta.env.BASE_URL
const routeFeatures: Partial<Record<string, RouteFeature[]>> = {
  'chengdu-hanzhong': ['village', 'pass'],
  'chengdu-jiangzhou': ['village'],
  'chang_an-hanzhong': ['supply', 'pass'],
  'chang_an-luoyang': ['supply', 'pass'],
  'luoyang-xiangyang': ['pass'],
  'jiangzhou-jiangxia': ['village', 'ferry'],
  'jiangxia-jianye': ['ferry', 'supply'],
  'jianye-shouchun': ['ferry', 'supply'],
  'shouchun-xiapi': ['supply'],
  'xuchang-shouchun': ['supply'],
  'xuchang-luoyang': ['supply'],
  'ye-luoyang': ['pass'],
}

type SiegeState = {
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
}

type DuelAction = 'attack' | 'guard' | 'evade' | 'focus' | 'special' | 'retreat'

type DuelState = {
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

type MilitaryAllocationKind = 'recruit' | 'weapon' | 'training'
type DiplomacyCommandKind = 'alliance' | 'scout' | 'borrow' | 'repay' | 'sabotage' | 'assassination' | 'fire' | 'persuade'
type RecruitScale = 'small' | 'medium' | 'large'
type TrainingMode = 'single' | 'all'
type TalentScope = 'local' | 'nearby' | 'all'
type TransportTarget = 'expedition' | CityId
type TransportAmount = 'small' | 'medium' | 'large'
type MoveResourceKind = 'troops' | 'food' | 'gold'
type TaxRate = 'light' | 'normal' | 'heavy'
type FieldBattleFormation = 'balanced' | 'charge' | 'guard' | 'maneuver'
type MapDisplayMode = 'full' | 'compact' | 'faction'
type RouteFeature = 'village' | 'supply' | 'pass' | 'ferry'
type RouteEventKind = 'forage' | 'village'
type CampaignWeather = 'clear' | 'rain' | 'heat'
type OfficerStatus = 'normal' | 'wounded' | 'captured'
type DiplomacyDebt = {
  factionId: FactionId
  principal: number
  dueYear: number
  dueMonth: number
}
type StrategicSettlement = {
  lines: string[]
  victory: boolean
}
type CityPolicyDelta = { treasury?: number; publicOrder?: number; recruits?: number; farms?: number; walls?: number; food?: number; supplies?: number; morale?: number; intel?: number; population?: number; commerce?: number; land?: number; irrigation?: number; disaster?: number }
type IntelCommandCategory = '内政' | '军事'
type ModalGridItem = {
  label: string
  detail?: string
  onSelect: () => void
}
type ModalChoiceColumn = {
  title: string
  items: {
    label: string
    detail?: string
    selected?: boolean
    onSelect: () => void
  }[]
}

const fieldBattleFormations: Record<FieldBattleFormation, {
  name: string
  posture: string
  detail: string
  effect: string
}> = {
  balanced: {
    name: '中军',
    posture: '稳阵接战',
    detail: '攻守平均，适合初次会战。',
    effect: '全军无额外风险，按当前士气接战。',
  },
  charge: {
    name: '锋矢',
    posture: '先锋突击',
    detail: '攻势最强，但阵脚较薄。',
    effect: '我军攻击提升，防御下降，胜利时城防损伤更高。',
  },
  guard: {
    name: '方阵',
    posture: '据险守势',
    detail: '减少兵损，推进较慢。',
    effect: '我军防御提升，移动下降，失利时额外损失较低。',
  },
  maneuver: {
    name: '雁行',
    posture: '两翼迂回',
    detail: '依赖情报与机动，适合扰乱守军。',
    effect: '移动与计略增强，开战消耗情报，敌前军受扰。',
  },
}

const TILE = 64
const MAP_W = 12
const MAP_H = 8
const BOARD_X = 36
const BOARD_Y = 92
const UI_X = BOARD_X + MAP_W * TILE + 24
const CANVAS_W = 1280
const CANVAS_H = 760
const FRAME = { x: 42, y: 34, width: 1196, height: 690 }
const FOOTER = { x: 70, y: 584, width: 1140, height: 122 }
const MODAL = {
  x: 640,
  y: 402,
  width: 820,
  height: 470,
  insetX: 58,
  titleOffsetY: 58,
  helperOffsetY: 112,
  gridOffsetY: 202,
  actionOffsetY: 430,
  colWidth: 230,
  rowHeight: 82,
  optionWidth: 168,
  optionHeight: 40,
  actionWidth: 150,
  actionHeight: 38,
  actionGap: 40,
} as const
const UI = {
  veil: 0x071017,
  page: 0x071017,
  panel: 0x101722,
  subPanel: 0x21160f,
  border: 0xd4af37,
  borderDim: 0x8f6c2b,
  shadow: 0x05070a,
  accent: 0xf8df9d,
  warning: 0xc94b3b,
} as const

const terrain: Record<TerrainType, TerrainTile> = {
  plain: { type: 'plain', walkable: true, moveCost: 1, defenseBonus: 0, attackBonus: 0, healPerTurn: 0 },
  forest: { type: 'forest', walkable: true, moveCost: 1, defenseBonus: 1, attackBonus: 0, healPerTurn: 0 },
  hill: { type: 'hill', walkable: true, moveCost: 2, defenseBonus: 0, attackBonus: 1, healPerTurn: 0 },
  water: { type: 'water', walkable: false, moveCost: 99, defenseBonus: 0, attackBonus: 0, healPerTurn: 0 },
  fort: { type: 'fort', walkable: true, moveCost: 1, defenseBonus: 2, attackBonus: 0, healPerTurn: 2 },
}

const mapRows: TerrainType[][] = [
  ['plain', 'plain', 'plain', 'forest', 'forest', 'plain', 'plain', 'hill', 'hill', 'hill', 'plain', 'plain'],
  ['plain', 'plain', 'forest', 'forest', 'plain', 'plain', 'plain', 'plain', 'hill', 'hill', 'hill', 'plain'],
  ['plain', 'plain', 'forest', 'plain', 'plain', 'water', 'water', 'plain', 'plain', 'hill', 'plain', 'plain'],
  ['plain', 'plain', 'plain', 'plain', 'forest', 'water', 'plain', 'plain', 'plain', 'plain', 'plain', 'plain'],
  ['plain', 'plain', 'plain', 'forest', 'forest', 'plain', 'plain', 'fort', 'plain', 'plain', 'plain', 'plain'],
  ['plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'forest', 'forest', 'plain', 'plain', 'plain', 'plain'],
  ['plain', 'plain', 'plain', 'plain', 'water', 'water', 'plain', 'plain', 'plain', 'forest', 'forest', 'plain'],
  ['plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'plain', 'forest', 'forest', 'plain', 'plain'],
]

const skills: Record<string, Skill> = {
  strike: { id: 'strike', name: '猛击', type: 'damage', damageType: 'physical', power: 3, range: 1 },
  volley: { id: 'volley', name: '连射', type: 'damage', damageType: 'physical', power: 2, range: 2 },
  fire: { id: 'fire', name: '火计', type: 'damage', damageType: 'magic', power: 4, range: 2 },
  mend: { id: 'mend', name: '包扎', type: 'heal', power: 7, range: 1 },
}

const strategyFactions: StrategyFaction[] = [
  { id: 'cao', name: '曹操军', ruler: '曹操', color: 0x3b5ba9, capital: 'xuchang', trait: '屯田强军' },
  { id: 'liu', name: '刘备军', ruler: '刘备', color: 0x4e9f50, capital: 'chengdu', trait: '仁德聚众' },
  { id: 'sun', name: '孙权军', ruler: '孙权', color: 0xd9a441, capital: 'jianye', trait: '江东水师' },
  { id: 'yuan', name: '袁绍军', ruler: '袁绍', color: 0x8b5fbf, capital: 'ye', trait: '河北名门' },
  { id: 'dong', name: '董卓军', ruler: '董卓', color: 0x7a2f2f, capital: 'chang_an', trait: '强权威压' },
  { id: 'neutral', name: '群雄割据', ruler: '诸郡豪强', color: 0x8a8f98, capital: 'luoyang', trait: '待势而动' },
]

const strategyCities: StrategyCity[] = [
  { id: 'xiangping', name: '襄平', region: '辽东', owner: 'neutral', x: 638, y: 44, gold: 420, food: 760, troops: 4200, defense: 50, routes: ['beiping'] },
  { id: 'beiping', name: '北平', region: '幽州', owner: 'neutral', x: 518, y: 58, gold: 520, food: 900, troops: 5200, defense: 54, routes: ['xiangping', 'nanpi', 'jinyang'] },
  { id: 'jinyang', name: '晋阳', region: '并州', owner: 'yuan', x: 322, y: 54, gold: 640, food: 1120, troops: 6800, defense: 60, routes: ['beiping', 'ye', 'chang_an'] },
  { id: 'nanpi', name: '南皮', region: '冀州', owner: 'yuan', x: 452, y: 104, gold: 720, food: 1180, troops: 7600, defense: 62, routes: ['beiping', 'ye', 'pingyuan'] },
  { id: 'pingyuan', name: '平原', region: '青州', owner: 'neutral', x: 500, y: 150, gold: 480, food: 860, troops: 4300, defense: 48, routes: ['nanpi', 'beihai', 'puyang'] },
  { id: 'beihai', name: '北海', region: '青州', owner: 'neutral', x: 594, y: 178, gold: 500, food: 880, troops: 4500, defense: 50, routes: ['pingyuan', 'xiapi'] },
  { id: 'xuchang', name: '许昌', region: '中原', owner: 'cao', x: 378, y: 178, gold: 900, food: 1300, troops: 9000, defense: 68, routes: ['luoyang', 'puyang', 'shouchun', 'chenliu', 'qiao', 'runan'] },
  { id: 'luoyang', name: '洛阳', region: '司隶', owner: 'neutral', x: 282, y: 178, gold: 500, food: 700, troops: 3500, defense: 55, routes: ['xuchang', 'chang_an', 'ye', 'xiangyang', 'wan', 'chenliu'] },
  { id: 'ye', name: '邺城', region: '河北', owner: 'yuan', x: 386, y: 92, gold: 1000, food: 1500, troops: 11000, defense: 70, routes: ['luoyang', 'puyang', 'nanpi', 'jinyang'] },
  { id: 'puyang', name: '濮阳', region: '兖州', owner: 'cao', x: 468, y: 208, gold: 420, food: 760, troops: 4200, defense: 48, routes: ['xuchang', 'ye', 'xiapi', 'pingyuan', 'chenliu'] },
  { id: 'chenliu', name: '陈留', region: '兖州', owner: 'cao', x: 420, y: 236, gold: 610, food: 980, troops: 5600, defense: 54, routes: ['xuchang', 'puyang', 'luoyang', 'qiao'] },
  { id: 'qiao', name: '谯郡', region: '豫州', owner: 'cao', x: 430, y: 350, gold: 560, food: 920, troops: 5200, defense: 50, routes: ['xuchang', 'runan', 'chenliu'] },
  { id: 'xiapi', name: '下邳', region: '徐州', owner: 'neutral', x: 558, y: 268, gold: 520, food: 850, troops: 4800, defense: 52, routes: ['puyang', 'shouchun', 'jiangxia', 'beihai', 'guangling'] },
  { id: 'guangling', name: '广陵', region: '徐州', owner: 'neutral', x: 612, y: 314, gold: 500, food: 820, troops: 4300, defense: 48, routes: ['xiapi', 'jianye'] },
  { id: 'shouchun', name: '寿春', region: '淮南', owner: 'neutral', x: 488, y: 326, gold: 580, food: 920, troops: 5200, defense: 56, routes: ['xuchang', 'xiapi', 'jianye', 'runan', 'hefei'] },
  { id: 'hefei', name: '合肥', region: '淮南', owner: 'neutral', x: 538, y: 358, gold: 640, food: 960, troops: 6200, defense: 62, routes: ['shouchun', 'lujiang', 'jianye'] },
  { id: 'lujiang', name: '庐江', region: '淮南', owner: 'neutral', x: 476, y: 398, gold: 520, food: 880, troops: 4600, defense: 50, routes: ['hefei', 'jiangxia', 'jianye'] },
  { id: 'wan', name: '宛城', region: '南阳', owner: 'neutral', x: 266, y: 270, gold: 560, food: 900, troops: 5200, defense: 58, routes: ['luoyang', 'xinye', 'runan', 'chang_an'] },
  { id: 'runan', name: '汝南', region: '豫州', owner: 'neutral', x: 402, y: 286, gold: 520, food: 940, troops: 5000, defense: 52, routes: ['xuchang', 'shouchun', 'wan', 'qiao'] },
  { id: 'xinye', name: '新野', region: '荆北', owner: 'neutral', x: 292, y: 336, gold: 430, food: 800, troops: 4200, defense: 48, routes: ['wan', 'xiangyang'] },
  { id: 'chengdu', name: '成都', region: '益州', owner: 'liu', x: 118, y: 342, gold: 850, food: 1600, troops: 7600, defense: 72, routes: ['jiangzhou', 'hanzhong', 'yongan', 'zitong', 'nanzhong'] },
  { id: 'zitong', name: '梓潼', region: '益州', owner: 'liu', x: 126, y: 286, gold: 420, food: 880, troops: 4200, defense: 54, routes: ['chengdu', 'hanzhong'] },
  { id: 'jiangzhou', name: '江州', region: '巴郡', owner: 'liu', x: 230, y: 374, gold: 390, food: 880, troops: 3600, defense: 50, routes: ['chengdu', 'jiangxia', 'yongan'] },
  { id: 'yongan', name: '永安', region: '巴东', owner: 'liu', x: 252, y: 422, gold: 360, food: 760, troops: 3500, defense: 54, routes: ['chengdu', 'jiangzhou', 'jiangling'] },
  { id: 'nanzhong', name: '南中', region: '南蛮', owner: 'neutral', x: 96, y: 470, gold: 360, food: 780, troops: 3900, defense: 44, routes: ['chengdu', 'yunnan'] },
  { id: 'yunnan', name: '云南', region: '南蛮', owner: 'neutral', x: 64, y: 540, gold: 340, food: 720, troops: 3600, defense: 42, routes: ['nanzhong'] },
  { id: 'hanzhong', name: '汉中', region: '汉中', owner: 'neutral', x: 172, y: 244, gold: 360, food: 780, troops: 3800, defense: 62, routes: ['chengdu', 'chang_an', 'tianshui', 'zitong'] },
  { id: 'tianshui', name: '天水', region: '陇右', owner: 'dong', x: 92, y: 180, gold: 430, food: 820, troops: 5200, defense: 58, routes: ['hanzhong', 'chang_an', 'wuwei'] },
  { id: 'wuwei', name: '武威', region: '凉州', owner: 'neutral', x: 58, y: 92, gold: 480, food: 860, troops: 5600, defense: 56, routes: ['tianshui'] },
  { id: 'jianye', name: '建业', region: '江东', owner: 'sun', x: 614, y: 384, gold: 950, food: 1200, troops: 7800, defense: 66, routes: ['wujun', 'shouchun', 'jiangxia', 'guangling', 'hefei', 'lujiang'] },
  { id: 'wujun', name: '吴郡', region: '江东', owner: 'sun', x: 642, y: 454, gold: 650, food: 980, troops: 4600, defense: 48, routes: ['jianye', 'changsha', 'guilin', 'kuaiji'] },
  { id: 'kuaiji', name: '会稽', region: '江东', owner: 'sun', x: 680, y: 520, gold: 520, food: 880, troops: 4200, defense: 46, routes: ['wujun'] },
  { id: 'jiangxia', name: '江夏', region: '荆州', owner: 'neutral', x: 376, y: 402, gold: 500, food: 860, troops: 4300, defense: 54, routes: ['jianye', 'xiangyang', 'jiangzhou', 'xiapi', 'jiangling', 'lujiang'] },
  { id: 'xiangyang', name: '襄阳', region: '荆州', owner: 'neutral', x: 318, y: 312, gold: 780, food: 1250, troops: 6500, defense: 74, routes: ['jiangxia', 'changsha', 'luoyang', 'xinye', 'jiangling'] },
  { id: 'jiangling', name: '江陵', region: '荆州', owner: 'neutral', x: 328, y: 452, gold: 620, food: 1040, troops: 5600, defense: 60, routes: ['xiangyang', 'jiangxia', 'wuling', 'yongan'] },
  { id: 'wuling', name: '武陵', region: '荆南', owner: 'neutral', x: 294, y: 514, gold: 380, food: 780, troops: 3600, defense: 44, routes: ['jiangling', 'lingling'] },
  { id: 'lingling', name: '零陵', region: '荆南', owner: 'neutral', x: 358, y: 548, gold: 390, food: 820, troops: 3700, defense: 44, routes: ['wuling', 'changsha', 'guilin'] },
  { id: 'guilin', name: '桂林', region: '岭南', owner: 'neutral', x: 478, y: 552, gold: 360, food: 760, troops: 3400, defense: 42, routes: ['lingling', 'wujun'] },
  { id: 'changsha', name: '长沙', region: '荆南', owner: 'neutral', x: 406, y: 486, gold: 460, food: 900, troops: 3900, defense: 46, routes: ['xiangyang', 'wujun', 'lingling'] },
  { id: 'chang_an', name: '长安', region: '关中', owner: 'dong', x: 190, y: 168, gold: 900, food: 1100, troops: 12000, defense: 78, routes: ['luoyang', 'hanzhong', 'wan', 'tianshui', 'jinyang'] },
]

const strategyOfficers: StrategyOfficer[] = [
  { id: 'cao_cao', name: '曹操', faction: 'cao', location: 'xuchang', role: '君主', war: 72, intel: 92, gov: 88, charm: 86, command: 94, loyalty: 100 },
  { id: 'xiahou_dun', name: '夏侯惇', faction: 'cao', location: 'puyang', role: '武将', war: 86, intel: 58, gov: 55, charm: 70, command: 82, loyalty: 92 },
  { id: 'guo_jia', name: '郭嘉', faction: 'cao', location: 'xuchang', role: '军师', war: 32, intel: 96, gov: 74, charm: 78, command: 70, loyalty: 88 },
  { id: 'xun_yu', name: '荀彧', faction: 'cao', location: 'xuchang', role: '谋臣', war: 28, intel: 94, gov: 96, charm: 84, command: 68, loyalty: 90 },
  { id: 'dian_wei', name: '典韦', faction: 'cao', location: 'xuchang', role: '武将', war: 96, intel: 34, gov: 25, charm: 58, command: 72, loyalty: 94 },
  { id: 'xu_chu', name: '许褚', faction: 'cao', location: 'xuchang', role: '武将', war: 95, intel: 36, gov: 28, charm: 60, command: 74, loyalty: 92 },
  { id: 'zhang_liao', name: '张辽', faction: 'cao', location: 'puyang', role: '武将', war: 92, intel: 76, gov: 58, charm: 78, command: 92, loyalty: 84 },
  { id: 'sima_yi', name: '司马懿', faction: 'cao', location: 'xuchang', role: '军师', war: 62, intel: 97, gov: 91, charm: 74, command: 90, loyalty: 78 },
  { id: 'xiahou_yuan', name: '夏侯渊', faction: 'cao', location: 'chenliu', role: '武将', war: 88, intel: 62, gov: 48, charm: 70, command: 84, loyalty: 90 },
  { id: 'cao_ren', name: '曹仁', faction: 'cao', location: 'wan', role: '武将', war: 84, intel: 70, gov: 62, charm: 72, command: 88, loyalty: 92 },
  { id: 'zhang_he', name: '张郃', faction: 'cao', location: 'qiao', role: '武将', war: 87, intel: 74, gov: 58, charm: 70, command: 86, loyalty: 82 },
  { id: 'yu_jin', name: '于禁', faction: 'cao', location: 'hefei', role: '武将', war: 80, intel: 66, gov: 58, charm: 62, command: 82, loyalty: 86 },
  { id: 'cheng_yu', name: '程昱', faction: 'cao', location: 'chenliu', role: '谋臣', war: 36, intel: 91, gov: 78, charm: 66, command: 66, loyalty: 84 },
  { id: 'li_dian', name: '李典', faction: 'cao', location: 'qiao', role: '武将', war: 76, intel: 70, gov: 62, charm: 68, command: 76, loyalty: 84 },
  { id: 'liu_bei', name: '刘备', faction: 'liu', location: 'chengdu', role: '君主', war: 68, intel: 76, gov: 80, charm: 96, command: 78, loyalty: 100 },
  { id: 'guan_yu', name: '关羽', faction: 'liu', location: 'chengdu', role: '武将', war: 97, intel: 72, gov: 60, charm: 88, command: 90, loyalty: 100 },
  { id: 'zhang_fei', name: '张飞', faction: 'liu', location: 'jiangzhou', role: '武将', war: 96, intel: 45, gov: 35, charm: 65, command: 84, loyalty: 98 },
  { id: 'zhuge_liang', name: '诸葛亮', faction: 'liu', location: 'chengdu', role: '军师', war: 38, intel: 99, gov: 96, charm: 90, command: 88, loyalty: 95 },
  { id: 'zhao_yun', name: '赵云', faction: 'liu', location: 'yongan', role: '武将', war: 94, intel: 76, gov: 62, charm: 86, command: 88, loyalty: 96 },
  { id: 'huang_zhong', name: '黄忠', faction: 'liu', location: 'jiangzhou', role: '武将', war: 93, intel: 66, gov: 52, charm: 74, command: 84, loyalty: 86 },
  { id: 'wei_yan', name: '魏延', faction: 'liu', location: 'yongan', role: '武将', war: 90, intel: 68, gov: 48, charm: 62, command: 86, loyalty: 76 },
  { id: 'pang_tong', name: '庞统', faction: 'liu', location: 'chengdu', role: '军师', war: 36, intel: 97, gov: 86, charm: 78, command: 82, loyalty: 90 },
  { id: 'ma_chao', name: '马超', faction: 'liu', location: 'chengdu', role: '武将', war: 95, intel: 56, gov: 42, charm: 82, command: 88, loyalty: 82 },
  { id: 'jiang_wei', name: '姜维', faction: 'liu', location: 'zitong', role: '武将', war: 88, intel: 90, gov: 72, charm: 78, command: 90, loyalty: 84 },
  { id: 'fa_zheng', name: '法正', faction: 'liu', location: 'chengdu', role: '谋臣', war: 34, intel: 94, gov: 82, charm: 70, command: 76, loyalty: 86 },
  { id: 'ma_su', name: '马谡', faction: 'liu', location: 'zitong', role: '参军', war: 46, intel: 82, gov: 68, charm: 62, command: 64, loyalty: 78 },
  { id: 'liao_hua', name: '廖化', faction: 'liu', location: 'yongan', role: '武将', war: 76, intel: 62, gov: 58, charm: 66, command: 72, loyalty: 86 },
  { id: 'ma_dai', name: '马岱', faction: 'liu', location: 'hanzhong', role: '武将', war: 82, intel: 64, gov: 52, charm: 68, command: 78, loyalty: 84 },
  { id: 'guan_ping', name: '关平', faction: 'liu', location: 'jiangzhou', role: '武将', war: 80, intel: 62, gov: 50, charm: 72, command: 76, loyalty: 92 },
  { id: 'sun_quan', name: '孙权', faction: 'sun', location: 'jianye', role: '君主', war: 62, intel: 80, gov: 84, charm: 86, command: 76, loyalty: 100 },
  { id: 'zhou_yu', name: '周瑜', faction: 'sun', location: 'jianye', role: '都督', war: 74, intel: 95, gov: 78, charm: 88, command: 94, loyalty: 92 },
  { id: 'lu_su', name: '鲁肃', faction: 'sun', location: 'wujun', role: '外交', war: 42, intel: 88, gov: 86, charm: 84, command: 66, loyalty: 90 },
  { id: 'sun_jian', name: '孙坚', faction: 'sun', location: 'wujun', role: '武将', war: 91, intel: 74, gov: 68, charm: 84, command: 88, loyalty: 100 },
  { id: 'lu_xun', name: '陆逊', faction: 'sun', location: 'jianye', role: '军师', war: 58, intel: 96, gov: 82, charm: 78, command: 92, loyalty: 88 },
  { id: 'gan_ning', name: '甘宁', faction: 'sun', location: 'jianye', role: '武将', war: 91, intel: 70, gov: 48, charm: 72, command: 84, loyalty: 82 },
  { id: 'taishi_ci', name: '太史慈', faction: 'sun', location: 'wujun', role: '武将', war: 92, intel: 68, gov: 50, charm: 80, command: 82, loyalty: 84 },
  { id: 'cheng_pu', name: '程普', faction: 'sun', location: 'jianye', role: '宿将', war: 80, intel: 68, gov: 60, charm: 76, command: 80, loyalty: 90 },
  { id: 'huang_gai', name: '黄盖', faction: 'sun', location: 'wujun', role: '武将', war: 82, intel: 66, gov: 56, charm: 74, command: 78, loyalty: 90 },
  { id: 'zhou_tai', name: '周泰', faction: 'sun', location: 'lujiang', role: '武将', war: 86, intel: 54, gov: 42, charm: 68, command: 76, loyalty: 88 },
  { id: 'lv_meng', name: '吕蒙', faction: 'sun', location: 'hefei', role: '都督', war: 82, intel: 88, gov: 76, charm: 76, command: 90, loyalty: 88 },
  { id: 'zhang_zhao', name: '张昭', faction: 'sun', location: 'jianye', role: '谋臣', war: 24, intel: 86, gov: 94, charm: 78, command: 54, loyalty: 86 },
  { id: 'zhu_ran', name: '朱然', faction: 'sun', location: 'kuaiji', role: '武将', war: 78, intel: 72, gov: 62, charm: 70, command: 80, loyalty: 84 },
  { id: 'yuan_shao', name: '袁绍', faction: 'yuan', location: 'ye', role: '君主', war: 66, intel: 70, gov: 72, charm: 82, command: 80, loyalty: 100 },
  { id: 'yan_liang', name: '颜良', faction: 'yuan', location: 'ye', role: '武将', war: 91, intel: 40, gov: 30, charm: 62, command: 78, loyalty: 84 },
  { id: 'wen_chou', name: '文丑', faction: 'yuan', location: 'nanpi', role: '武将', war: 90, intel: 42, gov: 30, charm: 60, command: 76, loyalty: 84 },
  { id: 'tian_feng', name: '田丰', faction: 'yuan', location: 'ye', role: '谋臣', war: 34, intel: 93, gov: 88, charm: 70, command: 68, loyalty: 82 },
  { id: 'ju_shou', name: '沮授', faction: 'yuan', location: 'nanpi', role: '军师', war: 38, intel: 91, gov: 86, charm: 72, command: 74, loyalty: 84 },
  { id: 'gao_lan', name: '高览', faction: 'yuan', location: 'nanpi', role: '武将', war: 82, intel: 58, gov: 44, charm: 62, command: 76, loyalty: 78 },
  { id: 'shen_pei', name: '审配', faction: 'yuan', location: 'ye', role: '谋臣', war: 42, intel: 84, gov: 80, charm: 58, command: 68, loyalty: 80 },
  { id: 'guo_tu', name: '郭图', faction: 'yuan', location: 'jinyang', role: '谋臣', war: 30, intel: 76, gov: 68, charm: 46, command: 56, loyalty: 72 },
  { id: 'xin_ping', name: '辛评', faction: 'yuan', location: 'pingyuan', role: '谋臣', war: 28, intel: 78, gov: 76, charm: 62, command: 54, loyalty: 76 },
  { id: 'dong_zhuo', name: '董卓', faction: 'dong', location: 'chang_an', role: '君主', war: 82, intel: 58, gov: 42, charm: 38, command: 84, loyalty: 100 },
  { id: 'lv_bu', name: '吕布', faction: 'dong', location: 'chang_an', role: '武将', war: 100, intel: 38, gov: 22, charm: 74, command: 86, loyalty: 62 },
  { id: 'jia_xu', name: '贾诩', faction: 'dong', location: 'chang_an', role: '谋臣', war: 42, intel: 96, gov: 76, charm: 68, command: 76, loyalty: 72 },
  { id: 'hua_xiong', name: '华雄', faction: 'dong', location: 'tianshui', role: '武将', war: 88, intel: 36, gov: 28, charm: 52, command: 72, loyalty: 78 },
  { id: 'li_ru', name: '李儒', faction: 'dong', location: 'chang_an', role: '谋臣', war: 30, intel: 88, gov: 72, charm: 42, command: 62, loyalty: 80 },
  { id: 'zhang_ji', name: '张济', faction: 'dong', location: 'tianshui', role: '武将', war: 76, intel: 54, gov: 46, charm: 54, command: 72, loyalty: 74 },
  { id: 'li_jue', name: '李傕', faction: 'dong', location: 'chang_an', role: '武将', war: 78, intel: 48, gov: 36, charm: 42, command: 74, loyalty: 70 },
  { id: 'guo_si', name: '郭汜', faction: 'dong', location: 'chang_an', role: '武将', war: 76, intel: 44, gov: 34, charm: 40, command: 70, loyalty: 70 },
  { id: 'niu_fu', name: '牛辅', faction: 'dong', location: 'wuwei', role: '武将', war: 70, intel: 42, gov: 38, charm: 40, command: 66, loyalty: 72 },
  { id: 'gongsun_zan', name: '公孙瓒', faction: 'neutral', location: 'beiping', role: '太守', war: 82, intel: 64, gov: 56, charm: 74, command: 84, loyalty: 80 },
  { id: 'kong_rong', name: '孔融', faction: 'neutral', location: 'beihai', role: '太守', war: 28, intel: 78, gov: 82, charm: 86, command: 48, loyalty: 76 },
  { id: 'liu_biao', name: '刘表', faction: 'neutral', location: 'xiangyang', role: '太守', war: 42, intel: 78, gov: 84, charm: 80, command: 62, loyalty: 78 },
  { id: 'zhang_lu', name: '张鲁', faction: 'neutral', location: 'hanzhong', role: '太守', war: 46, intel: 74, gov: 78, charm: 76, command: 58, loyalty: 76 },
  { id: 'ma_teng', name: '马腾', faction: 'neutral', location: 'wuwei', role: '太守', war: 82, intel: 58, gov: 60, charm: 78, command: 82, loyalty: 80 },
  { id: 'liu_zhang', name: '刘璋', faction: 'neutral', location: 'chengdu', role: '宗亲', war: 30, intel: 58, gov: 72, charm: 72, command: 44, loyalty: 70 },
  { id: 'zhang_ren', name: '张任', faction: 'neutral', location: 'yongan', role: '武将', war: 84, intel: 72, gov: 56, charm: 68, command: 82, loyalty: 82 },
  { id: 'yan_yan', name: '严颜', faction: 'neutral', location: 'jiangzhou', role: '武将', war: 82, intel: 64, gov: 58, charm: 72, command: 78, loyalty: 80 },
  { id: 'meng_huo', name: '孟获', faction: 'neutral', location: 'nanzhong', role: '豪强', war: 84, intel: 48, gov: 44, charm: 76, command: 78, loyalty: 74 },
  { id: 'zhurong', name: '祝融', faction: 'neutral', location: 'yunnan', role: '豪强', war: 86, intel: 54, gov: 42, charm: 78, command: 74, loyalty: 76 },
  { id: 'yong_kai', name: '雍闿', faction: 'neutral', location: 'nanzhong', role: '豪强', war: 62, intel: 58, gov: 54, charm: 54, command: 62, loyalty: 62 },
  { id: 'huang_zu', name: '黄祖', faction: 'neutral', location: 'jiangxia', role: '太守', war: 62, intel: 52, gov: 48, charm: 54, command: 68, loyalty: 72 },
  { id: 'han_xuan', name: '韩玄', faction: 'neutral', location: 'changsha', role: '太守', war: 36, intel: 42, gov: 50, charm: 40, command: 48, loyalty: 68 },
  { id: 'xing_daorong', name: '邢道荣', faction: 'neutral', location: 'lingling', role: '武将', war: 70, intel: 32, gov: 28, charm: 48, command: 56, loyalty: 70 },
  { id: 'chen_deng', name: '陈登', faction: 'neutral', location: 'guangling', role: '谋臣', war: 48, intel: 86, gov: 82, charm: 72, command: 66, loyalty: 76 },
  { id: 'qiao_xuan', name: '桥玄', faction: 'neutral', location: 'lujiang', role: '名士', war: 18, intel: 76, gov: 82, charm: 88, command: 38, loyalty: 76 },
  { id: 'wang_lang', name: '王朗', faction: 'neutral', location: 'kuaiji', role: '太守', war: 26, intel: 80, gov: 86, charm: 68, command: 46, loyalty: 72 },
  { id: 'jin_xuan', name: '金旋', faction: 'neutral', location: 'wuling', role: '太守', war: 48, intel: 46, gov: 52, charm: 50, command: 52, loyalty: 70 },
  { id: 'liu_du', name: '刘度', faction: 'neutral', location: 'lingling', role: '太守', war: 42, intel: 52, gov: 58, charm: 56, command: 48, loyalty: 70 },
  { id: 'zhao_fan', name: '赵范', faction: 'neutral', location: 'guilin', role: '太守', war: 44, intel: 54, gov: 58, charm: 58, command: 50, loyalty: 70 },
  { id: 'shi_xie', name: '士燮', faction: 'neutral', location: 'guilin', role: '名士', war: 30, intel: 76, gov: 84, charm: 82, command: 50, loyalty: 72 },
  { id: 'chen_gui', name: '陈珪', faction: 'neutral', location: 'xiapi', role: '谋臣', war: 24, intel: 82, gov: 78, charm: 66, command: 44, loyalty: 74 },
  { id: 'tao_qian', name: '陶谦', faction: 'neutral', location: 'xiapi', role: '太守', war: 34, intel: 66, gov: 78, charm: 78, command: 50, loyalty: 76 },
  { id: 'diao_chan', name: '貂蝉', faction: 'neutral', location: 'luoyang', role: '游士', war: 18, intel: 82, gov: 50, charm: 98, command: 20, loyalty: 70 },
]

const scenarioOptions = [
  { id: 'heroes_190', year: 190, name: '群雄割据', desc: '天下初乱，诸侯并起。适合从城池经营和邻境攻防开始。', locked: false },
  { id: 'guandu_200', year: 200, name: '官渡前夜', desc: '北方强权对峙，粮道与联盟更重要。', locked: true },
  { id: 'chibi_208', year: 208, name: '赤壁风云', desc: '江河争锋，外交、火计与水陆进军并重。', locked: true },
] as const

const difficultyOptions: { id: Difficulty; name: string; desc: string; threat: number; enemyGrowth: number }[] = [
  { id: 'easy', name: '初级', desc: '敌势较缓，适合熟悉内政、外交、军事循环。', threat: 18, enemyGrowth: 0.82 },
  { id: 'normal', name: '中级', desc: '按标准节奏推进，每月有明确扩张压力。', threat: 28, enemyGrowth: 1 },
  { id: 'hard', name: '上级', desc: '敌军整备更快，需要谨慎用兵。', threat: 42, enemyGrowth: 1.22 },
]

const baseUnits: Unit[] = [
  createUnit('yun', '刘备', '仁德君主', 'player', 'vanguard', { x: 1, y: 3 }, {
    maxHp: 30, hp: 30, atk: 10, def: 5, mag: 2, res: 3, move: 3, range: 1, speed: 6,
  }, ['strike'], { primary: 0xd34d2f, secondary: 0xffd166, portrait: 0xb73928 }),
  createUnit('lan', '关羽', '青龙上将', 'player', 'archer', { x: 1, y: 4 }, {
    maxHp: 22, hp: 22, atk: 8, def: 3, mag: 3, res: 4, move: 3, range: 2, speed: 8,
  }, ['volley'], { primary: 0x2f80ed, secondary: 0xe2c16f, portrait: 0x275eaa }),
  createUnit('xuan', '诸葛亮', '卧龙军师', 'player', 'strategist', { x: 0, y: 3 }, {
    maxHp: 20, hp: 20, atk: 4, def: 2, mag: 10, res: 7, move: 3, range: 2, speed: 5,
  }, ['fire'], { primary: 0x7a4cc2, secondary: 0xf6d365, portrait: 0x5b3b9e }),
  createUnit('qing', '张飞', '燕人猛将', 'player', 'medic', { x: 0, y: 4 }, {
    maxHp: 21, hp: 21, atk: 4, def: 3, mag: 8, res: 8, move: 3, range: 1, speed: 5,
  }, ['mend'], { primary: 0x19966f, secondary: 0xf2d492, portrait: 0x147756 }),
  createUnit('banditA', '郡兵甲', '守备步军', 'enemy', 'soldier', { x: 7, y: 3 }, {
    maxHp: 20, hp: 20, atk: 7, def: 3, mag: 1, res: 2, move: 2, range: 1, speed: 4,
  }, ['strike'], { primary: 0x495057, secondary: 0xe76f51, portrait: 0x343a40 }),
  createUnit('banditB', '郡兵乙', '守备步军', 'enemy', 'soldier', { x: 8, y: 5 }, {
    maxHp: 20, hp: 20, atk: 7, def: 3, mag: 1, res: 2, move: 2, range: 1, speed: 4,
  }, ['strike'], { primary: 0x495057, secondary: 0xe76f51, portrait: 0x343a40 }),
  createUnit('raider', '守备弓手', '城防弓兵', 'enemy', 'archer', { x: 9, y: 1 }, {
    maxHp: 18, hp: 18, atk: 7, def: 2, mag: 2, res: 3, move: 2, range: 2, speed: 6,
  }, ['volley'], { primary: 0x5d3a1a, secondary: 0xd98b2b, portrait: 0x6f4518 }),
  createUnit('boss', '高顺', '陷阵前锋', 'enemy', 'commander', { x: 10, y: 4 }, {
    maxHp: 34, hp: 34, atk: 10, def: 5, mag: 3, res: 4, move: 2, range: 1, speed: 5,
  }, ['strike'], { primary: 0x8d1b3d, secondary: 0xffb703, portrait: 0x7a1830 }),
]

class ProceduralMusic {
  private context?: AudioContext
  private gain?: GainNode
  private timer?: number
  private step = 0

  start() {
    if (this.context) return
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.context = new AudioContextClass()
    this.gain = this.context.createGain()
    this.gain.gain.value = 0.035
    this.gain.connect(this.context.destination)
    const melody = [196, 247, 294, 330, 294, 247, 220, 196]
    const bass = [98, 98, 123, 123, 147, 147, 110, 110]
    this.timer = window.setInterval(() => {
      if (!this.context || !this.gain) return
      this.playTone(melody[this.step % melody.length], 0.16, 'triangle')
      if (this.step % 2 === 0) this.playTone(bass[this.step % bass.length], 0.22, 'sine', 0.55)
      this.step += 1
    }, 270)
  }

  stop() {
    if (this.timer) window.clearInterval(this.timer)
    this.timer = undefined
    this.context?.close()
    this.context = undefined
  }

  private playTone(frequency: number, duration: number, type: OscillatorType, volume = 1) {
    if (!this.context || !this.gain) return
    const oscillator = this.context.createOscillator()
    const noteGain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.value = frequency
    noteGain.gain.setValueAtTime(0.0001, this.context.currentTime)
    noteGain.gain.exponentialRampToValueAtTime(0.35 * volume, this.context.currentTime + 0.015)
    noteGain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + duration)
    oscillator.connect(noteGain)
    noteGain.connect(this.gain)
    oscillator.start()
    oscillator.stop(this.context.currentTime + duration + 0.02)
  }
}

class KingdomsScene extends Phaser.Scene {
  private phase: Phase = 'title'
  private playerFactionId: FactionId = 'liu'
  private units: Unit[] = []
  private selectedUnitId?: string
  private selectedSkillId?: string
  private currentFaction: Faction = 'player'
  private turn = 1
  private roundKills = 0
  private highlighted: GridPosition[] = []
  private actionButtons: Phaser.GameObjects.Text[] = []
  private logLines: string[] = []
  private music = new ProceduralMusic()
  private councilState = {
    supplies: 80,
    morale: 55,
    intel: 20,
    actions: 3,
    trained: false,
    scouted: false,
    persuaded: false,
    alliance: 0,
    sabotage: false,
  }
  private cityState = {
    name: '成都',
    publicOrder: 62,
    treasury: 120,
    recruits: 48,
    farms: 1,
    walls: 1,
  }
  private campaignCities: StrategyCity[] = []
  private campaignOfficers: StrategyOfficer[] = []
  private selectedCityId: CityId = 'chengdu'
  private focusedCityId: CityId = 'chengdu'
  private selectedTargetCityId?: CityId = 'hanzhong'
  private selectedDiplomacyFactionId?: FactionId = 'neutral'
  private alliedFactionIds = new Set<FactionId>()
  private allianceTerms = new Map<FactionId, number>()
  private diplomacyDebts = new Map<FactionId, DiplomacyDebt>()
  private cityTaxRates = new Map<CityId, TaxRate>()
  private sabotagedFactionIds = new Set<FactionId>()
  private monthlyActionLog: string[] = []
  private marchArmy?: MarchArmy
  private aiMarchArmies: MarchArmy[] = []
  private usedRouteEvents = new Set<string>()
  private siegeState?: SiegeState
  private duelState?: DuelState
  private deploymentOfficerIds = new Set<string>()
  private deploymentTroopAllocations = new Map<string, number>()
  private deploymentFoodAllocations = new Map<string, number>()
  private deploymentFood?: number
  private fieldBattleFormation: FieldBattleFormation = 'balanced'
  private mapDisplayMode: MapDisplayMode = 'compact'
  private recruitScale: RecruitScale = 'medium'
  private trainingMode: TrainingMode = 'single'
  private talentScope: TalentScope = 'nearby'
  private selectedScenarioId: (typeof scenarioOptions)[number]['id'] = 'heroes_190'
  private selectedDifficulty: Difficulty = 'normal'
  private campaignClock = {
    year: 190,
    month: 1,
    mode: 'inspection' as CampaignMode,
    enemyThreat: 28,
    weather: 'clear' as CampaignWeather,
  }
  private appointments = {
    governor: 'liu_bei',
    vanguard: 'liu_bei',
    strategist: 'zhuge_liang',
  }
  private appointedOfficer(role: 'governor' | 'vanguard' | 'strategist'): StrategyOfficer | undefined {
    return this.campaignOfficers.find((o) => o.id === this.appointments[role])
  }

  private cityGovernanceBonus(cityId: CityId): {
    productionMultiplier: number
    taxMultiplier: number
    recruitMultiplier: number
    recruitPublicOrderCost: number
    moraleBonus: number
    publicOrderBonus: number
    defenseBonus: number
  } {
    const governor = this.campaignOfficers.find((o) => o.id === this.appointments.governor && o.location === cityId)
    if (!governor) return { productionMultiplier: 1, taxMultiplier: 1, recruitMultiplier: 1, recruitPublicOrderCost: 1, moraleBonus: 0, publicOrderBonus: 0, defenseBonus: 0 }
    const gov = governor.gov
    const charm = governor.charm
    const command = governor.command
    const productionMultiplier = gov >= 90 ? 1.18 : gov >= 75 ? 1.10 : gov >= 60 ? 1.04 : 0.96
    const taxMultiplier = gov >= 90 ? 1.12 : gov >= 75 ? 1.06 : gov >= 60 ? 1.02 : 0.96
    const recruitMultiplier = charm >= 90 ? 1.15 : charm >= 75 ? 1.08 : charm >= 60 ? 1.0 : 0.92
    const recruitPublicOrderCost = charm >= 90 ? 0.7 : charm >= 75 ? 0.85 : charm >= 60 ? 1.0 : 1.2
    const moraleBonus = Math.floor((charm - 60) * 0.06)
    const publicOrderBonus = Math.floor((gov - 60) * 0.04)
    const defenseBonus = Math.floor((command + governor.war - 120) * 0.04)
    return { productionMultiplier, taxMultiplier, recruitMultiplier, recruitPublicOrderCost, moraleBonus, publicOrderBonus, defenseBonus }
  }

  private recruitedNeutralIds = new Set<string>()
  private inspectionHeroPage = 0
  private inspectionOfficerId?: string
  private deploymentRosterPage = 0
  private deploymentTargetPage = 0
  private talentPage = 0
  private heroManagementPage = 0
  private monthReportLines: string[] = []
  private monthReportPage = 0

  private boardLayer!: Phaser.GameObjects.Container
  private unitLayer!: Phaser.GameObjects.Container
  private highlightLayer!: Phaser.GameObjects.Container
  private uiLayer!: Phaser.GameObjects.Container
  private overlayLayer!: Phaser.GameObjects.Container
  private statusText!: Phaser.GameObjects.Text
  private infoText!: Phaser.GameObjects.Text
  private logText!: Phaser.GameObjects.Text

  constructor() {
    super('kingdoms')
  }

  preload() {
    this.load.image('title-bg', `${ASSET_BASE}assets/images/backgrounds/title.png`)
    this.load.image('battlefield-bg', `${ASSET_BASE}assets/images/backgrounds/battlefield.png`)
    for (const unitId of ['yun', 'lan', 'xuan', 'qing', 'banditA', 'banditB', 'raider', 'boss']) {
      this.load.image(`portrait-${unitId}`, `${ASSET_BASE}assets/images/portraits/${unitId}.png`)
    }
  }

  create() {
    this.cameras.main.setBackgroundColor('#1b1f26')
    this.boardLayer = this.add.container(0, 0)
    this.highlightLayer = this.add.container(0, 0)
    this.unitLayer = this.add.container(0, 0)
    this.uiLayer = this.add.container(0, 0)
    this.overlayLayer = this.add.container(0, 0)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer))
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => this.handleKeyboard(event))
    this.showTitle()
  }

  private handleKeyboard(event: KeyboardEvent) {
    if (this.phase === 'moveTarget' || this.phase === 'actionTarget') {
      if (event.key === 'Escape' || event.key.toLowerCase() === 'c') this.cancelBattleTargetMode()
      return
    }
    if (this.duelState && !this.duelState.outcome) {
      this.handleDuelKeyboard(event)
      return
    }
    if (this.duelState?.outcome && (event.key === 'Enter' || event.key === ' ')) {
      this.finishDuelChallenge()
      return
    }
    if (this.phase === 'playerSelect') {
      this.handleBattleKeyboard(event)
      return
    }
    if (this.phase !== 'inspectionMonth' && this.phase !== 'marchMonth') return
    const key = event.key.toLowerCase()
    const commands: Record<string, () => void> = this.phase === 'inspectionMonth'
      ? {
          d: () => this.showDomesticCommand(),
          f: () => this.showDiplomacy(),
          m: () => this.showMilitaryCommand(),
          v: () => this.showInspection(),
          k: () => this.cycleMapDisplayMode(),
          p: () => this.showPersonnelCommand(),
          s: () => this.showSystemCommand(),
          n: () => this.resolveStageAdvance(),
        }
      : {
          a: () => this.showMarchArmyStatus(),
          r: () => this.showMarchRoute(),
          g: () => this.resolveMarchMove(),
          x: () => this.resolveMarchAttack(),
          b: () => this.showBriefing(),
          q: () => this.retreatMarchArmy(),
          w: () => this.showCampaignMessage('远征军按兵待命，等待主公号令。'),
          k: () => this.cycleMapDisplayMode(),
          n: () => this.advanceCampaignMonth(),
        }
    commands[key]?.()
  }

  private handleDuelKeyboard(event: KeyboardEvent) {
    const commands: Record<string, DuelAction> = {
      a: 'attack',
      g: 'guard',
      e: 'evade',
      f: 'focus',
      s: 'special',
      q: 'retreat',
      escape: 'retreat',
    }
    const action = commands[event.key.toLowerCase()]
    if (action) this.resolveDuelRound(action)
  }

  private handleBattleKeyboard(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    const selected = this.selectedUnit
    if (!selected || selected.faction !== 'player' || selected.hasActed) {
      const unitKeys = ['q', 'w', 'e', 'r']
      const index = unitKeys.indexOf(key)
      const unit = Number.isInteger(index) ? this.living('player')[index] : undefined
      if (unit) {
        this.selectedUnitId = unit.id
        this.highlighted = []
        this.renderBattle()
      }
      return
    }
    const commands: Record<string, () => void> = {
      m: () => {
        if (!selected.hasMoved) this.enterMoveMode(selected)
        else {
          this.addLog(`${selected.name}本阵已经移动。`)
          this.renderBattle()
        }
      },
      a: () => this.enterAttackMode(selected, undefined),
      t: () => this.enterAttackMode(selected, selected.skills[0]),
      w: () => this.finishUnit(selected),
      g: () => this.delegateUnit(selected),
      x: () => this.retreatBattle(),
    }
    commands[key]?.()
  }

  private showTitle() {
    this.phase = 'title'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.addTitleText('三国志列传：群英新篇', '群雄割据 · 天下布武')
    this.makeButton(640, 492, '开始游戏', () => {
      this.music.start()
      this.showScenarioSetup()
    }, this.overlayLayer)
    this.makeButton(640, 552, '继续游戏', () => this.showContinueStub(), this.overlayLayer)
    this.makeButton(640, 612, '环境设定', () => this.showSettingsOverlay(), this.overlayLayer)
  }

  private showScenarioSetup() {
    this.phase = 'scenarioSetup'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('初始设定', '剧本 / 年代 / 难度 / 玩家数')

    this.drawPanel(86, 140, 710, 420)
    this.drawSectionTitle(120, 166, '选择年代')
    scenarioOptions.forEach((scenario, index) => {
      const y = 254 + index * 100
      const active = this.selectedScenarioId === scenario.id
      this.overlayLayer.add(this.add.rectangle(122, y - 30, 614, 78, active ? 0x342415 : 0x21160f, 0.94).setOrigin(0).setStrokeStyle(2, active ? 0xf8df9d : 0xd4af37, active ? 0.95 : 0.5))
      this.overlayLayer.add(this.add.text(150, y - 16, `${scenario.year}年  ${scenario.name}${scenario.locked ? '（后续开放）' : ''}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: active ? '#fff0bd' : '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(150, y + 14, scenario.desc, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        color: '#ead7b3',
        wordWrap: { width: 470 },
      }))
      this.makeButton(658, y + 4, active ? '已定' : scenario.locked ? '未开' : '选择', () => {
        if (scenario.locked) {
          this.showTitleNotice('剧本未开放', '当前先以190年群雄割据打磨完整复刻流程。')
          return
        }
        this.selectedScenarioId = scenario.id
        this.showScenarioSetup()
      }, this.overlayLayer, 104, 36)
    })

    this.drawPanel(838, 140, 350, 420)
    this.drawSectionTitle(870, 166, '选择难度')
    difficultyOptions.forEach((difficulty, index) => {
      const y = 254 + index * 92
      const active = this.selectedDifficulty === difficulty.id
      this.overlayLayer.add(this.add.rectangle(872, y - 30, 274, 76, active ? 0x342415 : 0x21160f, 0.94).setOrigin(0).setStrokeStyle(2, active ? 0xf8df9d : 0xd4af37, active ? 0.95 : 0.45))
      this.overlayLayer.add(this.add.text(898, y - 18, difficulty.name, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: active ? '#fff0bd' : '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(898, y + 10, difficultySetupDesc(difficulty.id), {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '13px',
        color: '#ead7b3',
        lineSpacing: 2,
      }))
      this.makeButton(1094, y + 4, active ? '已定' : '选择', () => {
        this.selectedDifficulty = difficulty.id
        this.showScenarioSetup()
      }, this.overlayLayer, 74, 34, 18)
    })
    this.overlayLayer.add(this.add.rectangle(872, 494, 274, 54, 0x21160f, 0.7).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.35))
    this.overlayLayer.add(this.add.text(892, 502, '玩家数：一人｜目标：统一核心州郡\n流程：选城 → 命令 → 月令', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '14px',
      color: '#f4dfb3',
      lineSpacing: 4,
      wordWrap: { width: 236 },
    }))

    this.makeButton(438, 636, '返回标题', () => this.showTitle(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '决定', () => this.showRulerSelect(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '环境设定', () => this.showSettingsOverlay(), this.overlayLayer, 180, 44)
  }

  private showRulerSelect() {
    this.phase = 'rulerSelect'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('选择君主', `当前剧本：${this.selectedScenarioLabel()}｜${this.selectedDifficultyLabel()}`)
    strategyFactions.filter((faction) => faction.id !== 'neutral').forEach((faction, index) => {
      const x = 116 + (index % 3) * 360
      const y = 160 + Math.floor(index / 3) * 190
      this.overlayLayer.add(this.add.rectangle(x, y, 308, 146, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, faction.color, 0.9))
      this.overlayLayer.add(this.add.text(x + 28, y + 22, faction.name, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '29px',
        color: '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(x + 30, y + 66, `君主：${faction.ruler}\n主城：${cityName(faction.capital)}\n特性：${faction.trait}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#f8ecd0',
        lineSpacing: 7,
        wordWrap: { width: 176 },
      }))
      this.makeButton(x + 224, y + 108, '开始', () => {
        this.resetCampaignState(faction.id)
        this.showCampaign()
      }, this.overlayLayer, 112, 36)
    })
    this.makeButton(640, 636, '返回标题', () => this.showTitle(), this.overlayLayer, 180, 44)
  }

  private showCampaign() {
    this.syncCampaignModeToMonth()
    this.phase = this.campaignClock.mode === 'inspection' ? 'inspectionMonth' : 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame(
      this.campaignClock.mode === 'inspection' ? '视察情况' : '行军',
      `${this.campaignClock.year}年${this.campaignClock.month}月   ${campaignModeName(this.campaignClock.mode)}｜${this.selectedDifficultyLabel()}｜${campaignWeatherName(this.campaignClock.weather)}`,
      0.9,
    )
    this.drawCampaignMap()
    this.drawCampaignSidePanel()
    this.drawMainCommandMenu()
  }

  private drawMainCommandMenu() {
    if (this.campaignClock.mode === 'march') {
      this.drawMarchCommandMenu()
      return
    }
    const coreCommands: [string, string, () => void][] = [
      ['D', '内政', () => this.showDomesticCommand()],
      ['F', '外交', () => this.showDiplomacy()],
      ['M', '军事', () => this.showMilitaryCommand()],
    ]
    this.drawFooterBar()
    this.overlayLayer.add(this.add.text(102, 602, `视察情况  ${this.selectedCity?.name ?? '未选'}城  ${this.campaignClock.year}年${this.campaignClock.month}月  政令 ${this.councilState.actions}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8df9d',
    }))
    this.overlayLayer.add(this.add.text(732, 602, this.marchArmy ? '辅助：出征令已下达' : '辅助命令', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f4dfb3',
    }))
    this.overlayLayer.add(this.add.rectangle(700, 604, 1, 80, 0xd4af37, 0.35).setOrigin(0))
    coreCommands.forEach(([key, label, callback], index) => {
      const x = 170 + index * 176
      this.makeKeyButton(x, 668, key, label, callback, this.overlayLayer, 150, 46)
    })
    this.makeKeyButton(760, 668, 'N', '月令', () => this.advanceCampaignMonth(), this.overlayLayer, 104, 40)
    this.makeKeyButton(890, 668, 'V', '势力', () => this.showFactionOverview(), this.overlayLayer, 104, 40)
    this.makeKeyButton(1020, 668, 'P', '人事', () => this.showPersonnelCommand(), this.overlayLayer, 104, 40)
    this.makeKeyButton(1144, 668, 'S', '机能', () => this.showSystemCommand(), this.overlayLayer, 92, 40)
  }

  private drawMarchCommandMenu() {
    const coreCommands: [string, string, () => void][] = [
      ['A', '部队', () => this.showMarchArmyStatus()],
      ['R', '路线', () => this.showMarchRoute()],
      ['G', '移动', () => this.resolveMarchMove()],
      ['X', '攻击', () => this.resolveMarchAttack()],
    ]
    const auxCommands: [string, string, () => void][] = [
      ['B', '情报', () => this.showBriefing()],
      ['C', '截粮', () => this.confirmMarchForage()],
      ['Z', '占村', () => this.confirmMarchVillage()],
      ['Q', '撤退', () => this.retreatMarchArmy()],
      ['W', '待机', () => this.showCampaignMessage('远征军按兵待命，等待主公号令。')],
      ['N', '月令', () => this.advanceCampaignMonth()],
    ]
    this.drawFooterBar()
    this.overlayLayer.add(this.add.text(102, 602, `行军命令  ${this.campaignClock.year}年${this.campaignClock.month}月  ${this.marchArmySummary()}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8df9d',
      wordWrap: { width: 600 },
    }))
    this.overlayLayer.add(this.add.text(682, 602, this.marchArmy ? '辅助' : '辅助：暂无远征军', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f4dfb3',
    }))
    this.overlayLayer.add(this.add.rectangle(650, 604, 1, 80, 0xd4af37, 0.35).setOrigin(0))
    coreCommands.forEach(([key, label, callback], index) => {
      const x = 140 + index * 122
      this.makeKeyButton(x, 668, key, label, callback, this.overlayLayer, 106, 44)
    })
    auxCommands.forEach(([key, label, callback], index) => {
      const x = 692 + index * 86
      this.makeKeyButton(x, 668, key, label, callback, this.overlayLayer, 78, 38)
    })
  }

  private showBriefing() {
    this.phase = 'briefing'
    this.ensureDeploymentTarget()
    const source = this.selectedCity
    const target = this.selectedTargetCity
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('敌城情报', `${source?.name ?? '本城'}至${target?.name ?? '邻境'}军情`)
    this.drawPanel(230, 168, 820, 394)
    this.drawSectionTitle(270, 202, '邻境军情')
    const owner = target ? factionById(target.owner) : undefined
    const officers = target ? this.campaignOfficers.filter((officer) => officer.location === target.id && officer.faction === target.owner && officer.status !== 'captured') : []
    const odds = target && source ? Math.floor((source.troops / Math.max(1, target.troops + target.defense * 60)) * 100) : 0
    const copy = [
      `出发      ${source?.name ?? '-'}`,
      `目标      ${target?.name ?? '未定'}（${target?.region ?? '-'}）`,
      `归属      ${owner?.name ?? '-'}`,
      `守军      ${target?.troops ?? 0}`,
      `城防      ${target?.defense ?? 0}`,
      `粮草      ${target?.food ?? 0}`,
      `府库      ${target?.gold ?? 0}`,
      `守将      ${officers.map((officer) => officer.name).join('、') || owner?.ruler || '郡中守将'}`,
      `邻接      ${target?.routes.map((id) => cityName(id)).join('、') ?? '-'}`,
      `胜算      ${odds >= 150 ? '上风' : odds >= 95 ? '可战' : '艰难'}`,
    ].join('\n')
    this.overlayLayer.add(this.add.text(282, 268, copy, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      lineSpacing: 9,
      color: '#f7ead0',
      wordWrap: { width: 720 },
    }))
    this.makeButton(438, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '军事命令', () => this.showMilitaryCommand(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '行军出征', () => this.showDeployment(), this.overlayLayer, 180, 44)
  }

  private advanceCampaignMonth() {
    let liuFoodGain = 0
    let liuGoldGain = 0
    const enemyBefore = this.strongestEnemySummary()
    for (const city of this.campaignCities) {
      const taxConfig = taxRateConfig(this.cityTaxRates.get(city.id) ?? 'normal')
      const disasterPressure = city.disaster ?? 0
      const harvestRate = 0.045 + (city.land ?? 40) / 1600 + (city.irrigation ?? 35) / 2200 - disasterPressure / 1800
      const commerceRate = 0.045 + (city.commerce ?? 35) / 1500 - disasterPressure / 2100
      const bonus = city.owner === this.playerFactionId ? this.cityGovernanceBonus(city.id) : { productionMultiplier: 1, taxMultiplier: 1, recruitMultiplier: 1, recruitPublicOrderCost: 1, moraleBonus: 0, publicOrderBonus: 0, defenseBonus: 0 }
      const foodGain = Math.max(60, Math.floor((city.food * 0.035 + (city.population ?? 20000) * harvestRate / 18) * taxConfig.goldMultiplier * bonus.productionMultiplier))
      const goldGain = Math.max(40, Math.floor((city.gold * 0.04 + (city.population ?? 20000) * commerceRate / 25) * taxConfig.goldMultiplier * bonus.taxMultiplier))
      const enemyGrowth = city.owner === this.playerFactionId ? 1 : this.difficultyConfig().enemyGrowth
      const troopGain = Math.max(120, Math.floor((city.troops * 0.024 + (city.population ?? 20000) / 420) * enemyGrowth))
      city.food = Math.min(5000, city.food + foodGain)
      city.gold = Math.min(3000, city.gold + goldGain)
      city.troops = Math.min(30000, city.troops + troopGain)
      city.population = Math.max(8000, Math.floor((city.population ?? 20000) + Math.max(30, (city.population ?? 20000) * 0.006) - troopGain * 0.22 - disasterPressure * 16))
      city.disaster = Phaser.Math.Clamp(Math.floor(disasterPressure * 0.72), 0, 100)
      if (city.owner === this.playerFactionId) {
        liuFoodGain += foodGain
        liuGoldGain += goldGain
        this.setCityPublicOrder(city, this.cityPublicOrder(city) + taxConfig.publicOrderDelta + bonus.publicOrderBonus)
      }
    }
    const aiReports = this.runEnemyFactionTurns()
    const diplomacyReports = this.resolveDiplomacyTimers()
    const enemyAfter = this.strongestEnemySummary()
    this.syncSelectedCityState()
    const selectedCity = this.selectedCity
    const selectedPublicOrder = selectedCity ? this.cityPublicOrder(selectedCity) : this.cityState.publicOrder
    const governorBonus = this.cityGovernanceBonus(this.selectedCityId)
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + (selectedPublicOrder >= 70 ? 2 : -1) + governorBonus.moraleBonus, 0, 100)
    this.councilState.actions = 3
    this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 6 - this.cityState.walls, 0, 100)
    const officerReports = this.advanceOfficerStatuses()
    this.campaignClock.month += 1
    if (this.campaignClock.month > 12) {
      this.campaignClock.month = 1
      this.campaignClock.year += 1
    }
    this.usedRouteEvents = new Set<string>()
    this.syncCampaignModeToMonth()
    this.campaignClock.weather = this.rollCampaignWeather()
    const marchReport = this.refreshMarchArmyForNewMonth()
    const eventText = this.resolveMonthlyEvent()
    const commandLines = this.monthlyActionLog.length > 0
      ? [`本月命令：${this.monthlyActionLog.join('；')}。`]
      : ['本月命令：未执行城池命令。']
    const strategicLines = this.strategicSituationReport()
    this.monthlyActionLog = []
    this.saveCampaign()
    this.showMonthReport([
      ...commandLines,
      `${this.playerFaction.name}收入：粮 +${liuFoodGain}，金 +${liuGoldGain}。`,
      ...(marchReport ? [marchReport] : []),
      ...(diplomacyReports.length > 0 ? diplomacyReports : ['外交：盟约与债契暂无变化。']),
      ...(officerReports.length > 0 ? officerReports : ['武将状态：暂无伤疲恢复或俘虏变化。']),
      ...strategicLines,
      `天候：${campaignWeatherName(this.campaignClock.weather)}。${campaignWeatherEffect(this.campaignClock.weather)}`,
      `${enemyAfter.name}整备最盛：总兵 ${enemyBefore.troops} → ${enemyAfter.troops}。`,
      ...(aiReports.length > 0 ? aiReports.slice(0, 4) : ['诸势力暂未有大规模行动。']),
      eventText,
      `新月份：${campaignModeName(this.campaignClock.mode)}，政令恢复为 ${this.councilState.actions}，当前城池 ${this.selectedCity?.name ?? '-'}。`,
    ])
  }

  private syncCampaignModeToMonth() {
    this.campaignClock.mode = this.campaignClock.month % 2 === 1 ? 'inspection' : 'march'
  }

  private advanceOfficerStatuses() {
    const reports: string[] = []
    this.campaignOfficers.forEach((officer) => {
      if (officer.faction === this.playerFactionId && officer.status !== 'captured') {
        const salary = officerSalary(officer)
        const city = this.campaignCities.find((item) => item.id === officer.location)
        if (city) city.gold = Math.max(0, city.gold - salary)
      }
      if ((officer.fatigue ?? 0) > 0 && officer.status !== 'captured') {
        officer.fatigue = Math.max(0, (officer.fatigue ?? 0) - 12)
      }
      if (officer.status === 'wounded') {
        officer.statusTurns = Math.max(0, (officer.statusTurns ?? 0) - 1)
        if (officer.statusTurns <= 0) {
          officer.status = 'normal'
          officer.statusTurns = 0
          reports.push(`${officer.name}伤势渐愈，可重新任事。`)
        }
      }
    })
    return reports
  }

  private rollCampaignWeather(): CampaignWeather {
    const roll = Phaser.Math.Between(1, 100)
    if (roll <= 24) return 'rain'
    if (roll >= 86) return 'heat'
    return 'clear'
  }

  private refreshMarchArmyForNewMonth() {
    if (!this.marchArmy) return ''
    if (this.marchArmy.status === 'routed') return ''
    this.marchArmy.movePoints = 1
    if (this.siegeState && this.marchArmy.status === 'besieging') {
      this.siegeState.actionsRemaining = 1
    }
    const position = this.describeMarchPosition(this.marchArmy)
    const siegeText = this.siegeState && this.marchArmy.status === 'besieging' ? '，攻城令恢复为 1' : ''
    return `行军：${cityName(this.marchArmy.sourceCityId)}远征军仍在${position}，移动恢复为 ${this.marchArmy.movePoints}${siegeText}。`
  }

  private strategicSituationReport() {
    const total = this.campaignCities.length
    const controlled = this.countCities(this.playerFactionId)
    const remaining = total - controlled
    const enemyFactions = strategyFactions
      .filter((faction) => faction.id !== this.playerFactionId && this.countCities(faction.id) > 0)
      .map((faction) => `${faction.ruler}${this.countCities(faction.id)}城`)
    const fallenFactions = strategyFactions
      .filter((faction) => faction.id !== this.playerFactionId && faction.id !== 'neutral' && this.countCities(faction.id) === 0)
      .map((faction) => faction.name)
    const frontiers = this.neighborEnemyCities(this.playerFactionId)
    return [
      `天下形势：${this.playerFaction.name} ${controlled}/${total} 城，尚余 ${remaining} 城。`,
      enemyFactions.length > 0 ? `割据势力：${enemyFactions.join('、')}。` : '割据势力：诸城已平。',
      frontiers.length > 0 ? `接壤敌境：${frontiers.join('、')}。` : '接壤敌境：暂无。',
      fallenFactions.length > 0 ? `已灭势力：${fallenFactions.join('、')}。` : '已灭势力：暂无。',
    ]
  }

  private resolveDiplomacyTimers() {
    const reports: string[] = []
    for (const [factionId, turns] of Array.from(this.allianceTerms.entries())) {
      const nextTurns = turns - 1
      const faction = factionById(factionId)
      if (nextTurns <= 0) {
        this.allianceTerms.delete(factionId)
        this.alliedFactionIds.delete(factionId)
        reports.push(`外交：与${faction?.ruler ?? factionId}的盟约期满。`)
      } else {
        this.allianceTerms.set(factionId, nextTurns)
        reports.push(`外交：与${faction?.ruler ?? factionId}盟约尚余${nextTurns}月。`)
      }
    }
    this.councilState.alliance = this.allianceTerms.size

    for (const [factionId, debt] of Array.from(this.diplomacyDebts.entries())) {
      const faction = factionById(factionId)
      if (!this.isDebtDue(debt)) {
        reports.push(`债契：尚欠${faction?.ruler ?? factionId}${debt.principal}，限${debt.dueYear}年${debt.dueMonth}月。`)
        continue
      }
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale - 5, 0, 100)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 6, 0, 100)
      reports.push(`债契：拖欠${faction?.ruler ?? factionId}${debt.principal}到期未清，士气 -5，敌势 +6。`)
    }
    return reports.slice(0, 4)
  }

  private addCampaignMonths(months: number) {
    const absolute = this.campaignClock.year * 12 + (this.campaignClock.month - 1) + months
    return {
      year: Math.floor(absolute / 12),
      month: (absolute % 12) + 1,
    }
  }

  private isDebtDue(debt: DiplomacyDebt) {
    const now = this.campaignClock.year * 12 + this.campaignClock.month
    const due = debt.dueYear * 12 + debt.dueMonth
    return now >= due
  }

  private showMonthReport(lines: string[], page = 0) {
    this.phase = 'monthReport'
    this.monthReportLines = lines
    this.showCampaign()
    this.phase = 'monthReport'
    this.addLayeredPanel(640, 410, 800, 500)
    this.overlayLayer.add(this.add.text(640, 214, '月令报告', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.text(640, 270, `${this.campaignClock.year}年${this.campaignClock.month}月`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    const pageSize = 7
    const pageData = this.pagedItems(lines, page, pageSize)
    this.monthReportPage = pageData.page
    this.drawListViewport(286, 304, 708, 244)
    this.overlayLayer.add(this.add.text(314, 326, pageData.items.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8ecd0',
      lineSpacing: 8,
      wordWrap: { width: 642 },
    }))
    this.drawPager(640, 568, pageData.page, pageData.totalPages, () => {
      this.showMonthReport(this.monthReportLines, Math.max(0, this.monthReportPage - 1))
    }, () => {
      this.showMonthReport(this.monthReportLines, Math.min(pageData.totalPages - 1, this.monthReportPage + 1))
    })
    this.makeButton(640, 612, '回到版图', () => this.showCampaign(), this.overlayLayer, 180, 44)
  }

  private showCampaignMessage(message: string) {
    this.showCampaign()
    this.playCommandSignal(message)
    this.drawToast(message, 548)
  }

  private playCommandSignal(message: string) {
    const label = message.includes('情报')
      ? '使'
      : message.includes('出征') || message.includes('行军')
        ? '令'
        : message.includes('征兵') || message.includes('训练') || message.includes('士卒')
          ? '兵'
          : message.includes('开发') || message.includes('运输') || message.includes('粮')
            ? '政'
            : '命'
    const token = this.add.container(640, 520)
    const disk = this.add.circle(0, 0, 28, 0x8b1e16, 0.96).setStrokeStyle(3, 0xf8df9d, 0.9)
    const glyph = this.add.text(0, -1, label, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px',
      color: '#f8df9d',
    }).setOrigin(0.5)
    token.add([disk, glyph])
    this.overlayLayer.add(token)
    this.tweens.add({
      targets: token,
      y: 486,
      scale: 1.24,
      alpha: 0,
      duration: 760,
      ease: 'Cubic.easeOut',
      onComplete: () => token.destroy(),
    })
  }

  private recordMonthlyAction(message: string) {
    this.monthlyActionLog.push(message)
    if (this.monthlyActionLog.length > 6) this.monthlyActionLog.shift()
  }

  private resolveStageAdvance() {
    if (this.campaignClock.mode === 'march' && this.marchArmy) {
      if (this.marchArmy.status === 'ready') {
        this.showCampaignMessage('远征军尚未移动，请先执行「移动」。')
      } else {
        this.beginSiege()
      }
      return
    }
    this.advanceCampaignMonth()
  }

  private marchArmySummary() {
    if (!this.marchArmy) return '无远征军'
    const target = this.marchArmy.targetCityId ? cityName(this.marchArmy.targetCityId) : '未定'
    return `${cityName(this.marchArmy.sourceCityId)}军 → ${target}  兵${this.marchArmy.troops} 粮${this.marchArmy.food}`
  }

  private showMarchArmyStatus() {
    if (!this.marchArmy) {
      this.showCampaignMessage('本月暂无远征军。请在视察情况月由军事命令编成出征。')
      return
    }
    this.selectedCityId = this.marchArmy.sourceCityId
    if (this.marchArmy.targetCityId) this.selectedTargetCityId = this.marchArmy.targetCityId
    this.syncSelectedCityState()
    this.showCampaign()
    const target = this.marchArmy.targetCityId ? cityName(this.marchArmy.targetCityId) : '未定'
    const position = this.describeMarchPosition(this.marchArmy)
    const officerLines = this.marchArmy.officerIds
      .map((id) => this.campaignOfficers.find((officer) => officer.id === id))
      .filter((officer): officer is StrategyOfficer => Boolean(officer))
      .map((officer) => {
        const troops = this.marchArmy?.officerTroops[officer.id] ?? officerTroops(officer)
        const food = this.marchArmy?.officerFood[officer.id] ?? 0
        const fatigue = this.marchArmy?.officerFatigue[officer.id] ?? 0
        return `${officer.name} 兵${troops} 粮${food} 疲${fatigue} ${this.marchOfficerCondition(officer)}`
      })
    this.addLayeredPanel(640, 404, 820, 390)
    this.overlayLayer.add(this.add.text(640, 248, '远征军', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '38px',
      color: '#f8df9d',
    }).setOrigin(0.5))
    const summary = [
      `出发城    ${cityName(this.marchArmy.sourceCityId)}`,
      `目标城    ${target}`,
      `位置      ${position}`,
      `兵粮      兵${this.marchArmy.troops}  粮${this.marchArmy.food}  士气${this.marchArmy.morale}`,
      `主将      ${this.officerName(this.marchArmy.leaderOfficerId)}`,
      `状态      ${marchStatusName(this.marchArmy.status)}  移动${this.marchArmy.movePoints}`,
      `分摊      移动/改道先扣随军粮，粮尽加疲劳`,
    ].join('\n')
    this.overlayLayer.add(this.add.text(300, 306, summary, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f8ecd0',
      lineSpacing: 10,
      wordWrap: { width: 350 },
    }))
    this.overlayLayer.add(this.add.text(716, 306, ['随军', ...(officerLines.length > 0 ? officerLines : this.marchArmy.officerIds.map((id) => this.officerName(id)))].join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
      lineSpacing: 12,
      wordWrap: { width: 340 },
    }))
    this.makeButton(540, 594, '路线', () => this.showMarchRoute(), this.overlayLayer, 136, 40)
    this.makeButton(740, 594, '返回行军', () => this.showCampaign(), this.overlayLayer, 150, 40)
  }

  private showMarchRoute() {
    if (!this.marchArmy) {
      this.showCampaignMessage('本月暂无远征军，无法设定路线。')
      return
    }
    this.selectedCityId = this.marchArmy.sourceCityId
    if (this.marchArmy.targetCityId) this.selectedTargetCityId = this.marchArmy.targetCityId
    this.syncSelectedCityState()
    this.showCampaign()
    this.addLayeredPanel(640, 414, 760, 320)
    this.overlayLayer.add(this.add.text(640, 330, '行军路线', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '38px',
      color: '#f8df9d',
    }).setOrigin(0.5))
    const route = this.marchArmy.routePlan.length > 1 ? this.marchArmy.routePlan.map((id) => cityName(id)).join(' → ') : `${cityName(this.marchArmy.sourceCityId)} → 未定`
    const nextNode = this.nextMarchNode()
    const routeEnd = this.marchArmy.routePlan.at(-1) ?? this.marchArmy.sourceCityId
    const routeEndCity = this.campaignCities.find((city) => city.id === routeEnd)
    const candidates = this.marchArmy.status === 'ready' ? this.marchRouteExtensionCandidates() : []
    const currentFeatures = this.currentRouteFeatures(this.marchArmy)
    this.overlayLayer.add(this.add.text(330, 378, [
      `当前路线    ${route}`,
      `当前位置      ${this.describeMarchPosition(this.marchArmy)}`,
      `下一节点      ${nextNode ? cityName(nextNode) : '已抵达'}`,
      `路线末端      ${cityName(routeEnd)}`,
      `路况节点      ${currentFeatures.length > 0 ? currentFeatures.map((feature) => routeFeatureName(feature)).join('、') : '城内整备'}`,
      `状态          ${marchStatusName(this.marchArmy.status)}`,
    ].join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      lineSpacing: 10,
    }))
    this.overlayLayer.add(this.add.text(640, 486, this.marchArmy.status === 'ready' ? '未移动前可追加节点；重置既定路线会耗粮 -2、士气 -1。' : '远征军已出发，本月不能改线。', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#ead7b3',
    }).setOrigin(0.5))
    if (this.marchArmy.status === 'ready') {
      candidates.slice(0, 4).forEach((city, index) => {
        const x = 346 + index * 146
        const mark = city.owner === this.playerFactionId ? '途' : '攻'
        this.makeButton(x, 526, `${city.name}${mark}`, () => this.confirmMarchRouteNode(city), this.overlayLayer, 126, 36)
      })
      if (candidates.length === 0) {
        this.overlayLayer.add(this.add.text(640, 526, `${routeEndCity?.name ?? '末端'}周边暂无可追加节点。`, {
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontSize: '18px',
          color: '#ead7b3',
        }).setOrigin(0.5))
      }
      this.makeButton(930, 526, '重置', () => this.resetMarchRoute(), this.overlayLayer, 96, 36)
    }
    this.makeButton(540, 594, '部队', () => this.showMarchArmyStatus(), this.overlayLayer, 136, 40)
    this.makeButton(740, 594, '返回行军', () => this.showCampaign(), this.overlayLayer, 150, 40)
  }

  private confirmMarchRouteNode(target: StrategyCity) {
    if (!this.marchArmy) return
    const routeEnd = this.marchArmy.routePlan.at(-1) ?? this.marchArmy.sourceCityId
    const nextRoute = [...this.marchArmy.routePlan.filter((id) => id !== target.id), target.id]
    const finalTarget = target.owner !== this.playerFactionId
    this.showCommandConfirm({
      category: '行军',
      command: '路线',
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target: target.name,
      scope: `${cityName(routeEnd)} → ${target.name}`,
      effect: finalTarget ? '追加最终攻击目标，移动前可再次调整' : '追加途经节点，仍需选择最终攻击目标',
      hint: '确认后更新行军路线',
      onConfirm: () => {
        if (!this.marchArmy) return
        this.marchArmy.routePlan = nextRoute
        this.marchArmy.targetCityId = finalTarget ? target.id : undefined
        if (finalTarget) this.selectedTargetCityId = target.id
        this.focusedCityId = target.id
        this.showMarchRoute()
      },
      onCancel: () => this.showMarchRoute(),
    })
  }

  private resetMarchRoute() {
    if (!this.marchArmy) return
    if (this.marchArmy.routePlan.length > 1) {
      this.consumeMarchArmyFood(2)
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 1, 0, 100)
      this.recordMonthlyAction(`${cityName(this.marchArmy.sourceCityId)}军改道整备`)
    }
    this.marchArmy.routePlan = [this.marchArmy.sourceCityId]
    this.marchArmy.targetCityId = undefined
    this.focusedCityId = this.marchArmy.sourceCityId
    this.showMarchRoute()
  }

  private resolveMarchMove() {
    if (!this.marchArmy) {
      this.showCampaignMessage('没有可移动的远征军。')
      return
    }
    if (this.marchArmy.movePoints <= 0) {
      this.showCampaignMessage('本月移动已尽，远征军只能待机或攻击邻近目标。')
      return
    }
    if (this.marchArmy.routePlan.length < 2) {
      this.showCampaignMessage('远征军尚未指定路线节点。')
      return
    }
    const from = this.currentMarchNode()
    const target = this.nextMarchNode() ?? this.marchArmy.targetCityId
    if (!target) {
      this.showCampaignMessage('远征军已无下一路线节点。')
      return
    }
    const nextProgress = this.nextMarchProgress()
    const moveCost = this.routeMoveCost(from, target)
    const effect = nextProgress >= MARCH_ROUTE_STEPS
      ? `移动 -1｜随军粮 -${moveCost.food}｜疲劳 +${moveCost.fatigue}｜抵达${cityName(target)}`
      : `移动 -1｜随军粮 -${moveCost.food}｜疲劳 +${moveCost.fatigue}｜${cityName(from)}到${cityName(target)} ${nextProgress}/${MARCH_ROUTE_STEPS}`
    this.showCommandConfirm({
      category: '行军',
      command: '移动',
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target: cityName(target),
      scope: `${cityName(from)} → ${cityName(target)}`,
      effect,
      hint: '确认后执行远征军命令',
      onConfirm: () => this.executeMarchMove(),
      onCancel: () => this.showCampaign(),
    })
  }

  private executeMarchMove() {
    if (!this.marchArmy || this.marchArmy.routePlan.length < 2) return
    const from = this.currentMarchNode()
    const target = this.nextMarchNode() ?? this.marchArmy.targetCityId
    if (!target) return
    const nextProgress = this.nextMarchProgress()
    if (nextProgress >= MARCH_ROUTE_STEPS) {
      this.marchArmy.position = { kind: 'city', cityId: target, progress: MARCH_ROUTE_STEPS }
      this.marchArmy.status = 'marching'
    } else {
      this.marchArmy.position = { kind: 'route', route: [from, target], progress: nextProgress }
      this.marchArmy.status = 'marching'
    }
    this.marchArmy.movePoints -= 1
    const moveCost = this.routeMoveCost(from, target)
    this.consumeMarchArmyFood(moveCost.food)
    this.addMarchFatigue(moveCost.fatigue)
    if (moveCost.morale !== 0) this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + moveCost.morale, 0, 100)
    if (moveCost.enemyThreat > 0) this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + moveCost.enemyThreat, 0, 100)
    const eventMessage = this.applyMarchNodeEvent(from, target, nextProgress >= MARCH_ROUTE_STEPS)
    const encounterMessage = this.resolvePlayerAiMarchEncounter(from, target, nextProgress >= MARCH_ROUTE_STEPS)
    this.focusedCityId = target
    this.selectedTargetCityId = target
    const moveMessage = nextProgress >= MARCH_ROUTE_STEPS
      ? `${cityName(from)}军抵达${cityName(target)}${target === this.marchArmy.targetCityId ? '城下，可发起攻城。' : '，可继续沿路线前进。'}`
      : `${cityName(from)}军沿道路向${cityName(target)}推进，路线进度 ${nextProgress}/${MARCH_ROUTE_STEPS}。`
    this.recordMonthlyAction(`${cityName(from)}军行至${cityName(target)}`)
    this.showCampaignMessage(`${moveMessage}${this.routeMoveCostText(moveCost)}${eventMessage}${encounterMessage}`)
  }

  private applyMarchNodeEvent(from: CityId, target: CityId, arrived: boolean) {
    if (!this.marchArmy) return ''
    const targetCity = this.campaignCities.find((city) => city.id === target)
    if (!targetCity) return ''
    const features = this.routeFeaturesBetween(from, target)
    const routeText = features.length > 0 ? ` 路段${features.map((feature) => routeFeatureName(feature)).join('、')}。` : ''
    if (arrived && targetCity.owner === this.marchArmy.factionId) {
      this.marchArmy.food = Math.min(150, this.marchArmy.food + 3)
      this.distributeMarchSupply(3)
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 2, 0, 100)
      return `${routeText} 沿途驿站接应，随军粮 +3，情报 +2。`
    }
    if (arrived && target === this.marchArmy.targetCityId) {
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 3, 0, 100)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 1, 0, 100)
      return `${routeText} 城外斥候探明守备，情报 +3，敌势 +1。`
    }
    const pressure = targetCity.owner !== this.marchArmy.factionId || from === this.marchArmy.targetCityId
    if (pressure) {
      this.consumeMarchArmyFood(1)
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 1, 0, 100)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 1, 0, 100)
      const interceptLoss = this.resolveMarchInterception(targetCity, arrived)
      return interceptLoss > 0
        ? `${routeText} 前哨遭截击，随军粮 -1，士气 -1，损兵${interceptLoss}，敌势 +1。`
        : `${routeText} 前哨受扰，随军粮 -1，士气 -1，敌势 +1。`
    }
    this.marchArmy.food = Math.min(150, this.marchArmy.food + 2)
    this.distributeMarchSupply(2)
    this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + 1, 0, 100)
    return `${routeText} 乡导补水，随军粮 +2，士气 +1。`
  }

  private routeFeaturesBetween(a: CityId, b: CityId) {
    return routeFeatures[routeKey(a, b)] ?? []
  }

  private currentMarchRouteKey() {
    if (!this.marchArmy) return ''
    if (this.marchArmy.position.kind === 'route' && this.marchArmy.position.route) {
      return routeKey(this.marchArmy.position.route[0], this.marchArmy.position.route[1])
    }
    const current = this.currentMarchNode()
    const next = this.nextMarchNode()
    return next ? routeKey(current, next) : ''
  }

  private routeEventKey(kind: RouteEventKind) {
    const route = this.currentMarchRouteKey()
    return route ? `${this.campaignClock.year}-${this.campaignClock.month}-${kind}-${route}` : ''
  }

  private hasUsedRouteEvent(kind: RouteEventKind) {
    const key = this.routeEventKey(kind)
    return key.length > 0 && this.usedRouteEvents.has(key)
  }

  private markRouteEventUsed(kind: RouteEventKind) {
    const key = this.routeEventKey(kind)
    if (key) this.usedRouteEvents.add(key)
  }

  private routeMoveCost(a: CityId, b: CityId) {
    const features = this.routeFeaturesBetween(a, b)
    const rain = this.campaignClock.weather === 'rain'
    const heat = this.campaignClock.weather === 'heat'
    return {
      food: 4 + (features.includes('ferry') ? 2 : 0) + (rain && features.includes('ferry') ? 2 : 0) + (heat ? 1 : 0),
      fatigue: 2 + (features.includes('pass') ? 4 : 0) + (rain && features.includes('pass') ? 2 : 0) + (heat ? 1 : 0),
      morale: features.includes('pass') ? -1 : 0,
      enemyThreat: features.includes('supply') ? 1 : 0,
    }
  }

  private routeMoveCostText(cost: { food: number; fatigue: number; morale: number; enemyThreat: number }) {
    const parts: string[] = []
    if (cost.food > 4) parts.push(`额外耗粮 +${cost.food - 4}`)
    if (cost.fatigue > 2) parts.push(`额外疲劳 +${cost.fatigue - 2}`)
    if (cost.morale < 0) parts.push(`士气 ${cost.morale}`)
    if (cost.enemyThreat > 0) parts.push(`粮道戒备 +${cost.enemyThreat}`)
    if (this.campaignClock.weather === 'rain') parts.push('雨天路滑')
    if (this.campaignClock.weather === 'heat') parts.push('暑热耗粮')
    return parts.length > 0 ? ` ${parts.join('，')}。` : ''
  }

  private currentRouteFeatures(army: MarchArmy) {
    if (army.position.kind === 'route' && army.position.route) {
      return this.routeFeaturesBetween(army.position.route[0], army.position.route[1])
    }
    const current = army.position.cityId ?? army.sourceCityId
    const next = this.nextNodeForArmy(army)
    return next ? this.routeFeaturesBetween(current, next) : []
  }

  private consumeMarchArmyFood(amount: number) {
    if (!this.marchArmy || amount <= 0) return 0
    let remaining = Math.min(amount, this.marchArmy.food)
    let shortage = amount - remaining
    this.marchArmy.food = Math.max(0, this.marchArmy.food - amount)
    const ids = this.marchArmy.officerIds.filter((id) => (this.marchArmy?.officerFood[id] ?? 0) > 0)
    while (remaining > 0 && ids.length > 0) {
      const donor = ids
        .sort((a, b) => (this.marchArmy?.officerFood[b] ?? 0) - (this.marchArmy?.officerFood[a] ?? 0))[0]
      if (!donor || (this.marchArmy.officerFood[donor] ?? 0) <= 0) break
      this.marchArmy.officerFood[donor] = Math.max(0, (this.marchArmy.officerFood[donor] ?? 0) - 1)
      remaining -= 1
    }
    shortage += remaining
    if (shortage > 0) this.addMarchFatigue(shortage * 2)
    return amount - shortage
  }

  private distributeMarchSupply(amount: number) {
    if (!this.marchArmy || amount <= 0 || this.marchArmy.officerIds.length === 0) return
    for (let i = 0; i < amount; i += 1) {
      const id = this.marchArmy.officerIds[i % this.marchArmy.officerIds.length]
      this.marchArmy.officerFood[id] = (this.marchArmy.officerFood[id] ?? 0) + 1
    }
  }

  private addMarchFatigue(amount: number) {
    if (!this.marchArmy || amount <= 0) return
    this.marchArmy.officerIds.forEach((id) => {
      this.marchArmy!.officerFatigue[id] = Phaser.Math.Clamp((this.marchArmy!.officerFatigue[id] ?? 0) + amount, 0, 100)
    })
  }

  private marchOfficerCondition(officer: StrategyOfficer) {
    if (officer.status === 'captured') return '被俘'
    if (officer.status === 'wounded') return `伤疲${officer.statusTurns ?? 1}`
    if ((officer.fatigue ?? 0) >= 72) return '疲困'
    if ((officer.fatigue ?? 0) >= 45) return '劳顿'
    const fatigue = this.marchArmy?.officerFatigue[officer.id] ?? 0
    const troops = this.marchArmy?.officerTroops[officer.id] ?? officerTroops(officer)
    if (troops <= 160) return '重伤'
    if (fatigue >= 70) return '疲困'
    if (fatigue >= 42) return '劳顿'
    return '可战'
  }

  private isOfficerAvailable(officer: StrategyOfficer) {
    return (officer.status ?? 'normal') === 'normal' && (officer.fatigue ?? 0) < 85
  }

  private woundOfficer(officer: StrategyOfficer, turns: number) {
    if (officer.status === 'captured') return
    officer.status = 'wounded'
    officer.statusTurns = Math.max(officer.statusTurns ?? 0, turns)
    officer.fatigue = Phaser.Math.Clamp((officer.fatigue ?? 0) + 25, 0, 100)
  }

  private captureOfficer(officer: StrategyOfficer, captorFactionId: FactionId, location: CityId) {
    officer.status = 'captured'
    officer.captorFactionId = captorFactionId
    officer.location = location
    officer.fatigue = 100
  }

  private retireOfficer(officer: StrategyOfficer) {
    officer.status = 'wounded'
    officer.statusTurns = 99
    officer.fatigue = 100
  }

  private addOfficerMerit(officer: StrategyOfficer, amount: number) {
    officer.merit = Math.max(0, (officer.merit ?? initialOfficerMerit(officer)) + amount)
    officer.salary = Math.max(officer.salary ?? 0, initialOfficerSalary(officer) + Math.floor((officer.merit ?? 0) / 80))
  }

  private addOfficerFatigue(officer: StrategyOfficer, amount: number) {
    if (officer.status === 'captured') return
    officer.fatigue = Phaser.Math.Clamp((officer.fatigue ?? 0) + amount, 0, 100)
  }

  private resolveMarchInterception(targetCity: StrategyCity, arrived: boolean) {
    if (!this.marchArmy || targetCity.owner === this.marchArmy.factionId) return 0
    const threat = this.campaignClock.enemyThreat + Math.floor(targetCity.troops / 1200) + (arrived ? 4 : 0)
    if (threat < 42) return 0
    const loss = Math.min(Math.max(80, Math.floor(threat * 4.5)), Math.max(0, this.marchArmy.troops - 400))
    if (loss <= 0) return 0
    this.marchArmy.troops = Math.max(400, this.marchArmy.troops - loss)
    this.distributeMarchArmyTroopLoss(loss)
    this.addMarchFatigue(arrived ? 8 : 5)
    return loss
  }

  private resolvePlayerAiMarchEncounter(from: CityId, target: CityId, arrived: boolean) {
    if (!this.marchArmy) return ''
    const index = this.aiMarchArmies.findIndex((army) => this.aiArmyConflictsWithPlayer(army, from, target, arrived))
    if (index < 0) return ''
    const aiArmy = this.aiMarchArmies[index]
    const aiName = this.aiArmyName(aiArmy)
    const playerPower = this.marchArmy.troops * (0.72 + this.marchArmy.morale / 145)
    const aiPower = aiArmy.troops * (0.72 + aiArmy.morale / 145)
    const playerLoss = Math.min(Math.max(90, Math.floor(aiArmy.troops * 0.1)), Math.max(0, this.marchArmy.troops - 420))
    const aiLoss = Math.min(Math.max(90, Math.floor(this.marchArmy.troops * 0.12)), Math.max(0, aiArmy.troops - 360))
    this.marchArmy.troops = Math.max(400, this.marchArmy.troops - playerLoss)
    this.distributeMarchArmyTroopLoss(playerLoss)
    aiArmy.troops = Math.max(260, aiArmy.troops - aiLoss)
    this.addMarchFatigue(6)
    this.marchArmy.officerIds.forEach((id) => {
      const officer = this.campaignOfficers.find((item) => item.id === id)
      if (officer) {
        this.addOfficerMerit(officer, 5)
        this.addOfficerFatigue(officer, 8)
      }
    })
    if (playerPower >= aiPower * 1.08 || aiArmy.troops <= 520) {
      this.aiMarchArmies.splice(index, 1)
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + 4, 0, 100)
      this.recordMonthlyAction(`击退${aiName}`)
      return ` 遭遇${aiName}，我军损兵${playerLoss}，敌军损兵${aiLoss}后退却，士气 +4。`
    }
    if (aiPower >= playerPower * 1.22) {
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 6, 0, 100)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 3, 0, 100)
      this.recordMonthlyAction(`遭${aiName}截击`)
      return ` 遭遇${aiName}截击，我军损兵${playerLoss}，敌军损兵${aiLoss}，士气 -6，敌势 +3。`
    }
    this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 2, 0, 100)
    aiArmy.morale = Phaser.Math.Clamp(aiArmy.morale - 3, 0, 100)
    this.recordMonthlyAction(`与${aiName}遭遇`)
    return ` 遭遇${aiName}，双方收兵整队：我军损兵${playerLoss}，敌军损兵${aiLoss}。`
  }

  private aiArmyConflictsWithPlayer(aiArmy: MarchArmy, from: CityId, target: CityId, arrived: boolean) {
    if (!this.marchArmy || aiArmy.factionId === this.marchArmy.factionId) return false
    if (arrived && aiArmy.position.kind === 'city' && aiArmy.position.cityId === target) return true
    if (aiArmy.targetCityId && aiArmy.targetCityId === this.marchArmy.targetCityId && target === aiArmy.targetCityId) return true
    if (aiArmy.position.kind === 'route' && aiArmy.position.route) {
      const [aiFrom, aiTo] = aiArmy.position.route
      return (aiFrom === from && aiTo === target) || (aiFrom === target && aiTo === from)
    }
    return false
  }

  private distributeMarchArmyTroopLoss(totalLoss: number) {
    if (!this.marchArmy || totalLoss <= 0) return 0
    const ids = this.marchArmy.officerIds.filter((id) => (this.marchArmy?.officerTroops[id] ?? 0) > 80)
    const totalTroops = ids.reduce((sum, id) => sum + (this.marchArmy?.officerTroops[id] ?? 0), 0)
    let remainingLoss = totalLoss
    let appliedLoss = 0
    ids.forEach((id, index) => {
      if (!this.marchArmy) return
      const current = this.marchArmy.officerTroops[id] ?? 0
      const share = index === ids.length - 1
        ? remainingLoss
        : Math.max(1, Math.floor(totalLoss * (current / Math.max(1, totalTroops))))
      const loss = Math.min(Math.max(0, current - 80), share, remainingLoss)
      this.marchArmy.officerTroops[id] = current - loss
      const officer = this.campaignOfficers.find((item) => item.id === id)
      if (officer) officer.troops = Math.max(80, officerTroops(officer) - loss)
      remainingLoss -= loss
      appliedLoss += loss
    })
    return appliedLoss
  }

  private nextMarchProgress() {
    if (!this.marchArmy) return 1
    return Math.min(MARCH_ROUTE_STEPS, (this.marchArmy.position.progress ?? 0) + 1)
  }

  private currentMarchNode() {
    if (!this.marchArmy) return 'chengdu' as CityId
    return this.marchArmy.position.kind === 'route'
      ? this.marchArmy.position.route?.[0] ?? this.marchArmy.sourceCityId
      : this.marchArmy.position.cityId ?? this.marchArmy.sourceCityId
  }

  private nextMarchNode() {
    if (!this.marchArmy) return undefined
    if (this.marchArmy.position.kind === 'route') return this.marchArmy.position.route?.[1]
    const current = this.currentMarchNode()
    const index = this.marchArmy.routePlan.indexOf(current)
    return index >= 0 ? this.marchArmy.routePlan[index + 1] : this.marchArmy.targetCityId
  }

  private marchRouteExtensionCandidates() {
    if (!this.marchArmy) return []
    const routeEnd = this.marchArmy.routePlan.at(-1) ?? this.marchArmy.sourceCityId
    const used = new Set(this.marchArmy.routePlan)
    const city = this.campaignCities.find((item) => item.id === routeEnd)
    if (!city) return []
    if (city.owner !== this.marchArmy.factionId) return []
    return city.routes
      .map((id) => this.campaignCities.find((item) => item.id === id))
      .filter((item): item is StrategyCity => item !== undefined && !used.has(item.id))
      .filter((item) => item.owner === this.playerFactionId || item.owner !== this.marchArmy?.factionId)
  }

  private resolveMarchAttack() {
    if (!this.marchArmy) {
      this.showCampaignMessage('没有远征军可发起攻击。')
      return
    }
    if (this.marchArmy.status === 'ready') {
      this.showCampaignMessage('远征军尚未移动到敌城，请先执行「移动」。')
      return
    }
    if (!this.isMarchArmyAtTarget()) {
      this.showCampaignMessage('远征军尚未抵达目标城，不能攻城。请继续执行「移动」。')
      return
    }
    const target = this.marchArmy.targetCityId ? cityName(this.marchArmy.targetCityId) : '目标城'
    this.showCommandConfirm({
      category: '行军',
      command: '攻击',
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target,
      scope: '敌城城下',
      effect: '进入攻城层，选择强攻、围城、火计、挑战或会战',
      hint: '确认后展开攻城',
      onConfirm: () => this.beginSiege(),
      onCancel: () => this.showCampaign(),
    })
  }

  private isMarchArmyAtTarget() {
    return Boolean(this.marchArmy?.targetCityId && this.marchArmy.position.kind === 'city' && this.marchArmy.position.cityId === this.marchArmy.targetCityId)
  }

  private previewAiSupplyDisruption() {
    const route = this.currentMarchRouteKey()
    return route.length > 0 && this.aiMarchArmies.some((army) => this.aiArmyUsesRoute(army, route))
  }

  private aiArmyUsesRoute(army: MarchArmy, route: string) {
    if (army.position.kind === 'route' && army.position.route && routeKey(army.position.route[0], army.position.route[1]) === route) return true
    return army.routePlan.some((cityId, index) => {
      const next = army.routePlan[index + 1]
      return Boolean(next && routeKey(cityId, next) === route)
    })
  }

  private disruptAiSupplyLine() {
    const route = this.currentMarchRouteKey()
    if (!route) return ''
    const index = this.aiMarchArmies.findIndex((item) => this.aiArmyUsesRoute(item, route))
    const army = this.aiMarchArmies[index]
    if (!army) return ''
    const foodLoss = Math.min(10, army.food)
    const troopLoss = army.food <= 6 ? Math.min(220, Math.max(0, army.troops - 320)) : 0
    army.food = Math.max(0, army.food - 10)
    army.morale = Phaser.Math.Clamp(army.morale - 5, 0, 100)
    if (troopLoss > 0) army.troops = Math.max(260, army.troops - troopLoss)
    if (army.food <= 0 && army.morale <= 18) army.status = 'routed'
    const routed = army.status === 'routed' ? '，其军粮尽溃散' : ''
    if (army.status === 'routed') this.aiMarchArmies.splice(index, 1)
    return ` ${this.aiArmyName(army)}粮线受损，敌粮 -${foodLoss}，士气 -5${troopLoss > 0 ? `，折兵${troopLoss}` : ''}${routed}。`
  }

  private confirmMarchForage() {
    if (!this.marchArmy) {
      this.showCampaignMessage('没有远征军可截粮。')
      return
    }
    if (this.marchArmy.status === 'ready') {
      this.showCampaignMessage('远征军尚未离城，无法截粮。')
      return
    }
    const features = this.currentRouteFeatures(this.marchArmy)
    if (!features.includes('supply')) {
      this.showCampaignMessage(`当前路段为${features.length > 0 ? features.map((feature) => routeFeatureName(feature)).join('、') : '普通道路'}，没有可截粮道。`)
      return
    }
    if (this.hasUsedRouteEvent('forage')) {
      this.showCampaignMessage('本月已在此路段截粮，敌军已加强粮道戒备。')
      return
    }
    const disruption = this.previewAiSupplyDisruption()
    this.showCommandConfirm({
      category: '行军',
      command: '截粮',
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target: this.marchArmy.targetCityId ? `${cityName(this.marchArmy.targetCityId)}粮道` : '敌军粮道',
      scope: this.describeMarchPosition(this.marchArmy),
      effect: disruption ? '随军粮 +12｜敌行军粮 -10｜敌士气 -5｜敌势 +4' : '随军粮 +12｜敌势 +4｜民心 -1',
      hint: '确认后执行行军事件',
      onConfirm: () => this.executeMarchForage(),
      onCancel: () => this.showCampaign(),
    })
  }

  private executeMarchForage() {
    if (!this.marchArmy) return
    const features = this.currentRouteFeatures(this.marchArmy)
    const gain = 8 + (features.includes('supply') ? 4 : 0)
    this.markRouteEventUsed('forage')
    this.marchArmy.food = Math.min(120, this.marchArmy.food + gain)
    this.distributeMarchSupply(Math.floor(gain / 2))
    const sourceCity = this.campaignCities.find((c) => c.id === this.marchArmy?.sourceCityId)
    if (sourceCity) this.setCityPublicOrder(sourceCity, this.cityPublicOrder(sourceCity) - 1)
    this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 4, 0, 100)
    const disruption = this.disruptAiSupplyLine()
    this.recordMonthlyAction(`${cityName(this.marchArmy.sourceCityId)}军截粮`)
    this.showCampaignMessage(`远征军截得敌粮，随军粮 +${gain}；敌军戒备上升。${disruption}`)
  }

  private confirmMarchVillage() {
    if (!this.marchArmy) {
      this.showCampaignMessage('没有远征军可占村。')
      return
    }
    if (this.marchArmy.status === 'ready') {
      this.showCampaignMessage('远征军尚未离城，无法占村。')
      return
    }
    const features = this.currentRouteFeatures(this.marchArmy)
    if (!features.includes('village')) {
      this.showCampaignMessage(`当前路段为${features.length > 0 ? features.map((feature) => routeFeatureName(feature)).join('、') : '普通道路'}，没有可占村落。`)
      return
    }
    if (this.hasUsedRouteEvent('village')) {
      this.showCampaignMessage('本月已在此路段占村补给，乡民已经迁避。')
      return
    }
    this.showCommandConfirm({
      category: '行军',
      command: '占村',
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target: '沿途村落',
      scope: this.describeMarchPosition(this.marchArmy),
      effect: '随军粮 +7｜情报 +6｜士气 +1｜民心 -1',
      hint: '确认后执行行军事件',
      onConfirm: () => this.executeMarchVillage(),
      onCancel: () => this.showCampaign(),
    })
  }

  private executeMarchVillage() {
    if (!this.marchArmy) return
    const features = this.currentRouteFeatures(this.marchArmy)
    const foodGain = 4 + (features.includes('village') ? 3 : 0)
    const intelGain = 4 + (features.includes('village') ? 2 : 0)
    this.markRouteEventUsed('village')
    this.marchArmy.food = Math.min(120, this.marchArmy.food + foodGain)
    this.distributeMarchSupply(Math.floor(foodGain / 2))
    this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + 1, 0, 100)
    this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + intelGain, 0, 100)
    const sourceCity2 = this.campaignCities.find((c) => c.id === this.marchArmy?.sourceCityId)
    if (sourceCity2) this.setCityPublicOrder(sourceCity2, this.cityPublicOrder(sourceCity2) - 1)
    this.recordMonthlyAction(`${cityName(this.marchArmy.sourceCityId)}军占村补给`)
    this.showCampaignMessage(`远征军占得沿途村落，随军粮 +${foodGain}，情报 +${intelGain}，民心 -1。`)
  }

  private retreatMarchArmy() {
    if (!this.marchArmy) {
      this.showCampaignMessage('当前没有远征军需要撤退。')
      return
    }
    const message = `${cityName(this.marchArmy.sourceCityId)}军撤回本城，士气略降。`
    this.releaseMarchArmyOfficers(this.marchArmy.sourceCityId)
    this.marchArmy = undefined
    this.councilState.morale = Math.max(0, this.councilState.morale - 4)
    this.recordMonthlyAction(message)
    this.showCampaignMessage(message)
  }

  private describeMarchPosition(army: MarchArmy) {
    if (army.position.kind === 'city' && army.position.cityId) return cityName(army.position.cityId)
    if (army.position.kind === 'route' && army.position.route) {
      return `${cityName(army.position.route[0])} → ${cityName(army.position.route[1])} ${army.position.progress ?? 0}/${MARCH_ROUTE_STEPS}`
    }
    return '行军途中'
  }

  private officerName(officerId: string) {
    return this.campaignOfficers.find((officer) => officer.id === officerId)?.name ?? officerId
  }

  private activeMarchOfficerIds() {
    return new Set(this.marchArmy?.officerIds ?? [])
  }

  private isOfficerOnMarch(officerId: string) {
    return this.activeMarchOfficerIds().has(officerId)
  }

  private releaseMarchArmyOfficers(destinationCityId: CityId) {
    if (!this.marchArmy) return
    const officerIds = this.activeMarchOfficerIds()
    this.campaignOfficers.forEach((officer) => {
      if (officerIds.has(officer.id)) {
        officer.location = destinationCityId
      }
    })
  }

  private beginSiege() {
    if (!this.marchArmy?.targetCityId) {
      this.showCampaignMessage('远征军没有目标城，无法攻城。')
      return
    }
    if (this.siegeState && this.siegeState.attackerArmyId === this.marchArmy.id && this.siegeState.defenderCityId === this.marchArmy.targetCityId) {
      this.marchArmy.status = 'besieging'
      this.showSiege('攻城态势已恢复，敌我伤亡不会重置。')
      return
    }
    const target = this.campaignCities.find((city) => city.id === this.marchArmy?.targetCityId)
    if (!target || target.owner === this.playerFactionId) {
      this.showCampaignMessage('目标城已非敌城，无需攻城。')
      return
    }
    this.marchArmy.status = 'besieging'
    if (this.alliedFactionIds.has(target.owner)) {
      this.alliedFactionIds.delete(target.owner)
      this.allianceTerms.delete(target.owner)
      this.sabotagedFactionIds.add(target.owner)
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale - 8, 0, 100)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 12, 0, 100)
    }
    this.siegeState = {
      attackerArmyId: this.marchArmy.id,
      defenderCityId: target.id,
      wallHp: target.defense,
      defenderInitialDefense: target.defense,
      defenderTroops: target.troops,
      defenderInitialTroops: target.troops,
      defenderMorale: Phaser.Math.Clamp(42 + Math.floor(target.defense / 3) + Math.floor(target.troops / 900), 28, 88),
      attackerTroops: this.marchArmy.troops,
      actionsRemaining: 1,
      surroundTurns: 0,
      turns: 1,
    }
    this.showSiege()
  }

  private showSiege(message?: string) {
    if (!this.marchArmy || !this.siegeState) {
      this.showCampaignMessage('当前没有攻城战。')
      return
    }
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    this.phase = 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame(`${city.name}攻城`, `${this.campaignClock.year}年${this.campaignClock.month}月  第${this.siegeState.turns}合`, 0.93)

    this.drawPanel(86, 142, 430, 416)
    this.drawSectionTitle(118, 172, '攻城态势')
    const attackerRows: [string, string][] = [
      ['军势', `${cityName(this.marchArmy.sourceCityId)}军`],
      ['主将', this.officerName(this.marchArmy.leaderOfficerId)],
      ['兵力', `${this.siegeState.attackerTroops}`],
      ['粮草', `${this.marchArmy.food}`],
      ['士气', `${this.marchArmy.morale}`],
      ['攻城令', `${this.siegeState.actionsRemaining}`],
      ['围城', `${this.siegeState.surroundTurns}合`],
    ]
    const defenderRows: [string, string][] = [
      ['城池', city.name],
      ['归属', factionById(city.owner)?.name ?? '-'],
      ['城防', `${this.siegeState.wallHp}/${this.siegeState.defenderInitialDefense}`],
      ['守军', `${this.siegeState.defenderTroops}`],
      ['士气', `${this.siegeState.defenderMorale}`],
      ['府库', `${city.gold}`],
      ['存粮', `${city.food}`],
    ]
    this.drawCompactInfoCard(118, 218, 172, 300, '攻方', attackerRows)
    this.drawCompactInfoCard(308, 218, 172, 300, '守方', defenderRows)

    this.drawPanel(558, 142, 636, 416)
    this.drawSectionTitle(590, 172, '攻城命令')
    const actions: [string, string, () => void][] = [
      ['强攻', '高兵损，快速削城防与守军', () => this.confirmSiegeAction('assault')],
      ['围城', '耗粮，低兵损削士气与守军', () => this.confirmSiegeAction('surround')],
      ['火计', '耗情报，烧粮并降城防', () => this.confirmSiegeAction('fire')],
      ['挑战', '武将出阵单挑，胜负影响军心', () => this.confirmSiegeAction('challenge')],
      ['会战', '进入当前会战分支', () => this.confirmSiegeAction('fieldBattle')],
      ['撤退', '撤回远征军，损士气', () => this.confirmSiegeAction('retreat')],
    ]
    actions.forEach(([label, desc, callback], index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = 672 + col * 270
      const y = 250 + row * 90
      this.makeButton(x, y, label, callback, this.overlayLayer, 150, 42)
      this.overlayLayer.add(this.add.text(x - 82, y + 32, desc, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        color: '#ead7b3',
        wordWrap: { width: 230 },
      }))
    })

    if (this.siegeState.actionsRemaining <= 0) {
      this.overlayLayer.add(this.add.text(876, 532, '本月攻城令已尽，可返回行军整备，月令后再战。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#f8df9d',
        wordWrap: { width: 260 },
        align: 'center',
      }).setOrigin(0.5))
    }

    if (message) this.drawToast(message, 610)
    this.makeButton(640, 660, '返回行军', () => this.showCampaign(), this.overlayLayer, 180, 42)
  }

  private drawCompactInfoCard(x: number, y: number, width: number, height: number, title: string, rows: [string, string][]) {
    this.overlayLayer.add(this.add.rectangle(x, y, width, height, 0x21160f, 0.38).setOrigin(0).setStrokeStyle(1, 0x8f6c2b, 0.55))
    this.overlayLayer.add(this.add.text(x + 22, y + 20, title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '23px',
      color: '#f8df9d',
    }))
    const rowGap = rows.length >= 7 ? 31 : 34
    rows.forEach(([label, value], index) => {
      const rowY = y + 68 + index * rowGap
      this.overlayLayer.add(this.add.text(x + 22, rowY, label, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        color: '#d8c092',
      }))
      this.overlayLayer.add(this.add.text(x + 78, rowY, value, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '17px',
        color: '#f8ecd0',
        wordWrap: { width: width - 90 },
      }))
    })
  }

  private confirmSiegeAction(action: SiegeState['lastAction']) {
    if (!this.marchArmy || !this.siegeState || !action) return
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    if (action !== 'retreat' && this.siegeState.actionsRemaining <= 0) {
      this.showSiege('本月攻城令已尽，不能反复攻击。请返回行军整备或执行月令。')
      return
    }
    const config = {
      assault: { command: '强攻', target: `${city.name}城门与守军`, scope: '攻城正面', effect: '城防下降｜敌我均有兵损｜随军粮 -5' },
      surround: { command: '围城', target: `${city.name}守城军粮道`, scope: '城外包围', effect: '推进围城回合｜敌粮与士气下降｜我军粮 -7' },
      fire: { command: '火计', target: `${city.name}城内粮仓`, scope: '敌城营寨', effect: this.campaignClock.weather === 'rain' ? '雨天火势减弱｜消耗情报，成功则烧粮并降城防' : '消耗情报，成功则烧粮并降城防' },
      challenge: { command: '挑战', target: `${city.name}守城主将`, scope: '阵前单挑', effect: '进入单挑，胜负回写攻城士气和兵力' },
      fieldBattle: { command: '会战', target: `${city.name}守城军`, scope: '城外战场', effect: '进入会战分支，结果回写攻城态势' },
      retreat: { command: '撤退', target: cityName(this.marchArmy.sourceCityId), scope: '撤回本城', effect: '远征军撤回，士气下降' },
    }[action]
    this.showCommandConfirm({
      category: '攻城',
      command: config.command,
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target: config.target,
      scope: config.scope,
      effect: config.effect,
      hint: '确认后执行攻城命令',
      onConfirm: () => {
        if (action === 'challenge') this.beginDuelChallenge()
        else if (action === 'fieldBattle') this.showFieldBattlePreparation()
        else this.resolveSiegeAction(action)
      },
      onCancel: () => this.showSiege(),
    })
  }

  private resolveSiegeAction(action: SiegeState['lastAction']) {
    if (!this.marchArmy || !this.siegeState || !action) return
    if (action === 'retreat') {
      this.siegeState.lastAction = 'retreat'
      this.retreatMarchArmy()
      return
    }
    if (action === 'fieldBattle') {
      this.showFieldBattlePreparation()
      return
    }
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    if (this.siegeState.actionsRemaining <= 0) {
      this.showSiege('本月攻城令已尽，不能反复攻击。请返回行军整备或执行月令。')
      return
    }
    this.siegeState.lastAction = action
    this.siegeState.actionsRemaining = Math.max(0, this.siegeState.actionsRemaining - 1)
    let message = ''
    if (action === 'assault') {
      const wallDamage = 10 + Math.floor(this.marchArmy.morale / 18)
      const defenderLoss = 480 + Math.floor(this.marchArmy.troops / 18)
      const attackerLoss = 300 + Math.floor(this.siegeState.defenderTroops / 38)
      this.siegeState.wallHp = Math.max(0, this.siegeState.wallHp - wallDamage)
      this.siegeState.defenderTroops = Math.max(0, this.siegeState.defenderTroops - defenderLoss)
      this.siegeState.attackerTroops = Math.max(0, this.siegeState.attackerTroops - attackerLoss)
      this.marchArmy.troops = this.siegeState.attackerTroops
      this.marchArmy.food = Math.max(0, this.marchArmy.food - 5)
      message = `强攻城门，城防 -${wallDamage}，守军 -${defenderLoss}，我军 -${attackerLoss}。`
    } else if (action === 'surround') {
      this.siegeState.surroundTurns += 1
      const pressure = this.siegeState.surroundTurns
      const foodLoss = Math.min(city.food, 120 + pressure * 46 + Math.floor(this.councilState.intel * 1.5))
      const moraleLoss = 6 + pressure * 2 + (city.food <= 260 ? 4 : 0)
      const defenderLoss = 180 + pressure * 80 + Math.floor(this.councilState.intel * 2) + (city.food <= 260 ? 160 : 0)
      city.food = Math.max(0, city.food - foodLoss)
      this.siegeState.defenderTroops = Math.max(0, this.siegeState.defenderTroops - defenderLoss)
      this.siegeState.defenderMorale = Math.max(0, this.siegeState.defenderMorale - moraleLoss)
      this.marchArmy.food = Math.max(0, this.marchArmy.food - 7)
      this.marchArmy.morale = Math.max(0, this.marchArmy.morale - 1)
      message = `围城第${this.siegeState.surroundTurns}合，敌粮 -${foodLoss}，守军 -${defenderLoss}，守军士气 -${moraleLoss}。`
      const breakoutChance = Math.max(5, Math.floor(this.siegeState.defenderMorale * 0.6 + this.siegeState.defenderTroops / 400 - pressure * 12))
      if (this.siegeState.defenderMorale > 25 && this.siegeState.defenderTroops > 1200 && Phaser.Math.Between(1, 100) <= breakoutChance) {
        const breakoutLoss = Math.floor(this.marchArmy.troops * (0.12 + pressure * 0.03))
        this.siegeState.attackerTroops = Math.max(0, this.siegeState.attackerTroops - breakoutLoss)
        this.marchArmy.troops = this.siegeState.attackerTroops
        this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 8, 0, 100)
        this.siegeState.defenderTroops = Math.max(0, this.siegeState.defenderTroops - Math.floor(breakoutLoss * 0.6))
        this.siegeState.defenderMorale = Math.max(0, this.siegeState.defenderMorale - 10)
        this.persistSiegeDamageToCity()
        message += `\n守军突围！我军措手不及，损兵${breakoutLoss}。`
      }
    } else if (action === 'fire') {
      if (this.councilState.intel < 18) {
        this.marchArmy.food = Math.max(0, this.marchArmy.food - 3)
        message = '情报不足，火计未成，仅耗粮草。'
      } else {
        const weatherScale = this.campaignClock.weather === 'rain' ? 0.55 : this.campaignClock.weather === 'heat' ? 1.18 : 1
        const strategist = this.appointedOfficer('strategist')
        const strategistScale = strategist ? 1 + strategist.intel / 500 : 1
        const wallDamage = Math.max(2, Math.floor((7 + Math.floor(this.councilState.intel / 12)) * weatherScale * strategistScale))
        const foodLoss = Math.floor(city.food * 0.18 * weatherScale * strategistScale)
        this.councilState.intel = Math.max(0, this.councilState.intel - 18)
        this.siegeState.wallHp = Math.max(0, this.siegeState.wallHp - wallDamage)
        city.food = Math.max(120, city.food - foodLoss)
        this.marchArmy.food = Math.max(0, this.marchArmy.food - 4)
        const weatherText = this.campaignClock.weather === 'rain' ? '雨势压住火头，' : this.campaignClock.weather === 'heat' ? '天干助火，' : ''
        message = `${weatherText}火计焚营，城防 -${wallDamage}，敌粮 -${foodLoss}。`
      }
    }
    this.persistSiegeDamageToCity()
    this.siegeState.turns += 1
    if (
      this.siegeState.wallHp <= 0
      || this.siegeState.defenderTroops <= Math.max(500, Math.floor(this.siegeState.defenderInitialTroops * 0.18))
      || (action === 'surround' && this.siegeState.surroundTurns >= 2 && (this.siegeState.defenderMorale <= 12 || city.food <= 0))
    ) {
      this.completeSiegeVictory()
      return
    }
    if (this.marchArmy.food <= 0 || this.siegeState.attackerTroops <= 500) {
      this.completeSiegeFailure('粮尽兵疲，攻城失败。')
      return
    }
    this.showSiege(message)
  }

  private persistSiegeDamageToCity() {
    if (!this.siegeState) return
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    city.troops = Math.max(0, this.siegeState.defenderTroops)
    city.defense = Math.max(0, this.siegeState.wallHp)
    this.syncSelectedCityState()
  }

  private showFieldBattlePreparation() {
    if (!this.marchArmy || !this.siegeState) {
      this.showCampaignMessage('当前没有可进入会战的攻城军。')
      return
    }
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    this.phase = 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('会战布阵', `${city.name}城外  第${this.siegeState.turns}合`, 0.93)

    this.drawPanel(86, 132, 458, 442)
    this.drawSectionTitle(118, 162, '参战诸将')
    const marchArmy = this.marchArmy
    const officers = marchArmy.officerIds
      .map((id) => this.campaignOfficers.find((officer) => officer.id === id))
      .filter((officer): officer is StrategyOfficer => Boolean(officer))
    officers.forEach((officer, index) => {
      const y = 222 + index * 76
      this.overlayLayer.add(this.add.rectangle(118, y - 18, 382, 58, UI.subPanel, 0.62).setOrigin(0).setStrokeStyle(1, UI.borderDim, 0.48))
      this.overlayLayer.add(this.add.text(140, y - 8, officer.name, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '21px',
        color: '#f8df9d',
      }))
      const carriedTroops = marchArmy.officerTroops[officer.id] ?? officerTroops(officer)
      const carriedFood = marchArmy.officerFood[officer.id] ?? 0
      this.overlayLayer.add(this.add.text(140, y + 20, `兵${carriedTroops} 粮${carriedFood} 武${officerWeapons(officer)} 训${officerTraining(officer)} 统${officer.command}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#ead7b3',
      }))
    })
    if (officers.length === 0) {
      this.overlayLayer.add(this.add.text(314, 330, '远征军缺少可参战武将。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
    }

    this.drawPanel(586, 132, 608, 442)
    this.drawSectionTitle(618, 162, '选择阵型')
    ;(Object.entries(fieldBattleFormations) as [FieldBattleFormation, typeof fieldBattleFormations[FieldBattleFormation]][]).forEach(([key, config], index) => {
      const x = 618 + (index % 2) * 252
      const y = 206 + Math.floor(index / 2) * 116
      const selected = this.fieldBattleFormation === key
      this.drawFormationCard(x, y, config.name, config.posture, config.detail, selected, () => {
        this.fieldBattleFormation = key
        this.showFieldBattlePreparation()
      })
    })
    const selectedFormation = fieldBattleFormations[this.fieldBattleFormation]
    const defenderRows: [string, string][] = [
      ['守城', city.name],
      ['城防', `${this.siegeState.wallHp}/${city.defense}`],
      ['守军', `${this.siegeState.defenderTroops}`],
      ['士气', `${this.siegeState.defenderMorale}`],
      ['敌势', `${this.campaignClock.enemyThreat}`],
    ]
    this.drawListViewport(620, 486, 520, 78, '会战预估')
    defenderRows.forEach(([label, value], index) => {
      const x = 646 + (index % 2) * 112
      const y = 514 + Math.floor(index / 2) * 24
      this.overlayLayer.add(this.add.text(x, y, `${label} ${value}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#ead7b3',
      }))
    })
    this.overlayLayer.add(this.add.text(872, 512, selectedFormation.effect, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '15px',
      color: '#f8ecd0',
      wordWrap: { width: 248 },
      lineSpacing: 3,
    }))
    this.makeButton(440, 650, '返回攻城', () => this.showSiege(), this.overlayLayer, 170, 42)
    this.makeButton(640, 650, '确认会战', () => this.confirmFieldBattleStart(), this.overlayLayer, 170, 42)
    this.makeButton(840, 650, '调整阵型', () => this.showFieldBattlePreparation(), this.overlayLayer, 170, 42)
  }

  private drawFormationCard(x: number, y: number, name: string, posture: string, detail: string, selected: boolean, onSelect: () => void) {
    const width = 220
    const height = 102
    this.overlayLayer.add(this.add.rectangle(x, y, width, height, selected ? 0x3c2417 : 0x21160f, selected ? 0.92 : 0.68).setOrigin(0).setStrokeStyle(2, selected ? UI.border : UI.borderDim, selected ? 0.95 : 0.55))
    this.makeButton(x + width / 2, y + 28, selected ? `${name}*` : name, onSelect, this.overlayLayer, 132, 34)
    this.overlayLayer.add(this.add.text(x + 20, y + 54, posture, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '15px',
      color: '#f8ecd0',
      wordWrap: { width: width - 40 },
    }))
    this.overlayLayer.add(this.add.text(x + 20, y + 76, detail, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '14px',
      color: '#ead7b3',
      lineSpacing: 2,
      wordWrap: { width: width - 40 },
    }))
  }

  private confirmFieldBattleStart() {
    if (!this.marchArmy || !this.siegeState) return
    if (this.siegeState.actionsRemaining <= 0) {
      this.showSiege('本月攻城令已尽，不能反复攻击。请返回行军整备或执行月令。')
      return
    }
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    const formation = fieldBattleFormations[this.fieldBattleFormation]
    this.showCommandConfirm({
      category: '攻城',
      command: '会战',
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target: `${city.name}守城军`,
      scope: `${formation.name}｜${formation.posture}`,
      effect: `${formation.effect}｜会战后回写诸将兵损、守军、城防与士气`,
      hint: '确认后进入城外会战',
      onConfirm: () => {
        if (this.siegeState) this.siegeState.actionsRemaining = Math.max(0, this.siegeState.actionsRemaining - 1)
        this.startMarchArmy()
      },
      onCancel: () => this.showFieldBattlePreparation(),
    })
  }

  private beginDuelChallenge() {
    if (!this.marchArmy || !this.siegeState) return
    if (this.siegeState.actionsRemaining <= 0) {
      this.showSiege('本月攻城令已尽，不能反复攻击。请返回行军整备或执行月令。')
      return
    }
    const attacker = this.campaignOfficers.find((officer) => officer.id === this.marchArmy?.leaderOfficerId)
    if (!attacker) {
      this.showSiege('我军主将未列阵，挑战未成。')
      return
    }
    const city = this.campaignCities.find((c) => c.id === this.siegeState?.defenderCityId)
    if (!city) return
    const defenders = this.campaignOfficers
      .filter((officer) => officer.location === city.id && officer.faction === city.owner && this.isOfficerAvailable(officer))
      .sort((a, b) => b.war - a.war)
    if (defenders.length === 0) {
      this.showSiege('城中无可用守将可应战。')
      return
    }
    this.showDuelTargetSelection(attacker, defenders, city)
  }

  private showDuelTargetSelection(attacker: StrategyOfficer, defenders: StrategyOfficer[], city: StrategyCity) {
    this.showSiege()
    this.showModalGrid(
      '挑战：选择对手',
      `${attacker.name}（武${attacker.war}）出阵挑战${city.name}守将`,
      defenders.map((defender) => ({
        label: defender.name,
        detail: `武${defender.war} 兵${officerTroops(defender)}`,
        onSelect: () => this.tryBeginDuel(attacker, defender, city),
      })),
      () => this.showSiege(),
      '取消',
    )
  }

  private tryBeginDuel(attacker: StrategyOfficer, defender: StrategyOfficer, _city: StrategyCity) {
    const refuseChance = attacker.war - defender.war > 20 ? 40 : 10
    if (Phaser.Math.Between(1, 100) <= refuseChance) {
      this.showSiege(`${defender.name}惧${attacker.name}武勇，闭门不应战。`)
      return
    }
    this.siegeState!.lastAction = 'challenge'
    this.siegeState!.actionsRemaining = Math.max(0, this.siegeState!.actionsRemaining - 1)
    this.duelState = {
      attackerOfficerId: attacker.id,
      defenderOfficerId: defender.id,
      attackerHp: 100,
      defenderHp: 100,
      attackerStamina: 72,
      defenderStamina: 72,
      attackerSpirit: 24,
      defenderSpirit: 24,
      round: 1,
      log: [`${attacker.name}拍马出阵，${defender.name}应声迎战。`],
    }
    this.showDuel()
  }

  private showDuel() {
    if (!this.duelState || !this.marchArmy || !this.siegeState) {
      this.showSiege('单挑已经结束。')
      return
    }
    const attacker = this.campaignOfficers.find((officer) => officer.id === this.duelState?.attackerOfficerId)
    const defender = this.campaignOfficers.find((officer) => officer.id === this.duelState?.defenderOfficerId)
    if (!attacker || !defender) return
    this.phase = 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(38, 30, 1204, 696, 0x090d12, 0.94).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(640, 62, '阵前单挑', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '46px',
      color: '#f8df9d',
      stroke: '#26120b',
      strokeThickness: 5,
    }).setOrigin(0.5))
    this.drawDuelantPanel(112, 126, attacker, this.duelState.attackerHp, this.duelState.attackerStamina, this.duelState.attackerSpirit, '攻方')
    this.drawDuelantPanel(748, 126, defender, this.duelState.defenderHp, this.duelState.defenderStamina, this.duelState.defenderSpirit, '守方')
    this.overlayLayer.add(this.add.text(640, 224, '对', {
      fontFamily: 'Georgia, serif',
      fontSize: '56px',
      color: '#c94b3b',
      stroke: '#120909',
      strokeThickness: 4,
    }).setOrigin(0.5))

    const recentLog = this.duelState.log.slice(-4).join('\n')
    this.overlayLayer.add(this.add.rectangle(230, 430, 820, 136, 0x151b22, 0.92).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.8))
    this.overlayLayer.add(this.add.text(258, 454, recentLog, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f7ecd5',
      lineSpacing: 8,
      wordWrap: { width: 770 },
    }))

    if (this.duelState.outcome) {
      const result = this.duelOutcomeText()
      this.overlayLayer.add(this.add.text(640, 604, result, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#fff4cf',
        backgroundColor: '#3c2417',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5))
      this.makeButton(640, 674, '返回攻城', () => this.finishDuelChallenge(), this.overlayLayer, 180, 42)
      return
    }

    this.overlayLayer.add(this.add.rectangle(224, 584, 832, 116, 0x21160f, 0.92).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.72))
    this.overlayLayer.add(this.add.text(640, 604, `第${this.duelState.round}合：选择单挑命令`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    const commands: { key: string; label: string; action: DuelAction; x: number; y: number }[] = [
      { key: 'A', label: '攻击', action: 'attack', x: 438, y: 638 },
      { key: 'G', label: '防御', action: 'guard', x: 640, y: 638 },
      { key: 'E', label: '回避', action: 'evade', x: 842, y: 638 },
      { key: 'F', label: '蓄气', action: 'focus', x: 438, y: 680 },
      { key: 'S', label: '必杀', action: 'special', x: 640, y: 680 },
      { key: 'Q', label: '退却', action: 'retreat', x: 842, y: 680 },
    ]
    commands.forEach((command) => {
      this.makeButton(command.x, command.y, `[${command.key}] ${command.label}`, () => this.resolveDuelRound(command.action), this.overlayLayer, 150, 34, 17)
    })
  }

  private drawDuelantPanel(x: number, y: number, officer: StrategyOfficer, hp: number, stamina: number, spirit: number, camp: string) {
    this.overlayLayer.add(this.add.rectangle(x, y, 420, 280, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(x + 30, y + 28, camp, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#c9b07a',
    }))
    this.overlayLayer.add(this.add.text(x + 30, y + 64, officer.name, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '40px',
      color: '#f8df9d',
    }))
    this.overlayLayer.add(this.add.text(x + 30, y + 120, `${officer.role}  武${officer.war}  统${officer.command}  忠${officer.loyalty}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
    }))
    this.drawMeter(x + 30, y + 160, 330, 16, hp, 100, 0xc94b3b, '体力')
    this.drawMeter(x + 30, y + 202, 330, 16, stamina, 100, 0xd4af37, '气力')
    this.drawMeter(x + 30, y + 244, 330, 16, spirit, 100, 0x5fb3d1, '斗志')
  }

  private drawMeter(x: number, y: number, width: number, height: number, value: number, max: number, color: number, label: string) {
    this.overlayLayer.add(this.add.text(x, y - 24, `${label} ${Math.max(0, Math.floor(value))}/${max}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#ead7b3',
    }))
    this.overlayLayer.add(this.add.rectangle(x, y, width, height, 0x35241a, 0.95).setOrigin(0).setStrokeStyle(1, 0x9f7e3a, 0.65))
    this.overlayLayer.add(this.add.rectangle(x + 2, y + 2, Math.max(0, width - 4) * Phaser.Math.Clamp(value / max, 0, 1), height - 4, color, 0.9).setOrigin(0))
  }

  private resolveDuelRound(action: DuelAction) {
    if (!this.duelState) return
    const attacker = this.campaignOfficers.find((officer) => officer.id === this.duelState?.attackerOfficerId)
    const defender = this.campaignOfficers.find((officer) => officer.id === this.duelState?.defenderOfficerId)
    if (!attacker || !defender) return
    if (action === 'retreat') {
      this.duelState.outcome = 'attackerRetreat'
      this.duelState.log.push(`${attacker.name}拨马退回本阵，单挑中止。`)
      this.applyDuelOutcome()
      this.showDuel()
      return
    }
    if (action === 'special' && (this.duelState.attackerStamina < 55 || this.duelState.attackerSpirit < 45)) {
      this.duelState.log.push('气力或斗志不足，尚不能施展必杀。')
      this.showDuel()
      return
    }
    const defenderAction = this.defenderDuelAction(defender)
    const attackPower = this.duelPower(attacker, action, this.duelState.attackerStamina, this.duelState.attackerSpirit)
    const defensePower = this.duelPower(defender, defenderAction, this.duelState.defenderStamina, this.duelState.defenderSpirit)
    let attackerDamage = Math.max(3, defensePower - Math.floor(attacker.command / 10))
    let defenderDamage = Math.max(3, attackPower - Math.floor(defender.command / 10))

    if (action === 'guard') attackerDamage = Math.floor(attackerDamage * 0.42)
    if (defenderAction === 'guard') defenderDamage = Math.floor(defenderDamage * 0.42)
    if (action === 'focus') defenderDamage = Math.floor(defenderDamage * 0.28)
    if (defenderAction === 'focus') attackerDamage = Math.floor(attackerDamage * 0.28)
    if (action === 'evade') attackerDamage = Math.floor(attackerDamage * this.duelEvadeRate(attacker, this.duelState.attackerStamina))
    if (defenderAction === 'evade') defenderDamage = Math.floor(defenderDamage * this.duelEvadeRate(defender, this.duelState.defenderStamina))
    if (action === 'special') {
      defenderDamage += 12 + Math.floor(attacker.war / 8)
      attackerDamage = Math.floor(attackerDamage * 0.82)
    }
    if (defenderAction === 'special') {
      attackerDamage += 12 + Math.floor(defender.war / 8)
      defenderDamage = Math.floor(defenderDamage * 0.82)
    }

    this.duelState.attackerHp = Math.max(0, this.duelState.attackerHp - attackerDamage)
    this.duelState.defenderHp = Math.max(0, this.duelState.defenderHp - defenderDamage)
    this.duelState.attackerStamina = Phaser.Math.Clamp(this.duelState.attackerStamina + this.duelStaminaDelta(action), 0, 100)
    this.duelState.defenderStamina = Phaser.Math.Clamp(this.duelState.defenderStamina + this.duelStaminaDelta(defenderAction), 0, 100)
    this.duelState.attackerSpirit = Phaser.Math.Clamp(this.duelState.attackerSpirit + this.duelSpiritDelta(action, defenderDamage, attackerDamage), 0, 100)
    this.duelState.defenderSpirit = Phaser.Math.Clamp(this.duelState.defenderSpirit + this.duelSpiritDelta(defenderAction, attackerDamage, defenderDamage), 0, 100)
    this.duelState.log.push(`${duelActionName(action)}对${duelActionName(defenderAction)}：${attacker.name}受${attackerDamage}，${defender.name}受${defenderDamage}。`)

    if (this.duelState.defenderHp <= 0 && this.duelState.attackerHp <= 0) {
      this.duelState.outcome = 'draw'
      this.applyDuelOutcome()
    } else if (this.duelState.defenderHp <= 0) {
      this.duelState.outcome = 'attackerWin'
      this.applyDuelOutcome()
    } else if (this.duelState.attackerHp <= 0) {
      this.duelState.outcome = 'defenderWin'
      this.applyDuelOutcome()
    } else if (this.duelState.round >= 5) {
      this.duelState.outcome = this.duelState.attackerHp === this.duelState.defenderHp ? 'draw' : this.duelState.attackerHp > this.duelState.defenderHp ? 'attackerWin' : 'defenderWin'
      this.applyDuelOutcome()
    } else {
      this.duelState.round += 1
    }
    this.showDuel()
  }

  private defenderDuelAction(officer: StrategyOfficer): DuelAction {
    if (!this.duelState) return 'attack'
    if (this.duelState.defenderHp < 34) return 'guard'
    if (this.duelState.defenderStamina >= 58 && this.duelState.defenderSpirit >= 48 && (officer.war >= 84 || this.duelState.attackerHp < 46)) return 'special'
    if (this.duelState.defenderStamina < 30 || this.duelState.defenderSpirit < 32) return 'focus'
    if (this.duelState.attackerSpirit >= 54 && this.duelState.defenderStamina >= 42) return 'evade'
    return officer.war >= 86 || this.duelState.attackerHp < 42 ? 'attack' : 'guard'
  }

  private duelPower(officer: StrategyOfficer, action: DuelAction, stamina: number, spirit: number) {
    if (action === 'focus' || action === 'retreat') return Math.max(4, Math.floor(officer.war / 9))
    const base = action === 'special' ? 22 : action === 'attack' ? 13 : action === 'evade' ? 5 : 7
    return base + Math.floor(officer.war / 7) + Math.floor(officer.command / 18) + Math.floor(stamina / 18) + Math.floor(spirit / 22)
  }

  private duelEvadeRate(officer: StrategyOfficer, stamina: number) {
    const evadeScore = officer.command + stamina
    if (evadeScore >= 150) return 0.18
    if (evadeScore >= 118) return 0.34
    return 0.58
  }

  private duelStaminaDelta(action: DuelAction) {
    return {
      attack: -12,
      guard: 8,
      evade: -8,
      focus: 24,
      special: -34,
      retreat: 0,
    }[action]
  }

  private duelSpiritDelta(action: DuelAction, dealt: number, taken: number) {
    const exchange = Math.floor((dealt - taken) / 5)
    const base = {
      attack: 8,
      guard: 4,
      evade: 6,
      focus: 15,
      special: -28,
      retreat: 0,
    }[action]
    return base + exchange
  }

  private applyDuelOutcome() {
    if (!this.duelState || !this.marchArmy || !this.siegeState) return
    const attacker = this.campaignOfficers.find((officer) => officer.id === this.duelState?.attackerOfficerId)
    const defender = this.campaignOfficers.find((officer) => officer.id === this.duelState?.defenderOfficerId)
    if (!attacker || !defender) return
    if (this.duelState.outcome === 'attackerWin') {
      const defenderLoss = 420 + attacker.war * 8
      this.siegeState.defenderTroops = Math.max(0, this.siegeState.defenderTroops - defenderLoss)
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + 8, 0, 100)
      this.addOfficerMerit(attacker, 18)
      const roll = Phaser.Math.Between(1, 100)
      const sourceCity = this.campaignCities.find((c) => c.id === this.marchArmy?.sourceCityId)
      if (roll <= 30 && sourceCity) {
        this.captureOfficer(defender, this.marchArmy.factionId, sourceCity.id)
        this.duelState.log.push(`${defender.name}力竭被擒，押送${sourceCity.name}。守军震动，损兵${defenderLoss}。`)
      } else if (roll <= 40) {
        this.retireOfficer(defender)
        this.duelState.log.push(`${defender.name}重伤退阵，短期难以再战。守军震动，损兵${defenderLoss}。`)
      } else {
        this.woundOfficer(defender, 2)
        this.duelState.log.push(`${defender.name}败退伤疲，守军震动，损兵${defenderLoss}。`)
      }
    } else if (this.duelState.outcome === 'defenderWin') {
      const attackerLoss = 320 + defender.war * 6
      this.siegeState.attackerTroops = Math.max(0, this.siegeState.attackerTroops - attackerLoss)
      this.marchArmy.troops = this.siegeState.attackerTroops
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 10, 0, 100)
      this.addOfficerMerit(defender, 16)
      const city = this.campaignCities.find((c) => c.id === this.siegeState?.defenderCityId)
      const roll = Phaser.Math.Between(1, 100)
      if (roll <= 20 && city) {
        this.captureOfficer(attacker, city.owner, city.id)
        this.duelState.log.push(`${attacker.name}力竭被擒，押入${city.name}。我军损兵${attackerLoss}。`)
      } else if (roll <= 28) {
        this.retireOfficer(attacker)
        this.duelState.log.push(`${attacker.name}重伤退阵，短期难以再战。我军损兵${attackerLoss}。`)
      } else {
        this.woundOfficer(attacker, 2)
        this.duelState.log.push(`${attacker.name}失利伤疲退阵，我军损兵${attackerLoss}。`)
      }
    } else if (this.duelState.outcome === 'attackerRetreat') {
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 4, 0, 100)
      this.duelState.log.push('我军退回攻城阵地，士气小挫。')
    } else {
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 2, 0, 100)
      if (this.duelState.attackerHp <= 30) this.woundOfficer(attacker, 1)
      if (this.duelState.defenderHp <= 30) this.woundOfficer(defender, 1)
      this.addOfficerMerit(attacker, 5)
      this.addOfficerMerit(defender, 5)
      this.duelState.log.push('两将难分胜负，各自收兵。')
    }
    this.persistSiegeDamageToCity()
    this.siegeState.turns += 1
  }

  private duelOutcomeText() {
    if (!this.duelState) return '单挑结束。'
    if (this.duelState.outcome === 'attackerWin') return '我将得胜，敌军军心动摇。'
    if (this.duelState.outcome === 'defenderWin') return '守将得势，我军士气受挫。'
    if (this.duelState.outcome === 'attackerRetreat') return '我军退回本阵，攻城仍可继续。'
    return '两军鸣金，单挑不分胜负。'
  }

  private finishDuelChallenge() {
    const message = this.duelOutcomeText()
    this.duelState = undefined
    if (!this.marchArmy || !this.siegeState) {
      this.showCampaign()
      return
    }
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (city && (this.siegeState.wallHp <= 0 || this.siegeState.defenderTroops <= Math.max(500, Math.floor(this.siegeState.defenderInitialTroops * 0.18)))) {
      this.completeSiegeVictory()
      return
    }
    if (this.marchArmy.food <= 0 || this.siegeState.attackerTroops <= 500) {
      this.completeSiegeFailure('单挑失利，军势难支，攻城失败。')
      return
    }
    this.showSiege(message)
  }

  private completeSiegeVictory() {
    if (!this.marchArmy || !this.siegeState) return
    const victorFactionId = this.marchArmy.factionId
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    const source = this.campaignCities.find((item) => item.id === this.marchArmy?.sourceCityId)
    if (!city || !source) return
    const oldOwnerId = city.owner
    const oldOwner = factionById(oldOwnerId)?.name ?? '敌军'
    const victor = factionById(victorFactionId)
    const seizedGold = Math.floor(city.gold * 0.18)
    const seizedFood = Math.floor(city.food * 0.18)
    const prisonerLines = this.captureDefeatedOfficers(city, oldOwnerId, victorFactionId)
    city.owner = victorFactionId
    city.troops = Math.max(600, Math.floor(this.siegeState.attackerTroops * 0.35))
    city.defense = Math.max(18, Math.floor(this.siegeState.wallHp * 0.75))
    city.gold = Math.max(120, city.gold - seizedGold)
    city.food = Math.max(160, city.food - seizedFood)
    source.gold = Math.min(3000, source.gold + seizedGold)
    source.food = Math.min(5000, source.food + seizedFood)
    this.recordMonthlyAction(`攻取${city.name}`)
    this.releaseMarchArmyOfficers(city.id)
    this.marchArmy = undefined
    this.siegeState = undefined
    this.syncSelectedCityState()
    const settlement = this.resolveStrategicSettlement(oldOwnerId)
    if (settlement.victory) {
      this.showCampaignVictory(city, seizedGold, seizedFood, settlement.lines)
      return
    }
    this.showSiegeAftermath(city, {
      oldOwner,
      victorName: victor?.name ?? '我军',
      seizedGold,
      seizedFood,
      settlementLines: settlement.lines,
      prisonerLines,
    })
  }

  private captureDefeatedOfficers(city: StrategyCity, defeatedFactionId: FactionId, captorFactionId: FactionId) {
    const pressure = this.siegeState
      ? (this.siegeState.wallHp <= 0 ? 2 : 1) + (this.siegeState.defenderTroops <= Math.floor(this.siegeState.defenderInitialTroops * 0.35) ? 1 : 0)
      : 1
    const captives = this.campaignOfficers
      .filter((officer) => officer.location === city.id && officer.faction === defeatedFactionId && this.isOfficerAvailable(officer))
      .toSorted((a, b) => b.command + b.war - (a.command + a.war))
      .slice(0, Math.min(2, pressure))
    captives.forEach((officer) => {
      officer.status = 'captured'
      officer.statusTurns = 0
      officer.captorFactionId = captorFactionId
      officer.location = city.id
    })
    return captives.length > 0
      ? captives.map((officer) => `${officer.name}被俘，暂押${city.name}。`)
      : ['敌将趁乱逃散，未获俘虏。']
  }

  private showSiegeAftermath(city: StrategyCity, report: { oldOwner: string; victorName: string; seizedGold: number; seizedFood: number; settlementLines: string[]; prisonerLines: string[] }) {
    this.phase = 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('战后处置', `${this.campaignClock.year}年${this.campaignClock.month}月  ${city.name}入城`, 0.93)
    this.drawPanel(112, 136, 450, 430)
    this.drawSectionTitle(148, 172, '攻城结果')
    const resultRows: [string, string][] = [
      ['城池', `${city.name}（${city.region}）`],
      ['原属', report.oldOwner],
      ['现属', report.victorName],
      ['留守兵', `${city.troops}`],
      ['城防', `${city.defense}`],
      ['缴获', `金${report.seizedGold}｜粮${report.seizedFood}`],
    ]
    resultRows.forEach(([label, value], index) => {
      const y = 224 + index * 46
      this.overlayLayer.add(this.add.text(154, y, label, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#d8c092',
      }))
      this.overlayLayer.add(this.add.text(244, y, value, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8ecd0',
        wordWrap: { width: 260 },
      }))
    })

    this.drawPanel(612, 136, 556, 430)
    this.drawSectionTitle(648, 172, '天下形势')
    const lines = report.settlementLines.length > 0
      ? report.settlementLines
      : [`${city.name}已纳入版图。`]
    this.drawListViewport(650, 222, 478, 184)
    this.overlayLayer.add(this.add.text(680, 252, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
      lineSpacing: 10,
      wordWrap: { width: 420 },
    }))
    this.drawListViewport(650, 426, 478, 92, '战后待办')
    this.overlayLayer.add(this.add.text(680, 454, report.prisonerLines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#ead7b3',
      lineSpacing: 4,
      wordWrap: { width: 420 },
    }))

    this.makeButton(412, 636, '入城整编', () => this.enterCapturedCity(city.id), this.overlayLayer, 170, 42)
    this.makeButton(640, 636, '俘虏处置', () => this.showPrisonerDisposition(city.id), this.overlayLayer, 170, 42)
    this.makeButton(868, 636, '返回版图', () => {
      this.selectedCityId = city.id
      this.focusedCityId = city.id
      this.syncSelectedCityState()
      this.showCampaign()
    }, this.overlayLayer, 170, 42)
  }

  private showPrisonerDisposition(cityId: CityId) {
    const city = this.campaignCities.find((item) => item.id === cityId)
    if (!city) {
      this.showCampaign()
      return
    }
    const prisoners = this.campaignOfficers.filter((officer) => officer.status === 'captured' && officer.captorFactionId === this.playerFactionId && officer.location === cityId)
    this.phase = 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('俘虏处置', `${city.name}  战后军府`, 0.93)
    this.drawPanel(150, 146, 980, 414)
    this.drawSectionTitle(190, 182, '被俘武将')
    if (prisoners.length === 0) {
      this.overlayLayer.add(this.add.text(640, 344, '当前没有押在本城的俘虏。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '24px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
    }
    prisoners.slice(0, 6).forEach((officer, index) => {
      const x = 204 + (index % 2) * 456
      const y = 236 + Math.floor(index / 2) * 94
      this.overlayLayer.add(this.add.rectangle(x, y, 392, 70, UI.subPanel, 0.7).setOrigin(0).setStrokeStyle(1, UI.borderDim, 0.55))
      this.overlayLayer.add(this.add.text(x + 24, y + 14, officer.name, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(x + 24, y + 42, `${factionById(officer.faction)?.name ?? '敌军'}｜武${officer.war} 智${officer.intel} 统${officer.command} 忠${officer.loyalty}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#ead7b3',
      }))
    })
    const first = prisoners[0]
    this.makeButton(376, 636, '登用首俘', () => first ? this.recruitPrisoner(first.id, city.id) : this.showPrisonerDisposition(city.id), this.overlayLayer, 170, 42)
    this.makeButton(640, 636, '释放首俘', () => first ? this.releasePrisoner(first.id, city.id) : this.showPrisonerDisposition(city.id), this.overlayLayer, 170, 42)
    this.makeButton(904, 636, '返回战后', () => this.showCampaign(), this.overlayLayer, 170, 42)
  }

  private recruitPrisoner(officerId: string, cityId: CityId) {
    const officer = this.campaignOfficers.find((item) => item.id === officerId)
    const city = this.campaignCities.find((item) => item.id === cityId)
    if (!officer || !city) return
    officer.faction = this.playerFactionId
    officer.location = cityId
    officer.status = 'normal'
    officer.statusTurns = 0
    officer.captorFactionId = undefined
    officer.loyalty = Phaser.Math.Clamp(Math.max(48, Math.floor((officer.loyalty + this.councilState.morale + this.cityPublicOrder(this.campaignCities.find((c) => c.id === cityId))) / 3)), 35, 82)
    this.recordMonthlyAction(`${city.name}登用俘将${officer.name}`)
    this.showCampaignMessage(`${officer.name}愿暂归${this.playerFaction.name}，留驻${city.name}。`)
  }

  private releasePrisoner(officerId: string, cityId: CityId) {
    const officer = this.campaignOfficers.find((item) => item.id === officerId)
    const city = this.campaignCities.find((item) => item.id === cityId)
    if (!officer || !city) return
    officer.status = 'normal'
    officer.statusTurns = 0
    officer.captorFactionId = undefined
    officer.faction = 'neutral'
    officer.location = cityId
    officer.loyalty = Phaser.Math.Clamp(officer.loyalty + 6, 0, 100)
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 2, 0, 100)
    this.recordMonthlyAction(`${city.name}释放俘将${officer.name}`)
    this.showCampaignMessage(`${officer.name}获释归乡，军中称仁，士气 +2。`)
  }

  private enterCapturedCity(cityId: CityId) {
    this.selectedCityId = cityId
    this.focusedCityId = cityId
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 3, 0, 100)
    this.syncSelectedCityState()
    this.showCampaignMessage(`${cityName(cityId)}战后整编完成，士气 +3。`)
  }

  private completeSiegeFailure(message: string) {
    if (!this.marchArmy || !this.siegeState) return
    const source = this.campaignCities.find((item) => item.id === this.marchArmy?.sourceCityId)
    const targetCityId = this.siegeState.defenderCityId
    const survivors = Math.max(0, this.marchArmy.troops)
    const garrisonLoss = Math.floor(survivors * 0.12)
    if (source) source.troops = Math.max(500, source.troops - garrisonLoss)
    this.recordMonthlyAction(`攻${cityName(this.siegeState.defenderCityId)}失利`)
    this.releaseMarchArmyOfficers(this.marchArmy.sourceCityId)
    this.marchArmy = undefined
    this.siegeState = undefined
    this.councilState.morale = Math.max(0, this.councilState.morale - 6)
    this.showSiegeFailureAftermath({
      message,
      source,
      targetName: cityName(targetCityId),
      survivors,
      garrisonLoss,
    })
  }

  private showSiegeFailureAftermath(report: { message: string; source?: StrategyCity; targetName: string; survivors: number; garrisonLoss: number }) {
    this.phase = 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('攻城失利', `${this.campaignClock.year}年${this.campaignClock.month}月  ${report.targetName}城下`, 0.93)
    this.addLayeredPanel(640, 388, 760, 386)
    this.overlayLayer.add(this.add.text(640, 244, '溃退报告', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '46px',
      color: '#ffb3b3',
      stroke: '#2a120c',
      strokeThickness: 5,
    }).setOrigin(0.5))
    const sourceName = report.source?.name ?? '本城'
    const lines = [
      report.message,
      `残军退回：${sourceName}`,
      `归队残兵：${report.survivors}`,
      `本城接应损耗：兵 -${report.garrisonLoss}`,
      '全军士气 -6，远征军解散，诸将回城待命。',
    ]
    this.overlayLayer.add(this.add.text(640, 376, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f7ecd5',
      align: 'center',
      lineSpacing: 12,
      wordWrap: { width: 640 },
    }).setOrigin(0.5))
    this.makeButton(540, 546, '回到本城', () => {
      if (report.source) {
        this.selectedCityId = report.source.id
        this.focusedCityId = report.source.id
        this.syncSelectedCityState()
      }
      this.showCampaign()
    }, this.overlayLayer, 170, 42)
    this.makeButton(740, 546, '月令', () => this.advanceCampaignMonth(), this.overlayLayer, 150, 42)
  }

  private resolveStrategicSettlement(defeatedCandidateId: FactionId): StrategicSettlement {
    const lines: string[] = []
    if (defeatedCandidateId !== this.playerFactionId && this.countCities(defeatedCandidateId) === 0) {
      const defeated = factionById(defeatedCandidateId)
      this.alliedFactionIds.delete(defeatedCandidateId)
      this.allianceTerms.delete(defeatedCandidateId)
      this.diplomacyDebts.delete(defeatedCandidateId)
      this.sabotagedFactionIds.delete(defeatedCandidateId)
      lines.push(`${defeated?.name ?? '敌势力'}失去根据地，势力灭亡。`)
      this.recordMonthlyAction(`${defeated?.name ?? '敌势力'}灭亡`)
    }
    const controlled = this.countCities(this.playerFactionId)
    const total = this.campaignCities.length
    const remaining = total - controlled
    if (remaining <= 0) {
      lines.push(`${this.playerFaction.name}尽有${total}城，统一达成。`)
      this.recordMonthlyAction('统一天下')
      return { lines, victory: true }
    }
    lines.push(`统一进度：${this.playerFaction.name} ${controlled}/${total} 城，尚余 ${remaining} 城。`)
    return { lines, victory: false }
  }

  private showCampaignVictory(city: StrategyCity, seizedGold: number, seizedFood: number, lines: string[]) {
    this.phase = 'result'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.addLayeredPanel(640, 390, 760, 390)
    this.overlayLayer.add(this.add.text(640, 254, '统一达成', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '54px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 5,
    }).setOrigin(0.5))
    const copy = [
      `${city.name}归入${this.playerFaction.name}，最后的割据据点已平定。`,
      `本战缴获：金${seizedGold}｜粮${seizedFood}`,
      ...lines,
      `${this.campaignClock.year}年${this.campaignClock.month}月，天下诸城归于一统。`,
    ].join('\n')
    this.overlayLayer.add(this.add.text(640, 386, copy, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f7ecd5',
      align: 'center',
      lineSpacing: 12,
      wordWrap: { width: 650 },
    }).setOrigin(0.5))
    this.makeButton(548, 550, '查看版图', () => this.showCampaign(), this.overlayLayer, 170, 42)
    this.makeButton(748, 550, '回到标题', () => this.showTitle(), this.overlayLayer, 170, 42)
  }

  private showDomesticCommand() {
    this.showCommandPanel('内政', [
      ['开发', () => this.showCityPolicyActorSelection('内政', '开发', '本城田亩', '兴修水利，田亩渐丰，城池存粮增加。', '金 -130｜粮 +260｜土地 +4｜水利 +5｜灾害 -4｜民心 +2', { treasury: -130, farms: 1, publicOrder: 2, food: 260, land: 4, irrigation: 5, disaster: -4 }, true)],
      ['调动', () => this.showMoveActorSelection()],
      ['情报', () => this.showIntelActorSelection('内政')],
      ['福利', () => this.showCityPolicyActorSelection('内政', '福利', '本城百姓', '赈济百姓，民心上升。', '金 -120｜人口 +420｜民心 +6｜灾害 -3｜士气 +2', { treasury: -120, population: 420, publicOrder: 6, disaster: -3, morale: 2 }, true)],
      ['任命', () => this.showAppointmentActorSelection()],
      ['税率', () => this.showTaxActorSelection()],
      ['教育', () => this.showEducationActorSelection()],
      ['运输', () => this.showTransportActorSelection()],
    ])
  }

  private showMilitaryCommand() {
    this.showCommandPanel('军事', [
      ['征兵', () => this.showMilitaryActorSelection('recruit')],
      ['武器', () => this.showMilitaryActorSelection('weapon')],
      ['情报', () => this.showIntelActorSelection('军事')],
      ['人材', () => this.showTalentActorSelection()],
      ['防卫', () => this.showCityPolicyActorSelection('军事', '防卫', '本城城防', '修缮城垣箭楼，城防上升。', '金 -140｜城防 +8｜商业 +1', { treasury: -140, walls: 8, commerce: 1 }, true)],
      ['训练', () => this.showMilitaryActorSelection('training')],
      ['出征', () => this.showDeploymentActorSelection()],
    ])
  }

  private showMilitaryActorSelection(kind: MilitaryAllocationKind) {
    const meta = militaryAllocationMeta(kind)
    const cities = this.controlledCities().filter((city) => this.officersInCity(city.id).length > 0)
    this.showCampaign()
    this.showModalGrid(
      `军事｜${meta.command}：选择发起城`,
      '军事命令先确定军府所在城，再选择本城武将或全军作为目标。',
      cities.map((city) => {
      const officers = this.officersInCity(city.id)
        return {
          label: city.name,
          detail: `武将${officers.length}｜金${city.gold} 兵${city.troops}`,
          onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        this.showMilitaryOfficerSelection(kind, city)
          },
        }
      }),
      () => {
      this.showCampaign()
      this.showMilitaryCommand()
      },
    )
  }

  private showMilitaryOfficerSelection(kind: MilitaryAllocationKind, actorCity = this.selectedCity) {
    const city = actorCity
    if (!city) return
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    const officers = this.officersInCity(city.id)
    if (officers.length === 0) {
      this.showCampaignMessage('本城没有可分配军令的武将。')
      return
    }
    this.showCampaign()
    const meta = militaryAllocationMeta(kind)
    this.addLayeredPanel(MODAL.x, MODAL.y, MODAL.width, MODAL.height)
    const { left, top } = this.drawModalTitle(`军事｜${meta.command}：选择对象`, `${city.name}${meta.actor}发起，选择本城武将作为目标`)
    if (kind === 'recruit') {
      const scales: RecruitScale[] = ['small', 'medium', 'large']
      scales.forEach((scale, index) => {
        const config = recruitScaleConfig(scale)
        this.makeModalOptionButton(this.modalGridPosition(index, left, top).x, top + 162, this.recruitScale === scale ? `${config.label}✓` : config.label, () => {
          this.recruitScale = scale
          this.showMilitaryOfficerSelection(kind, city)
        }, 142)
      })
    } else if (kind === 'training') {
      const modes: [TrainingMode, string][] = [['single', '单将训练'], ['all', '全军操练']]
      modes.forEach(([mode, label], index) => {
        this.makeModalOptionButton(this.modalGridPosition(index, left, top).x, top + 162, this.trainingMode === mode ? `${label}✓` : label, () => {
          this.trainingMode = mode
          this.showMilitaryOfficerSelection(kind, city)
        }, 150)
      })
      if (this.trainingMode === 'all') {
        this.makeModalOptionButton(640, top + 248, '确认全军操练', () => this.confirmTrainingAll(city), 190)
        this.overlayLayer.add(this.add.text(640, top + 296, '目标：本城所有可战武将｜金 -180｜全员训练 +6｜士气 +4', {
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontSize: '18px',
          color: '#f7ecd5',
        }).setOrigin(0.5))
        this.makeModalActionButton(this.modalActionX(0, 2), top + MODAL.actionOffsetY, '重选发起城', () => this.showMilitaryActorSelection(kind))
        this.makeModalActionButton(this.modalActionX(1, 2), top + MODAL.actionOffsetY, '取消', () => this.showCampaign())
        return
      }
    }
    officers.forEach((officer, index) => {
      const { x, y: gridY } = this.modalGridPosition(index, left, top)
      const y = (kind === 'recruit' || kind === 'training' ? top + 258 : gridY)
        + Math.floor(index / 3) * (kind === 'recruit' || kind === 'training' ? MODAL.rowHeight : 0)
      this.makeModalOptionButton(x, y, officer.name, () => this.confirmMilitaryAllocation(kind, officer, city))
      this.overlayLayer.add(this.add.text(x, y + 35, `兵${officerTroops(officer)} 武${officerWeapons(officer)} 训${officerTraining(officer)}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#ead7b3',
      }).setOrigin(0.5))
    })
    this.makeModalActionButton(this.modalActionX(0, 2), top + MODAL.actionOffsetY, '重选发起城', () => this.showMilitaryActorSelection(kind))
    this.makeModalActionButton(this.modalActionX(1, 2), top + MODAL.actionOffsetY, '取消', () => this.showCampaign())
  }

  private confirmMilitaryAllocation(kind: MilitaryAllocationKind, officer: StrategyOfficer, actorCity: StrategyCity) {
    const city = actorCity
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    const meta = militaryAllocationMeta(kind)
    this.showCommandConfirm({
      category: '军事',
      command: meta.command,
      actor: `${city.name}${meta.actor}`,
      target: officer.name,
      scope: `${city.name}本城武将`,
      effect: meta.effect(officer, kind === 'recruit' ? this.recruitScale : undefined),
      hint: '确认后执行军事分配',
      onConfirm: () => this.executeMilitaryAllocation(kind, officer, city),
      onCancel: () => this.showMilitaryOfficerSelection(kind, city),
    })
  }

  private confirmTrainingAll(actorCity: StrategyCity) {
    const city = actorCity
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    const officers = this.deployableOfficersInCity(city.id)
    if (officers.length === 0) {
      this.showCampaignMessage('本城没有可训练的武将。')
      return
    }
    this.showCommandConfirm({
      category: '军事',
      command: '训练',
      actor: `${city.name}校场`,
      target: '本城全军',
      scope: `${city.name}可战武将`,
      effect: `金 -180｜${officers.map((officer) => officer.name).join('、')}训练 +6｜士气 +4`,
      hint: '确认后执行全军操练',
      onConfirm: () => this.executeTrainingAll(city),
      onCancel: () => this.showMilitaryOfficerSelection('training', city),
    })
  }

  private executeTrainingAll(actorCity: StrategyCity) {
    const city = actorCity
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    const officers = this.deployableOfficersInCity(city.id)
    if (this.councilState.actions <= 0) {
      this.showCampaignMessage('本月政令已用尽，无法训练。')
      return
    }
    if (city.gold < 180) {
      this.showCampaignMessage('府库不足，无法全军操练。')
      return
    }
    city.gold = Math.max(0, city.gold - 180)
    officers.forEach((officer) => {
      officer.training = Math.min(100, officerTraining(officer) + 6)
      this.addOfficerMerit(officer, 4)
      this.addOfficerFatigue(officer, 8)
    })
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 4, 0, 100)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}全军操练`)
    this.syncSelectedCityState()
    this.showCampaignMessage(`${city.name}全军操练完成，诸将训练提升。`)
  }

  private executeMilitaryAllocation(kind: MilitaryAllocationKind, officer: StrategyOfficer, actorCity: StrategyCity) {
    const city = actorCity
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    if (this.councilState.actions <= 0) {
      this.showCampaignMessage('本月政令已用尽，无法执行军事命令。')
      return
    }
    const meta = militaryAllocationMeta(kind)
    const goldCost = kind === 'recruit' ? recruitScaleConfig(this.recruitScale).goldCost : meta.goldCost
    if (city.gold < goldCost) {
      this.showCampaignMessage('府库不足，无法执行军事命令。')
      return
    }
    city.gold = Math.max(0, city.gold - goldCost)
    if (kind === 'recruit') {
      const scale = recruitScaleConfig(this.recruitScale)
      const bonus = this.cityGovernanceBonus(city.id)
      const adjustedTroops = Math.floor(scale.troops * bonus.recruitMultiplier)
      const adjustedPublicOrderCost = Math.max(1, Math.floor(scale.publicOrderCost * bonus.recruitPublicOrderCost))
      officer.troops = Math.min(6000, officerTroops(officer) + adjustedTroops)
      city.troops = Math.min(30000, city.troops + adjustedTroops)
      this.setCityPublicOrder(city, this.cityPublicOrder(city) - adjustedPublicOrderCost)
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + scale.moraleGain, 0, 100)
      this.addOfficerMerit(officer, Math.floor(adjustedTroops / 120))
      this.addOfficerFatigue(officer, adjustedPublicOrderCost + 4)
    } else if (kind === 'weapon') {
      this.improveOfficerEquipment(officer)
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 2, 0, 100)
      this.addOfficerMerit(officer, 5)
      this.addOfficerFatigue(officer, 3)
    } else {
      officer.training = Math.min(100, officerTraining(officer) + 12)
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 3, 0, 100)
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 2, 0, 100)
      this.addOfficerMerit(officer, 6)
      this.addOfficerFatigue(officer, 10)
    }
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}${meta.command}${officer.name}`)
    this.syncSelectedCityState()
    this.showCampaignMessage(`${officer.name}${meta.resultText(officer)}。`)
  }

  private improveOfficerEquipment(officer: StrategyOfficer) {
    const equipment = officerEquipment(officer)
    const priorities: (keyof OfficerEquipment)[] = officer.war >= officer.command && officer.war >= officer.intel
      ? ['spear', 'armor', 'horse', 'bow']
      : officer.command >= officer.intel
        ? ['horse', 'spear', 'armor', 'bow']
        : ['bow', 'armor', 'spear', 'horse']
    const target = priorities
      .filter((key) => equipment[key] < 5)
      .toSorted((a, b) => equipment[a] - equipment[b])[0] ?? 'spear'
    const next = Math.min(5, equipment[target] + 1)
    if (target === 'spear') officer.spear = next
    if (target === 'bow') officer.bow = next
    if (target === 'horse') officer.horse = next
    if (target === 'armor') officer.armor = next
    const upgraded = officerEquipment(officer)
    officer.weapons = Math.min(5, Math.max(officerWeapons(officer) + 1, upgraded.spear, upgraded.bow, upgraded.horse, upgraded.armor))
  }

  private showPersonnelCommand() {
    this.showCommandPanel('人事', [
      ['详表', () => this.showOfficerDetail(this.inspectionOfficerId ?? this.campaignOfficers.find((officer) => officer.faction === this.playerFactionId)?.id)],
      ['搜索', () => this.showTalentActorSelection()],
      ['登用', () => this.showTalentActorSelection()],
      ['赏赐', () => this.showHeroManagement()],
      ['移动', () => this.showMoveActorSelection()],
      ['俘虏', () => this.showPrisonerDisposition(this.selectedCityId)],
    ])
  }

  private showSystemCommand() {
    this.showCommandPanel('机能', [
      ['势力', () => this.showFactionOverview()],
      ['保存', () => {
        const saved = this.saveCampaign()
        this.showCampaignMessage(saved ? '存档成功。' : '存档失败。')
      }],
      ['读取', () => this.showContinueStub()],
      ['环境', () => this.showSettingsOverlay()],
      ['标题', () => this.showTitle()],
    ])
  }

  private addLayeredPanel(x: number, y: number, width: number, height: number, layer = this.overlayLayer) {
    const effectiveHeight = y >= 390 && y <= 424 && height >= 300 ? Math.max(height, 470) : height
    const veil = this.add.rectangle(640, 380, CANVAS_W, CANVAS_H, UI.shadow, 0.68)
    const shadow = this.add.rectangle(x + 10, y + 12, width, effectiveHeight, 0x000000, 0.34)
    const panel = this.add.rectangle(x, y, width, effectiveHeight, UI.panel, 0.978).setStrokeStyle(3, UI.border, 0.92)
    const topShade = this.add.rectangle(x, y - effectiveHeight / 2 + 26, width - 52, 30, 0x2a1b12, 0)
    layer.add([veil, shadow, panel, topShade])
    return { veil, shadow, panel, topShade }
  }

  private modalTop(height: number = MODAL.height, y: number = MODAL.y) {
    return y - Math.max(height, MODAL.height) / 2
  }

  private modalLeft(width: number = MODAL.width, x: number = MODAL.x) {
    return x - width / 2
  }

  private drawModalTitle(title: string, subtitle?: string, width: number = MODAL.width, height: number = MODAL.height, x: number = MODAL.x, y: number = MODAL.y) {
    const left = this.modalLeft(width, x)
    const top = this.modalTop(height, y)
    const heading = this.add.text(left + MODAL.insetX, top + MODAL.titleOffsetY, title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f8df9d',
    })
    this.overlayLayer.add(heading)
    const nodes: Phaser.GameObjects.GameObject[] = [heading]
    if (subtitle) {
      const helper = this.add.text(left + MODAL.insetX + 18, top + MODAL.helperOffsetY, subtitle, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#ead7b3',
        wordWrap: { width: width - MODAL.insetX * 2 - 36 },
      })
      this.overlayLayer.add(helper)
      nodes.push(helper)
    }
    return { left, top, nodes }
  }

  private modalGridPosition(index: number, left = this.modalLeft(), top = this.modalTop()) {
    const col = index % 3
    const row = Math.floor(index / 3)
    return {
      x: left + MODAL.insetX + MODAL.optionWidth / 2 + col * MODAL.colWidth,
      y: top + MODAL.gridOffsetY + row * MODAL.rowHeight,
    }
  }

  private modalActionX(index: number, total: number) {
    const step = MODAL.actionWidth + MODAL.actionGap
    return MODAL.x - ((total - 1) * step) / 2 + index * step
  }

  private makeModalOptionButton(x: number, y: number, label: string, callback: () => void, width: number = MODAL.optionWidth) {
    return this.makeButton(x, y, label, callback, this.overlayLayer, width, MODAL.optionHeight)
  }

  private makeModalActionButton(x: number, y: number, label: string, callback: () => void) {
    return this.makeButton(x, y, label, callback, this.overlayLayer, MODAL.actionWidth, MODAL.actionHeight)
  }

  private showModalGrid(title: string, subtitle: string | undefined, items: ModalGridItem[], onCancel: () => void, cancelLabel = '取消', actions?: ModalGridItem[]) {
    const layered = this.addLayeredPanel(MODAL.x, MODAL.y, MODAL.width, MODAL.height)
    const { left, top, nodes } = this.drawModalTitle(title, subtitle)
    const dynamicNodes: Phaser.GameObjects.GameObject[] = []
    const close = () => {
      Object.values(layered).forEach((node) => node.destroy())
      nodes.forEach((node) => node.destroy())
      dynamicNodes.forEach((node) => node.destroy())
    }
    if (items.length === 0) {
      const empty = this.add.text(MODAL.x, top + MODAL.gridOffsetY, '当前没有可选项目。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8ecd0',
      }).setOrigin(0.5)
      this.overlayLayer.add(empty)
      dynamicNodes.push(empty)
    }
    items.forEach((item, index) => {
      const { x, y } = this.modalGridPosition(index, left, top)
      const button = this.makeModalOptionButton(x, y, item.label, () => {
        close()
        item.onSelect()
      })
      dynamicNodes.push(button)
      if (item.detail) {
        const detail = this.add.text(x, y + 35, item.detail, {
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontSize: '14px',
          color: '#ead7b3',
          align: 'center',
          wordWrap: { width: MODAL.colWidth - 34 },
        }).setOrigin(0.5)
        this.overlayLayer.add(detail)
        dynamicNodes.push(detail)
      }
    })
    const actionItems = actions ?? [{ label: cancelLabel, onSelect: onCancel }]
    actionItems.forEach((action, index) => {
      const button = this.makeModalActionButton(this.modalActionX(index, actionItems.length), top + MODAL.actionOffsetY, action.label, () => {
      close()
        action.onSelect()
      })
      dynamicNodes.push(button)
    })
  }

  private showModalChoiceColumns(title: string, subtitle: string | undefined, columns: ModalChoiceColumn[], summary: string | undefined, actions: ModalGridItem[]) {
    const layered = this.addLayeredPanel(MODAL.x, MODAL.y, MODAL.width, MODAL.height)
    const { left, top, nodes } = this.drawModalTitle(title, subtitle)
    const dynamicNodes: Phaser.GameObjects.GameObject[] = []
    const close = () => {
      Object.values(layered).forEach((node) => node.destroy())
      nodes.forEach((node) => node.destroy())
      dynamicNodes.forEach((node) => node.destroy())
    }
    columns.forEach((column, columnIndex) => {
      const titleX = left + (columnIndex === 0 ? 70 : 440)
      const buttonX = left + (columnIndex === 0 ? 138 : 512)
      const titleNode = this.add.text(titleX, top + 156, column.title, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '19px',
        color: '#f8df9d',
      })
      this.overlayLayer.add(titleNode)
      dynamicNodes.push(titleNode)
      column.items.slice(0, 5).forEach((item, index) => {
        const y = top + 202 + index * 48
        const button = this.makeButton(buttonX, y, item.selected ? `${item.label}✓` : item.label, () => {
          close()
          item.onSelect()
        }, this.overlayLayer, 154, 36)
        dynamicNodes.push(button)
        if (item.detail) {
          const detail = this.add.text(buttonX + 90, y, item.detail, {
            fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
            fontSize: '15px',
            color: '#ead7b3',
            wordWrap: { width: 112 },
          }).setOrigin(0, 0.5)
          this.overlayLayer.add(detail)
          dynamicNodes.push(detail)
        }
      })
    })
    if (summary) {
      const summaryNode = this.add.text(MODAL.x, top + 334, summary, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f7ecd5',
        wordWrap: { width: MODAL.width - MODAL.insetX * 2 },
        align: 'center',
      }).setOrigin(0.5)
      this.overlayLayer.add(summaryNode)
      dynamicNodes.push(summaryNode)
    }
    actions.forEach((action, index) => {
      const button = this.makeModalActionButton(this.modalActionX(index, actions.length), top + MODAL.actionOffsetY, action.label, () => {
        close()
        action.onSelect()
      })
      dynamicNodes.push(button)
    })
  }

  private showModalReport(title: string, subtitle: string | undefined, lines: string[], actionLabel: string, onAction: () => void) {
    const layered = this.addLayeredPanel(MODAL.x, MODAL.y, MODAL.width, MODAL.height)
    const { left, top, nodes } = this.drawModalTitle(title, subtitle)
    const body = this.add.text(left + MODAL.insetX + 22, top + 146, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
      lineSpacing: 8,
      wordWrap: { width: MODAL.width - MODAL.insetX * 2 - 44 },
    })
    this.overlayLayer.add(body)
    const close = () => {
      Object.values(layered).forEach((node) => node.destroy())
      nodes.forEach((node) => node.destroy())
      body.destroy()
    }
    const action = this.makeModalActionButton(MODAL.x, top + MODAL.actionOffsetY, actionLabel, () => {
      close()
      onAction()
    })
    this.overlayLayer.add(action)
  }

  private showCommandPanel(title: string, items: [string, () => void][]) {
    const layered = this.addLayeredPanel(MODAL.x, MODAL.y, MODAL.width, MODAL.height)
    const { left, top, nodes } = this.drawModalTitle(`${title}命令  ｜  ${this.selectedCity?.name ?? '未选'}城`)
    const buttons: Phaser.GameObjects.Text[] = []
    items.forEach(([label, callback], index) => {
      const { x, y } = this.modalGridPosition(index, left, top)
      const button = this.makeModalOptionButton(x, y, label, () => {
        Object.values(layered).forEach((node) => node.destroy())
        nodes.forEach((node) => node.destroy())
        buttons.forEach((item) => item.destroy())
        callback()
      })
      buttons.push(button)
    })
    const close = this.makeModalActionButton(MODAL.x, top + MODAL.actionOffsetY, '取消', () => {
      Object.values(layered).forEach((node) => node.destroy())
      nodes.forEach((node) => node.destroy())
      buttons.forEach((item) => item.destroy())
      this.showCampaign()
    })
    buttons.push(close)
  }

  private showCommandConfirm(config: {
    category: string
    command: string
    actor: string
    target: string
    scope: string
    effect: string
    onConfirm: () => void
    onCancel?: () => void
    hint?: string
  }) {
    const width = 760
    const layered = this.addLayeredPanel(MODAL.x, MODAL.y, width, MODAL.height)
    const { left, top, nodes: titleNodes } = this.drawModalTitle(`${config.category}｜${config.command}`, undefined, width)
    const bodyLines = [
      ...modalInfoLines('发起方', config.actor, 28),
      ...modalInfoLines('目标', config.target, 28),
      ...modalInfoLines('范围', config.scope, 28),
      ...modalInfoLines('效果', config.effect, 30),
    ]
    const body = this.add.text(left + MODAL.insetX + 28, top + MODAL.helperOffsetY, bodyLines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
      lineSpacing: 8,
      wordWrap: { width: width - MODAL.insetX * 2 - 56 },
    })
    const hint = this.add.text(640, top + 350, config.hint ?? '确认后消耗政令并执行命令', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#d8c092',
    }).setOrigin(0.5)
    const nodes: Phaser.GameObjects.GameObject[] = [...Object.values(layered), ...titleNodes, body, hint]
    const close = () => nodes.forEach((node) => node.destroy())
    const cancel = this.makeModalActionButton(this.modalActionX(0, 2), top + MODAL.actionOffsetY, '取消', () => {
      close()
      config.onCancel?.()
    })
    const confirm = this.makeModalActionButton(this.modalActionX(1, 2), top + MODAL.actionOffsetY, '确认', () => {
      close()
      config.onConfirm()
    })
    nodes.push(cancel, confirm)
    this.overlayLayer.add(nodes)
  }

  private showCityPolicyOfficerSelection(category: string, command: string, target: string, message: string, effect: string, delta: CityPolicyDelta, actorCity: StrategyCity) {
    const officers = this.officersInCity(actorCity.id)
    if (officers.length === 0) {
      this.showCampaignMessage('本城没有可执行命令的武将。')
      return
    }
    this.showCampaign()
    this.showModalGrid(
      `${category}｜${command}：选择执行武将`,
      `${actorCity.name}太守府发起，选择本城武将作为执行人`,
      officers.map((officer) => ({
        label: officer.name,
        detail: `政${officer.gov} 智${officer.intel} 魅${officer.charm}`,
        onSelect: () => {
          this.confirmCityPolicy(category, command, target, message, effect, delta, actorCity, () => this.showCityPolicyOfficerSelection(category, command, target, message, effect, delta, actorCity), officer)
        },
      })),
      () => {
        this.showCampaign()
        if (category === '军事') this.showMilitaryCommand()
        else this.showDomesticCommand()
      },
      '取消',
      [
        { label: '重选发起城', onSelect: () => this.showCityPolicyActorSelection(category, command, target, message, effect, delta) },
        { label: '取消', onSelect: () => { this.showCampaign(); if (category === '军事') this.showMilitaryCommand(); else this.showDomesticCommand() } },
      ],
    )
  }

  private showCityPolicyActorSelection(category: string, command: string, target: string, message: string, effect: string, delta: CityPolicyDelta, needsOfficer = false) {
    const cities = this.controlledCities()
    this.showCampaign()
    this.showModalGrid(
      `${category}｜${command}：选择发起城`,
      '此命令以城池为发起方和目标，确认前必须明确是哪一座城执行。',
      cities.map((city) => ({
        label: city.name,
        detail: `金${city.gold} 粮${city.food} 兵${city.troops} 防${city.defense}`,
        onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        if (needsOfficer) {
          this.showCityPolicyOfficerSelection(category, command, target, message, effect, delta, city)
        } else {
          this.confirmCityPolicy(category, command, target, message, effect, delta, city, () => this.showCityPolicyActorSelection(category, command, target, message, effect, delta, needsOfficer))
        }
        },
      })),
      () => {
      this.showCampaign()
      if (category === '军事') this.showMilitaryCommand()
      else this.showDomesticCommand()
      },
    )
  }

  private showTaxActorSelection() {
    const cities = this.controlledCities()
    this.showCampaign()
    this.showModalGrid('内政｜税率：选择发起城', '税率是持续政令，会在月令收入中生效；确认前必须明确执行城。', cities.map((city) => {
      const current = taxRateConfig(this.cityTaxRates.get(city.id) ?? 'normal')
      return {
        label: city.name,
        detail: `${current.label}｜金${city.gold} 民心${this.cityState.publicOrder}`,
        onSelect: () => this.showTaxRateSelection(city),
      }
    }), () => this.showDomesticCommand())
  }

  private showTaxRateSelection(city: StrategyCity) {
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    const governor = this.campaignOfficers.find((o) => o.id === this.appointments.governor && o.location === city.id)
    const govHint = governor ? `太守${governor.name}（政${governor.gov}）治理，月令产出受政务加成。` : '本城未任命太守，月令产出按基准结算。'
    this.showModalGrid(
      `内政｜税率：${city.name}`,
      govHint,
      (['light', 'normal', 'heavy'] as TaxRate[]).map((rate) => {
      const config = taxRateConfig(rate)
      const selected = (this.cityTaxRates.get(city.id) ?? 'normal') === rate
        return {
          label: selected ? `${config.label}✓` : config.label,
          detail: `收入x${config.goldMultiplier.toFixed(1)}｜民心${config.publicOrderDelta >= 0 ? '+' : ''}${config.publicOrderDelta}/月`,
          onSelect: () => this.confirmTaxRate(city, rate),
        }
      }),
      () => this.showDomesticCommand(),
      '取消',
      [
        { label: '重选发起城', onSelect: () => this.showTaxActorSelection() },
        { label: '取消', onSelect: () => this.showDomesticCommand() },
      ],
    )
  }

  private confirmTaxRate(city: StrategyCity, rate: TaxRate) {
    const config = taxRateConfig(rate)
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category: '内政',
      command: '税率',
      actor: `${city.name}太守府`,
      target: `${city.name}税制`,
      scope: `${config.label}，月令持续结算`,
      effect: `府库收入x${config.goldMultiplier.toFixed(1)}｜民心 ${config.publicOrderDelta >= 0 ? '+' : ''}${config.publicOrderDelta}/月`,
      hint: '确认后消耗政令并设定税制',
      onConfirm: () => this.applyTaxRate(city, rate),
      onCancel: () => this.showTaxRateSelection(city),
    })
  }

  private applyTaxRate(city: StrategyCity, rate: TaxRate) {
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，无法调整税率。')
      return
    }
    const config = taxRateConfig(rate)
    this.cityTaxRates.set(city.id, rate)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}定${config.label}`)
    this.syncSelectedCityState()
    this.showCityMessage(`${city.name}改行${config.label}，下次月令按新税制结算。`)
  }

  private confirmCityPolicy(category: string, command: string, target: string, message: string, effect: string, delta: CityPolicyDelta, actorCity = this.selectedCity, onCancel?: () => void, officer?: StrategyOfficer) {
    const city = actorCity
    if (!city) return
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    const officerHint = officer ? `｜执行 ${officer.name}（政${officer.gov}）` : ''
    this.showCommandConfirm({
      category,
      command,
      actor: `${city.name}${category === '军事' ? '军府' : '太守府'}`,
      target,
      scope: `${city.name}城${officerHint}`,
      effect,
      onConfirm: () => this.applyCityPolicy(message, delta, officer),
      onCancel,
    })
  }

  private showIntelActorSelection(category: IntelCommandCategory) {
    const cities = this.controlledCities().filter((city) => this.intelTargetsFrom(city, category).length > 0)
    this.showCampaign()
    this.showModalGrid(
      `${category}｜情报：选择发起城`,
      category === '军事'
      ? '军事情报先确定斥候出发城，再选择邻接敌城。'
      : '内政情报先确定发起城，再选择本城或邻接城池查看。',
      cities.map((city) => {
      const targets = this.intelTargetsFrom(city, category)
        return {
          label: city.name,
          detail: `目标${targets.length}｜情报${this.councilState.intel}`,
          onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        this.showIntelTargetSelection(category, city)
          },
        }
      }),
      () => {
      this.showCampaign()
      if (category === '军事') this.showMilitaryCommand()
      else this.showDomesticCommand()
      },
    )
  }

  private showIntelTargetSelection(category: IntelCommandCategory, actorCity: StrategyCity) {
    const targets = this.intelTargetsFrom(actorCity, category)
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showModalGrid(
      `${category}｜情报：选择目标`,
      `发起方：${actorCity.name}${category === '军事' ? '斥候' : '军师府'}`,
      targets.map((city) => {
      const owner = factionById(city.owner)
        return {
          label: city.id === actorCity.id ? `${city.name}本城` : city.name,
          detail: `${owner?.name ?? '-'}｜兵${city.troops} 防${city.defense}`,
          onSelect: () => this.confirmIntelCommand(category, actorCity, city),
        }
      }),
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选发起城', onSelect: () => this.showIntelActorSelection(category) },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private intelTargetsFrom(actorCity: StrategyCity, category: IntelCommandCategory) {
    if (category === '军事') return this.diplomacyTargetsFrom(actorCity)
    const targets = [
      actorCity,
      ...actorCity.routes
        .map((routeId) => this.campaignCities.find((item) => item.id === routeId))
        .filter((item): item is StrategyCity => item !== undefined),
    ]
    return targets
  }

  private confirmIntelCommand(category: IntelCommandCategory, actorCity: StrategyCity, targetCity: StrategyCity) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = targetCity.id
    this.selectedTargetCityId = targetCity.owner !== this.playerFactionId ? targetCity.id : this.selectedTargetCityId
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category,
      command: '情报',
      actor: `${actorCity.name}${category === '军事' ? '斥候' : '军师府'}`,
      target: targetCity.name,
      scope: targetCity.id === actorCity.id ? `${actorCity.name}本城` : `${actorCity.name} → ${targetCity.name}`,
      effect: category === '军事' ? '政令 -1｜情报 +6｜显示敌城守军、城防、守将' : '政令 -1｜情报 +4｜显示城池和邻接军情',
      hint: '确认后执行情报命令',
      onConfirm: () => this.executeIntelCommand(category, actorCity, targetCity),
      onCancel: () => this.showIntelTargetSelection(category, actorCity),
    })
  }

  private executeIntelCommand(category: IntelCommandCategory, actorCity: StrategyCity, targetCity: StrategyCity) {
    if (this.councilState.actions <= 0) {
      this.showCampaignMessage('本月政令已用尽，无法侦察。')
      return
    }
    this.selectedCityId = actorCity.id
    this.focusedCityId = targetCity.id
    if (targetCity.owner !== this.playerFactionId) this.selectedTargetCityId = targetCity.id
    this.councilState.actions -= 1
    this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + (category === '军事' ? 6 : 4), 0, 100)
    this.recordMonthlyAction(`${actorCity.name}${category}情报${targetCity.name}`)
    this.syncSelectedCityState()
    this.showIntelReport(category, actorCity, targetCity)
  }

  private showIntelReport(category: IntelCommandCategory, actorCity: StrategyCity, targetCity: StrategyCity) {
    this.showCampaign()
    const owner = factionById(targetCity.owner)
    const officers = this.campaignOfficers.filter((officer) => officer.location === targetCity.id && officer.faction === targetCity.owner)
    const neighbors = targetCity.routes.map((id) => this.campaignCities.find((item) => item.id === id)).filter((item): item is StrategyCity => Boolean(item))
    const lines = [
      `发起      ${actorCity.name}`,
      `目标      ${targetCity.name}（${targetCity.region}）`,
      `归属      ${owner?.name ?? '-'}`,
      `守军      ${targetCity.troops}`,
      `城防      ${targetCity.defense}`,
      `粮草      ${targetCity.food}`,
      `府库      ${targetCity.gold}`,
      `守将      ${officers.map((officer) => officer.name).join('、') || owner?.ruler || '郡中守将'}`,
      `邻接      ${neighbors.map((city) => city.name).join('、') || '-'}`,
      `情报      ${this.councilState.intel}`,
    ]
    this.showModalReport(`${category}情报`, undefined, lines, '返回', () => category === '军事' ? this.showMilitaryCommand() : this.showDomesticCommand())
  }

  private showEducationActorSelection() {
    const cities = this.controlledCities()
    this.showCampaign()
    this.showModalGrid('内政｜教育：选择发起城', '教育命令先确定讲堂所在城，再选择本城武将或本城吏士。', cities.map((city) => {
      const officers = this.officersInCity(city.id)
      return {
        label: city.name,
        detail: `武将${officers.length}｜金${city.gold} 情报${this.councilState.intel}`,
        onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        this.showEducationTargetSelection(city)
        },
      }
    }), () => {
      this.showCampaign()
      this.showDomesticCommand()
    })
  }

  private showEducationTargetSelection(actorCity: StrategyCity) {
    const officers = this.officersInCity(actorCity.id)
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showModalGrid(
      '内政｜教育：选择目标',
      `${actorCity.name}讲堂发起教育`,
      [
        { label: '本城吏士', detail: '情报 +4｜士气 +2', onSelect: () => this.confirmEducation(actorCity) },
        ...officers.map((officer) => ({
          label: officer.name,
          detail: `智${officer.intel} 政${officer.gov} 忠${officer.loyalty}`,
          onSelect: () => this.confirmEducation(actorCity, officer),
        })),
      ],
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选发起城', onSelect: () => this.showEducationActorSelection() },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private confirmEducation(actorCity: StrategyCity, officer?: StrategyOfficer) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category: '内政',
      command: '教育',
      actor: `${actorCity.name}讲堂`,
      target: officer?.name ?? '本城吏士',
      scope: `${actorCity.name}本城教育`,
      effect: officer ? `金 -100｜${officer.name}智略 +1｜政务 +1｜忠诚 +2` : '金 -100｜情报 +4｜士气 +2',
      hint: '确认后执行教育命令',
      onConfirm: () => this.executeEducation(actorCity, officer),
      onCancel: () => this.showEducationTargetSelection(actorCity),
    })
  }

  private executeEducation(actorCity: StrategyCity, officer?: StrategyOfficer) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，无法教育。')
      return
    }
    if (actorCity.gold < 100) {
      this.showCityMessage('府库不足，无法开设讲堂。')
      return
    }
    actorCity.gold = Math.max(0, actorCity.gold - 100)
    if (officer) {
      officer.intel = Math.min(100, officer.intel + 1)
      officer.gov = Math.min(100, officer.gov + 1)
      officer.loyalty = Math.min(100, officer.loyalty + 2)
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 2, 0, 100)
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 1, 0, 100)
      this.recordMonthlyAction(`${actorCity.name}教育${officer.name}`)
      this.councilState.actions -= 1
      this.syncSelectedCityState()
      this.showCityMessage(`${officer.name}入讲堂受教，智略与政务略有精进。`)
      return
    }
    this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 4, 0, 100)
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 2, 0, 100)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${actorCity.name}教育吏士`)
    this.syncSelectedCityState()
    this.showCityMessage(`${actorCity.name}讲堂开课，吏士见闻增长。`)
  }

  private showTransportActorSelection() {
    const cities = this.controlledCities()
    this.showCampaign()
    this.showModalGrid('内政｜运输：选择发起城', '运输命令先确定发车城，再选择远征粮仓或相邻己方城作为目的地。', cities.map((city) => {
      const destinations = this.controlledNeighborCitiesFrom(city)
      return {
        label: city.name,
        detail: `粮${city.food}｜邻城${destinations.length}｜行军粮${this.councilState.supplies}`,
        onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        this.showTransportTargetSelection(city)
        },
      }
    }), () => {
      this.showCampaign()
      this.showDomesticCommand()
    })
  }

  private showTransportTargetSelection(actorCity: StrategyCity) {
    const city = actorCity
    const destinations = this.controlledNeighborCitiesFrom(city)
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showModalGrid(
      '内政｜运输：选择目标',
      `${city.name}太守府发起运输，选择粮草去向`,
      [
        { label: '远征粮仓', detail: '只可发运粮草', onSelect: () => this.showTransportAmountSelection('expedition', city, 'food') },
        ...destinations.map((destination) => ({
          label: destination.name,
          detail: '可运粮/金/兵',
          onSelect: () => this.showTransportResourceSelection(destination.id, city),
        })),
      ],
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选发起城', onSelect: () => this.showTransportActorSelection() },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private showTransportResourceSelection(target: TransportTarget, actorCity: StrategyCity) {
    const city = actorCity
    const targetCity = target !== 'expedition' ? this.campaignCities.find((item) => item.id === target) : undefined
    const targetName = target === 'expedition' ? '远征粮仓' : targetCity?.name ?? '目标城'
    this.selectedCityId = city.id
    this.focusedCityId = targetCity?.id ?? city.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showModalGrid(
      '内政｜运输：选择资源',
      `${city.name} → ${targetName}，选择本次运输对象`,
      (['food', 'gold', 'troops'] as MoveResourceKind[]).map((kind) => ({
        label: moveResourceName(kind),
        detail: kind === 'troops' ? `可发${Math.max(0, city.troops - 500)}` : `可发${city[kind]}`,
        onSelect: () => this.showTransportAmountSelection(target, city, kind),
      })),
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选目标', onSelect: () => this.showTransportTargetSelection(city) },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private showTransportAmountSelection(target: TransportTarget, actorCity: StrategyCity, kind: MoveResourceKind) {
    const city = actorCity
    const targetCity = target !== 'expedition' ? this.campaignCities.find((item) => item.id === target) : undefined
    const targetName = target === 'expedition' ? '远征粮仓' : targetCity?.name ?? '目标城'
    this.selectedCityId = city.id
    this.focusedCityId = targetCity?.id ?? city.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showModalGrid(
      '内政｜运输：选择数量',
      `${city.name} → ${targetName}，选择${moveResourceName(kind)}发运规模`,
      (['small', 'medium', 'large'] as TransportAmount[]).map((amount) => {
      const config = target === 'expedition' ? transportAmountConfig(amount) : moveResourceConfig(kind, amount)
      const sourceAmount = target === 'expedition' ? transportAmountConfig(amount).sourceFood : moveResourceConfig(kind, amount).amount
      const gain = target === 'expedition' ? transportAmountConfig(amount).expeditionGain : transportCityGain(kind, amount)
        return {
          label: config.label,
          detail: `发${moveResourceName(kind)}-${sourceAmount}｜到${moveResourceName(kind)}+${gain}`,
          onSelect: () => this.confirmTransportTarget(target, city, amount, kind),
        }
      }),
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选资源', onSelect: () => target === 'expedition' ? this.showTransportTargetSelection(city) : this.showTransportResourceSelection(target, city) },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private confirmTransportTarget(target: TransportTarget, actorCity: StrategyCity, amount: TransportAmount, kind: MoveResourceKind) {
    const city = actorCity
    const foodConfig = transportAmountConfig(amount)
    const moveConfig = moveResourceConfig(kind, amount)
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    const targetCity = target !== 'expedition' ? this.campaignCities.find((item) => item.id === target) : undefined
    const targetName = target === 'expedition' ? '远征粮仓' : targetCity?.name ?? '目标城'
    const scope = target === 'expedition' ? `${city.name}粮仓 → 远征粮仓` : `${city.name} → ${targetName}`
    const sourceAmount = target === 'expedition' ? foodConfig.sourceFood : moveConfig.amount
    const gain = target === 'expedition' ? foodConfig.expeditionGain : transportCityGain(kind, amount)
    const effect = target === 'expedition'
      ? `${foodConfig.label}｜城池粮 -${sourceAmount}｜行军粮 +${gain}`
      : `${moveConfig.label}${moveResourceName(kind)}｜发城${moveResourceName(kind)} -${sourceAmount}｜目标城${moveResourceName(kind)} +${gain}｜路耗 ${sourceAmount - gain}`
    this.showCommandConfirm({
      category: '内政',
      command: '运输',
      actor: `${city.name}太守府`,
      target: targetName,
      scope,
      effect,
      onConfirm: () => this.transportSupplies(target, city, amount, kind),
      onCancel: () => this.showTransportAmountSelection(target, city, kind),
    })
  }

  private showInspection() {
    this.phase = 'inspect'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('视察情况', `${this.campaignClock.year}年${this.campaignClock.month}月   ${campaignModeName(this.campaignClock.mode)}`)
    this.drawInspectionCity()
    this.drawInspectionHeroes()
    this.drawInspectionThreat()
    this.makeButton(298, 636, '城池详表', () => this.showCityDetail(this.focusedCityId), this.overlayLayer, 160, 44)
    this.makeButton(480, 636, '势力一览', () => this.showFactionOverview(), this.overlayLayer, 160, 44)
    this.makeButton(640, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(820, 636, '武将详表', () => this.showOfficerDetail(this.inspectionOfficerId ?? this.campaignOfficers.find((officer) => officer.faction === this.playerFactionId)?.id), this.overlayLayer, 160, 44)
    this.makeButton(1002, 636, '军事命令', () => this.showMilitaryCommand(), this.overlayLayer, 160, 44)
  }

  private drawInspectionCity() {
    this.drawPanel(82, 140, 330, 430)
    this.drawSectionTitle(112, 170, '城池')
    const lines = [
      `势力    ${this.playerFaction.name}`,
      `主城    ${cityName(this.playerFaction.capital)}`,
      `城池    ${this.countCities(this.playerFactionId)}`,
      `武将    ${this.countOfficers(this.playerFactionId)}`,
      `总兵    ${this.sumCityField(this.playerFactionId, 'troops')}`,
      `总粮    ${this.sumCityField(this.playerFactionId, 'food')}`,
      `府库    ${this.cityState.treasury}`,
      `民心    ${this.cityState.publicOrder}`,
      `邻敌    ${this.neighborEnemyCities(this.playerFactionId).join('、') || '无'}`,
    ]
    this.overlayLayer.add(this.add.text(118, 230, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '19px',
      color: '#f8ecd0',
      lineSpacing: 13,
    }))
  }

  private drawInspectionHeroes() {
    this.drawPanel(450, 140, 380, 430)
    this.drawSectionTitle(480, 170, '武将')
    const officers = this.campaignOfficers.filter((officer) => officer.faction === this.playerFactionId)
    const pageSize = 4
    const pageData = this.pagedItems(officers, this.inspectionHeroPage, pageSize)
    this.inspectionHeroPage = pageData.page
    this.drawListViewport(474, 218, 332, 286)
    pageData.items.forEach((officer, index) => {
      const y = 250 + index * 66
      const key = officerPortraitKey(officer.id)
      this.overlayLayer.add(this.add.rectangle(488, y - 24, 292, 58, 0x21160f, 0.9).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.45))
      if (this.textures.exists(key)) {
        this.overlayLayer.add(this.add.image(512, y + 7, key).setDisplaySize(44, 52))
      }
      this.overlayLayer.add(this.add.text(552, y - 14, `${officer.name}｜${officer.role}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#f8df9d',
        wordWrap: { width: 188 },
      }))
      this.overlayLayer.add(this.add.text(552, y + 13, `武${officer.war}  智${officer.intel}  政${officer.gov}  忠${officer.loyalty}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#f8ecd0',
      }))
      this.makeButton(754, y + 7, '详', () => {
        this.inspectionOfficerId = officer.id
        this.showOfficerDetail(officer.id)
      }, this.overlayLayer, 44, 30, 15)
    })
    this.drawPager(640, 528, pageData.page, pageData.totalPages, () => {
      this.inspectionHeroPage = Math.max(0, this.inspectionHeroPage - 1)
      this.showInspection()
    }, () => {
      this.inspectionHeroPage = Math.min(pageData.totalPages - 1, this.inspectionHeroPage + 1)
      this.showInspection()
    })
  }

  private drawInspectionThreat() {
    this.drawPanel(868, 140, 326, 430)
    this.drawSectionTitle(898, 170, '敌情')
    const supplyNeed = this.deploymentSupplyNeed()
    const threatLabel = this.campaignClock.enemyThreat >= 75 ? '强盛' : this.campaignClock.enemyThreat >= 55 ? '警戒' : '可战'
    const lines = [
      `敌势    ${this.campaignClock.enemyThreat}（${threatLabel}）`,
      `情报    ${this.councilState.intel}`,
      `盟约    ${this.councilState.alliance}`,
      `离间    ${this.councilState.sabotage ? '已成' : '未行'}`,
      `劝降    ${this.councilState.persuaded ? '已送' : '未送'}`,
      `出征粮  ${supplyNeed}`,
      `政令    ${this.councilState.actions}`,
      `建议    ${this.campaignClock.enemyThreat > 60 ? '先外交削敌' : '可准备出征'}`,
    ]
    this.overlayLayer.add(this.add.text(904, 230, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      lineSpacing: 13,
    }))
  }

  private showCityDetail(cityId = this.focusedCityId) {
    const city = this.campaignCities.find((item) => item.id === cityId) ?? this.selectedCity
    if (!city) {
      this.showInspection()
      return
    }
    this.focusedCityId = city.id
    const faction = factionById(city.owner)
    const officers = this.campaignOfficers.filter((officer) => officer.location === city.id && officer.status !== 'captured')
    const wounded = officers.filter((officer) => officer.status === 'wounded').length
    const capturedHere = this.campaignOfficers.filter((officer) => officer.location === city.id && officer.status === 'captured' && officer.captorFactionId === this.playerFactionId).length
    const routeNames = city.routes.map((id) => cityName(id)).join('、')
    const hostileRoutes = city.routes
      .map((id) => this.campaignCities.find((item) => item.id === id))
      .filter((item): item is StrategyCity => item !== undefined)
      .filter((item) => item.owner !== city.owner)
      .map((item) => `${item.name}(${factionById(item.owner)?.ruler ?? '-'})`)
    const officerPower = officers.reduce((sum, officer) => sum + officer.command + officer.war, 0)
    this.phase = 'inspect'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('城池详表', `${city.name}  ${city.region}  ${faction?.name ?? '-'}`, 0.93)
    this.drawPanel(88, 132, 500, 456)
    this.drawSectionTitle(124, 168, '城池资料')
    const basicRows = [
      `城名      ${city.name}`,
      `地域      ${city.region}`,
      `归属      ${faction?.name ?? '-'}`,
      `座标      ${city.x}, ${city.y}`,
      `兵力      ${city.troops}`,
      `城防      ${city.defense}`,
      `府库      ${city.gold}`,
      `存粮      ${city.food}`,
      `人口      ${city.population ?? 0}`,
      `商业      ${city.commerce ?? 0}`,
      `土地      ${city.land ?? 0}`,
      `水利      ${city.irrigation ?? 0}`,
      `灾害      ${city.disaster ?? 0}`,
      `税制      ${taxRateConfig(this.cityTaxRates.get(city.id) ?? 'normal').label}`,
      `民心      ${city.id === this.selectedCityId ? this.cityState.publicOrder : '未详'}`,
      `守将      ${officers.length}名（伤疲${wounded}）`,
      `俘虏      ${capturedHere}`,
    ]
    this.overlayLayer.add(this.add.text(128, 222, basicRows.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '17px',
      color: '#f8ecd0',
      lineSpacing: 4,
    }))
    this.drawPanel(626, 132, 566, 456)
    this.drawSectionTitle(662, 168, '军政判断')
    const avgPower = officers.length > 0 ? Math.floor(officerPower / officers.length) : 0
    const analysis = [
      `道路      ${routeNames || '-'}`,
      `接壤敌境  ${hostileRoutes.join('、') || '无'}`,
      `武将均势  ${avgPower}`,
      `粮兵比    ${city.troops > 0 ? Math.floor((city.food / city.troops) * 100) : 0}`,
      `民户负担  ${this.cityBurdenLabel(city)}`,
      `钱粮潜力  ${this.cityEconomyGrade(city)}`,
      `守备评估  ${this.cityDefenseGrade(city)}`,
      `攻守建议  ${this.cityAdvice(city, hostileRoutes.length)}`,
      '',
      '本城武将',
      ...(officers.slice(0, 8).map((officer) => `${officer.name} ${officer.role} 统${officer.command} 武${officer.war} 智${officer.intel} ${officerStatusName(officer)}`)),
    ]
    this.overlayLayer.add(this.add.text(666, 220, analysis.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8ecd0',
      lineSpacing: 8,
      wordWrap: { width: 470 },
    }))
    this.makeButton(412, 636, '返回视察', () => this.showInspection(), this.overlayLayer, 170, 42)
    this.makeButton(640, 636, '设为命令城', () => {
      if (city.owner === this.playerFactionId) {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
      }
      this.showInspection()
    }, this.overlayLayer, 170, 42)
    this.makeButton(868, 636, '武将详表', () => this.showOfficerDetail(officers[0]?.id), this.overlayLayer, 170, 42)
  }

  private showOfficerDetail(officerId?: string) {
    const officer = this.campaignOfficers.find((item) => item.id === officerId)
      ?? this.campaignOfficers.filter((item) => item.faction === this.playerFactionId).toSorted((a, b) => b.command - a.command)[0]
    if (!officer) {
      this.showInspection()
      return
    }
    this.inspectionOfficerId = officer.id
    const city = this.campaignCities.find((item) => item.id === officer.location)
    const faction = factionById(officer.faction)
    const armsGrade = officerWeapons(officer) >= 4 ? '精锐' : officerWeapons(officer) >= 2 ? '整备' : '薄弱'
    const trainingGrade = officerTraining(officer) >= 75 ? '熟练' : officerTraining(officer) >= 45 ? '可战' : '待训'
    const equipment = officerEquipment(officer)
    this.phase = 'inspect'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('武将详表', `${officer.name}  ${faction?.name ?? '在野'}  ${city?.name ?? '去向未明'}`, 0.93)
    this.drawPanel(88, 132, 500, 456)
    this.drawSectionTitle(124, 168, '人物资料')
    const portraitKey = officerPortraitKey(officer.id)
    if (this.textures.exists(portraitKey)) this.overlayLayer.add(this.add.image(186, 252, portraitKey).setDisplaySize(96, 118))
    const basicRows = [
      `姓名      ${officer.name}`,
      `身份      ${officer.role}`,
      `势力      ${faction?.name ?? '-'}`,
      `所在      ${city?.name ?? '-'}`,
      `状态      ${officerStatusName(officer)}`,
      `忠诚      ${officer.loyalty}`,
      `功绩      ${officerMerit(officer)}`,
      `俸禄      ${officerSalary(officer)}`,
      `疲劳      ${officer.fatigue ?? 0}`,
      `统兵      ${officerTroops(officer)}`,
      `武装      ${officerWeapons(officer)}（${armsGrade}）`,
      `兵种      ${officerTroopTypeName(officer)}`,
      `枪弓马甲  ${equipment.spear}/${equipment.bow}/${equipment.horse}/${equipment.armor}`,
      `训练      ${officerTraining(officer)}（${trainingGrade}）`,
    ]
    this.overlayLayer.add(this.add.text(270, 208, basicRows.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
      lineSpacing: 8,
    }))
    this.drawPanel(626, 132, 566, 456)
    this.drawSectionTitle(662, 168, '能力与任用')
    const roles = [
      `武力      ${officer.war}  ${this.abilityGrade(officer.war)}`,
      `智略      ${officer.intel}  ${this.abilityGrade(officer.intel)}`,
      `政务      ${officer.gov}  ${this.abilityGrade(officer.gov)}`,
      `魅力      ${officer.charm}  ${this.abilityGrade(officer.charm)}`,
      `统率      ${officer.command}  ${this.abilityGrade(officer.command)}`,
      '',
      `太守适性  ${this.roleFit(officer.gov, officer.charm)}`,
      `先锋适性  ${this.roleFit(officer.war, officer.command)}`,
      `军师适性  ${this.roleFit(officer.intel, officer.command)}`,
      `当前任命  ${this.officerAppointmentText(officer.id)}`,
      `战后影响  ${officer.status === 'wounded' ? '伤疲期间不能出征、任命或登场单挑。' : officer.status === 'captured' ? '被俘期间不能行动，可在战后处置。' : (officer.fatigue ?? 0) >= 85 ? '疲劳过高，本月不宜再任事。' : '可参与内政、军事、行军和会战。'}`,
    ]
    this.overlayLayer.add(this.add.text(666, 222, roles.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
      lineSpacing: 9,
      wordWrap: { width: 470 },
    }))
    this.makeButton(412, 636, '返回视察', () => this.showInspection(), this.overlayLayer, 170, 42)
    this.makeButton(640, 636, '所在城池', () => city ? this.showCityDetail(city.id) : this.showInspection(), this.overlayLayer, 170, 42)
    this.makeButton(868, 636, '任命武将', () => this.showAppointmentActorSelection(), this.overlayLayer, 170, 42)
  }

  private cityDefenseGrade(city: StrategyCity) {
    const score = city.troops + city.defense * 80 + city.food * 0.35
    if (score >= 16000) return '坚城'
    if (score >= 9500) return '可守'
    if (score >= 5200) return '薄防'
    return '危城'
  }

  private cityEconomyGrade(city: StrategyCity) {
    const score = (city.commerce ?? 35) + (city.land ?? 35) + Math.floor((city.irrigation ?? 35) * 0.8) - Math.floor((city.disaster ?? 0) * 0.7)
    if (score >= 210) return '富庶'
    if (score >= 155) return '充实'
    if (score >= 105) return '平平'
    return '凋敝'
  }

  private cityBurdenLabel(city: StrategyCity) {
    const population = Math.max(1, city.population ?? 20000)
    const burden = city.troops / population
    if (burden >= 0.38) return '极重'
    if (burden >= 0.25) return '偏重'
    if (burden >= 0.14) return '可承'
    return '宽缓'
  }

  private cityAdvice(city: StrategyCity, hostileRouteCount: number) {
    if (city.owner !== this.playerFactionId) return city.defense >= 55 ? '先离间或火计削弱守备。' : '可备粮直取。'
    if ((city.disaster ?? 0) >= 35) return '灾害偏高，先开发或福利安民。'
    if ((city.commerce ?? 0) < 30) return '商业薄弱，宜减灾修市积府库。'
    if ((city.land ?? 0) < 35 || (city.irrigation ?? 0) < 35) return '农田水利不足，优先开发。'
    if (hostileRouteCount >= 2 && city.troops < 7000) return '多线接敌，优先征兵防卫。'
    if (city.food < city.troops * 0.25) return '粮兵比偏低，优先开发或运输。'
    if (city.defense < 45) return '城防不足，宜修缮防卫。'
    return '可作为出征或转运据点。'
  }

  private abilityGrade(value: number) {
    if (value >= 90) return '卓绝'
    if (value >= 75) return '上'
    if (value >= 55) return '中'
    return '下'
  }

  private roleFit(primary: number, secondary: number) {
    const score = Math.floor(primary * 0.65 + secondary * 0.35)
    if (score >= 86) return '极佳'
    if (score >= 72) return '适任'
    if (score >= 56) return '可用'
    return '不宜'
  }

  private officerAppointmentText(officerId: string) {
    const roles = Object.entries(this.appointments)
      .filter(([, id]) => id === officerId)
      .map(([role]) => appointmentRoleName(role as keyof typeof this.appointments))
    return roles.join('、') || '无'
  }

  private showFactionOverview() {
    this.phase = 'factions'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('势力一览', '观天下强弱，择交战时机')
    this.drawPanel(94, 142, 1092, 420)
    const columns = [
      ['势力', 124],
      ['君主', 276],
      ['城池', 410],
      ['武将', 498],
      ['总兵', 592],
      ['总粮', 728],
      ['特性', 860],
    ] as const
    columns.forEach(([label, x]) => {
      this.overlayLayer.add(this.add.text(x, 170, label, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '21px',
        color: '#f5d487',
      }))
    })
    strategyFactions.filter((faction) => faction.id !== 'neutral').forEach((faction, index) => {
      const y = 220 + index * 60
      this.overlayLayer.add(this.add.rectangle(120, y - 12, 1010, 44, 0x21160f, index % 2 === 0 ? 0.88 : 0.72).setOrigin(0).setStrokeStyle(1, faction.color, 0.7))
      const values = [
        [faction.name, 134, 132],
        [faction.ruler, 286, 104],
        [String(this.countCities(faction.id)), 424, 54],
        [String(this.countOfficers(faction.id)), 512, 54],
        [String(this.sumCityField(faction.id, 'troops')), 594, 104],
        [String(this.sumCityField(faction.id, 'food')), 730, 104],
        [faction.trait, 862, 240],
      ] as const
      values.forEach(([value, x, width]) => this.overlayLayer.add(this.add.text(x, y, value, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8ecd0',
        wordWrap: { width },
      })))
    })
    this.makeButton(540, 636, '返回视察', () => this.showInspection(), this.overlayLayer, 180, 44)
    this.makeButton(740, 636, '外交交涉', () => this.showDiplomacy(), this.overlayLayer, 180, 44)
  }

  private showTalentActorSelection() {
    const cities = this.controlledCities()
    this.showCampaign()
    this.showModalGrid('军事｜人材：选择发起城', '人材命令先确定举荐所在城，再选择在野人物登用。', cities.map((city) => ({
      label: city.name,
      detail: `金${city.gold}｜民心${this.cityState.publicOrder}｜情报${this.councilState.intel}`,
      onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        this.showTalentSearch(city)
      },
    })), () => {
      this.showCampaign()
      this.showMilitaryCommand()
    })
  }

  private showTalentSearch(actorCity = this.selectedCity) {
    const city = actorCity
    if (!city) return
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.phase = 'talent'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('访贤登用', '搜索在野、举荐名士、补强阵营')
    this.drawPanel(92, 140, 470, 420)
    this.drawPanel(604, 140, 590, 420)
    this.drawSectionTitle(124, 170, '传闻')
    this.drawSectionTitle(636, 170, '在野人才')
    const candidates = this.talentCandidates(city)
    const allNeutralCount = this.campaignOfficers.filter((officer) => officer.faction === 'neutral' && this.isOfficerAvailable(officer)).length
    const localCount = this.talentCandidates(city, 'local').length
    const nearbyCount = this.talentCandidates(city, 'nearby').length
    this.overlayLayer.add(this.add.text(124, 230, [
      `发起：${city.name}`,
      `政令：${this.councilState.actions}`,
      `府库：${city.gold}`,
      `民心：${this.cityState.publicOrder}`,
      `范围：${talentScopeName(this.talentScope)}`,
      `人才：本${localCount} 周${nearbyCount} 天${allNeutralCount}`,
      `魅力、情报、民心影响成败。`,
      `远访天下成功率较低。`,
      '',
      this.recruitedNeutralIds.size > 0 ? '已有名士投效，声望渐起。' : '洛阳传来名士流落消息。',
    ].join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '19px',
      color: '#f8ecd0',
      lineSpacing: 10,
      wordWrap: { width: 390 },
    }))
    ;(['local', 'nearby', 'all'] as TalentScope[]).forEach((scope, index) => {
      this.makeButton(170 + index * 112, 500, this.talentScope === scope ? `${talentScopeName(scope)}✓` : talentScopeName(scope), () => {
        this.talentScope = scope
        this.talentPage = 0
        this.showTalentSearch(city)
      }, this.overlayLayer, 96, 34, 15)
    })
    const pageSize = 4
    const pageData = this.pagedItems(candidates, this.talentPage, pageSize)
    this.talentPage = pageData.page
    this.drawListViewport(628, 218, 530, 304)
    if (pageData.items.length === 0) {
      this.overlayLayer.add(this.add.text(892, 354, '此范围暂无可访在野人才。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
    }
    pageData.items.forEach((officer, index) => {
      const y = 244 + index * 70
      const recruited = this.recruitedNeutralIds.has(officer.id)
      this.overlayLayer.add(this.add.rectangle(636, y - 22, 500, 58, 0x21160f, 0.9).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
      this.overlayLayer.add(this.add.text(660, y - 12, `${officer.name}｜${officer.role}｜${cityName(officer.location)}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#f8df9d',
        wordWrap: { width: 330 },
      }))
      this.overlayLayer.add(this.add.text(660, y + 12, `武${officer.war} 智${officer.intel} 政${officer.gov} 魅${officer.charm} 成${this.recruitChance(officer, city)}%`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#f8ecd0',
      }))
      this.makeButton(1038, y + 7, recruited ? '已登用' : '登用', () => this.confirmRecruitOfficer(city, officer), this.overlayLayer, 108, 32)
    })
    this.drawPager(890, 540, pageData.page, pageData.totalPages, () => {
      this.talentPage = Math.max(0, this.talentPage - 1)
      this.showTalentSearch(city)
    }, () => {
      this.talentPage = Math.min(pageData.totalPages - 1, this.talentPage + 1)
      this.showTalentSearch(city)
    })
    this.makeButton(438, 636, '重选发起城', () => this.showTalentActorSelection(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '推进月份', () => this.advanceCampaignMonth(), this.overlayLayer, 180, 44)
  }

  private talentCandidates(actorCity: StrategyCity, scope = this.talentScope) {
    const nearbyIds = new Set<CityId>([actorCity.id, ...actorCity.routes])
    return this.campaignOfficers
      .filter((officer) => officer.faction === 'neutral' && this.isOfficerAvailable(officer))
      .filter((officer) => {
        if (scope === 'local') return officer.location === actorCity.id
        if (scope === 'nearby') return nearbyIds.has(officer.location)
        return true
      })
      .toSorted((a, b) => {
        const locality = this.talentLocalityScore(actorCity, b) - this.talentLocalityScore(actorCity, a)
        if (locality !== 0) return locality
        return (b.intel + b.gov + b.charm + b.war) - (a.intel + a.gov + a.charm + a.war)
      })
  }

  private talentLocalityScore(actorCity: StrategyCity, officer: StrategyOfficer) {
    if (officer.location === actorCity.id) return 2
    if (actorCity.routes.includes(officer.location)) return 1
    return 0
  }

  private confirmRecruitOfficer(actorCity: StrategyCity, officer: StrategyOfficer) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    if (this.recruitedNeutralIds.has(officer.id)) {
      this.showTalentMessage(`${officer.name}已经投效。`, actorCity)
      return
    }
    this.showCampaign()
    this.showCommandConfirm({
      category: '军事',
      command: '人材',
      actor: `${actorCity.name}举荐所`,
      target: officer.name,
      scope: `${actorCity.name}访贤登用`,
      effect: `金 -20｜成功率 ${this.recruitChance(officer, actorCity)}%｜成功则${officer.name}入${actorCity.name}`,
      hint: '确认后遣使访贤',
      onConfirm: () => this.tryRecruitOfficer(actorCity, officer),
      onCancel: () => this.showTalentSearch(actorCity),
    })
  }

  private tryRecruitOfficer(actorCity: StrategyCity, officer: StrategyOfficer) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    if (this.councilState.actions <= 0) {
      this.showTalentMessage('政令已用尽，需等下月再访。', actorCity)
      return
    }
    if (actorCity.gold < 20) {
      this.showTalentMessage('府库不足，无法备礼访贤。', actorCity)
      return
    }
    this.councilState.actions -= 1
    actorCity.gold = Math.max(0, actorCity.gold - 20)
    if (Phaser.Math.Between(1, 100) <= this.recruitChance(officer, actorCity)) {
      this.recruitedNeutralIds.add(officer.id)
      officer.faction = this.playerFactionId
      officer.location = actorCity.id
      officer.role = '客将'
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 6, 0, 100)
      this.recordMonthlyAction(`${actorCity.name}登用${officer.name}`)
      this.syncSelectedCityState()
      this.showTalentMessage(`${officer.name}愿赴${actorCity.name}效力，士气 +6。`, actorCity)
    } else {
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 6, 0, 100)
      this.recordMonthlyAction(`${actorCity.name}访${officer.name}未果`)
      this.syncSelectedCityState()
      this.showTalentMessage(`${officer.name}暂未应允，但留下线索，情报 +6。`, actorCity)
    }
  }

  private recruitChance(officer: StrategyOfficer, actorCity = this.selectedCity) {
    const ruler = this.campaignOfficers.find((item) => item.faction === this.playerFactionId && item.role === '君主')
    const charm = ruler?.charm ?? 80
    const locality = actorCity ? this.talentLocalityScore(actorCity, officer) : 0
    const localityBonus = locality === 2 ? 8 : locality === 1 ? 3 : -8
    return Phaser.Math.Clamp(28 + Math.floor(charm / 4) + Math.floor(this.councilState.intel / 10) + Math.floor(this.cityState.publicOrder / 20) + localityBonus - Math.floor(officer.loyalty / 10), 8, 88)
  }

  private showTalentMessage(message: string, actorCity = this.selectedCity) {
    this.showTalentSearch(actorCity)
    this.drawToast(message, 590)
  }

  private drawCampaignMap() {
    const map = this.add.container(86, 140)
    map.add(this.add.rectangle(0, 0, 720, 430, 0x101722, 0.95).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    map.add(this.add.text(28, 24, '天下形势', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px',
      color: '#f5d487',
    }))
    map.add(this.add.text(506, 28, `显示：${mapDisplayModeName(this.mapDisplayMode)}  [K]`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '15px',
      color: '#f4dfb3',
    }))
    this.makeButton(730, 166, '切换', () => this.cycleMapDisplayMode(), this.overlayLayer, 72, 28, 14)
    const route = this.add.graphics()
    route.lineStyle(2, 0xc9a45a, 0.38)
    for (const city of this.campaignCities) {
      for (const routeId of city.routes) {
        const target = this.campaignCities.find((item) => item.id === routeId)
        if (!target || city.id > target.id) continue
        const from = campaignMapPoint(city)
        const to = campaignMapPoint(target)
        route.beginPath()
        route.moveTo(from.x, from.y)
        route.lineTo(to.x, to.y)
        route.strokePath()
      }
    }
    map.add(route)
    for (const [index, city] of this.campaignCities.entries()) {
      const faction = factionById(city.owner)
      this.drawCityNode(map, city, faction?.name.replace('军', '') ?? '群雄', faction?.color ?? 0x8a8f98, index)
    }
    this.drawAiMarchArmies(map)
    map.add(this.add.rectangle(26, 360, 666, 48, 0x21160f, 0.92).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
    map.add(this.add.text(42, 370, this.strategicDirective(), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f4dfb3',
      lineSpacing: 3,
      wordWrap: { width: 630 },
    }))
    this.overlayLayer.add(map)
  }

  private cycleMapDisplayMode() {
    const order: MapDisplayMode[] = ['compact', 'faction', 'full']
    this.mapDisplayMode = order[(order.indexOf(this.mapDisplayMode) + 1) % order.length]
    this.showCampaign()
  }

  private drawAiMarchArmies(layer: Phaser.GameObjects.Container) {
    this.aiMarchArmies.forEach((army, index) => {
      const point = this.aiArmyMapPoint(army)
      const faction = factionById(army.factionId)
      const marker = this.add.container(point.x + 12, point.y - 16 - (index % 2) * 10)
      marker.add(this.add.circle(0, 0, 11, faction?.color ?? 0x8a8f98, 0.96).setStrokeStyle(2, 0xffe1a6, 0.9))
      marker.add(this.add.text(0, -1, '军', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '13px',
        color: '#fff4cf',
      }).setOrigin(0.5))
      const target = army.targetCityId ? cityName(army.targetCityId) : '目标'
      marker.add(this.add.text(16, -8, `${faction?.ruler ?? '敌'}→${target}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '12px',
        color: '#f8ecd0',
        backgroundColor: '#14100d',
        padding: { x: 3, y: 1 },
      }))
      layer.add(marker)
    })
  }

  private aiArmyMapPoint(army: MarchArmy) {
    if (army.position.kind === 'route' && army.position.route) {
      const from = this.campaignCities.find((city) => city.id === army.position.route?.[0])
      const to = this.campaignCities.find((city) => city.id === army.position.route?.[1])
      if (from && to) {
        const fromPoint = campaignMapPoint(from)
        const toPoint = campaignMapPoint(to)
        const ratio = Phaser.Math.Clamp((army.position.progress ?? 0) / MARCH_ROUTE_STEPS, 0, 1)
        return {
          x: Phaser.Math.Linear(fromPoint.x, toPoint.x, ratio),
          y: Phaser.Math.Linear(fromPoint.y, toPoint.y, ratio),
        }
      }
    }
    const city = this.campaignCities.find((item) => item.id === (army.position.cityId ?? army.sourceCityId))
    return city ? campaignMapPoint(city) : { x: 360, y: 220 }
  }

  private strategicDirective() {
    const city = this.selectedCity
    if (!city) return '政略方针：请选择己方城池，再下达本月命令。'
    const targets = this.availableDeploymentTargets()
    const nearest = targets.toSorted((a, b) => a.troops - b.troops)[0]
    if (this.marchArmy) {
      return `政略方针：${cityName(this.marchArmy.sourceCityId)}远征军已编成，行军月可移动并攻击${this.marchArmy.targetCityId ? cityName(this.marchArmy.targetCityId) : '目标城'}。`
    }
    if (this.councilState.actions <= 0) {
      return '政略方针：本月政令已尽，可确认出征或推进月令查看诸势力动向。'
    }
    if (city.food < 900) {
      return `政略方针：${city.name}存粮偏低，宜先以内政「开发」或「运输」稳住军需。`
    }
    if (this.cityState.publicOrder < 55) {
      return `政略方针：${city.name}民心不稳，宜先行「福利」，否则月令士气会受损。`
    }
    if (nearest && nearest.troops > city.troops * 0.75) {
      return `政略方针：邻城${nearest.name}守军不弱，宜先「侦察」或「离间」，再发兵。`
    }
    if (nearest) {
      return `政略方针：${city.name}可攻取${nearest.name}，宜先以军事「征兵」或「训练」扩大胜算。`
    }
    return `政略方针：${city.name}周边暂无敌城，宜治理城池、移动武将、等待月令。`
  }

  private drawCityNode(layer: Phaser.GameObjects.Container, city: StrategyCity, status: string, color: number, index: number) {
    const point = campaignMapPoint(city)
    const selected = city.id === this.selectedCityId
    const focused = city.id === this.focusedCityId
    const ownCity = city.owner === this.playerFactionId
    const target = city.id === this.selectedTargetCityId
    const ringColor = selected ? 0xffffff : target ? 0xffd166 : focused ? 0x9fd7ff : ownCity ? 0xf8df9d : 0x7f6a48
    const radius = selected ? 25 : focused || target ? 23 : 20
    const circle = this.add.circle(point.x, point.y, radius, color, ownCity ? 0.96 : 0.84).setStrokeStyle(selected || focused || target ? 4 : 2, ringColor, selected || focused || target ? 1 : 0.85)
    circle.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.focusMapCity(city.id))
    layer.add(circle)
    layer.add(this.add.text(point.x, point.y - 1, factionShortName(city.owner), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: selected ? '13px' : '12px',
      color: '#fff6d8',
      fontStyle: 'bold',
    }).setOrigin(0.5))
    if (selected || focused || target) {
      layer.add(this.add.circle(point.x, point.y, selected ? 32 : 29, 0xf8df9d, 0).setStrokeStyle(2, ringColor, 0.7))
    }
    const showName = this.shouldShowCityName(city, selected, focused, target)
    const showStatus = this.mapDisplayMode === 'full' || selected || focused || target
    if (!showName && !showStatus) return
    const label = this.cityLabelOffset(city, index)
    const labelX = point.x + label.x
    const labelY = point.y + label.y
    if (showName) {
      const nameBg = this.add.rectangle(labelX, labelY, city.name.length * 14 + 12, 20, 0x14100d, this.mapDisplayMode === 'full' ? 0.72 : 0.88)
        .setStrokeStyle(1, ringColor, selected || focused || target ? 0.8 : 0.26)
      layer.add(nameBg)
      layer.add(this.add.text(labelX, labelY - 1, city.name, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: selected || focused || target ? '13px' : '12px',
      color: '#fff6d8',
    }).setOrigin(0.5))
    }
    if (showStatus) {
      layer.add(this.add.text(labelX, labelY + 18, status, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '12px',
      color: '#e8d4a9',
    }).setOrigin(0.5))
    }
  }

  private shouldShowCityName(city: StrategyCity, selected: boolean, focused: boolean, target: boolean) {
    if (selected || focused || target) return true
    if (this.mapDisplayMode === 'full') return true
    if (this.mapDisplayMode === 'faction') return city.id === factionById(city.owner)?.capital || city.owner === this.playerFactionId
    return city.owner === this.playerFactionId || city.id === factionById(city.owner)?.capital || city.troops >= 9000 || city.defense >= 72
  }

  private cityLabelOffset(city: StrategyCity, index: number) {
    if (this.mapDisplayMode === 'full') {
      const patterns = [
        { x: 0, y: -31 },
        { x: 32, y: -8 },
        { x: -34, y: -8 },
        { x: 0, y: 31 },
      ]
      return patterns[index % patterns.length]
    }
    if (city.y < 120) return { x: 0, y: -31 }
    if (city.x > 520) return { x: -34, y: -4 }
    if (city.x < 170) return { x: 34, y: -4 }
    return { x: 0, y: -31 }
  }

  private focusMapCity(cityId: CityId) {
    const city = this.campaignCities.find((item) => item.id === cityId)
    if (!city) return
    this.focusedCityId = city.id
    if (city.owner === this.playerFactionId) {
      this.selectedCityId = city.id
      this.syncSelectedCityState()
      this.ensureDeploymentTarget()
      this.ensureDiplomacyTarget()
      this.ensureLocalAppointments()
      this.showCampaign()
      return
    } else {
      const adjacent = this.selectedCity?.routes.includes(city.id)
      if (adjacent) {
        this.selectedTargetCityId = city.id
        this.selectedDiplomacyFactionId = city.owner
        this.showBriefing()
        return
      }
    }
    this.showCampaign()
  }

  private drawCampaignSidePanel() {
    this.overlayLayer.add(this.add.rectangle(846, 140, 332, 430, 0x101722, 0.95).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(878, 166, '城池与军情', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '28px',
      color: '#f5d487',
    }))
    const focusedCity = this.focusedCity
    const focusedFaction = focusedCity ? factionById(focusedCity.owner) : undefined
    const focusRows: [string, string][] = [
      ['光标', focusedCity?.name ?? '-'],
      ['归属', focusedFaction?.name ?? '-'],
      ['区域', focusedCity?.region ?? '-'],
      ['兵力', `${focusedCity?.troops ?? 0}`],
      ['城防', `${focusedCity?.defense ?? 0}`],
      ['府库', `${focusedCity?.gold ?? 0}`],
      ['存粮', `${focusedCity?.food ?? 0}`],
      ['人口', `${focusedCity?.population ?? 0}`],
      ['商田', `${focusedCity?.commerce ?? 0}/${focusedCity?.land ?? 0}`],
    ]
    const commandRows: [string, string][] = [
      ['命令城', this.selectedCity?.name ?? '未选'],
      ['粮草', `${this.councilState.supplies}`],
      ['士气', `${this.councilState.morale}`],
      ['情报', `${this.councilState.intel}`],
      ['政令', `${this.councilState.actions}`],
      ['民心', `${this.cityState.publicOrder}`],
      ['税率', taxRateConfig(this.cityTaxRates.get(this.selectedCityId) ?? 'normal').label],
      ['敌势', `${this.campaignClock.enemyThreat}`],
      ['军行', this.marchArmy ? `${this.marchArmy.targetCityId ? cityName(this.marchArmy.targetCityId) : '目标'}${marchStatusName(this.marchArmy.status)}` : '无'],
    ]
    this.drawStatColumn(884, 222, focusRows)
    this.drawStatColumn(1026, 222, commandRows)
    this.overlayLayer.add(this.add.rectangle(880, 472, 264, 54, 0x21160f, 0.94).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.65))
    this.overlayLayer.add(this.add.text(900, 482, `邻接：${this.selectedCity?.routes.map((id) => cityName(id)).join('、') ?? '-'}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '14px',
      color: '#f4dfb3',
      wordWrap: { width: 224 },
    }))
    this.overlayLayer.add(this.add.text(884, 538, `本月：${this.monthlyActionLog.slice(-1).join('；') || '尚未下令'}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '13px',
      color: '#ead7b3',
      wordWrap: { width: 282 },
    }))
    this.makeButton(1012, 558, '详表', () => focusedCity ? this.showCityDetail(focusedCity.id) : this.showInspection(), this.overlayLayer, 102, 30, 15)
  }

  private drawStatColumn(x: number, y: number, rows: [string, string][]) {
    rows.forEach(([label, value], index) => {
      const rowY = y + index * 23
      this.overlayLayer.add(this.add.text(x, rowY, label, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#d8c092',
      }))
      this.overlayLayer.add(this.add.text(x + 58, rowY, value, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#f8ecd0',
        wordWrap: { width: 84 },
      }))
    })
  }

  private showCityGovernance() {
    this.phase = 'city'
    this.syncSelectedCityState()
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame(`${this.cityState.name} 政厅`, '内政结果会转化为粮草、士气和出征兵源', 0.91)
    this.drawCityStatsPanel()
    this.drawCityCommandPanel()
    this.drawCitySelector()
    this.makeButton(438, 636, '切换城池', () => this.cycleControlledCity(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '任命武将', () => this.showAppointmentActorSelection(), this.overlayLayer, 180, 44)
  }

  private drawCityStatsPanel() {
    this.drawPanel(84, 144, 472, 430)
    this.drawSectionTitle(116, 174, '城池状态')
    const stats = [
      ['府库', this.cityState.treasury, 3000],
      ['粮草', this.selectedCity?.food ?? 0, 5000],
      ['兵力', this.selectedCity?.troops ?? 0, 30000],
      ['城防', this.cityState.walls, 100],
      ['民心', this.cityState.publicOrder, 100],
    ] as const
    stats.forEach(([label, value, max], index) => {
      const y = 242 + index * 54
      this.overlayLayer.add(this.add.text(120, y, label, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '21px',
        color: '#f8ecd0',
      }))
      this.overlayLayer.add(this.add.rectangle(204, y + 13, 250, 16, 0x2a2016, 0.95).setOrigin(0, 0.5))
      this.overlayLayer.add(this.add.rectangle(204, y + 13, 250 * Math.min(1, value / max), 16, 0xd4af37, 0.92).setOrigin(0, 0.5))
      this.overlayLayer.add(this.add.text(472, y, `${value}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8df9d',
      }))
    })
  }

  private drawCityCommandPanel() {
    this.overlayLayer.add(this.add.rectangle(604, 144, 590, 430, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(636, 174, '内政命令', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    const commands: [string, string, () => void][] = [
      ['开发', '金 -120，粮 +300', () => this.showCityPolicyActorSelection('内政', '开发', '本城田亩', '开发田地，粮仓渐实。', '金 -120｜粮 +300', { treasury: -120, food: 300 }, true)],
      ['调动', '移驻一名武将到邻城', () => this.showMoveActorSelection()],
      ['情报', '查看本城与邻城军情', () => this.showIntelActorSelection('内政')],
      ['福利', '金 -100，民心 +10，士气 +2', () => this.showCityPolicyActorSelection('内政', '福利', '本城百姓', '开仓赈济，民心渐定。', '金 -100｜民心 +10｜士气 +2', { treasury: -100, publicOrder: 10, morale: 2 }, true)],
      ['任命', '任命太守、先锋、军师', () => this.showAppointmentActorSelection()],
      ['税率', '轻/常/重税，月令结算', () => this.showTaxActorSelection()],
      ['教育', '教育武将或本城吏士', () => this.showEducationActorSelection()],
      ['运输', '选择发运量，支援粮仓或邻城', () => this.showTransportActorSelection()],
    ]
    commands.forEach(([label, desc, callback], index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = 704 + col * 252
      const y = 230 + row * 82
      this.makeButton(x, y, label, callback, this.overlayLayer, 136, 38)
      this.overlayLayer.add(this.add.text(x - 66, y + 28, desc, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#ead7b3',
        wordWrap: { width: 200 },
      }))
    })
  }

  private transportSupplies(target: TransportTarget, actorCity: StrategyCity, amount: TransportAmount, kind: MoveResourceKind) {
    const city = actorCity
    const foodConfig = transportAmountConfig(amount)
    const moveConfig = moveResourceConfig(kind, amount)
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，无法转运物资。')
      return
    }
    const targetCity = target !== 'expedition' ? this.campaignCities.find((item) => item.id === target) : undefined
    if (target !== 'expedition' && !targetCity) {
      this.showCityMessage('运输目标无效。')
      return
    }
    if (target === 'expedition') {
      if (kind !== 'food') {
        this.showCityMessage('远征粮仓只接收粮草。')
        return
      }
      if (city.food < foodConfig.sourceFood) {
        this.showCityMessage(`${city.name}存粮不足，无法执行${foodConfig.label}。`)
        return
      }
      city.food = Math.max(0, city.food - foodConfig.sourceFood)
      this.councilState.supplies = Phaser.Math.Clamp(this.councilState.supplies + foodConfig.expeditionGain, 0, 150)
    } else if (targetCity) {
      const available = kind === 'troops' ? Math.max(0, city.troops - 500) : city[kind]
      if (available < moveConfig.amount) {
        this.showCityMessage(`${city.name}${moveResourceName(kind)}不足，无法执行${moveConfig.label}。`)
        return
      }
      const gain = transportCityGain(kind, amount)
      city[kind] = Math.max(kind === 'troops' ? 500 : 0, city[kind] - moveConfig.amount)
      targetCity[kind] = Math.min(moveResourceCap(kind), targetCity[kind] + gain)
    }
    this.councilState.actions -= 1
    const label = target === 'expedition' ? foodConfig.label : `${moveConfig.label}${moveResourceName(kind)}`
    this.recordMonthlyAction(target === 'expedition' ? `${city.name}${label}入远征仓` : `${city.name}${label}至${targetCity?.name ?? '邻城'}`)
    this.syncSelectedCityState()
    this.showCityMessage(target === 'expedition'
      ? `${foodConfig.label}入远征仓，行军粮草 +${foodConfig.expeditionGain}。`
      : `${label}抵达${targetCity?.name ?? '邻城'}，目标城${moveResourceName(kind)} +${transportCityGain(kind, amount)}。`)
  }

  private drawCitySelector() {
    const controlled = this.campaignCities.filter((city) => city.owner === this.playerFactionId)
    this.overlayLayer.add(this.add.text(116, 540, `${this.playerFaction.name}城池：${controlled.map((city) => city.name).join('、')}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f4dfb3',
    }))
  }

  private officerGovBonus(officer?: StrategyOfficer): number {
    if (!officer) return 1
    const gov = officer.gov
    return gov >= 90 ? 1.20 : gov >= 75 ? 1.12 : gov >= 60 ? 1.05 : 0.95
  }

  private applyCityPolicy(message: string, delta: CityPolicyDelta, officer?: StrategyOfficer) {
    const city = this.selectedCity
    if (!city) return
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，请出征或推进月令。')
      return
    }
    if ((delta.treasury ?? 0) < 0 && city.gold + (delta.treasury ?? 0) < 0) {
      this.showCityMessage('府库不足，无法施行政令。')
      return
    }
    const govBonus = this.officerGovBonus(officer)
    const scale = (value: number) => value >= 0 ? Math.floor(value * govBonus) : value
    city.gold = Phaser.Math.Clamp(city.gold + (delta.treasury ?? 0), 0, 3000)
    city.food = Phaser.Math.Clamp(city.food + scale(delta.food ?? 0), 0, 5000)
    this.councilState.supplies = Phaser.Math.Clamp(this.councilState.supplies + (delta.supplies ?? 0), 0, 150)
    city.troops = Phaser.Math.Clamp(city.troops + (delta.recruits ?? 0), 0, 30000)
    city.defense = Phaser.Math.Clamp(city.defense + scale(delta.walls ?? 0), 0, 100)
    city.population = Math.max(8000, Math.floor((city.population ?? this.initializeCityEconomy(city).population ?? 20000) + scale(delta.population ?? 0)))
    city.commerce = Phaser.Math.Clamp((city.commerce ?? this.initializeCityEconomy(city).commerce ?? 35) + scale(delta.commerce ?? 0), 0, 100)
    city.land = Phaser.Math.Clamp((city.land ?? this.initializeCityEconomy(city).land ?? 35) + scale(delta.land ?? 0), 0, 100)
    city.irrigation = Phaser.Math.Clamp((city.irrigation ?? this.initializeCityEconomy(city).irrigation ?? 35) + scale(delta.irrigation ?? 0), 0, 100)
    city.disaster = Phaser.Math.Clamp((city.disaster ?? 0) + (delta.disaster ?? 0), 0, 100)
    this.setCityPublicOrder(city, this.cityPublicOrder(city) + scale(delta.publicOrder ?? 0))
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + scale(delta.morale ?? 0), 0, 100)
    this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + (delta.intel ?? 0), 0, 100)
    this.councilState.actions -= 1
    const officerSuffix = officer ? `（${officer.name}政${officer.gov}）` : ''
    this.recordMonthlyAction(`${message.startsWith(city.name) ? message : `${city.name}${message}`}${officerSuffix}`)
    this.syncSelectedCityState()
    this.showCityMessage(`${message}${officerSuffix}`)
  }

  private showCityMessage(message: string) {
    this.showCampaign()
    this.playCommandSignal(message)
    this.drawToast(message, 548)
  }

  private cycleControlledCity() {
    const controlled = this.campaignCities.filter((city) => city.owner === this.playerFactionId)
    const index = controlled.findIndex((city) => city.id === this.selectedCityId)
    const next = controlled[(index + 1 + controlled.length) % controlled.length]
    if (next) this.selectedCityId = next.id
    this.ensureDeploymentTarget()
    this.ensureDiplomacyTarget()
    this.ensureLocalAppointments()
    this.showCityGovernance()
  }

  private syncSelectedCityState() {
    const city = this.selectedCity
    if (!city) return
    this.cityState.name = city.name
    this.cityState.treasury = city.gold
    this.cityState.recruits = city.troops
    this.cityState.walls = city.defense
    this.cityState.publicOrder = city.publicOrder ?? this.cityState.publicOrder
  }

  private showHeroManagement() {
    this.phase = 'heroes'
    this.ensureLocalAppointments()
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('武将任命', '太守影响内政，先锋影响出征，军师影响情报', 0.91)
    this.drawHeroCards()
    this.drawAppointmentPanel()
    this.makeButton(540, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(740, 636, '移动武将', () => this.showMoveActorSelection(), this.overlayLayer, 180, 44)
  }

  private drawHeroCards() {
    const heroes = this.currentCityOfficers()
    if (heroes.length === 0) {
      this.overlayLayer.add(this.add.rectangle(92, 150, 1096, 340, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
      this.overlayLayer.add(this.add.text(640, 300, `${this.selectedCity?.name ?? '当前城'}暂无本军武将，请从人事移动或访贤登用补充。`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '24px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
      return
    }
    const pageSize = 8
    const pageData = this.pagedItems(heroes, this.heroManagementPage, pageSize)
    this.heroManagementPage = pageData.page
    pageData.items.forEach((officer, index) => {
      const x = 92 + (index % 4) * 278
      const y = 150 + Math.floor(index / 4) * 172
      this.overlayLayer.add(this.add.rectangle(x, y, 244, 160, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
      const key = officerPortraitKey(officer.id)
      if (this.textures.exists(key)) {
        this.overlayLayer.add(this.add.image(x + 54, y + 70, key).setDisplaySize(72, 86))
      }
      this.overlayLayer.add(this.add.text(x + 112, y + 24, `${officer.name}`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '25px',
        color: '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(x + 112, y + 54, `${officer.role}｜${cityName(officer.location)}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '17px',
        color: '#ead7b3',
      }))
      const lines = [
        `统 ${officer.command}  武 ${officer.war}`,
        `兵 ${officerTroops(officer)}  武装 ${officerWeapons(officer)}`,
        `训练 ${officerTraining(officer)}  忠 ${officer.loyalty}`,
      ]
      this.overlayLayer.add(this.add.text(x + 112, y + 84, lines.join('\n'), {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '17px',
        color: '#f8ecd0',
        lineSpacing: 6,
      }))
    })
    this.drawPager(640, 488, pageData.page, pageData.totalPages, () => {
      this.heroManagementPage = Math.max(0, this.heroManagementPage - 1)
      this.showHeroManagement()
    }, () => {
      this.heroManagementPage = Math.min(pageData.totalPages - 1, this.heroManagementPage + 1)
      this.showHeroManagement()
    })
  }

  private drawAppointmentPanel() {
    this.overlayLayer.add(this.add.rectangle(182, 510, 916, 84, 0x21160f, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    const governor = this.appointedOfficer('governor')
    const vanguard = this.appointedOfficer('vanguard')
    const strategist = this.appointedOfficer('strategist')
    this.overlayLayer.add(this.add.text(210, 532, `太守：${governor?.name ?? '-'}    先锋：${vanguard?.name ?? '-'}    军师：${strategist?.name ?? '-'}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f8df9d',
    }))
    this.makeButton(720, 552, '任太守', () => this.showAppointmentActorSelection('governor'), this.overlayLayer, 132, 36)
    this.makeButton(858, 552, '任先锋', () => this.showAppointmentActorSelection('vanguard'), this.overlayLayer, 132, 36)
    this.makeButton(996, 552, '任军师', () => this.showAppointmentActorSelection('strategist'), this.overlayLayer, 132, 36)
  }

  private showAppointmentActorSelection(role?: keyof typeof this.appointments) {
    const cities = this.controlledCities().filter((city) => this.officersInCity(city.id).length > 0)
    this.showCampaign()
    this.showModalGrid(
      `内政｜任命${role ? `：${appointmentRoleName(role)}` : '：选择发起城'}`,
      '任命命令先确定发起城，再选择职位和本城武将。',
      cities.map((city) => {
      const officers = this.officersInCity(city.id)
        return {
          label: city.name,
          detail: `武将${officers.length}｜金${city.gold} 民心${this.cityState.publicOrder}`,
          onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        if (role) this.showAppointmentSelection(role, city)
        else this.showAppointmentRoleSelection(city)
          },
        }
      }),
      () => this.showCampaign(),
    )
  }

  private showAppointmentRoleSelection(actorCity: StrategyCity) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    this.showCampaign()
    const roles: [keyof typeof this.appointments, string][] = [['governor', '太守'], ['vanguard', '先锋'], ['strategist', '军师']]
    this.showModalGrid(
      '内政｜任命：选择职位',
      `${actorCity.name}太守府发起任命`,
      roles.map(([role, label]) => ({
        label,
        detail: role === 'governor' ? '影响民心' : role === 'vanguard' ? '影响远征' : '影响情报',
        onSelect: () => this.showAppointmentSelection(role, actorCity),
      })),
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选发起城', onSelect: () => this.showAppointmentActorSelection() },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private showAppointmentSelection(role: keyof typeof this.appointments, actorCity = this.selectedCity) {
    const city = actorCity
    if (!city) return
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    const officers = this.officersInCity(city.id)
    if (officers.length === 0) {
      this.showHeroMessage('本城没有可任命武将。')
      return
    }
    this.showCampaign()
    this.showModalGrid(
      `${city.name}｜选择${appointmentRoleName(role)}`,
      `${city.name}太守府发起任命`,
      officers.map((officer) => ({
        label: officer.name,
        detail: `统${officer.command} 武${officer.war} 智${officer.intel} 政${officer.gov}`,
        onSelect: () => this.confirmAppointment(role, officer, city),
      })),
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选职位', onSelect: () => this.showAppointmentRoleSelection(city) },
        { label: '重选发起城', onSelect: () => this.showAppointmentActorSelection(role) },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private confirmAppointment(role: keyof typeof this.appointments, officer: StrategyOfficer, actorCity: StrategyCity) {
    const city = actorCity
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category: '内政',
      command: '任命',
      actor: `${city.name}太守府`,
      target: `${officer.name}任${appointmentRoleName(role)}`,
      scope: `${city.name}武将任命`,
      effect: this.appointmentEffectText(role, officer),
      hint: '确认后调整本城职任',
      onConfirm: () => this.executeAppointment(role, officer, city),
      onCancel: () => this.showAppointmentSelection(role, city),
    })
  }

  private executeAppointment(role: keyof typeof this.appointments, officer: StrategyOfficer, actorCity: StrategyCity) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    this.appointments[role] = officer.id
    this.addOfficerMerit(officer, 8)
    this.addOfficerFatigue(officer, 4)
    this.applyAppointmentEffects()
    this.showHeroMessage(`${officer.name}已任${appointmentRoleName(role)}。`)
  }

  private appointmentEffectText(role: keyof typeof this.appointments, officer: StrategyOfficer) {
    if (role === 'governor') return `民心按${officer.name}政务与守备重算`
    if (role === 'vanguard') return `出征主将改为${officer.name}，影响远征主帅`
    return `情报按${officer.name}智略重算`
  }

  private showHeroMessage(message: string) {
    this.showHeroManagement()
    this.drawToast(message, 602)
  }

  private applyAppointmentEffects() {
    const governor = this.appointedOfficer('governor')
    const strategist = this.appointedOfficer('strategist')
    if (governor) {
      const govBonus = Math.floor((governor.gov - 60) * 0.28)
      const charmBonus = Math.floor((governor.charm - 60) * 0.18)
      const newOrder = Phaser.Math.Clamp(58 + govBonus + charmBonus, 0, 100)
      const city = this.campaignCities.find((c) => c.id === governor.location)
      if (city) this.setCityPublicOrder(city, newOrder)
      this.cityState.publicOrder = newOrder
    }
    if (strategist) {
      this.councilState.intel = Phaser.Math.Clamp(12 + Math.floor(strategist.intel * 0.82), 0, 100)
    }
  }

  private showMoveActorSelection() {
    const cities = this.controlledCities().filter((city) => this.controlledNeighborCitiesFrom(city).length > 0 && this.canMoveAnythingFrom(city))
    if (this.councilState.actions <= 0) {
      this.showHeroMessage('本月政令已用尽，不能调动。')
      return
    }
    this.showCampaign()
    this.showModalGrid(
      '内政｜调动：选择发起城',
      '调动命令先确定发起城，再选择调将、调兵、调粮或调金。',
      cities.map((city) => {
      const officers = this.movableOfficersInCity(city.id)
        return {
          label: city.name,
          detail: `将${officers.length}｜兵${city.troops}｜粮${city.food}｜金${city.gold}`,
          onSelect: () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        this.showMoveKindSelection(city)
          },
        }
      }),
      () => this.showCampaign(),
    )
  }

  private showMoveKindSelection(actorCity: StrategyCity) {
    const city = actorCity
    const officers = this.movableOfficersInCity(city.id)
    const destinations = this.controlledNeighborCitiesFrom(city)
    if (destinations.length === 0) {
      this.showHeroMessage('当前没有相邻己方目的城。')
      return
    }
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    const firstDestination = destinations[0]
    const items: [string, string, boolean, () => void][] = [
      ['调将', `可调武将 ${officers.length}`, officers.length > 0, () => this.showMoveOfficerSelection(city, officers[0].id, firstDestination.id)],
      ['调兵', `可调兵 ${Math.max(0, city.troops - 500)}`, city.troops > 800, () => this.showMoveResourceSelection(city, 'troops', firstDestination.id, 'medium')],
      ['调粮', `存粮 ${city.food}`, city.food >= moveResourceConfig('food', 'small').amount, () => this.showMoveResourceSelection(city, 'food', firstDestination.id, 'medium')],
      ['调金', `府库 ${city.gold}`, city.gold >= moveResourceConfig('gold', 'small').amount, () => this.showMoveResourceSelection(city, 'gold', firstDestination.id, 'medium')],
    ]
    this.showModalGrid(
      '内政｜调动：选择对象',
      `${city.name}可向${destinations.map((item) => item.name).join('、')}调动`,
      items.map(([label, hint, enabled, callback]) => ({
        label: enabled ? label : `${label}-`,
        detail: hint,
        onSelect: enabled ? callback : () => this.showCampaignMessage(`${label}条件不足。`),
      })),
      () => this.showCampaign(),
      '取消',
      [
        { label: '重选发起城', onSelect: () => this.showMoveActorSelection() },
        { label: '取消', onSelect: () => this.showCampaign() },
      ],
    )
  }

  private showMoveOfficerSelection(actorCity: StrategyCity, officerId: string, destinationId: CityId) {
    const officers = this.movableOfficersInCity(actorCity.id)
    const destinations = this.controlledNeighborCitiesFrom(actorCity)
    const officer = officers.find((item) => item.id === officerId) ?? officers[0]
    const destination = destinations.find((item) => item.id === destinationId) ?? destinations[0]
    if (!officer || !destination) {
      this.showHeroMessage('当前没有可调动的武将或目的城。')
      return
    }
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    this.showCampaign()
    const moveActions: ModalGridItem[] = [
      { label: '重选对象', onSelect: () => this.showMoveKindSelection(actorCity) },
      { label: '取消', onSelect: () => this.showCampaign() },
      { label: '确认', onSelect: () => this.confirmMoveOfficer(actorCity, officer, destination) },
    ]
    if (officers.length > 1) {
      moveActions.push({ label: '全员', onSelect: () => this.confirmMoveOfficers(actorCity, officers, destination) })
    }
    this.showModalChoiceColumns('内政｜调动：调动武将', `${actorCity.name}太守府发起调将`, [
      {
        title: '选择武将',
        items: officers.map((item) => ({
          label: item.name,
          selected: item.id === officer.id,
          onSelect: () => this.showMoveOfficerSelection(actorCity, item.id, destination.id),
        })),
      },
      {
        title: '目的城',
        items: destinations.map((item) => ({
          label: item.name,
          selected: item.id === destination.id,
          onSelect: () => this.showMoveOfficerSelection(actorCity, officer.id, item.id),
        })),
      },
    ], `${officer.name}：${cityName(officer.location)} → ${destination.name}${officers.length > 1 ? `｜全员${officers.length}将可一并调动` : ''}`, moveActions)
  }

  private confirmMoveOfficer(actorCity: StrategyCity, officer: StrategyOfficer, destination: StrategyCity) {
    const city = actorCity
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category: '内政',
      command: '调动',
      actor: `${city.name}太守府`,
      target: officer.name,
      scope: `${city.name} → ${destination.name}`,
      effect: `移动${officer.name}至${destination.name}｜政令 -1`,
      hint: '确认后调动武将',
      onConfirm: () => this.executeMoveOfficer(city, officer, destination),
      onCancel: () => this.showMoveOfficerSelection(city, officer.id, destination.id),
    })
  }

  private confirmMoveOfficers(actorCity: StrategyCity, officers: StrategyOfficer[], destination: StrategyCity) {
    const city = actorCity
    const movable = officers.filter((officer) => officer.location === city.id && officer.role !== '君主')
    this.selectedCityId = city.id
    this.focusedCityId = city.id
    this.syncSelectedCityState()
    this.showCampaign()
    const names = movable.map((officer) => officer.name).join('、')
    this.showCommandConfirm({
      category: '内政',
      command: '调动',
      actor: `${city.name}太守府`,
      target: `${destination.name}诸将`,
      scope: `${city.name} → ${destination.name}`,
      effect: `调动 ${names}｜共${movable.length}将｜政令 -1`,
      hint: '确认后批量调动武将',
      onConfirm: () => this.executeMoveOfficers(city, movable, destination),
      onCancel: () => this.showMoveOfficerSelection(city, movable[0]?.id ?? officers[0]?.id, destination.id),
    })
  }

  private showMoveResourceSelection(actorCity: StrategyCity, kind: MoveResourceKind, destinationId: CityId, amount: TransportAmount) {
    const city = actorCity
    const destinations = this.controlledNeighborCitiesFrom(city)
    const destination = destinations.find((item) => item.id === destinationId) ?? destinations[0]
    if (!destination) {
      this.showHeroMessage('当前没有相邻己方目的城。')
      return
    }
    this.selectedCityId = city.id
    this.focusedCityId = destination.id
    this.syncSelectedCityState()
    this.showCampaign()
    const config = moveResourceConfig(kind, amount)
    this.showModalChoiceColumns(`内政｜调动：调动${moveResourceName(kind)}`, `${city.name}太守府发起物资调动`, [
      {
        title: '目的城',
        items: destinations.map((item) => ({
          label: item.name,
          selected: item.id === destination.id,
          onSelect: () => this.showMoveResourceSelection(city, kind, item.id, amount),
        })),
      },
      {
        title: '数量',
        items: (['small', 'medium', 'large'] as TransportAmount[]).map((item) => {
          const itemConfig = moveResourceConfig(kind, item)
          return {
            label: itemConfig.label,
            detail: `${itemConfig.amount}`,
            selected: item === amount,
            onSelect: () => this.showMoveResourceSelection(city, kind, destination.id, item),
          }
        }),
      },
    ], `${city.name} → ${destination.name}｜${config.label}${moveResourceName(kind)} ${config.amount}`, [
      { label: '重选对象', onSelect: () => this.showMoveKindSelection(city) },
      { label: '取消', onSelect: () => this.showCampaign() },
      { label: '确认', onSelect: () => this.confirmMoveResource(city, destination, kind, amount) },
    ])
  }

  private confirmMoveResource(actorCity: StrategyCity, destination: StrategyCity, kind: MoveResourceKind, amount: TransportAmount) {
    const city = actorCity
    const config = moveResourceConfig(kind, amount)
    this.selectedCityId = city.id
    this.focusedCityId = destination.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category: '内政',
      command: '调动',
      actor: `${city.name}太守府`,
      target: `${destination.name}${moveResourceName(kind)}`,
      scope: `${city.name} → ${destination.name}`,
      effect: `${config.label}${moveResourceName(kind)} ${config.amount}｜政令 -1`,
      hint: '确认后调动物资',
      onConfirm: () => this.executeMoveResource(city, destination, kind, amount),
      onCancel: () => this.showMoveResourceSelection(city, kind, destination.id, amount),
    })
  }

  private executeMoveResource(actorCity: StrategyCity, destination: StrategyCity, kind: MoveResourceKind, amount: TransportAmount) {
    const config = moveResourceConfig(kind, amount)
    this.selectedCityId = actorCity.id
    this.focusedCityId = destination.id
    this.syncSelectedCityState()
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，不能调动。')
      return
    }
    if (!this.controlledNeighborCitiesFrom(actorCity).some((city) => city.id === destination.id)) {
      this.showCityMessage('目的城不是相邻己方城，无法调动。')
      return
    }
    const available = kind === 'troops' ? Math.max(0, actorCity.troops - 500) : actorCity[kind]
    if (available < config.amount) {
      this.showCityMessage(`${actorCity.name}${moveResourceName(kind)}不足，无法执行${config.label}。`)
      return
    }
    actorCity[kind] = Math.max(kind === 'troops' ? 500 : 0, actorCity[kind] - config.amount)
    destination[kind] = Math.min(moveResourceCap(kind), destination[kind] + config.amount)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${actorCity.name}${config.label}${moveResourceName(kind)}至${destination.name}`)
    this.syncSelectedCityState()
    this.showCityMessage(`${config.label}${moveResourceName(kind)}已调往${destination.name}。`)
  }

  private executeMoveOfficer(actorCity: StrategyCity, officer: StrategyOfficer, destination: StrategyCity) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，不能调动。')
      return
    }
    if (!this.controlledNeighborCitiesFrom(actorCity).some((city) => city.id === destination.id)) {
      this.showCityMessage('目的城不是相邻己方城，无法调动。')
      return
    }
    officer.location = destination.id
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${officer.name}移驻${destination.name}`)
    this.ensureLocalAppointments()
    this.showHeroMessage(`${officer.name}已移往${destination.name}。`)
  }

  private executeMoveOfficers(actorCity: StrategyCity, officers: StrategyOfficer[], destination: StrategyCity) {
    this.selectedCityId = actorCity.id
    this.focusedCityId = actorCity.id
    this.syncSelectedCityState()
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，不能调动。')
      return
    }
    if (!this.controlledNeighborCitiesFrom(actorCity).some((city) => city.id === destination.id)) {
      this.showCityMessage('目的城不是相邻己方城，无法调动。')
      return
    }
    const movable = officers.filter((officer) => officer.location === actorCity.id && officer.role !== '君主')
    if (movable.length === 0) {
      this.showHeroMessage('当前没有可批量调动的武将。')
      return
    }
    movable.forEach((officer) => {
      officer.location = destination.id
    })
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${movable.map((officer) => officer.name).join('、')}移驻${destination.name}`)
    this.ensureLocalAppointments()
    this.showHeroMessage(`${movable.length}名武将已移往${destination.name}。`)
  }

  private showDeployment() {
    if (this.marchArmy) {
      this.showCampaignMessage('已有远征军在外，请在行军月继续移动、攻击或撤退后再下达新出征令。')
      return
    }
    this.phase = 'deploy'
    this.ensureDeploymentTarget()
    this.ensureDeploymentSelection()
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.drawPageFrame('行军出征', '确认兵粮、任命与敌情后发兵')
    this.drawDeploymentSummary()
    this.drawDeploymentRoster()
    this.makeButton(438, 636, '重选发起城', () => this.showDeploymentActorSelection(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '确认出征', () => this.confirmDeployment(), this.overlayLayer, 180, 44)
  }

  private showDeploymentActorSelection() {
    if (this.marchArmy) {
      this.showCampaignMessage('已有远征军在外，请先处理当前出征。')
      return
    }
    const cities = this.controlledCities().filter((city) => this.deployableOfficersInCity(city.id).length > 0 && this.diplomacyTargetsFrom(city).length > 0)
    this.showCampaign()
    this.showModalGrid('军事｜出征：选择发起城', '出征命令先确定发兵城，再选择随军武将、粮草和邻接目标城。', cities.map((city) => {
      const officers = this.deployableOfficersInCity(city.id)
      const targets = this.diplomacyTargetsFrom(city)
      return {
        label: city.name,
        detail: `武将${officers.length}｜邻敌${targets.length}｜粮${city.food}`,
        onSelect: () => {
          this.selectedCityId = city.id
          this.focusedCityId = city.id
          this.selectedTargetCityId = targets[0]?.id
          this.deploymentOfficerIds.clear()
          this.deploymentTroopAllocations.clear()
          this.deploymentFoodAllocations.clear()
          this.deploymentFood = undefined
          this.syncSelectedCityState()
          this.ensureDeploymentSelection()
          this.showDeployment()
        },
      }
    }), () => {
      this.showCampaign()
      this.showMilitaryCommand()
    })
  }

  private drawDeploymentSummary() {
    const vanguard = heroById(this.appointments.vanguard)
    const strategist = heroById(this.appointments.strategist)
    const supplyNeed = this.deploymentSupplyNeed()
    const selectedFood = this.selectedDeploymentFood()
    const risk = this.campaignClock.enemyThreat >= 75 ? '极高' : this.campaignClock.enemyThreat >= 55 ? '偏高' : '可控'
    const source = this.selectedCity
    const target = this.selectedTargetCity
    this.overlayLayer.add(this.add.rectangle(86, 140, 420, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(118, 170, '军情确认', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    const lines = [
      `出发        ${source?.name ?? '-'}`,
      `目标        ${target?.name ?? '未定'}`,
      `守军        ${target?.troops ?? 0}`,
      `先锋        ${vanguard?.name ?? '-'}`,
      `军师        ${strategist?.name ?? '-'}`,
      `本城存粮    ${source?.food ?? 0}`,
      `士气        ${this.councilState.morale}`,
      `情报        ${this.councilState.intel}`,
      `行军粮草    ${this.councilState.supplies}/${selectedFood}`,
      `敌势        ${this.campaignClock.enemyThreat}（${risk}）`,
      `最低军粮    ${supplyNeed}`,
      `补给来源    内政「运输」转入`,
    ]
    this.overlayLayer.add(this.add.text(122, 230, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '17px',
      color: '#f8ecd0',
      lineSpacing: 4,
    }))
    const foodOptions: [string, number][] = [
      ['最低', supplyNeed],
      ['标准', supplyNeed + 10],
      ['充足', supplyNeed + 20],
    ]
    foodOptions.forEach(([label, amount], index) => {
      const capped = Math.min(this.councilState.supplies, amount)
      this.makeButton(160 + index * 112, 532, `${label}${capped}`, () => {
        this.deploymentFood = capped
        this.rebalanceDeploymentFood(capped)
        this.showDeployment()
      }, this.overlayLayer, 96, 34)
    })
  }

  private drawDeploymentRoster() {
    this.overlayLayer.add(this.add.rectangle(548, 140, 646, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(580, 170, '出战武将', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    const officers = this.deployableCurrentCityOfficers()
    const manifest = new Map(this.selectedDeploymentManifest().map((item) => [item.officer.id, item]))
    const pageSize = 4
    const pageData = this.pagedItems(officers, this.deploymentRosterPage, pageSize)
    this.deploymentRosterPage = pageData.page
    this.drawListViewport(570, 214, 596, 258)
    pageData.items.forEach((officer, index) => {
      const unitId = unitIdForOfficerId(officer.id)
      const unit = unitId ? heroById(unitId) : undefined
      if (!unit || !unitId) return
      const x = 588 + (index % 2) * 288
      const y = 230 + Math.floor(index / 2) * 120
      this.overlayLayer.add(this.add.rectangle(x, y, 268, 102, 0x21160f, 0.92).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.65))
      const key = `portrait-${unit.id}`
      if (this.textures.exists(key)) {
        this.overlayLayer.add(this.add.image(x + 44, y + 50, key).setDisplaySize(58, 72))
      }
      const roles = roleLabels(officer.id, this.appointments)
      const selected = this.deploymentOfficerIds.has(officer.id)
      const detail = manifest.get(officer.id)
      this.overlayLayer.add(this.add.text(x + 88, y + 14, unit.name, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '19px',
        color: '#f8df9d',
      }))
      this.makeButton(x + 220, y + 22, selected ? '随军' : '留守', () => this.toggleDeploymentOfficer(officer.id), this.overlayLayer, 82, 30)
      if (selected) {
        this.overlayLayer.add(this.add.circle(x + 250, y + 14, 6, 0xf8df9d, 0.95))
      }
      this.overlayLayer.add(this.add.text(x + 88, y + 42, roles || '随军武将', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#d8c092',
        wordWrap: { width: 154 },
      }))
      const equipment = officerEquipment(officer)
      this.overlayLayer.add(this.add.text(x + 88, y + 64, `兵${detail?.troops ?? officerTroops(officer)}/${officerTroops(officer)} 粮${detail?.food ?? 0}\n${officerTroopTypeName(officer)} 枪${equipment.spear}弓${equipment.bow}马${equipment.horse}甲${equipment.armor}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#f8ecd0',
        lineSpacing: 2,
        wordWrap: { width: 150 },
      }))
      if (selected) {
        this.makeButton(x + 34, y + 90, '兵-', () => this.adjustDeploymentOfficerTroops(officer.id, -200), this.overlayLayer, 48, 24)
        this.makeButton(x + 86, y + 90, '兵+', () => this.adjustDeploymentOfficerTroops(officer.id, 200), this.overlayLayer, 48, 24)
        this.makeButton(x + 138, y + 90, '粮-', () => this.adjustDeploymentOfficerFood(officer.id, -2), this.overlayLayer, 48, 24)
        this.makeButton(x + 190, y + 90, '粮+', () => this.adjustDeploymentOfficerFood(officer.id, 2), this.overlayLayer, 48, 24)
      }
    })
    if (officers.length === 0) {
      this.overlayLayer.add(this.add.text(872, 322, '本城暂无可出战武将。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
    }
    this.drawPager(868, 486, pageData.page, pageData.totalPages, () => {
      this.deploymentRosterPage = Math.max(0, this.deploymentRosterPage - 1)
      this.showDeployment()
    }, () => {
      this.deploymentRosterPage = Math.min(pageData.totalPages - 1, this.deploymentRosterPage + 1)
      this.showDeployment()
    }, 164)
    this.drawDeploymentTargets()
  }

  private drawDeploymentTargets() {
    const targets = this.availableDeploymentTargets()
    this.drawListViewport(570, 494, 596, 60, '邻接目标')
    if (targets.length === 0) {
      this.overlayLayer.add(this.add.text(704, 521, '当前城池周边暂无可攻目标。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#ead7b3',
      }))
      return
    }
    const pageSize = 2
    const pageData = this.pagedItems(targets, this.deploymentTargetPage, pageSize)
    this.deploymentTargetPage = pageData.page
    pageData.items.forEach((city, index) => {
      const x = 724 + index * 150
      const selected = city.id === this.selectedTargetCityId
      this.makeButton(x, 518, selected ? `${city.name}*` : city.name, () => {
        this.selectedTargetCityId = city.id
        this.showDeployment()
      }, this.overlayLayer, 126, 32)
      this.overlayLayer.add(this.add.text(x, 546, `${factionById(city.owner)?.name ?? '群雄'} 兵${city.troops}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '13px',
        color: '#ead7b3',
      }).setOrigin(0.5))
    })
    this.drawPager(1120, 518, pageData.page, pageData.totalPages, () => {
      this.deploymentTargetPage = Math.max(0, this.deploymentTargetPage - 1)
      this.showDeployment()
    }, () => {
      this.deploymentTargetPage = Math.min(pageData.totalPages - 1, this.deploymentTargetPage + 1)
      this.showDeployment()
    }, 88)
  }

  private confirmDeployment() {
    if (this.marchArmy) {
      this.showDeploymentMessage('已有远征军在外，请先处理当前出征。')
      return
    }
    this.ensureDeploymentTarget()
    this.ensureDeploymentSelection()
    const source = this.selectedCity
    const target = this.selectedTargetCity
    if (!source) return
    if (!target) {
      this.showDeploymentMessage('没有邻接敌城，无法出征。请先切换城池。')
      return
    }
    if (this.selectedDeploymentOfficers().length === 0) {
      this.showDeploymentMessage('本城没有可出战武将，请先移动武将。')
      return
    }
    const supplyNeed = this.deploymentSupplyNeed()
    const selectedFood = this.selectedDeploymentFood()
    if (this.councilState.supplies < selectedFood || selectedFood < supplyNeed) {
      this.showDeploymentMessage('粮草不足，无法出征。请先治理城池或运输军粮。')
      return
    }
    const troops = this.currentCityDeploymentTroops()
    const manifest = this.selectedDeploymentManifest(selectedFood)
    const officers = manifest.map(({ officer, troops, food }) => `${officer.name}兵${troops}粮${food}`).join('、')
    this.showCommandConfirm({
      category: '军事',
      command: '出征',
      actor: `${source.name}太守府`,
      target: target.name,
      scope: `${source.name} → ${target.name}`,
      effect: `随军 ${officers}｜合兵${troops}｜行军粮 -${selectedFood}`,
      hint: '确认后编成远征军',
      onConfirm: () => this.executeDeployment(source, target),
      onCancel: () => this.showDeployment(),
    })
  }

  private executeDeployment(source: StrategyCity, target: StrategyCity) {
    this.selectedCityId = source.id
    this.focusedCityId = source.id
    this.selectedTargetCityId = target.id
    this.syncSelectedCityState()
    this.ensureDeploymentSelection()
    const supplyNeed = this.deploymentSupplyNeed()
    const selectedFood = this.selectedDeploymentFood()
    if (this.councilState.supplies < selectedFood || selectedFood < supplyNeed) {
      this.showDeploymentMessage('粮草不足，无法出征。请先治理城池或运输军粮。')
      return
    }
    this.councilState.supplies -= selectedFood
    const manifest = this.selectedDeploymentManifest(selectedFood)
    const officerIds = manifest.map(({ officer }) => officer.id)
    const officerTroops = Object.fromEntries(manifest.map(({ officer, troops }) => [officer.id, troops]))
    const officerFood = Object.fromEntries(manifest.map(({ officer, food }) => [officer.id, food]))
    const officerFatigue = Object.fromEntries(manifest.map(({ officer }) => [officer.id, 0]))
    const leaderOfficerId = this.appointedOfficer('vanguard')?.id ?? officerIds[0] ?? this.campaignOfficers.find((o) => o.faction === this.playerFactionId && o.role === '君主')?.id ?? officerIds[0] ?? ''
    const armyTroops = manifest.reduce((sum, item) => sum + item.troops, 0)
    this.marchArmy = {
      id: `army-${this.campaignClock.year}-${this.campaignClock.month}-${this.selectedCityId}`,
      factionId: this.playerFactionId,
      sourceCityId: source.id,
      targetCityId: target.id,
      leaderOfficerId,
      officerIds: officerIds.slice(0, 4),
      officerTroops,
      officerFood,
      officerFatigue,
      troops: armyTroops,
      food: selectedFood,
      morale: this.councilState.morale,
      position: { kind: 'city', cityId: source.id },
      routePlan: [source.id, target.id],
      movePoints: 1,
      status: 'ready',
    }
    manifest.forEach(({ officer, troops }) => {
      this.addOfficerMerit(officer, Math.max(6, Math.floor(troops / 260)))
      this.addOfficerFatigue(officer, 12)
    })
    this.deploymentOfficerIds.clear()
    this.deploymentTroopAllocations.clear()
    this.deploymentFoodAllocations.clear()
    this.deploymentFood = undefined
    this.recordMonthlyAction(`${source.name}下令出征${target.name}`)
    this.showCampaignMessage(`出征令已下达：${source.name} → ${target.name}。月令后将在行军月移动与攻击。`)
  }

  private deploymentSupplyNeed() {
    const target = this.selectedTargetCity
    const distanceCost = this.selectedCity?.routes.includes(target?.id ?? 'chengdu') ? 0 : 8
    const garrisonCost = target ? Math.floor(target.troops / 2200) : 0
    return 18 + distanceCost + garrisonCost + Math.floor(this.campaignClock.enemyThreat / 12)
  }

  private showDeploymentMessage(message: string) {
    this.showDeployment()
    this.drawToast(message, 590)
  }

  private showDiplomacy() {
    this.phase = 'diplomacy'
    this.showCampaign()
    this.showCommandPanel('外交', [
      ['同盟', () => this.showDiplomacyActorSelection('alliance')],
      ['计策', () => this.showDiplomacyPlotMenu()],
      ['情报', () => this.showDiplomacyActorSelection('scout')],
      ['借款', () => this.showDiplomacyActorSelection('borrow')],
      ['还款', () => this.showDiplomacyActorSelection('repay')],
    ])
  }

  private showDiplomacyPlotMenu() {
    this.showCommandPanel('计策', [
      ['离间', () => this.showDiplomacyActorSelection('sabotage')],
      ['暗杀', () => this.showDiplomacyActorSelection('assassination')],
      ['火计', () => this.showDiplomacyActorSelection('fire')],
      ['劝降', () => this.showDiplomacyActorSelection('persuade')],
    ])
  }

  private showDiplomacyActorSelection(kind: DiplomacyCommandKind) {
    const meta = diplomacyCommandMeta(kind)
    const actors = this.controlledCities().filter((city) => this.diplomacyTargetsFrom(city).length > 0)
    this.showCampaign()
    this.addLayeredPanel(MODAL.x, MODAL.y, MODAL.width, MODAL.height)
    const { left, top } = this.drawModalTitle(`外交｜${meta.command}：选择发起方`, '外交命令先确定出使城，再选择邻接势力或敌城，最后确认执行。')
    if (actors.length === 0) {
      this.overlayLayer.add(this.add.text(640, 414, '当前没有邻接外交目标的己方城。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
    }
    actors.forEach((city, index) => {
      const { x, y } = this.modalGridPosition(index, left, top)
      const targets = this.diplomacyTargetsFrom(city)
      this.makeButton(x, y, city.name, () => {
        this.selectedCityId = city.id
        this.focusedCityId = city.id
        this.syncSelectedCityState()
        this.showDiplomacyTargetSelection(kind, city)
      }, this.overlayLayer, 168, 40)
      this.overlayLayer.add(this.add.text(x, y + 34, `邻接目标 ${targets.length}｜金${city.gold} 粮${city.food}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#ead7b3',
      }).setOrigin(0.5))
    })
    this.makeModalActionButton(MODAL.x, top + MODAL.actionOffsetY, '取消', () => this.showDiplomacy())
  }

  private showDiplomacyTargetSelection(kind: DiplomacyCommandKind, actor: StrategyCity) {
    const meta = diplomacyCommandMeta(kind)
    const targets = this.diplomacyTargetsFrom(actor)
    this.showCampaign()
    this.addLayeredPanel(MODAL.x, MODAL.y, 850, MODAL.height)
    const { left, top } = this.drawModalTitle(
      `外交｜${meta.command}：选择目标`,
      `发起方：${actor.name}使者    目标类型：${meta.targetKind === 'faction' ? '邻接势力' : '邻接敌城'}`,
      850,
    )
    if (meta.targetKind === 'faction') {
      const factionTargets = this.diplomacyFactionTargetsForCommand(kind, actor)
      if (factionTargets.length === 0) {
        const emptyText = kind === 'repay'
          ? '当前邻接势力中没有可还债对象。'
          : '当前没有可交涉的邻接势力。'
        this.overlayLayer.add(this.add.text(640, 426, emptyText, {
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontSize: '20px',
          color: '#f8ecd0',
        }).setOrigin(0.5))
      }
      factionTargets.forEach((faction, index) => {
        const cityNames = targets.filter((city) => city.owner === faction.id).map((city) => city.name).join('、')
        const status = this.diplomacyFactionStatus(kind, faction.id)
        const { x, y } = this.modalGridPosition(index, left, top)
        this.makeModalOptionButton(x, y, faction.ruler, () => this.confirmDiplomacyAction(kind, actor, faction))
        this.overlayLayer.add(this.add.text(x, y + 35, `${faction.name}｜${status || `邻城 ${cityNames}`}`, {
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontSize: '14px',
          color: '#ead7b3',
        }).setOrigin(0.5))
      })
    } else {
      targets.forEach((city, index) => {
        const faction = factionById(city.owner)
        const { x, y } = this.modalGridPosition(index, left, top)
        this.makeModalOptionButton(x, y, city.name, () => {
          if (kind === 'sabotage' || kind === 'assassination') {
            this.showDiplomacyOfficerTargetSelection(kind, actor, city)
            return
          }
          this.confirmDiplomacyAction(kind, actor, city)
        })
        this.overlayLayer.add(this.add.text(x, y + 35, `${faction?.ruler ?? '敌将'}｜兵${city.troops} 防${city.defense}`, {
          fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
          fontSize: '14px',
          color: '#ead7b3',
        }).setOrigin(0.5))
      })
    }
    this.makeModalActionButton(this.modalActionX(0, 2), top + MODAL.actionOffsetY, '重选发起方', () => this.showDiplomacyActorSelection(kind))
    this.makeModalActionButton(this.modalActionX(1, 2), top + MODAL.actionOffsetY, '取消', () => this.showDiplomacy())
  }

  private confirmDiplomacyAction(kind: DiplomacyCommandKind, actor: StrategyCity, target: StrategyCity | StrategyFaction) {
    const meta = diplomacyCommandMeta(kind)
    const targetCity = 'region' in target ? target : this.diplomacyTargetsFrom(actor).find((city) => city.owner === target.id)
    const faction = 'region' in target ? factionById(target.owner) : target
    this.selectedCityId = actor.id
    this.focusedCityId = actor.id
    this.selectedTargetCityId = targetCity?.id
    this.selectedDiplomacyFactionId = faction?.id
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category: '外交',
      command: meta.command,
      actor: `${actor.name}使者`,
      target: 'region' in target ? `${target.name}（${faction?.ruler ?? '敌势力'}）` : `${target.name}（${target.ruler}）`,
      scope: `${actor.name}邻接外交`,
      effect: this.diplomacyCommandEffect(kind),
      onConfirm: () => this.executeDiplomacyCommand(kind),
      onCancel: () => this.showDiplomacyTargetSelection(kind, actor),
    })
  }

  private showDiplomacyOfficerTargetSelection(kind: 'sabotage' | 'assassination', actor: StrategyCity, targetCity: StrategyCity) {
    const meta = diplomacyCommandMeta(kind)
    const officers = this.enemyOfficersInCity(targetCity)
    this.selectedCityId = actor.id
    this.focusedCityId = targetCity.id
    this.selectedTargetCityId = targetCity.id
    this.selectedDiplomacyFactionId = targetCity.owner
    this.syncSelectedCityState()
    this.showCampaign()
    this.addLayeredPanel(MODAL.x, MODAL.y, MODAL.width, MODAL.height)
    const { left, top } = this.drawModalTitle(`外交｜${meta.command}：选择武将`, `发起方：${actor.name}使者    目标城：${targetCity.name}`)
    if (officers.length === 0) {
      this.overlayLayer.add(this.add.text(640, 414, `${targetCity.name}暂无可指定武将，只能改用火计或劝降。`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
    }
    officers.forEach((officer, index) => {
      const { x, y } = this.modalGridPosition(index, left, top)
      this.makeModalOptionButton(x, y, officer.name, () => this.confirmDiplomacyOfficerAction(kind, actor, targetCity, officer))
      this.overlayLayer.add(this.add.text(x, y + 35, `忠${officer.loyalty} 智${officer.intel} 兵${officerTroops(officer)}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#ead7b3',
      }).setOrigin(0.5))
    })
    this.makeModalActionButton(this.modalActionX(0, 2), top + MODAL.actionOffsetY, '重选敌城', () => this.showDiplomacyTargetSelection(kind, actor))
    this.makeModalActionButton(this.modalActionX(1, 2), top + MODAL.actionOffsetY, '取消', () => this.showDiplomacy())
  }

  private confirmDiplomacyOfficerAction(kind: 'sabotage' | 'assassination', actor: StrategyCity, targetCity: StrategyCity, officer: StrategyOfficer) {
    const meta = diplomacyCommandMeta(kind)
    const chance = kind === 'sabotage' ? this.diplomacyChance('sabotage') : this.assassinationChance(targetCity, officer)
    this.selectedCityId = actor.id
    this.focusedCityId = targetCity.id
    this.selectedTargetCityId = targetCity.id
    this.selectedDiplomacyFactionId = targetCity.owner
    this.syncSelectedCityState()
    this.showCampaign()
    this.showCommandConfirm({
      category: '外交',
      command: meta.command,
      actor: `${actor.name}使者`,
      target: `${targetCity.name}｜${officer.name}`,
      scope: `${actor.name} → ${targetCity.name}城内武将`,
      effect: kind === 'sabotage'
        ? `成功率 ${chance}%｜${officer.name}忠诚下降｜守军动摇`
        : `成功率 ${chance}%｜扰乱${officer.name}部曲｜失败则敌势上升`,
      hint: '确认后执行计策',
      onConfirm: () => this.executeDiplomacyOfficerCommand(kind, actor, targetCity, officer),
      onCancel: () => this.showDiplomacyOfficerTargetSelection(kind, actor, targetCity),
    })
  }

  private executeDiplomacyOfficerCommand(kind: 'sabotage' | 'assassination', actor: StrategyCity, targetCity: StrategyCity, officer: StrategyOfficer) {
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，无法施行计策。')
      return
    }
    this.selectedCityId = actor.id
    this.focusedCityId = targetCity.id
    this.selectedTargetCityId = targetCity.id
    this.selectedDiplomacyFactionId = targetCity.owner
    if (kind === 'sabotage') {
      this.resolveOfficerSabotage(targetCity, officer)
      return
    }
    this.resolveOfficerAssassination(targetCity, officer)
  }

  private enemyOfficersInCity(city: StrategyCity) {
    return strategyOfficers
      .filter((officer) => officer.location === city.id && officer.faction === city.owner)
      .toSorted((a, b) => {
        if (a.role === '君主' && b.role !== '君主') return -1
        if (a.role !== '君主' && b.role === '君主') return 1
        return officerTroops(b) - officerTroops(a)
      })
  }

  private resolveOfficerSabotage(targetCity: StrategyCity, officer: StrategyOfficer) {
    this.councilState.actions -= 1
    this.councilState.supplies = Math.max(0, this.councilState.supplies - 5)
    const chance = this.diplomacyChance('sabotage')
    const success = Phaser.Math.Between(1, 100) <= chance
    if (success) {
      const loyaltyLoss = Phaser.Math.Between(7, 14)
      const troopLoss = Math.max(120, Math.floor(officerTroops(officer) * 0.1))
      officer.loyalty = Phaser.Math.Clamp(officer.loyalty - loyaltyLoss, 0, 100)
      officer.troops = Math.max(200, officerTroops(officer) - troopLoss)
      targetCity.troops = Math.max(600, targetCity.troops - troopLoss)
      this.councilState.sabotage = true
      this.sabotagedFactionIds.add(targetCity.owner)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat - 10, 0, 100)
      this.recordMonthlyAction(`离间${targetCity.name}${officer.name}`)
      this.syncSelectedCityState()
      this.showDiplomacyMessage(`${officer.name}军心动摇，忠诚 -${loyaltyLoss}，所部兵力受损。`)
      return
    }
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale - 3, 0, 100)
    this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 3, 0, 100)
    this.showDiplomacyMessage(`离间${officer.name}失败，敌城戒备上升，我军士气 -3。`)
  }

  private resolveOfficerAssassination(targetCity: StrategyCity, officer: StrategyOfficer) {
    this.councilState.actions -= 1
    this.councilState.supplies = Math.max(0, this.councilState.supplies - 8)
    const chance = this.assassinationChance(targetCity, officer)
    const success = Phaser.Math.Between(1, 100) <= chance
    if (success) {
      const troopLoss = Math.max(180, Math.floor(officerTroops(officer) * 0.18))
      officer.troops = Math.max(120, officerTroops(officer) - troopLoss)
      officer.loyalty = Phaser.Math.Clamp(officer.loyalty - 3, 0, 100)
      targetCity.troops = Math.max(500, targetCity.troops - troopLoss)
      targetCity.defense = Math.max(15, targetCity.defense - 2)
      this.recordMonthlyAction(`暗袭${targetCity.name}${officer.name}`)
      this.syncSelectedCityState()
      this.showDiplomacyMessage(`${officer.name}营中大乱，所部折损，${targetCity.name}城防略降。`)
      return
    }
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale - 5, 0, 100)
    this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 5, 0, 100)
    this.showDiplomacyMessage(`暗袭${officer.name}失败，敌方严加搜捕，敌势 +5。`)
  }

  private assassinationChance(targetCity: StrategyCity, officer: StrategyOfficer) {
    const intelBonus = Math.floor(this.councilState.intel / 7)
    const moraleBonus = Math.floor((this.councilState.morale - 50) / 6)
    const defensePenalty = Math.floor(targetCity.defense / 12)
    const officerPenalty = Math.floor((officer.intel + officer.command) / 24)
    return Phaser.Math.Clamp(34 + intelBonus + moraleBonus - defensePenalty - officerPenalty, 12, 72)
  }

  private diplomacyCommandEffect(kind: DiplomacyCommandKind) {
    return {
      alliance: `成功率 ${this.diplomacyChance('alliance')}%｜4月盟约｜士气 +10｜敌势 -8`,
      scout: `成功率 ${this.diplomacyChance('scout')}%｜情报 +32`,
      borrow: '府库 +260｜生成6月债契｜士气 -2',
      repay: '偿还债契｜士气 +3｜敌势 -3',
      sabotage: `成功率 ${this.diplomacyChance('sabotage')}%｜选敌城武将｜降忠诚扰军心`,
      assassination: '选敌城武将｜扰乱部曲，失败则敌势上升',
      fire: '烧敌粮并削城防，失败则情报下降',
      persuade: `成功率 ${this.diplomacyChance('persuade')}%｜守军动摇｜情报 +10`,
    }[kind]
  }

  private executeDiplomacyCommand(kind: DiplomacyCommandKind) {
    if (kind === 'borrow') {
      this.borrowFunds()
      return
    }
    if (kind === 'repay') {
      this.repayFunds()
      return
    }
    if (kind === 'assassination') {
      this.resolveAssassination()
      return
    }
    if (kind === 'fire') {
      this.resolveDiplomacyFire()
      return
    }
    this.resolveDiplomacy(kind)
  }

  private borrowFunds() {
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，无法遣使借款。')
      return
    }
    const city = this.selectedCity
    const faction = this.selectedDiplomacyFaction()
    if (!city) return
    if (!faction) {
      this.showDiplomacyMessage('没有明确债主，无法借款。')
      return
    }
    if (this.diplomacyDebts.has(faction.id)) {
      this.showDiplomacyMessage(`尚欠${faction.ruler}军债契未清，不能再借。`)
      return
    }
    const due = this.addCampaignMonths(6)
    city.gold = Phaser.Math.Clamp(city.gold + 260, 0, 3000)
    this.diplomacyDebts.set(faction.id, {
      factionId: faction.id,
      principal: 260,
      dueYear: due.year,
      dueMonth: due.month,
    })
    this.councilState.morale = Math.max(0, this.councilState.morale - 2)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}向${faction.ruler}借款`)
    this.syncSelectedCityState()
    this.showDiplomacyMessage(`使者向${faction.ruler}借得军资，债期至${due.year}年${due.month}月。`)
  }

  private repayFunds() {
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，无法遣使还款。')
      return
    }
    const city = this.selectedCity
    const faction = this.selectedDiplomacyFaction()
    if (!city) return
    if (!faction) {
      this.showDiplomacyMessage('没有明确债权势力，无法还款。')
      return
    }
    const debt = this.diplomacyDebts.get(faction.id)
    if (!debt) {
      this.showDiplomacyMessage(`未欠${faction.ruler}军债契，无需还款。`)
      return
    }
    const payment = Math.min(180, debt.principal)
    if (city.gold < payment) {
      this.showDiplomacyMessage('府库不足，无法还款。')
      return
    }
    city.gold -= payment
    debt.principal -= payment
    if (debt.principal <= 0) {
      this.diplomacyDebts.delete(faction.id)
    } else {
      this.diplomacyDebts.set(faction.id, debt)
    }
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 3, 0, 100)
    this.campaignClock.enemyThreat = Math.max(0, this.campaignClock.enemyThreat - 3)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}还${faction.ruler}债`)
    this.syncSelectedCityState()
    this.showDiplomacyMessage(debt.principal <= 0 ? '债契已清，邦交缓和，敌势略降。' : `已还${payment}，尚欠${debt.principal}。`)
  }

  private resolveAssassination() {
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，无法施行暗杀。')
      return
    }
    this.councilState.actions -= 1
    const target = this.selectedTargetCity
    const success = Phaser.Math.Between(1, 100) <= Math.max(18, Math.min(72, 28 + Math.floor(this.councilState.intel / 2)))
    if (success && target) {
      target.troops = Math.max(600, Math.floor(target.troops * 0.88))
      this.recordMonthlyAction(`暗杀扰乱${target.name}`)
      this.showDiplomacyMessage(`刺客扰乱${target.name}守备，敌军兵力动摇。`)
    } else {
      this.councilState.morale = Math.max(0, this.councilState.morale - 5)
      this.campaignClock.enemyThreat = Math.min(100, this.campaignClock.enemyThreat + 4)
      this.showDiplomacyMessage('暗杀失败，敌方戒备上升，我军士气受挫。')
    }
  }

  private resolveDiplomacyFire() {
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，无法施行火计。')
      return
    }
    const target = this.selectedTargetCity
    if (!target) {
      this.showDiplomacyMessage('没有可施火计的目标城。')
      return
    }
    this.councilState.actions -= 1
    const success = Phaser.Math.Between(1, 100) <= Math.max(25, Math.min(82, 36 + Math.floor(this.councilState.intel / 2)))
    if (success) {
      target.food = Math.max(200, Math.floor(target.food * 0.78))
      target.defense = Math.max(15, target.defense - 6)
      this.recordMonthlyAction(`火计烧${target.name}`)
      this.showDiplomacyMessage(`火计袭扰${target.name}，敌粮与城防下降。`)
    } else {
      this.councilState.intel = Math.max(0, this.councilState.intel - 6)
      this.showDiplomacyMessage('火计未成，密探折返，情报下降。')
    }
  }

  private resolveDiplomacy(kind: 'alliance' | 'scout' | 'sabotage' | 'persuade') {
    this.ensureDiplomacyTarget()
    if (!this.selectedDiplomacyFaction()) {
      this.showDiplomacyMessage('没有可交涉对象，请先切换到邻接敌城的己方城池。')
      return
    }
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，请推进月份或出征。')
      return
    }
    const chance = this.diplomacyChance(kind)
    const roll = Phaser.Math.Between(1, 100)
    this.councilState.actions -= 1
    this.councilState.supplies = Math.max(0, this.councilState.supplies - 5)
    if (roll <= chance) {
      this.applyDiplomacySuccess(kind)
    } else {
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale - 3, 0, 100)
      this.showDiplomacyMessage(`对${this.selectedDiplomacyFaction()?.ruler ?? '对方'}${diplomacyName(kind)}失败，士气 -3。`)
    }
  }

  private applyDiplomacySuccess(kind: 'alliance' | 'scout' | 'sabotage' | 'persuade') {
    const faction = this.selectedDiplomacyFaction()
    const targetCity = this.selectedTargetCity?.owner === faction?.id
      ? this.selectedTargetCity
      : this.availableDeploymentTargets().find((city) => city.owner === faction?.id)
    if (!faction) return
    if (kind === 'alliance') {
      const months = 4
      this.alliedFactionIds.add(faction.id)
      this.allianceTerms.set(faction.id, months)
      this.councilState.alliance = this.allianceTerms.size
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 10, 0, 100)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat - 8, 0, 100)
      this.recordMonthlyAction(`与${faction.ruler}同盟`)
      this.showDiplomacyMessage(`与${faction.ruler}暂结${months}月盟约，士气 +10，敌势 -8。`)
      return
    }
    if (kind === 'scout') {
      this.councilState.scouted = true
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 32, 0, 100)
      if (targetCity) this.selectedTargetCityId = targetCity.id
      this.recordMonthlyAction(`侦察${targetCity?.name ?? faction.ruler}`)
      this.showDiplomacyScoutReport(faction, targetCity)
      return
    }
    if (kind === 'sabotage') {
      this.councilState.sabotage = true
      this.sabotagedFactionIds.add(faction.id)
      if (targetCity) targetCity.troops = Math.max(800, Math.floor(targetCity.troops * 0.86))
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat - 14, 0, 100)
      this.recordMonthlyAction(`离间${faction.ruler}军`)
      this.showDiplomacyMessage(`离间${faction.ruler}军奏效，${targetCity?.name ?? '目标城'}兵力动摇，敌势 -14。`)
      return
    }
    this.councilState.persuaded = true
    if (targetCity) {
      targetCity.troops = Math.max(600, Math.floor(targetCity.troops * 0.9))
      targetCity.defense = Math.max(20, targetCity.defense - 5)
    }
    this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 10, 0, 100)
    this.recordMonthlyAction(`劝降${targetCity?.name ?? faction.ruler}`)
    this.showDiplomacyMessage(`劝降书送入${targetCity?.name ?? '敌营'}，守军动摇，情报 +10。`)
  }

  private showDiplomacyScoutReport(faction: StrategyFaction, targetCity?: StrategyCity) {
    this.showDiplomacy()
    const cities = this.campaignCities.filter((city) => city.owner === faction.id)
    const officers = targetCity
      ? this.campaignOfficers.filter((officer) => officer.location === targetCity.id && officer.faction === targetCity.owner)
      : this.campaignOfficers.filter((officer) => officer.faction === faction.id)
    const debt = this.diplomacyDebts.get(faction.id)
    const treaty = this.allianceTerms.get(faction.id)
    const report = [
      `目标势力  ${faction.name}（${faction.ruler}）`,
      `邻接城池  ${targetCity?.name ?? (cities.map((city) => city.name).join('、') || '-')}`,
      `城防兵粮  ${targetCity ? `兵${targetCity.troops} 防${targetCity.defense} 粮${targetCity.food}` : `总兵${this.sumCityField(faction.id, 'troops')}`}`,
      `府库      ${targetCity ? targetCity.gold : this.sumCityField(faction.id, 'gold')}`,
      `武将      ${officers.map((officer) => `${officer.name} 忠${officer.loyalty}`).join('、') || '未探明'}`,
      `邦交      ${treaty ? `盟约余${treaty}月` : debt ? `债契${debt.principal}` : '无特殊约束'}`,
      `情报      +32，现为${this.councilState.intel}`,
    ]
    this.showModalReport('外交情报', undefined, report, '返回外交', () => this.showDiplomacy())
  }

  private diplomacyChance(kind: 'alliance' | 'scout' | 'sabotage' | 'persuade') {
    const base = {
      alliance: 48,
      scout: 68,
      sabotage: 42,
      persuade: 38,
    }[kind]
    const intelBonus = kind === 'scout' ? 0 : Math.floor(this.councilState.intel / 8)
    const moraleBonus = Math.floor((this.councilState.morale - 50) / 5)
    const threatPenalty = Math.floor(this.campaignClock.enemyThreat / 12)
    const targetCity = this.availableDeploymentTargets().find((city) => city.owner === this.selectedDiplomacyFactionId)
    const garrisonPenalty = targetCity ? Math.floor(targetCity.troops / 5000) : 0
    const strategist = this.appointedOfficer('strategist')
    const strategistBonus = strategist ? Math.floor(strategist.intel / 20) : 0
    const betrayalPenalty = this.selectedDiplomacyFactionId && this.sabotagedFactionIds.has(this.selectedDiplomacyFactionId) ? 12 : 0
    return Phaser.Math.Clamp(base + intelBonus + moraleBonus + strategistBonus - threatPenalty - garrisonPenalty - betrayalPenalty, 15, 92)
  }

  private showDiplomacyMessage(message: string) {
    this.showDiplomacy()
    this.drawToast(message, 590)
  }

  private startMarchArmy() {
    if (!this.marchArmy) {
      this.showCampaignMessage('当前没有待执行的出征令。')
      return
    }
    if (!this.marchArmy.targetCityId) {
      this.showCampaignMessage('远征军没有目标城，无法攻击。')
      return
    }
    this.selectedCityId = this.marchArmy.sourceCityId
    this.focusedCityId = this.marchArmy.targetCityId
    this.selectedTargetCityId = this.marchArmy.targetCityId
    this.syncSelectedCityState()
    this.ensureDiplomacyTarget()
    this.ensureLocalAppointments()
    this.startBattle()
  }

  private startBattle() {
    this.phase = 'playerSelect'
    this.ensureDeploymentTarget()
    const source = this.selectedCity
    const target = this.selectedTargetCity
    this.units = this.createBattleUnits()
    this.turn = 1
    this.currentFaction = 'player'
    this.selectedUnitId = undefined
    this.selectedSkillId = undefined
    this.roundKills = 0
    this.applyCouncilBonuses()
    this.applyFieldBattleFormationBonuses()
    this.selectNextReadyPlayerUnit()
    this.logLines = [
      `战斗开始：${source?.name ?? '我城'}军向${target?.name ?? '敌境'}进发，遭遇守军拦截。`,
      `战前态势：补给 ${this.councilState.supplies}，士气 ${this.councilState.morale}，情报 ${this.councilState.intel}，敌势 ${this.campaignClock.enemyThreat}。`,
      this.siegeState ? `会战阵型：${fieldBattleFormations[this.fieldBattleFormation].name}，${fieldBattleFormations[this.fieldBattleFormation].posture}。` : '会战分支：选择武将后以下达移动、攻击、计略、待机、委任、撤退等战斗命令。',
    ]
    if (this.councilState.intel >= 40) this.logLines.push(`密探回报：${target?.name ?? '目标城'}守军布防已明，计略与夹击更有效。`)
    if (this.campaignClock.enemyThreat >= 55) this.logLines.push('敌势已盛，敌军攻击提高。')
    this.overlayLayer.removeAll(true)
    this.renderBattle()
  }

  private createBattleUnits() {
    const marchingUnitIds = new Set((this.marchArmy?.officerIds ?? [])
      .map((officerId) => unitIdForOfficerId(officerId, this.playerFactionOfficers()))
      .filter((unitId): unitId is string => unitId !== undefined))
    const playerUnitIds = marchingUnitIds.size > 0
      ? marchingUnitIds
      : new Set(this.currentCityUnits().map((unit) => unit.id))
    const playerUnits = baseUnits
      .filter((unit) => unit.faction === 'player' && playerUnitIds.has(unit.id))
      .map((unit) => {
        const officer = this.officerForUnit(unit.id)
        const troopBonus = officer ? Math.floor(officerTroops(officer) / 550) : 0
        const weaponBonus = officer ? officerWeapons(officer) : 0
        const trainingBonus = officer ? Math.floor(officerTraining(officer) / 25) : 0
        const equipment = officer ? officerEquipment(officer) : { spear: 0, bow: 0, horse: 0, armor: 0 }
        const hpBonus = troopBonus + equipment.armor
        const rangeBonus = (unit.classId === 'archer' || unit.classId === 'strategist') && equipment.bow >= 3 ? 1 : 0
        const stats = {
          ...unit.stats,
          maxHp: unit.stats.maxHp + hpBonus,
          hp: unit.stats.maxHp + hpBonus,
          atk: unit.stats.atk + weaponBonus + Math.floor(equipment.spear / 2),
          def: unit.stats.def + trainingBonus + Math.floor(equipment.armor / 2),
          mag: unit.stats.mag + Math.floor(equipment.bow / 2),
          move: unit.stats.move + (equipment.horse >= 3 ? 1 : 0),
          range: unit.stats.range + rangeBonus,
        }
        const formationPosition = this.siegeState ? this.playerFormationPosition(unit, unit.position) : unit.position
        return { ...unit, stats, position: { ...formationPosition } }
      })
    const target = this.selectedTargetCity
    const owner = target ? factionById(target.owner) : undefined
    const defenderName = owner?.ruler ?? '守将'
    const cityNameText = target?.name ?? '目标城'
    const troopScale = Math.max(0, Math.floor((target?.troops ?? 3600) / 1800))
    const defenseScale = Math.max(0, Math.floor((target?.defense ?? 50) / 25))
    const threatScale = Math.max(0, Math.floor(this.campaignClock.enemyThreat / 30))
    const enemyUnits: Unit[] = [
      createUnit('defenderA', `${owner?.name.replace('军', '') ?? '郡'}兵`, `${cityNameText}前军`, 'enemy', 'soldier', { x: 7, y: 3 }, {
        maxHp: 16 + troopScale, hp: 16 + troopScale, atk: 6 + threatScale, def: 3 + defenseScale, mag: 1, res: 2, move: 2, range: 1, speed: 4,
      }, ['strike'], { primary: owner?.color ?? 0x495057, secondary: 0xe76f51, portrait: 0x343a40 }),
      createUnit('defenderB', `${cityNameText}守兵`, '城门守备', 'enemy', 'soldier', { x: 8, y: 5 }, {
        maxHp: 18 + defenseScale, hp: 18 + defenseScale, atk: 6, def: 4 + defenseScale, mag: 1, res: 3, move: 2, range: 1, speed: 4,
      }, ['strike'], { primary: owner?.color ?? 0x495057, secondary: 0xd4af37, portrait: 0x343a40 }),
      createUnit('defenderC', `${owner?.trait ?? '守备'}队`, '侧翼军', 'enemy', 'archer', { x: 9, y: 1 }, {
        maxHp: 15 + troopScale, hp: 15 + troopScale, atk: 6 + threatScale, def: 2, mag: 2, res: 3, move: 2, range: 2, speed: 6,
      }, ['volley'], { primary: owner?.color ?? 0x5d3a1a, secondary: 0xd98b2b, portrait: 0x6f4518 }),
      createUnit('boss', defenderName, `${cityNameText}守将`, 'enemy', 'commander', { x: 10, y: 4 }, {
        maxHp: 26 + troopScale + defenseScale, hp: 26 + troopScale + defenseScale, atk: 9 + threatScale, def: 5 + defenseScale, mag: 3, res: 4, move: 2, range: 1, speed: 5,
      }, ['strike'], { primary: owner?.color ?? 0x8d1b3d, secondary: 0xffb703, portrait: 0x7a1830 }),
    ]
    return [...playerUnits, ...enemyUnits]
  }

  private renderBattle() {
    this.boardLayer.removeAll(true)
    this.highlightLayer.removeAll(true)
    this.unitLayer.removeAll(true)
    this.uiLayer.removeAll(true)
    this.drawBattleBackground()
    this.drawMap()
    this.drawHighlights()
    this.drawUnits()
    this.drawHud()
  }

  private drawBackdrop() {
    this.overlayLayer.add(this.add.rectangle(0, 0, 1280, 760, 0x151821).setOrigin(0))
    if (this.textures.exists('title-bg')) {
      this.overlayLayer.add(this.add.image(640, 380, 'title-bg').setDisplaySize(1280, 760).setAlpha(0.52))
      this.overlayLayer.add(this.add.rectangle(0, 0, 1280, 760, 0x10141b, 0.38).setOrigin(0))
    }
    for (let i = 0; i < 36; i += 1) {
      const x = Phaser.Math.Between(0, 1280)
      const y = Phaser.Math.Between(0, 760)
      const color = i % 3 === 0 ? 0xa93f2c : i % 3 === 1 ? 0xd4af37 : 0x3b6e5f
      this.overlayLayer.add(this.add.circle(x, y, Phaser.Math.Between(2, 6), color, 0.22))
    }
    this.overlayLayer.add(this.add.rectangle(0, 565, 1280, 195, 0x10131a, 0.75).setOrigin(0))
    this.overlayLayer.add(this.add.polygon(248, 578, [0, 100, 160, 20, 320, 110, 470, 45, 660, 115], 0x2f3b35, 0.8))
    this.overlayLayer.add(this.add.polygon(762, 582, [0, 110, 140, 30, 290, 100, 450, 22, 650, 120], 0x3b302d, 0.8))
  }

  private addTitleText(title: string, subtitle: string) {
    this.overlayLayer.add(this.add.text(640, 132, title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '68px',
      color: '#f8df9d',
      stroke: '#4b1d18',
      strokeThickness: 8,
      align: 'center',
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.text(640, 220, subtitle, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '26px',
      color: '#e7d5b0',
      align: 'center',
    }).setOrigin(0.5))
  }

  private saveKey = 'fenghuo-heroes-save'

  private allMarchArmies(): MarchArmy[] {
    const armies: MarchArmy[] = []
    if (this.marchArmy) armies.push(this.marchArmy)
    armies.push(...this.aiMarchArmies)
    return armies
  }

  private defeatedFactionIds(): FactionId[] {
    return strategyFactions
      .filter((f) => f.id !== 'neutral' && this.countCities(f.id) === 0)
      .map((f) => f.id)
  }

  private serializeAlliances(): Partial<Record<StartableFactionId, StartableFactionId[]>> {
    const result: Partial<Record<StartableFactionId, StartableFactionId[]>> = {}
    for (const [factionId, turns] of this.allianceTerms.entries()) {
      if (turns > 0 && factionId !== 'neutral') {
        const pfid = this.playerFactionId as StartableFactionId
        if (!result[pfid]) result[pfid] = []
        result[pfid]!.push(factionId as StartableFactionId)
      }
    }
    return result
  }

  private serializeDebts(): SerializableDiplomacyDebt[] {
    return Array.from(this.diplomacyDebts.entries()).map(([factionId, debt]) => ({
      factionId,
      principal: debt.principal,
      dueYear: debt.dueYear,
      dueMonth: debt.dueMonth,
    }))
  }

  private serializeMarchArmy(army: MarchArmy): {
    id: string; factionId: FactionId; sourceCityId: CityId; targetCityId?: CityId
    leaderOfficerId: string; officerIds: string[]; officerTroops: Record<string, number>
    officerFood: Record<string, number>; officerFatigue: Record<string, number>
    troops: number; food: number; morale: number
    position: { kind: 'city' | 'route'; cityId?: CityId; route?: [CityId, CityId]; progress?: number }
    routePlan: CityId[]; movePoints: number; status: MarchArmy['status']
  } {
    return {
      id: army.id,
      factionId: army.factionId,
      sourceCityId: army.sourceCityId,
      targetCityId: army.targetCityId,
      leaderOfficerId: army.leaderOfficerId,
      officerIds: [...army.officerIds],
      officerTroops: { ...army.officerTroops },
      officerFood: { ...army.officerFood },
      officerFatigue: { ...army.officerFatigue },
      troops: army.troops,
      food: army.food,
      morale: army.morale,
      position: { ...army.position, route: army.position.route ? [...army.position.route] as [CityId, CityId] : undefined },
      routePlan: [...army.routePlan],
      movePoints: army.movePoints,
      status: army.status,
    }
  }

  private saveCampaign(): boolean {
    try {
      const snapshot = createCampaignSnapshot({
        meta: {
          year: this.campaignClock.year,
          month: this.campaignClock.month,
          difficulty: this.selectedDifficulty,
          playerFactionId: this.playerFactionId as StartableFactionId,
        },
        cities: this.campaignCities.map((c) => ({
          id: c.id, owner: c.owner, gold: c.gold, food: c.food, troops: c.troops,
          defense: c.defense, population: c.population, commerce: c.commerce,
          land: c.land, irrigation: c.irrigation, disaster: c.disaster,
        })),
        officers: this.campaignOfficers.map((o) => ({
          id: o.id, faction: o.faction, location: o.location, loyalty: o.loyalty,
          troops: o.troops, weapons: o.weapons, spear: o.spear, bow: o.bow,
          horse: o.horse, armor: o.armor, training: o.training, status: o.status,
          statusTurns: o.statusTurns, captorFactionId: o.captorFactionId,
          merit: o.merit, salary: o.salary, fatigue: o.fatigue,
        })),
        marchArmies: this.allMarchArmies().map((a) => this.serializeMarchArmy(a)),
        defeatedFactionIds: this.defeatedFactionIds(),
        alliances: this.serializeAlliances(),
        debts: this.serializeDebts(),
      })
      localStorage.setItem(this.saveKey, JSON.stringify(snapshot))
      return true
    } catch {
      return false
    }
  }

  private loadCampaign(): boolean {
    try {
      const raw = localStorage.getItem(this.saveKey)
      if (!raw) return false
      const snapshot: CampaignSnapshot = JSON.parse(raw)
      const errors = validateCampaignSnapshot(snapshot)
      if (errors.length > 0) return false

      this.playerFactionId = snapshot.meta.playerFactionId
      this.selectedDifficulty = snapshot.meta.difficulty
      this.campaignClock.year = snapshot.meta.year
      this.campaignClock.month = snapshot.meta.month
      this.syncCampaignModeToMonth()
      this.campaignClock.weather = 'clear'

      this.campaignCities = strategyCities.map((base) => {
        const saved = snapshot.cities.find((c) => c.id === base.id)
        if (!saved) return { ...base, routes: [...base.routes] }
        return {
          ...base,
          owner: saved.owner as FactionId,
          gold: saved.gold,
          food: saved.food,
          troops: saved.troops,
          defense: saved.defense,
          population: saved.population,
          commerce: saved.commerce,
          land: saved.land,
          irrigation: saved.irrigation,
          disaster: saved.disaster,
          routes: [...base.routes],
        }
      })

      this.campaignOfficers = strategyOfficers.map((base) => {
        const saved = snapshot.officers.find((o) => o.id === base.id)
        if (!saved) return { ...base }
        return {
          ...base,
          faction: saved.faction as FactionId,
          location: saved.location as CityId,
          loyalty: saved.loyalty,
          troops: saved.troops ?? base.troops,
          weapons: saved.weapons ?? base.weapons,
          spear: saved.spear ?? base.spear,
          bow: saved.bow ?? base.bow,
          horse: saved.horse ?? base.horse,
          armor: saved.armor ?? base.armor,
          training: saved.training ?? base.training,
          status: (saved.status ?? 'normal') as OfficerStatus,
          statusTurns: saved.statusTurns ?? 0,
          captorFactionId: saved.captorFactionId as FactionId | undefined,
          merit: saved.merit ?? base.merit,
          salary: saved.salary ?? base.salary,
          fatigue: saved.fatigue ?? 0,
        }
      })

      this.marchArmy = undefined
      this.aiMarchArmies = []
      for (const savedArmy of snapshot.marchArmies) {
        const army: MarchArmy = {
          id: savedArmy.id,
          factionId: savedArmy.factionId as FactionId,
          sourceCityId: savedArmy.sourceCityId as CityId,
          targetCityId: savedArmy.targetCityId as CityId | undefined,
          leaderOfficerId: savedArmy.leaderOfficerId,
          officerIds: [...savedArmy.officerIds],
          officerTroops: { ...savedArmy.officerTroops },
          officerFood: { ...savedArmy.officerFood },
          officerFatigue: { ...savedArmy.officerFatigue },
          troops: savedArmy.troops,
          food: savedArmy.food,
          morale: savedArmy.morale,
          position: { kind: savedArmy.position.kind, cityId: savedArmy.position.cityId as CityId | undefined, route: savedArmy.position.route ? [...savedArmy.position.route] as [CityId, CityId] : undefined, progress: savedArmy.position.progress },
          routePlan: savedArmy.routePlan.map((id) => id as CityId),
          movePoints: savedArmy.movePoints,
          status: savedArmy.status,
        }
        if (army.factionId === this.playerFactionId) {
          this.marchArmy = army
        } else {
          this.aiMarchArmies.push(army)
        }
      }

      this.diplomacyDebts = new Map<FactionId, DiplomacyDebt>()
      for (const debt of snapshot.debts) {
        this.diplomacyDebts.set(debt.factionId as FactionId, { factionId: debt.factionId as FactionId, principal: debt.principal, dueYear: debt.dueYear, dueMonth: debt.dueMonth })
      }

      this.allianceTerms = new Map<FactionId, number>()
      this.alliedFactionIds = new Set<FactionId>()
      const pfid = this.playerFactionId as StartableFactionId
      const allies = snapshot.alliances[pfid]
      if (allies) {
        for (const allyId of allies) {
          this.allianceTerms.set(allyId, 4)
          this.alliedFactionIds.add(allyId)
        }
      }

      this.siegeState = undefined
      this.duelState = undefined
      this.selectedDiplomacyFactionId = 'neutral'
      this.alliedFactionIds = new Set<FactionId>(this.allianceTerms.keys())
      this.sabotagedFactionIds = new Set<FactionId>()
      this.cityTaxRates = new Map<CityId, TaxRate>()
      this.monthlyActionLog = []
      this.usedRouteEvents = new Set<string>()
      this.deploymentOfficerIds = new Set<string>()
      this.deploymentTroopAllocations = new Map<string, number>()
      this.deploymentFoodAllocations = new Map<string, number>()
      this.deploymentFood = undefined
      this.fieldBattleFormation = 'balanced'
      this.recruitedNeutralIds = new Set<string>()
      this.mapDisplayMode = 'compact'

      const faction = strategyFactions.find((f) => f.id === this.playerFactionId) ?? strategyFactions[1]
      this.selectedCityId = faction.capital
      this.focusedCityId = faction.capital
      this.councilState = { supplies: 80, morale: 55, intel: 20, actions: 3, trained: false, scouted: false, persuaded: false, alliance: 0, sabotage: false }

      const capital = this.campaignCities.find((c) => c.id === faction.capital)
      this.cityState = {
        name: capital?.name ?? faction.capital,
        publicOrder: 62,
        treasury: capital?.gold ?? 800,
        recruits: capital?.troops ?? 6000,
        farms: 1,
        walls: capital?.defense ?? 60,
      }

      const ruler = this.campaignOfficers.find((o) => o.faction === this.playerFactionId && o.role === '君主')
      const strategist = this.campaignOfficers.find((o) => o.faction === this.playerFactionId && (o.role === '军师' || o.role === '谋臣' || o.role === '都督'))
      const fallback = this.campaignOfficers.find((o) => o.faction === this.playerFactionId)
      this.appointments = {
        governor: ruler?.id ?? fallback?.id ?? '',
        vanguard: ruler?.id ?? fallback?.id ?? '',
        strategist: strategist?.id ?? ruler?.id ?? fallback?.id ?? '',
      }

      this.syncSelectedCityState()
      this.ensureLocalAppointments()
      this.music.start()
      this.showCampaign()
      return true
    } catch {
      return false
    }
  }

  private hasSavedCampaign(): boolean {
    try {
      return localStorage.getItem(this.saveKey) !== null
    } catch {
      return false
    }
  }

  private getSaveMeta(): CampaignSnapshotMeta | undefined {
    try {
      const raw = localStorage.getItem(this.saveKey)
      if (!raw) return undefined
      const snapshot: CampaignSnapshot = JSON.parse(raw)
      return snapshot.meta
    } catch {
      return undefined
    }
  }

  private showContinueStub() {
    if (!this.hasSavedCampaign()) {
      this.showTitleNotice('继续游戏', '暂无存档。请从”开始游戏”进入新一局。')
      return
    }
    const meta = this.getSaveMeta()
    if (!meta) {
      this.showTitleNotice('继续游戏', '存档读取失败，请重新开始。')
      return
    }
    const faction = strategyFactions.find((f) => f.id === meta.playerFactionId)
    const saveDate = new Date(meta.savedAt)
    const dateStr = `${saveDate.getMonth() + 1}/${saveDate.getDate()} ${saveDate.getHours()}:${String(saveDate.getMinutes()).padStart(2, '0')}`
    const layered = this.addLayeredPanel(640, 420, 660, 260)
    const heading = this.add.text(640, 342, '继续游戏', {
      fontFamily: 'Georgia, “Times New Roman”, serif',
      fontSize: '34px',
      color: '#f8df9d',
    }).setOrigin(0.5)
    const body = this.add.text(640, 414, [
      `势力：${faction?.name ?? '未知'}`,
      `年份：${meta.year}年 ${meta.month}月`,
      `难度：${meta.difficulty === 'easy' ? '初级' : meta.difficulty === 'hard' ? '上级' : '标准'}`,
      `保存：${dateStr}`,
    ].join('\n'), {
      fontFamily: 'Arial, “Microsoft YaHei”, sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5)
    const nodes: Phaser.GameObjects.GameObject[] = [...Object.values(layered), heading, body]
    this.overlayLayer.add([heading, body])
    const loadBtn = this.makeButton(580, 510, '继续', () => {
      nodes.forEach((node) => node.destroy())
      this.loadCampaign()
    }, this.overlayLayer, 140, 40)
    const cancelBtn = this.makeButton(700, 510, '取消', () => {
      nodes.forEach((node) => node.destroy())
    }, this.overlayLayer, 140, 40)
    nodes.push(loadBtn, cancelBtn)
  }

  private showSettingsOverlay() {
    this.showTitleNotice('环境设定', '当前可用设置：音乐随开始游戏自动播放。音量、文字速度和存档位将在机能菜单中继续补齐。')
  }

  private showTitleNotice(title: string, message: string) {
    const layered = this.addLayeredPanel(640, 420, 660, 220)
    const heading = this.add.text(640, 362, title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#f8df9d',
    }).setOrigin(0.5)
    const body = this.add.text(640, 424, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0.5)
    const nodes: Phaser.GameObjects.GameObject[] = [...Object.values(layered), heading, body]
    const close = this.makeButton(640, 506, '关闭', () => {
      nodes.forEach((node) => node.destroy())
    }, this.overlayLayer, 140, 40)
    nodes.push(close)
    this.overlayLayer.add([heading, body])
  }

  private drawPageFrame(title: string, context?: string, alpha = 0.92) {
    this.overlayLayer.add(this.add.rectangle(FRAME.x, FRAME.y, FRAME.width, FRAME.height, UI.page, alpha).setOrigin(0).setStrokeStyle(4, UI.border, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, title, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    if (context) {
      this.overlayLayer.add(this.add.text(1010, 72, context, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f4dfb3',
        align: 'right',
      }).setOrigin(0.5))
    }
  }

  private drawPanel(x: number, y: number, width: number, height: number, alpha = 0.96) {
    const panel = this.add.rectangle(x, y, width, height, UI.panel, alpha).setOrigin(0).setStrokeStyle(2, UI.borderDim, 0.9)
    this.overlayLayer.add(panel)
    return panel
  }

  private drawSectionTitle(x: number, y: number, text: string, size = 32) {
    const title = this.add.text(x, y, text, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: `${size}px`,
      color: '#f5d487',
    })
    this.overlayLayer.add(title)
    return title
  }

  private drawFooterBar() {
    this.overlayLayer.add(this.add.rectangle(FOOTER.x, FOOTER.y, FOOTER.width, FOOTER.height, UI.subPanel, 0.97).setOrigin(0).setStrokeStyle(2, UI.border, 0.82))
  }

  private clampListPage(page: number, count: number, pageSize: number) {
    const totalPages = Math.max(1, Math.ceil(count / pageSize))
    return Phaser.Math.Clamp(page, 0, totalPages - 1)
  }

  private pagedItems<T>(items: T[], page: number, pageSize: number) {
    const safePage = this.clampListPage(page, items.length, pageSize)
    const start = safePage * pageSize
    return {
      page: safePage,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      items: items.slice(start, start + pageSize),
    }
  }

  private drawListViewport(x: number, y: number, width: number, height: number, title?: string) {
    this.overlayLayer.add(this.add.rectangle(x, y, width, height, UI.subPanel, 0.56).setOrigin(0).setStrokeStyle(1, UI.borderDim, 0.45))
    if (title) {
      this.overlayLayer.add(this.add.text(x + 16, y + 10, title, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        color: '#f4dfb3',
      }))
    }
  }

  private drawPager(x: number, y: number, page: number, totalPages: number, onPrev: () => void, onNext: () => void, width = 180) {
    if (totalPages <= 1) return
    const safeWidth = Math.max(width, 142)
    this.overlayLayer.add(this.add.text(x, y, `${page + 1}/${totalPages}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f4dfb3',
      align: 'center',
    }).setOrigin(0.5))
    this.makeButton(x - safeWidth / 2 + 26, y, '<', onPrev, this.overlayLayer, 42, 30, 17)
    this.makeButton(x + safeWidth / 2 - 26, y, '>', onNext, this.overlayLayer, 42, 30, 17)
  }

  private drawToast(message: string, y = 584) {
    const safeY = y >= FOOTER.y - 60 ? FOOTER.y - 28 : y
    const text = this.add.text(640, safeY, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#fff6d8',
      align: 'center',
      wordWrap: { width: 700 },
    }).setOrigin(0.5)
    const width = Phaser.Math.Clamp(text.width + 76, 420, 790)
    const height = Math.max(54, text.height + 24)
    const toast = this.add.container(640, safeY)
    const shadow = this.add.rectangle(8, 10, width, height, 0x000000, 0.42)
    const panel = this.add.rectangle(0, 0, width, height, 0x071017, 0.98).setStrokeStyle(2, 0xf8df9d, 0.92)
    const warmInset = this.add.rectangle(0, 0, width - 14, height - 12, 0x3c2417, 0.58).setStrokeStyle(1, 0x8f6c2b, 0.72)
    const accent = this.add.rectangle(-width / 2 + 5, 0, 6, height - 10, 0xd4af37, 0.96)
    text.setPosition(0, 0)
    toast.add([shadow, panel, warmInset, accent, text])
    this.overlayLayer.add(toast)
    return toast
  }

  private drawBattleBackground() {
    this.boardLayer.add(this.add.rectangle(0, 0, 1280, 760, 0x151a20).setOrigin(0))
    if (this.textures.exists('battlefield-bg')) {
      this.boardLayer.add(this.add.image(BOARD_X + MAP_W * TILE / 2, BOARD_Y + MAP_H * TILE / 2, 'battlefield-bg').setDisplaySize(MAP_W * TILE, MAP_H * TILE).setAlpha(0.48))
    }
    this.uiLayer.add(this.add.rectangle(0, 0, 1280, 72, 0x221712, 0.98).setOrigin(0))
    this.uiLayer.add(this.add.text(36, 20, `群英新篇 · ${this.selectedTargetCity?.name ?? '邻境'}攻略`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '28px',
      color: '#f8df9d',
    }))
    this.drawBattleForceSummary()
  }

  private drawBattleForceSummary() {
    const player = this.forceSummary('player')
    const enemy = this.forceSummary('enemy')
    const total = Math.max(1, player.total + enemy.total)
    const barWidth = 290
    const playerWidth = Math.max(12, barWidth * (player.total / total))
    const enemyWidth = Math.max(12, barWidth * (enemy.total / total))
    this.uiLayer.add(this.add.rectangle(330, 14, 330, 44, 0x101722, 0.88).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
    this.uiLayer.add(this.add.rectangle(350, 42, barWidth, 8, 0x1c1b18, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.rectangle(350, 42, playerWidth, 8, 0x45d483, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.text(350, 20, `我军 兵${player.total}/${player.max}  将${player.alive}  士气${this.councilState.morale}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f8ecd0',
    }))
    this.uiLayer.add(this.add.rectangle(686, 14, 330, 44, 0x101722, 0.88).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
    this.uiLayer.add(this.add.rectangle(706, 42, barWidth, 8, 0x1c1b18, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.rectangle(706 + barWidth - enemyWidth, 42, enemyWidth, 8, 0xf25f5c, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.text(706, 20, `敌军 兵${enemy.total}/${enemy.max}  将${enemy.alive}  敌势${this.campaignClock.enemyThreat}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f8ecd0',
    }))
  }

  private applyCouncilBonuses() {
    if (this.councilState.trained) {
      this.units.filter((unit) => unit.faction === 'player').forEach((unit) => {
        unit.stats.maxHp += 2
        unit.stats.hp += 2
      })
    }
    if (this.councilState.morale >= 70) {
      this.units.filter((unit) => unit.faction === 'player').forEach((unit) => {
        unit.stats.atk += 1
      })
    }
    const enemyCommander = this.units.find((unit) => unit.faction === 'enemy' && unit.classId === 'commander')
    if (this.councilState.intel >= 60) {
      if (enemyCommander) enemyCommander.stats.hp -= 3
    }
    if (this.councilState.intel >= 90) {
      if (enemyCommander) enemyCommander.stats.def -= 1
    }
    if (this.councilState.persuaded && this.councilState.intel >= 50) {
      const soldier = this.units.find((unit) => unit.id === 'defenderA')
      if (soldier) {
        soldier.stats.hp = Math.ceil(soldier.stats.hp / 2)
        soldier.stats.atk -= 1
      }
    }
    if (this.campaignClock.enemyThreat >= 55) {
      this.units.filter((unit) => unit.faction === 'enemy').forEach((unit) => {
        unit.stats.atk += 1
      })
    }
    if (this.campaignClock.enemyThreat >= 75) {
      if (enemyCommander) {
        enemyCommander.stats.maxHp += 5
        enemyCommander.stats.hp += 5
      }
    }
  }

  private applyFieldBattleFormationBonuses() {
    if (!this.siegeState) return
    const players = this.units.filter((unit) => unit.faction === 'player')
    const enemies = this.units.filter((unit) => unit.faction === 'enemy')
    if (this.fieldBattleFormation === 'charge') {
      players.forEach((unit) => {
        unit.stats.atk += 2
        unit.stats.def = Math.max(0, unit.stats.def - 1)
      })
      this.marchArmy!.morale = Phaser.Math.Clamp(this.marchArmy!.morale + 3, 0, 100)
      return
    }
    if (this.fieldBattleFormation === 'guard') {
      players.forEach((unit) => {
        unit.stats.def += 2
        unit.stats.move = Math.max(1, unit.stats.move - 1)
      })
      return
    }
    if (this.fieldBattleFormation === 'maneuver') {
      players.forEach((unit) => {
        unit.stats.move += 1
        unit.stats.mag += 1
      })
      const disrupted = enemies.find((unit) => unit.id === 'defenderA') ?? enemies[0]
      if (disrupted && this.councilState.intel >= 8) {
        disrupted.stats.hp = Math.max(1, disrupted.stats.hp - 3)
        disrupted.stats.def = Math.max(0, disrupted.stats.def - 1)
        this.councilState.intel = Math.max(0, this.councilState.intel - 8)
      }
    }
  }

  private playerFormationPosition(unit: Unit, fallback: GridPosition) {
    const order = this.marchArmy?.officerIds
      .map((officerId) => unitIdForOfficerId(officerId, this.playerFactionOfficers()))
      .filter((unitId): unitId is string => unitId !== undefined) ?? []
    const index = Math.max(0, order.indexOf(unit.id))
    const formations: Record<FieldBattleFormation, GridPosition[]> = {
      balanced: [{ x: 1, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 4 }, { x: 1, y: 5 }],
      charge: [{ x: 3, y: 3 }, { x: 2, y: 2 }, { x: 2, y: 4 }, { x: 1, y: 3 }],
      guard: [{ x: 1, y: 3 }, { x: 1, y: 2 }, { x: 1, y: 4 }, { x: 0, y: 3 }],
      maneuver: [{ x: 2, y: 2 }, { x: 2, y: 5 }, { x: 1, y: 3 }, { x: 1, y: 4 }],
    }
    return formations[this.fieldBattleFormation][index] ?? fallback
  }

  private resetCouncilState() {
    this.councilState = {
      supplies: 80,
      morale: 55,
      intel: 20,
      actions: 3,
      trained: false,
      scouted: false,
      persuaded: false,
      alliance: 0,
      sabotage: false,
    }
  }

  private resetCampaignState(factionId: FactionId = 'liu') {
    this.playerFactionId = factionId
    this.resetCouncilState()
    this.campaignCities = strategyCities.map((city) => this.initializeCityEconomy({ ...city, routes: [...city.routes] }))
    this.campaignOfficers = strategyOfficers.map((officer) => ({
      ...officer,
      troops: initialOfficerTroops(officer, factionId),
      weapons: initialOfficerWeapons(officer),
      spear: initialOfficerEquipment(officer).spear,
      bow: initialOfficerEquipment(officer).bow,
      horse: initialOfficerEquipment(officer).horse,
      armor: initialOfficerEquipment(officer).armor,
      training: initialOfficerTraining(officer),
      status: 'normal',
      statusTurns: 0,
      captorFactionId: undefined,
      merit: initialOfficerMerit(officer),
      salary: initialOfficerSalary(officer),
      fatigue: 0,
    }))
    const faction = strategyFactions.find((f) => f.id === factionId) ?? strategyFactions[1]
    this.selectedCityId = faction.capital
    this.focusedCityId = faction.capital
    this.selectedTargetCityId = undefined
    this.selectedDiplomacyFactionId = 'neutral'
    this.alliedFactionIds = new Set<FactionId>()
    this.allianceTerms = new Map<FactionId, number>()
    this.diplomacyDebts = new Map<FactionId, DiplomacyDebt>()
    this.cityTaxRates = new Map<CityId, TaxRate>()
    this.sabotagedFactionIds = new Set<FactionId>()
    this.monthlyActionLog = []
    this.marchArmy = undefined
    this.aiMarchArmies = []
    this.usedRouteEvents = new Set<string>()
    this.deploymentOfficerIds = new Set<string>()
    this.deploymentTroopAllocations = new Map<string, number>()
    this.deploymentFoodAllocations = new Map<string, number>()
    this.deploymentFood = undefined
    this.fieldBattleFormation = 'balanced'
    const scenario = this.scenarioConfig()
    const difficulty = this.difficultyConfig()
    const capital = this.campaignCities.find((c) => c.id === faction.capital)
    this.cityState = {
      name: capital?.name ?? faction.capital,
      publicOrder: 62,
      treasury: capital?.gold ?? 800,
      recruits: capital?.troops ?? 6000,
      farms: 1,
      walls: capital?.defense ?? 60,
    }
    this.campaignClock = {
      year: scenario.year,
      month: 1,
      mode: 'inspection',
      enemyThreat: difficulty.threat,
      weather: 'clear',
    }
    const ruler = this.campaignOfficers.find((o) => o.faction === factionId && o.role === '君主')
    const strategist = this.campaignOfficers.find((o) => o.faction === factionId && (o.role === '军师' || o.role === '谋臣' || o.role === '都督'))
    const fallbackOfficer = this.campaignOfficers.find((o) => o.faction === factionId)
    this.appointments = {
      governor: ruler?.id ?? fallbackOfficer?.id ?? '',
      vanguard: ruler?.id ?? fallbackOfficer?.id ?? '',
      strategist: strategist?.id ?? ruler?.id ?? fallbackOfficer?.id ?? '',
    }
    this.recruitedNeutralIds = new Set<string>()
    this.syncSelectedCityState()
    this.ensureLocalAppointments()
  }

  private initializeCityEconomy(city: StrategyCity): StrategyCity {
    const scale = city.defense + Math.floor(city.troops / 320) + Math.floor(city.gold / 45)
    return {
      ...city,
      population: city.population ?? Math.max(18000, Math.floor(city.troops * 4.8 + city.food * 9 + city.gold * 18)),
      commerce: city.commerce ?? Phaser.Math.Clamp(Math.floor(city.gold / 22 + scale / 3), 18, 100),
      land: city.land ?? Phaser.Math.Clamp(Math.floor(city.food / 24 + scale / 4), 20, 100),
      irrigation: city.irrigation ?? Phaser.Math.Clamp(Math.floor(city.defense * 0.45 + city.food / 70), 16, 100),
      disaster: city.disaster ?? 0,
      publicOrder: city.publicOrder ?? (city.owner === this.playerFactionId ? 62 : 50),
    }
  }

  private cityPublicOrder(city: StrategyCity | undefined): number {
    return city?.publicOrder ?? this.cityState.publicOrder
  }

  private setCityPublicOrder(city: StrategyCity, value: number) {
    city.publicOrder = Phaser.Math.Clamp(value, 0, 100)
    if (city.id === this.selectedCityId) {
      this.cityState.publicOrder = city.publicOrder
    }
  }

  private get playerFaction(): StrategyFaction {
    return strategyFactions.find((f) => f.id === this.playerFactionId) ?? strategyFactions[1]
  }

  private get selectedCity() {
    return this.campaignCities.find((city) => city.id === this.selectedCityId)
  }

  private get selectedTargetCity() {
    return this.campaignCities.find((city) => city.id === this.selectedTargetCityId)
  }

  private get focusedCity() {
    return this.campaignCities.find((city) => city.id === this.focusedCityId) ?? this.selectedCity
  }

  private countOfficers(faction: FactionId) {
    return this.campaignOfficers.filter((officer) => officer.faction === faction).length
  }

  private currentCityOfficers() {
    return this.officersInCity(this.selectedCityId)
  }

  private officersInCity(cityId: CityId) {
    return this.campaignOfficers.filter((officer) => officer.faction === this.playerFactionId && officer.location === cityId && !this.isOfficerOnMarch(officer.id) && this.isOfficerAvailable(officer))
  }

  private movableOfficersInCity(cityId: CityId) {
    return this.officersInCity(cityId).filter((officer) => officer.role !== '君主')
  }

  private canMoveAnythingFrom(city: StrategyCity) {
    return this.movableOfficersInCity(city.id).length > 0
      || city.troops > 800
      || city.food >= moveResourceConfig('food', 'small').amount
      || city.gold >= moveResourceConfig('gold', 'small').amount
  }

  private playerFactionOfficers() {
    return this.campaignOfficers.filter((o) => o.faction === this.playerFactionId)
  }

  private currentCityUnits() {
    const pfo = this.playerFactionOfficers()
    const localUnitIds = new Set(this.currentCityOfficers().map((officer) => unitIdForOfficerId(officer.id, pfo)).filter((id): id is string => id !== undefined))
    return baseUnits.filter((unit) => unit.faction === 'player' && localUnitIds.has(unit.id))
  }

  private deployableCurrentCityOfficers() {
    return this.deployableOfficersInCity(this.selectedCityId)
  }

  private deployableOfficersInCity(cityId: CityId) {
    return this.officersInCity(cityId)
  }

  private ensureDeploymentSelection() {
    const deployable = this.deployableCurrentCityOfficers()
    const deployableIds = new Set(deployable.map((officer) => officer.id))
    this.deploymentOfficerIds = new Set([...this.deploymentOfficerIds].filter((id) => deployableIds.has(id)))
    this.deploymentTroopAllocations = new Map([...this.deploymentTroopAllocations].filter(([id]) => deployableIds.has(id)))
    this.deploymentFoodAllocations = new Map([...this.deploymentFoodAllocations].filter(([id]) => deployableIds.has(id)))
    if (this.deploymentOfficerIds.size === 0) {
      deployable.slice(0, 4).forEach((officer) => this.deploymentOfficerIds.add(officer.id))
    }
    const minimum = this.deploymentSupplyNeed()
    if (this.deploymentFood === undefined || this.deploymentFood < minimum || this.deploymentFood > this.councilState.supplies) {
      this.deploymentFood = Math.min(this.councilState.supplies, minimum + 10)
    }
    this.ensureDeploymentAllocations()
  }

  private selectedDeploymentOfficers() {
    const selected = this.deployableCurrentCityOfficers().filter((officer) => this.deploymentOfficerIds.has(officer.id))
    return selected.length > 0 ? selected.slice(0, 4) : this.deployableCurrentCityOfficers().slice(0, 4)
  }

  private selectedDeploymentFood() {
    const minimum = this.deploymentSupplyNeed()
    return Phaser.Math.Clamp(this.deploymentFood ?? minimum, minimum, Math.max(minimum, this.councilState.supplies))
  }

  private toggleDeploymentOfficer(officerId: string) {
    if (this.deploymentOfficerIds.has(officerId)) {
      if (this.deploymentOfficerIds.size <= 1) {
        this.showDeploymentMessage('至少需要一名随军武将。')
        return
      }
      this.deploymentOfficerIds.delete(officerId)
      this.deploymentTroopAllocations.delete(officerId)
      this.deploymentFoodAllocations.delete(officerId)
    } else {
      if (this.deploymentOfficerIds.size >= 4) {
        this.showDeploymentMessage('当前版本最多选择四名随军武将。')
        return
      }
      this.deploymentOfficerIds.add(officerId)
    }
    this.ensureDeploymentAllocations(true)
    this.showDeployment()
  }

  private currentCityDeploymentTroops() {
    const total = this.selectedDeploymentOfficers()
      .reduce((sum, officer) => sum + (this.deploymentTroopAllocations.get(officer.id) ?? officerTroops(officer)), 0)
    return Phaser.Math.Clamp(total, 800, 9000)
  }

  private selectedDeploymentManifest(totalFood = this.selectedDeploymentFood()) {
    const officers = this.selectedDeploymentOfficers()
    this.ensureDeploymentAllocations()
    const foodTotal = officers.reduce((sum, officer) => sum + (this.deploymentFoodAllocations.get(officer.id) ?? 0), 0)
    if (foodTotal !== totalFood) {
      this.rebalanceDeploymentFood(totalFood)
    }
    return officers.map((officer) => {
      const troops = this.deploymentTroopAllocations.get(officer.id) ?? officerTroops(officer)
      const food = this.deploymentFoodAllocations.get(officer.id) ?? 1
      return { officer, troops: Phaser.Math.Clamp(troops, 200, officerTroops(officer)), food: Math.max(1, food) }
    })
  }

  private ensureDeploymentAllocations(forceFoodRebalance = false) {
    const selected = this.selectedDeploymentOfficers()
    const selectedIds = new Set(selected.map((officer) => officer.id))
    this.deploymentTroopAllocations = new Map([...this.deploymentTroopAllocations].filter(([id]) => selectedIds.has(id)))
    this.deploymentFoodAllocations = new Map([...this.deploymentFoodAllocations].filter(([id]) => selectedIds.has(id)))
    selected.forEach((officer) => {
      if (!this.deploymentTroopAllocations.has(officer.id)) {
        this.deploymentTroopAllocations.set(officer.id, officerTroops(officer))
      }
    })
    const foodTotal = selected.reduce((sum, officer) => sum + (this.deploymentFoodAllocations.get(officer.id) ?? 0), 0)
    if (forceFoodRebalance || foodTotal !== this.selectedDeploymentFood() || selected.some((officer) => !this.deploymentFoodAllocations.has(officer.id))) {
      this.rebalanceDeploymentFood(this.selectedDeploymentFood())
    }
  }

  private rebalanceDeploymentFood(totalFood = this.selectedDeploymentFood()) {
    const selected = this.selectedDeploymentOfficers()
    if (selected.length === 0) return
    const totalTroops = selected.reduce((sum, officer) => sum + (this.deploymentTroopAllocations.get(officer.id) ?? officerTroops(officer)), 0)
    let remainingFood = totalFood
    selected.forEach((officer, index) => {
      const troops = this.deploymentTroopAllocations.get(officer.id) ?? officerTroops(officer)
      const food = index === selected.length - 1
        ? remainingFood
        : Math.max(1, Math.floor(totalFood * (troops / Math.max(1, totalTroops))))
      this.deploymentFoodAllocations.set(officer.id, Math.max(1, food))
      remainingFood = Math.max(0, remainingFood - Math.max(1, food))
    })
  }

  private adjustDeploymentOfficerTroops(officerId: string, delta: number) {
    this.ensureDeploymentAllocations()
    const officer = this.selectedDeploymentOfficers().find((item) => item.id === officerId)
    if (!officer) return
    const current = this.deploymentTroopAllocations.get(officerId) ?? officerTroops(officer)
    this.deploymentTroopAllocations.set(officerId, Phaser.Math.Clamp(current + delta, 200, officerTroops(officer)))
    this.showDeployment()
  }

  private adjustDeploymentOfficerFood(officerId: string, delta: number) {
    this.ensureDeploymentAllocations()
    const selected = this.selectedDeploymentOfficers()
    if (selected.length <= 1) {
      this.showDeploymentMessage('单将出征时全部军粮随主将携行。')
      return
    }
    const current = this.deploymentFoodAllocations.get(officerId) ?? 1
    if (delta > 0) {
      const donor = selected
        .filter((officer) => officer.id !== officerId)
        .sort((a, b) => (this.deploymentFoodAllocations.get(b.id) ?? 0) - (this.deploymentFoodAllocations.get(a.id) ?? 0))
        .find((officer) => (this.deploymentFoodAllocations.get(officer.id) ?? 0) > 1)
      if (!donor) {
        this.showDeploymentMessage('其他随军武将已无可调军粮。')
        return
      }
      const donorFood = this.deploymentFoodAllocations.get(donor.id) ?? 1
      const moved = Math.min(delta, donorFood - 1)
      this.deploymentFoodAllocations.set(officerId, current + moved)
      this.deploymentFoodAllocations.set(donor.id, donorFood - moved)
    } else {
      if (current <= 1) {
        this.showDeploymentMessage('每名随军武将至少携带1点军粮。')
        return
      }
      const receiver = selected.find((officer) => officer.id !== officerId)
      if (!receiver) return
      const moved = Math.min(Math.abs(delta), current - 1)
      this.deploymentFoodAllocations.set(officerId, current - moved)
      this.deploymentFoodAllocations.set(receiver.id, (this.deploymentFoodAllocations.get(receiver.id) ?? 1) + moved)
    }
    this.showDeployment()
  }

  private officerForUnit(unitId: string) {
    const officerId = officerIdForUnitId(unitId, this.playerFactionOfficers())
    return this.campaignOfficers.find((officer) => officer.id === officerId)
  }

  private controlledNeighborCitiesFrom(city: StrategyCity) {
    return city.routes
      .map((routeId) => this.campaignCities.find((item) => item.id === routeId))
      .filter((item): item is StrategyCity => item !== undefined && item.owner === this.playerFactionId)
  }

  private ensureLocalAppointments() {
    const officers = this.currentCityOfficers()
    if (officers.length === 0) return
    for (const role of Object.keys(this.appointments) as (keyof typeof this.appointments)[]) {
      const currentOfficer = this.appointedOfficer(role)
      if (!currentOfficer || currentOfficer.location !== this.selectedCityId || !officers.some((o) => o.id === currentOfficer.id)) {
        this.appointments[role] = officers[0].id
      }
    }
    this.applyAppointmentEffects()
  }

  private availableDeploymentTargets() {
    const city = this.selectedCity
    if (!city) return []
    return this.diplomacyTargetsFrom(city)
  }

  private controlledCities() {
    return this.campaignCities.filter((city) => city.owner === this.playerFactionId)
  }

  private diplomacyTargetsFrom(city: StrategyCity) {
    return city.routes
      .map((routeId) => this.campaignCities.find((item) => item.id === routeId))
      .filter((item): item is StrategyCity => item !== undefined && item.owner !== this.playerFactionId)
  }

  private diplomacyFactionTargetsFrom(city: StrategyCity) {
    const ids = new Set(this.diplomacyTargetsFrom(city).map((target) => target.owner))
    return strategyFactions.filter((faction) => ids.has(faction.id))
  }

  private diplomacyFactionTargetsForCommand(kind: DiplomacyCommandKind, city: StrategyCity) {
    const factions = this.diplomacyFactionTargetsFrom(city)
    if (kind === 'repay') {
      return factions.filter((faction) => this.diplomacyDebts.has(faction.id))
    }
    return factions
  }

  private diplomacyFactionStatus(kind: DiplomacyCommandKind, factionId: FactionId) {
    if (kind === 'alliance') {
      const turns = this.allianceTerms.get(factionId)
      return turns ? `盟期 ${turns}月` : ''
    }
    const debt = this.diplomacyDebts.get(factionId)
    if ((kind === 'borrow' || kind === 'repay') && debt) {
      return `欠${debt.principal} 至${debt.dueYear}年${debt.dueMonth}月`
    }
    return ''
  }

  private availableDiplomacyFactions() {
    const ids = new Set(this.availableDeploymentTargets().map((city) => city.owner))
    return strategyFactions.filter((faction) => ids.has(faction.id))
  }

  private selectedDiplomacyFaction() {
    return strategyFactions.find((faction) => faction.id === this.selectedDiplomacyFactionId)
  }

  private ensureDeploymentTarget() {
    const targets = this.availableDeploymentTargets()
    if (targets.length === 0) {
      this.selectedTargetCityId = undefined
      return
    }
    if (!targets.some((city) => city.id === this.selectedTargetCityId)) {
      this.selectedTargetCityId = targets[0].id
    }
  }

  private ensureDiplomacyTarget() {
    const factions = this.availableDiplomacyFactions()
    if (factions.length === 0) {
      this.selectedDiplomacyFactionId = undefined
      return
    }
    if (!factions.some((faction) => faction.id === this.selectedDiplomacyFactionId)) {
      this.selectedDiplomacyFactionId = factions[0].id
    }
    const targets = this.availableDeploymentTargets()
    if (targets.some((city) => city.id === this.selectedTargetCityId && city.owner === this.selectedDiplomacyFactionId)) {
      return
    }
    const target = targets.find((city) => city.owner === this.selectedDiplomacyFactionId)
    if (target) this.selectedTargetCityId = target.id
  }

  private scenarioConfig() {
    return scenarioOptions.find((scenario) => scenario.id === this.selectedScenarioId) ?? scenarioOptions[0]
  }

  private difficultyConfig() {
    return difficultyOptions.find((difficulty) => difficulty.id === this.selectedDifficulty) ?? difficultyOptions[1]
  }

  private selectedScenarioLabel() {
    const scenario = this.scenarioConfig()
    return `${scenario.year}年 ${scenario.name}`
  }

  private selectedDifficultyLabel() {
    return this.difficultyConfig().name
  }

  private countCities(faction: FactionId) {
    return this.campaignCities.filter((city) => city.owner === faction).length
  }

  private sumCityField(faction: FactionId, field: 'gold' | 'food' | 'troops') {
    return this.campaignCities
      .filter((city) => city.owner === faction)
      .reduce((sum, city) => sum + city[field], 0)
  }

  private neighborEnemyCities(faction: FactionId) {
    const owned = this.campaignCities.filter((city) => city.owner === faction)
    const names = new Set<string>()
    for (const city of owned) {
      for (const routeId of city.routes) {
        const neighbor = this.campaignCities.find((item) => item.id === routeId)
        if (neighbor && neighbor.owner !== faction) names.add(neighbor.name)
      }
    }
    return Array.from(names).slice(0, 4)
  }

  private runEnemyFactionTurns() {
    const reports: string[] = []
    reports.push(...this.advanceAiMarchArmies())
    for (const faction of strategyFactions.filter((item) => item.id !== this.playerFactionId && item.id !== 'neutral')) {
      const cities = this.campaignCities.filter((city) => city.owner === faction.id)
      if (cities.length === 0) continue
      this.aiGovernFaction(faction, cities, reports)
      if (this.aiMarchArmies.some((army) => army.factionId === faction.id)) continue
      const strongest = cities.toSorted((a, b) => b.troops - a.troops)[0]
      const neighbors = strongest.routes
        .map((routeId) => this.campaignCities.find((city) => city.id === routeId))
        .filter((city): city is StrategyCity => city !== undefined)
      const target = neighbors
        .filter((city) => city.owner !== faction.id)
        .toSorted((a, b) => a.troops + a.defense * 60 - (b.troops + b.defense * 60))[0]
      if (!target) {
        strongest.troops = Math.min(30000, strongest.troops + 420)
        reports.push(`${faction.name}在${strongest.name}练兵。`)
        continue
      }
      if (target.owner === this.playerFactionId && this.alliedFactionIds.has(faction.id)) {
        strongest.troops = Math.min(30000, strongest.troops + 260)
        reports.push(`${faction.name}顾及盟约，在${strongest.name}暂缓进犯。`)
        continue
      }
      if (strongest.troops > target.troops * 1.18 && strongest.troops > 5200) {
        const army = this.createAiMarchArmy(faction, strongest, target)
        this.aiMarchArmies.push(army)
        reports.push(`${faction.name}自${strongest.name}发兵，向${target.name}进军。`)
      } else {
        strongest.troops = Math.min(30000, strongest.troops + 520)
        strongest.food = Math.min(5000, strongest.food + 180)
        reports.push(`${faction.name}屯兵${strongest.name}，窥伺${target.name}。`)
      }
    }
    return reports.slice(0, 6)
  }

  private aiGovernFaction(faction: StrategyFaction, cities: StrategyCity[], reports: string[]) {
    const trait = faction.trait
    for (const city of cities) {
      const borderNeighbor = city.routes.some((r) => {
        const n = this.campaignCities.find((c) => c.id === r)
        return n && n.owner !== faction.id
      })
      const recruitAmount = trait === '屯田强军' ? 380 : trait === '仁德聚众' ? 320 : trait === '江东水师' ? 340 : trait === '河北名门' ? 360 : 300
      if (city.troops < 6000) {
        city.troops = Math.min(30000, city.troops + recruitAmount)
      }
      const foodGain = Math.floor(80 + city.population! * 0.003)
      const goldGain = Math.floor(50 + city.population! * 0.002)
      city.food = Math.min(5000, city.food + foodGain)
      city.gold = Math.min(3000, city.gold + goldGain)
      if (borderNeighbor && city.defense < 65) {
        city.defense = Math.min(100, city.defense + 3)
      }
      if (city.publicOrder !== undefined && city.publicOrder < 45) {
        city.publicOrder = Math.min(100, (city.publicOrder ?? 50) + 4)
        city.gold = Math.max(0, city.gold - 40)
      }
    }
    const totalTroops = cities.reduce((sum, c) => sum + c.troops, 0)
    if (totalTroops > 18000 && cities.length >= 2) {
      const weakest = cities.toSorted((a, b) => a.troops - b.troops)[0]
      const strongest = cities.toSorted((a, b) => b.troops - a.troops)[0]
      if (strongest.troops > weakest.troops * 2 && strongest.troops > 6000) {
        const transfer = Math.floor(strongest.troops * 0.15)
        strongest.troops -= transfer
        weakest.troops = Math.min(30000, weakest.troops + transfer)
      }
    }
    this.aiAttemptDiplomacy(faction, cities, reports)
  }

  private aiAttemptDiplomacy(faction: StrategyFaction, cities: StrategyCity[], reports: string[]) {
    const playerBorderCities = cities.filter((c) => c.routes.some((r) => {
      const n = this.campaignCities.find((cc) => cc.id === r)
      return n && n.owner === this.playerFactionId
    }))
    if (playerBorderCities.length > 0 && Phaser.Math.Between(1, 100) <= 22) {
      const borderCity = playerBorderCities[Phaser.Math.Between(0, playerBorderCities.length - 1)]
      const playerCity = borderCity.routes
        .map((r) => this.campaignCities.find((c) => c.id === r))
        .find((c) => c && c.owner === this.playerFactionId)
      if (playerCity) {
        playerCity.troops = Math.max(600, Math.floor(playerCity.troops * 0.92))
        playerCity.defense = Math.max(15, playerCity.defense - 2)
        reports.push(`${faction.ruler}遣细作潜入${playerCity.name}，守军略有动摇。`)
      }
    }
    if (Phaser.Math.Between(1, 100) <= 12) {
      const otherFactions = strategyFactions.filter((f) => f.id !== faction.id && f.id !== this.playerFactionId && f.id !== 'neutral' && this.countCities(f.id) > 0)
      if (otherFactions.length > 0) {
        const ally = otherFactions[Phaser.Math.Between(0, otherFactions.length - 1)]
        reports.push(`${faction.ruler}与${ally.ruler}互通使节，暗中结好。`)
      }
    }
  }

  private createAiMarchArmy(faction: StrategyFaction, source: StrategyCity, target: StrategyCity): MarchArmy {
    const leader = this.campaignOfficers
      .filter((officer) => officer.faction === faction.id && officer.location === source.id && this.isOfficerAvailable(officer))
      .toSorted((a, b) => b.command - a.command || b.war - a.war)[0]
      ?? this.campaignOfficers.filter((officer) => officer.faction === faction.id && this.isOfficerAvailable(officer)).toSorted((a, b) => b.command - a.command)[0]
    const troops = Math.min(Math.max(1800, Math.floor(source.troops * 0.42)), Math.max(1200, source.troops - 1000))
    source.troops = Math.max(900, source.troops - troops)
    return {
      id: `ai-${faction.id}-${this.campaignClock.year}-${this.campaignClock.month}-${source.id}-${target.id}`,
      factionId: faction.id,
      sourceCityId: source.id,
      targetCityId: target.id,
      leaderOfficerId: leader?.id ?? faction.ruler,
      officerIds: leader ? [leader.id] : [],
      officerTroops: leader ? { [leader.id]: troops } : {},
      officerFood: leader ? { [leader.id]: 24 } : {},
      officerFatigue: leader ? { [leader.id]: 0 } : {},
      troops,
      food: 42,
      morale: 52 + Math.floor(source.defense / 6),
      position: { kind: 'city', cityId: source.id },
      routePlan: [source.id, target.id],
      movePoints: 1,
      status: 'ready',
    }
  }

  private advanceAiMarchArmies() {
    const reports: string[] = []
    const remaining: MarchArmy[] = []
    for (const army of this.aiMarchArmies) {
      const targetId = army.targetCityId
      const target = targetId ? this.campaignCities.find((city) => city.id === targetId) : undefined
      if (!target || target.owner === army.factionId) {
        reports.push(`${this.aiArmyName(army)}失去目标，收军回防。`)
        continue
      }
      const from = this.currentNodeForArmy(army)
      const next = this.nextNodeForArmy(army)
      if (!next) {
        remaining.push(army)
        continue
      }
      const nextProgress = Math.min(MARCH_ROUTE_STEPS, (army.position.progress ?? 0) + 1)
      const moveCost = this.routeMoveCost(from, next)
      army.food = Math.max(0, army.food - moveCost.food)
      army.morale = Phaser.Math.Clamp(army.morale + moveCost.morale, 0, 100)
      if (nextProgress >= MARCH_ROUTE_STEPS) {
        army.position = { kind: 'city', cityId: next, progress: MARCH_ROUTE_STEPS }
        army.status = 'marching'
        const encounter = this.resolveAiPlayerMarchEncounter(army, from, next, true)
        if (encounter) reports.push(encounter)
        if ((army.status as MarchArmy['status']) === 'routed') continue
        if (next === targetId) {
          reports.push(this.resolveAiSiege(army, target))
          continue
        }
        reports.push(`${this.aiArmyName(army)}抵达${cityName(next)}，继续向${target.name}推进。`)
      } else {
        army.position = { kind: 'route', route: [from, next], progress: nextProgress }
        army.status = 'marching'
        const encounter = this.resolveAiPlayerMarchEncounter(army, from, next, false)
        if (encounter) reports.push(encounter)
        if ((army.status as MarchArmy['status']) === 'routed') continue
        reports.push(`${this.aiArmyName(army)}沿${cityName(from)}至${cityName(next)}道路行军 ${nextProgress}/${MARCH_ROUTE_STEPS}。`)
      }
      remaining.push(army)
    }
    this.aiMarchArmies = remaining
    return reports
  }

  private resolveAiSiege(army: MarchArmy, target: StrategyCity) {
    const faction = factionById(army.factionId)
    const oldOwnerId = target.owner
    const attackScore = army.troops * (0.78 + army.morale / 160)
    const defendScore = target.troops + target.defense * 72
    if (attackScore > defendScore) {
      const attackerLoss = Math.floor(army.troops * 0.24)
      const defenderRemain = Math.floor(target.troops * 0.32)
      const source = this.campaignCities.find((city) => city.id === army.sourceCityId)
      if (source) source.troops = Math.max(900, source.troops + Math.max(300, army.troops - attackerLoss - Math.floor(army.troops * 0.36)))
      target.owner = army.factionId
      target.troops = Math.max(1000, defenderRemain)
      target.defense = Math.max(18, Math.floor(target.defense * 0.72))
      const settlement = this.resolveStrategicSettlement(oldOwnerId)
      return [`${faction?.name ?? '敌军'}攻取${target.name}。`, ...settlement.lines.filter((line) => !line.startsWith('统一进度'))].join(' ')
    }
    const defenderLoss = Math.floor(target.troops * 0.16)
    target.troops = Math.max(600, target.troops - defenderLoss)
    const source = this.campaignCities.find((city) => city.id === army.sourceCityId)
    if (source) source.troops = Math.max(900, source.troops + Math.floor(army.troops * 0.48))
    return `${faction?.name ?? '敌军'}攻${target.name}不克，守军损兵${defenderLoss}。`
  }

  private resolveAiPlayerMarchEncounter(aiArmy: MarchArmy, from: CityId, target: CityId, arrived: boolean) {
    if (!this.marchArmy || !this.aiArmyConflictsWithPlayer(aiArmy, from, target, arrived)) return ''
    const aiName = this.aiArmyName(aiArmy)
    const playerPower = this.marchArmy.troops * (0.72 + this.marchArmy.morale / 145)
    const aiPower = aiArmy.troops * (0.72 + aiArmy.morale / 145)
    const playerLoss = Math.min(Math.max(70, Math.floor(aiArmy.troops * 0.08)), Math.max(0, this.marchArmy.troops - 420))
    const aiLoss = Math.min(Math.max(70, Math.floor(this.marchArmy.troops * 0.1)), Math.max(0, aiArmy.troops - 360))
    this.marchArmy.troops = Math.max(400, this.marchArmy.troops - playerLoss)
    this.distributeMarchArmyTroopLoss(playerLoss)
    aiArmy.troops = Math.max(260, aiArmy.troops - aiLoss)
    if (playerPower >= aiPower * 1.12 || aiArmy.troops <= 520) {
      aiArmy.status = 'routed'
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + 3, 0, 100)
      this.recordMonthlyAction(`击退${aiName}`)
      return `${aiName}遭我远征军截击，敌损${aiLoss}，我损${playerLoss}，敌军退却。`
    }
    this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 4, 0, 100)
    this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 2, 0, 100)
    this.recordMonthlyAction(`遭${aiName}扰袭`)
    return `${aiName}与我远征军遭遇，我损${playerLoss}，敌损${aiLoss}，士气 -4。`
  }

  private currentNodeForArmy(army: MarchArmy) {
    return army.position.kind === 'route'
      ? army.position.route?.[0] ?? army.sourceCityId
      : army.position.cityId ?? army.sourceCityId
  }

  private nextNodeForArmy(army: MarchArmy) {
    if (army.position.kind === 'route') return army.position.route?.[1]
    const current = this.currentNodeForArmy(army)
    const index = army.routePlan.indexOf(current)
    return index >= 0 ? army.routePlan[index + 1] : army.targetCityId
  }

  private aiArmyName(army: MarchArmy) {
    const faction = factionById(army.factionId)
    return `${faction?.name ?? '敌军'}${cityName(army.sourceCityId)}军`
  }

  private resolveMonthlyEvent() {
    const roll = Phaser.Math.Between(1, 100)
    const city = this.selectedCity
    if (roll <= 25 && city) {
      const gain = 260 + Math.floor((city.land ?? 35) * 3 + (city.irrigation ?? 35) * 2)
      city.food = Math.min(5000, city.food + gain)
      city.disaster = Phaser.Math.Clamp((city.disaster ?? 0) - 5, 0, 100)
      this.syncSelectedCityState()
      return `${city.name}丰收，粮 +${gain}，灾害 -5。`
    }
    if (roll <= 45 && city) {
      const loss = Math.min(city.gold, 120)
      city.gold -= loss
      city.commerce = Phaser.Math.Clamp((city.commerce ?? 35) - 3, 0, 100)
      city.disaster = Phaser.Math.Clamp((city.disaster ?? 0) + 8, 0, 100)
      this.setCityPublicOrder(city, this.cityPublicOrder(city) - 6)
      this.syncSelectedCityState()
      return `${city.name}盗贼滋扰，金 -${loss}，商业 -3，灾害 +8，民心 -6。`
    }
    if (roll <= 68) {
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 10, 0, 100)
      return '门客带来名士传闻，情报 +10。'
    }
    this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 5, 0, 100)
    return '边境告急，敌势 +5。'
  }

  private strongestEnemySummary() {
    const summaries = strategyFactions
      .filter((faction) => faction.id !== this.playerFactionId && faction.id !== 'neutral')
      .map((faction) => ({
        name: faction.name,
        troops: this.sumCityField(faction.id, 'troops'),
      }))
    return summaries.toSorted((a, b) => b.troops - a.troops)[0] ?? { name: '群雄', troops: 0 }
  }

  private drawMap() {
    for (let y = 0; y < MAP_H; y += 1) {
      for (let x = 0; x < MAP_W; x += 1) {
        const tile = terrain[mapRows[y][x]]
        const px = BOARD_X + x * TILE
        const py = BOARD_Y + y * TILE
        this.boardLayer.add(this.add.rectangle(px, py, TILE - 2, TILE - 2, this.terrainColor(tile.type), 0.74).setOrigin(0))
        this.boardLayer.add(this.add.rectangle(px, py, TILE - 2, TILE - 2, 0x000000, 0).setOrigin(0).setStrokeStyle(1, 0xf4d48c, 0.22))
        this.drawTerrainMark(tile.type, px, py)
      }
    }
  }

  private drawTerrainMark(type: TerrainType, px: number, py: number) {
    if (type === 'forest') {
      this.boardLayer.add(this.add.triangle(px + 32, py + 18, 0, 28, 18, 0, 36, 28, 0x2d6a4f, 0.8))
      this.boardLayer.add(this.add.rectangle(px + 28, py + 40, 8, 14, 0x6d4c41, 0.9))
    }
    if (type === 'hill') {
      this.boardLayer.add(this.add.triangle(px + 32, py + 42, 2, 28, 30, 0, 58, 28, 0x7b5f3a, 0.72))
    }
    if (type === 'water') {
      this.boardLayer.add(this.add.ellipse(px + 32, py + 34, 42, 18, 0x8ecae6, 0.28))
    }
    if (type === 'fort') {
      this.boardLayer.add(this.add.rectangle(px + 17, py + 22, 30, 26, 0x926f34, 0.95).setStrokeStyle(2, 0xf4d58d))
      this.boardLayer.add(this.add.rectangle(px + 23, py + 15, 18, 10, 0x53331b, 0.95))
    }
  }

  private drawHighlights() {
    for (const pos of this.highlighted) {
      const px = BOARD_X + pos.x * TILE
      const py = BOARD_Y + pos.y * TILE
      this.highlightLayer.add(this.add.rectangle(px + 2, py + 2, TILE - 6, TILE - 6, this.phase === 'moveTarget' ? 0x6cb6ff : 0xffd166, 0.28).setOrigin(0))
      this.highlightLayer.add(this.add.rectangle(px + 2, py + 2, TILE - 6, TILE - 6, 0xffffff, 0).setOrigin(0).setStrokeStyle(2, 0xffffff, 0.45))
    }
  }

  private drawUnits() {
    for (const unit of this.units.filter((u) => u.alive)) {
      const { x, y } = gridToWorld(unit.position)
      const selected = unit.id === this.selectedUnitId
      const base = this.add.container(x, y)
      base.add(this.add.circle(0, 15, 23, unit.faction === 'player' ? 0x122945 : 0x3d1115, 0.82))
      base.add(this.add.circle(0, 0, 20, unit.palette.primary, unit.hasActed ? 0.58 : 1).setStrokeStyle(selected ? 4 : 2, selected ? 0xfff0ad : unit.palette.secondary))
      base.add(this.add.rectangle(0, -8, 22, 12, unit.palette.secondary, 0.95))
      base.add(this.add.text(0, -3, unit.name.slice(0, 1), {
        fontFamily: 'Georgia, serif',
        fontSize: '22px',
        color: '#fff8dd',
        stroke: '#1b0d0b',
        strokeThickness: 3,
      }).setOrigin(0.5))
      base.add(this.add.rectangle(-24, 30, 48, 6, 0x161616, 0.95).setOrigin(0))
      base.add(this.add.rectangle(-24, 30, 48 * (unit.stats.hp / unit.stats.maxHp), 6, unit.faction === 'player' ? 0x45d483 : 0xf25f5c, 0.95).setOrigin(0))
      base.add(this.add.text(0, 41, `${unit.stats.hp}/${unit.stats.maxHp}`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#f8f2de',
      }).setOrigin(0.5))
      this.unitLayer.add(base)
    }
  }

  private drawHud() {
    this.statusText = this.add.text(UI_X, 98, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#f8df9d',
    })
    this.infoText = this.add.text(UI_X, 142, '', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '17px',
      color: '#f8ecd0',
      lineSpacing: 8,
      wordWrap: { width: 380 },
    })
    this.logText = this.add.text(36, 626, '', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f3dec0',
      lineSpacing: 5,
      wordWrap: { width: 1120 },
    })
    this.uiLayer.add(this.add.rectangle(UI_X - 18, 86, 420, 498, UI.panel, 0.94).setOrigin(0).setStrokeStyle(2, UI.border, 0.76))
    this.uiLayer.add(this.add.rectangle(UI_X - 2, 386, 388, 188, UI.subPanel, 0.88).setOrigin(0).setStrokeStyle(1, UI.border, 0.6))
    this.uiLayer.add(this.add.text(UI_X + 18, 400, '战斗命令', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#f8df9d',
    }))
    this.uiLayer.add(this.add.rectangle(24, 612, 1190, 114, UI.panel, 0.94).setOrigin(0).setStrokeStyle(2, UI.border, 0.76))
    this.uiLayer.add([this.statusText, this.infoText, this.logText])
    this.uiLayer.add(this.add.rectangle(1040, 14, 208, 44, 0x101722, 0.74).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.42))
    this.makeButton(1092, 36, this.siegeState ? '攻城' : '版图', () => {
      if (this.siegeState) this.showSiege('会战暂停，攻城态势未结算。')
      else this.showCampaign()
    }, this.uiLayer, 88, 34, 18)
    this.makeButton(1196, 36, '退却', () => this.retreatBattle(), this.uiLayer, 88, 34, 18)
    this.updateHud()
  }

  private updateHud() {
    this.actionButtons.forEach((button) => button.destroy())
    this.actionButtons = []
    const selected = this.selectedUnit
    const factionLabel = this.currentFaction === 'player' ? '我方回合' : '敌方回合'
    this.statusText.setText(`第 ${this.turn} 阵 · ${factionLabel} · ${this.battlePosture()}`)
    if (selected) {
      const tile = terrain[mapRows[selected.position.y][selected.position.x]]
      this.infoText.setText([
        `${selected.name}｜${selected.title}`,
        `兵力 ${selected.stats.hp}/${selected.stats.maxHp}`,
        `攻 ${selected.stats.atk}  防 ${selected.stats.def}  谋 ${selected.stats.mag}  抗 ${selected.stats.res}`,
        `移动 ${selected.stats.move}  射程 ${selected.stats.range}`,
        `地形 ${terrainName(tile.type)}：防御 +${tile.defenseBonus} 攻击 +${tile.attackBonus}`,
      ].join('\n'))
      this.drawPortrait(selected)
      if (this.currentFaction === 'player' && selected.faction === 'player' && !selected.hasActed && (this.phase === 'moveTarget' || this.phase === 'actionTarget')) {
        const modeLabel = this.phase === 'moveTarget' ? '选择移动格' : this.selectedSkillId ? '选择计略目标' : '选择攻击目标'
        this.addActionButton(modeLabel, 438, () => undefined)
        this.addActionButton('[C] 取消', 480, () => this.cancelBattleTargetMode())
        this.addActionButton('[X] 撤退', 522, () => this.retreatBattle())
      }
      if (this.currentFaction === 'player' && selected.faction === 'player' && !selected.hasActed && this.phase === 'playerSelect') {
        if (!selected.hasMoved) this.addActionButton('[M] 移动', 438, () => this.enterMoveMode(selected))
        else this.addActionButton('已移动', 438, () => {
          this.addLog(`${selected.name}本阵已经移动。`)
          this.renderBattle()
        })
        this.addActionButton('[A] 攻击', 480, () => this.enterAttackMode(selected, undefined))
        const skill = skills[selected.skills[0]]
        this.addActionButton(skill.type === 'heal' ? '[T] 救护' : '[T] 计略', 522, () => this.enterAttackMode(selected, skill.id))
        this.addActionButton('[W] 待机', 564, () => this.finishUnit(selected))
        this.addActionButton('[G] 委任', 438, () => this.delegateUnit(selected), UI_X + 298)
        this.addActionButton('[X] 撤退', 480, () => this.retreatBattle(), UI_X + 298)
      }
    } else {
      const unitKeys = ['Q', 'W', 'E', 'R']
      const roster = this.living('player').map((unit, index) => `[${unitKeys[index] ?? '-'}] ${unit.name} 兵${unit.stats.hp}/${unit.stats.maxHp}`).join('\n')
      this.infoText.setText(`军势态势：${this.battlePosture()}\n目标：击破守军主将并夺取${this.selectedTargetCity?.name ?? '目标城'}。\n字母键可选武将。\n\n${roster}`)
    }
    this.logText.setText(this.logLines.slice(-4).join('\n'))
  }

  private drawPortrait(unit: Unit) {
    const x = UI_X + 292
    const y = 148
    this.uiLayer.add(this.add.rectangle(x, y, 82, 98, 0x231613, 0.92).setStrokeStyle(2, unit.palette.secondary))
    const key = `portrait-${unit.id}`
    if (this.textures.exists(key)) {
      this.uiLayer.add(this.add.image(x, y, key).setDisplaySize(74, 90))
      return
    }
    this.uiLayer.add(this.add.circle(x, y - 10, 30, unit.palette.portrait, 1))
    this.uiLayer.add(this.add.rectangle(x, y + 26, 54, 42, unit.palette.primary, 1))
    this.uiLayer.add(this.add.text(x, y - 10, unit.name.slice(0, 1), {
      fontFamily: 'Georgia, serif',
      fontSize: '34px',
      color: '#fff5d6',
      stroke: '#1c1010',
      strokeThickness: 4,
    }).setOrigin(0.5))
  }

  private addActionButton(label: string, y: number, callback: () => void, x = UI_X + 116) {
    const button = this.makeButton(x, y, label, callback, this.uiLayer, 150, 34)
    this.actionButtons.push(button)
  }

  private forceSummary(faction: Faction) {
    const units = this.units.filter((unit) => unit.faction === faction)
    return {
      total: units.filter((unit) => unit.alive).reduce((sum, unit) => sum + unit.stats.hp, 0),
      max: units.reduce((sum, unit) => sum + unit.stats.maxHp, 0),
      alive: units.filter((unit) => unit.alive).length,
    }
  }

  private battlePosture() {
    const player = this.forceSummary('player')
    const enemy = this.forceSummary('enemy')
    const ratio = player.total / Math.max(1, enemy.total)
    if (this.councilState.supplies <= 12) return '粮道告急'
    if (ratio >= 1.35) return '我军占优'
    if (ratio <= 0.72) return '敌军压境'
    if (this.campaignClock.enemyThreat >= 70) return '敌势强盛'
    return '两军相持'
  }

  private makeKeyButton(x: number, y: number, key: string, label: string, callback: () => void, layer: Phaser.GameObjects.Container, width = 220, height = 48) {
    return this.makeButton(x, y, `[${key}] ${label}`, callback, layer, width, height, width <= 92 ? 16 : 19)
  }

  private makeButton(x: number, y: number, label: string, callback: () => void, layer: Phaser.GameObjects.Container, width = 220, height = 48, fontSize = 21) {
    const effectiveFontSize = Math.min(
      fontSize,
      height <= 36 ? 17 : height <= 40 ? 19 : fontSize,
      width <= 96 ? 16 : width <= 140 ? 18 : fontSize,
      label.length >= 8 && width <= 170 ? 18 : fontSize,
    )
    const padY = height <= 36 ? 5 : height <= 40 ? 7 : 9
    const padX = width <= 110 ? 10 : 18
    const button = this.add.text(x, y, label, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: `${effectiveFontSize}px`,
      color: '#21140f',
      align: 'center',
      backgroundColor: '#f5d487',
      padding: { x: padX, y: padY },
      fixedWidth: width,
      fixedHeight: height,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    button.on('pointerover', () => button.setStyle({ backgroundColor: '#ffe7a6' }))
    button.on('pointerout', () => button.setStyle({ backgroundColor: '#f5d487' }))
    button.on('pointerdown', callback)
    layer.add(button)
    return button
  }

  private handlePointer(pointer: Phaser.Input.Pointer) {
    if (this.phase === 'title' || this.phase === 'inspectionMonth' || this.phase === 'marchMonth' || this.phase === 'inspect' || this.phase === 'factions' || this.phase === 'talent' || this.phase === 'city' || this.phase === 'heroes' || this.phase === 'diplomacy' || this.phase === 'deploy' || this.phase === 'briefing' || this.phase === 'monthReport' || this.phase === 'enemyTurn' || this.phase === 'result') return
    if (pointer.rightButtonDown() && (this.phase === 'moveTarget' || this.phase === 'actionTarget')) {
      this.cancelBattleTargetMode()
      return
    }
    const pos = worldToGrid(pointer.x, pointer.y)
    if (!pos || !isInside(pos)) return
    if (this.phase === 'moveTarget') {
      this.tryMove(pos)
      return
    }
    if (this.phase === 'actionTarget') {
      this.tryAction(pos)
      return
    }
    const unit = this.unitAt(pos)
    if (unit?.faction === 'player' && !unit.hasActed) {
      this.selectedUnitId = unit.id
      this.highlighted = []
      this.renderBattle()
    }
  }

  private enterMoveMode(unit: Unit) {
    this.phase = 'moveTarget'
    this.highlighted = reachableTiles(unit)
    this.renderBattle()
  }

  private enterAttackMode(unit: Unit, skillId?: string) {
    this.phase = 'actionTarget'
    this.selectedSkillId = skillId
    const range = skillId ? skills[skillId].range : unit.stats.range
    this.highlighted = tilesInRange(unit.position, range).filter((pos) => isInside(pos))
    this.renderBattle()
  }

  private cancelBattleTargetMode() {
    if (this.phase !== 'moveTarget' && this.phase !== 'actionTarget') return
    this.phase = 'playerSelect'
    this.selectedSkillId = undefined
    this.highlighted = []
    this.renderBattle()
  }

  private tryMove(pos: GridPosition) {
    const unit = this.selectedUnit
    if (!unit || !this.highlighted.some((tile) => samePos(tile, pos))) return
    if (this.unitAt(pos) && !samePos(unit.position, pos)) return
    unit.position = pos
    unit.hasMoved = true
    this.phase = 'playerSelect'
    this.highlighted = []
    this.addLog(`${unit.name} 移动到 ${pos.x + 1},${pos.y + 1}。`)
    this.renderBattle()
  }

  private tryAction(pos: GridPosition) {
    const unit = this.selectedUnit
    if (!unit || !this.highlighted.some((tile) => samePos(tile, pos))) return
    const skill = this.selectedSkillId ? skills[this.selectedSkillId] : undefined
    const target = this.unitAt(pos)
    if (!target || !target.alive) return
    if (!this.performUnitAction(unit, target, skill)) return
    unit.hasActed = true
    this.phase = 'playerSelect'
    this.selectedSkillId = undefined
    this.highlighted = []
    if (!this.checkBattleEnd()) this.afterPlayerAction()
  }

  private performUnitAction(unit: Unit, target: Unit, skill?: Skill) {
    if (skill?.type === 'heal') {
      if (target.faction !== unit.faction) return false
      const amount = unit.stats.mag + skill.power
      target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + amount)
      this.addLog(`${unit.name} 使用${skill.name}，为 ${target.name} 回复 ${amount} 兵。`)
      return true
    }
    if (target.faction === unit.faction) return false
    const damage = computeDamage(unit, target, skill)
    target.stats.hp = Math.max(0, target.stats.hp - damage)
    const actionName = skill ? skill.name : '攻击'
    this.addLog(`${unit.name} 对 ${target.name} 下令${actionName}，造成 ${damage} 兵损。`)
    this.flashAt(target.position, unit.faction === 'player' ? 0xfff1a8 : 0xff6b6b)
    if (target.stats.hp <= 0) this.defeatUnit(target, unit)
    return true
  }

  private finishUnit(unit: Unit) {
    unit.hasActed = true
    this.addLog(`${unit.name} 原地待机。`)
    this.afterPlayerAction()
  }

  private delegateUnit(unit: Unit) {
    const target = nearestAttackable(unit, this.living('enemy'))
    if (target) {
      const skill = skills[unit.skills[0]]
      const useSkill = skill && distance(unit.position, target.position) <= skill.range && skill.type === 'damage'
      this.performUnitAction(unit, target, useSkill ? skill : undefined)
      unit.hasActed = true
      this.phase = 'playerSelect'
      this.selectedSkillId = undefined
      this.highlighted = []
      if (!this.checkBattleEnd()) this.afterPlayerAction()
      return
    }
    const enemy = nearestUnit(unit, this.living('enemy'))
    const next = enemy ? bestStepToward(unit, enemy.position, this.units) : undefined
    if (next) {
      unit.position = next
      unit.hasMoved = true
      this.addLog(`${unit.name} 奉命逼近敌阵。`)
    }
    this.finishUnit(unit)
  }

  private retreatBattle() {
    if (this.siegeState && this.marchArmy) {
      this.resolveSiegeAction('retreat')
      return
    }
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale - 8, 0, 100)
    this.councilState.supplies = Math.max(0, this.councilState.supplies - 8)
    this.marchArmy = undefined
    this.campaignClock.mode = 'inspection'
    this.recordMonthlyAction(`${this.selectedCity?.name ?? '我军'}撤退`)
    this.showResult(false, '我军鸣金收兵，士气 -8，补给 -8。')
  }

  private afterPlayerAction() {
    this.highlighted = []
    if (this.living('player').every((unit) => unit.hasActed)) {
      this.selectedUnitId = undefined
      this.startEnemyTurn()
    } else {
      this.phase = 'playerSelect'
      this.selectNextReadyPlayerUnit()
      this.renderBattle()
    }
  }

  private startEnemyTurn() {
    this.currentFaction = 'enemy'
    this.phase = 'enemyTurn'
    this.renderBattle()
    this.time.delayedCall(520, () => this.runEnemyUnit(0))
  }

  private runEnemyUnit(index: number) {
    const enemies = this.living('enemy')
    if (index >= enemies.length) {
      this.endRound()
      return
    }
    const enemy = enemies[index]
    const target = nearestUnit(enemy, this.living('player'))
    if (!target) {
      this.checkBattleEnd()
      return
    }
    if (distance(enemy.position, target.position) > enemy.stats.range) {
      const next = bestStepToward(enemy, target.position, this.units)
      if (next) {
        enemy.position = next
        this.addLog(`${enemy.name} 逼近 ${target.name}。`)
      }
    }
    const newTarget = nearestAttackable(enemy, this.living('player'))
    if (newTarget) {
      const skill = skills[enemy.skills[0]]
      const useSkill = distance(enemy.position, newTarget.position) <= skill.range
      const damage = computeDamage(enemy, newTarget, useSkill ? newTarget.stats.hp > 5 ? skill : undefined : undefined)
      newTarget.stats.hp = Math.max(0, newTarget.stats.hp - damage)
      this.addLog(`${enemy.name} 攻击 ${newTarget.name}，造成 ${damage} 伤害。`)
      this.flashAt(newTarget.position, 0xff6b6b)
      if (newTarget.stats.hp <= 0) this.defeatUnit(newTarget, enemy)
    }
    this.renderBattle()
    if (!this.checkBattleEnd()) this.time.delayedCall(580, () => this.runEnemyUnit(index + 1))
  }

  private endRound() {
    this.councilState.supplies = Math.max(0, this.councilState.supplies - 8)
    if (this.councilState.supplies === 0) {
      this.living('player').forEach((unit) => {
        unit.stats.hp = Math.max(1, unit.stats.hp - 1)
      })
      this.addLog('补给断绝，我军疲惫，每部存活军势损失 1 点兵力。')
    } else {
      this.addLog(`阵后整备：军粮消耗，剩余补给 ${this.councilState.supplies}，态势「${this.battlePosture()}」。`)
    }
    for (const unit of this.units) {
      unit.hasMoved = false
      unit.hasActed = false
      if (unit.alive) {
        const tile = terrain[mapRows[unit.position.y][unit.position.x]]
        if (tile.healPerTurn > 0) {
          unit.stats.hp = Math.min(unit.stats.maxHp, unit.stats.hp + tile.healPerTurn)
        }
      }
    }
    this.turn += 1
    this.currentFaction = 'player'
    this.phase = 'playerSelect'
    this.selectNextReadyPlayerUnit()
    this.addLog(`第 ${this.turn} 阵开始，${this.battlePosture()}。`)
    this.renderBattle()
  }

  private selectNextReadyPlayerUnit() {
    const current = this.selectedUnit
    if (current?.faction === 'player' && current.alive && !current.hasActed) return
    const next = this.living('player')
      .filter((unit) => !unit.hasActed)
      .toSorted((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)[0]
    this.selectedUnitId = next?.id
  }

  private defeatUnit(target: Unit, attacker: Unit) {
    target.alive = false
    target.stats.hp = 0
    if (attacker.faction === 'player') {
      this.roundKills += 1
    }
    this.addLog(`${target.name} 军势溃散。`)
  }

  private checkBattleEnd() {
    const commander = this.units.find((unit) => unit.faction === 'enemy' && unit.classId === 'commander')
    const enemyForce = this.forceSummary('enemy')
    const playerAlive = this.living('player').length > 0
    if (!commander?.alive || enemyForce.total <= Math.max(8, Math.floor(enemyForce.max * 0.18))) {
      this.showResult(true)
      return true
    } else if (!playerAlive) {
      this.showResult(false)
      return true
    }
    return false
  }

  private showResult(victory: boolean, overrideCopy?: string) {
    this.phase = 'result'
    this.overlayLayer.removeAll(true)
    this.renderBattle()
    const target = this.selectedTargetCity
    const inSiege = Boolean(this.siegeState)
    const battleReport = inSiege ? this.applyFieldBattleToSiege(victory) : this.applyBattleOutcome(victory)
    const title = victory ? (inSiege ? '会战胜利' : '战役胜利') : (inSiege ? '会战失利' : '战役失败')
    const playerForce = this.forceSummary('player')
    const enemyForce = this.forceSummary('enemy')
    const siegeCity = this.siegeState ? this.campaignCities.find((city) => city.id === this.siegeState?.defenderCityId) : undefined
    const siegeCanFinish = Boolean(this.siegeState && siegeCity && (this.siegeState.wallHp <= 0 || this.siegeState.defenderTroops <= Math.max(500, Math.floor(this.siegeState.defenderInitialTroops * 0.18))))
    const copy = overrideCopy ?? (inSiege
      ? `会战结果已回写攻城态势。\n残兵：我军 ${playerForce.total}｜敌军 ${enemyForce.total}\n${battleReport}\n阵数：${this.turn}  击破：${this.roundKills}`
      : victory
      ? `敌军主将已败，${target?.name ?? '目标城'}归入${this.playerFaction.name}。\n残兵：我军 ${playerForce.total}｜敌军 ${enemyForce.total}\n${battleReport}\n阵数：${this.turn}  击破：${this.roundKills}`
      : `我方军势受挫，粮道失守。\n残兵：我军 ${playerForce.total}｜敌军 ${enemyForce.total}\n${battleReport}\n阵数：${this.turn}`)
    this.addLayeredPanel(640, 382, 660, 328)
    this.overlayLayer.add(this.add.text(640, 306, title, {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: victory ? '#f8df9d' : '#ffb3b3',
      stroke: '#1b1010',
      strokeThickness: 5,
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.text(640, 388, copy, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f7ecd5',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5))
    if (inSiege) {
      if (victory) {
        this.makeButton(640, 500, siegeCanFinish ? '入城' : '继续攻城', () => siegeCanFinish ? this.completeSiegeVictory() : this.showSiege(), this.overlayLayer, 170, 42)
      } else {
        this.makeButton(540, 500, '返回攻城', () => this.showSiege(), this.overlayLayer, 170, 42)
        this.makeButton(740, 500, '撤退', () => this.resolveSiegeAction('retreat'), this.overlayLayer, 150, 42)
      }
    } else {
      this.makeButton(460, 500, '再战', () => this.startBattle(), this.overlayLayer, 150, 42)
      this.makeButton(640, 500, '返回版图', () => {
        this.marchArmy = undefined
        this.campaignClock.mode = 'inspection'
        this.showCampaign()
      }, this.overlayLayer, 170, 42)
      this.makeButton(830, 500, '月令', () => {
        this.marchArmy = undefined
        this.campaignClock.mode = 'inspection'
        this.advanceCampaignMonth()
      }, this.overlayLayer, 150, 42)
    }
  }

  private applyFieldBattleToSiege(victory: boolean) {
    if (!this.siegeState || !this.marchArmy) return '攻城态势未变化。'
    const player = this.forceSummary('player')
    const enemy = this.forceSummary('enemy')
    const playerRemainRatio = Phaser.Math.Clamp(player.total / Math.max(1, player.max), 0, 1)
    const enemyRemainRatio = Phaser.Math.Clamp(enemy.total / Math.max(1, enemy.max), 0, 1)
    const formation = this.fieldBattleFormation
    const attackerLossRate = formation === 'guard' ? 0.82 : formation === 'charge' ? 1.18 : formation === 'maneuver' ? 0.94 : 1
    const defenderLossRate = formation === 'charge' ? 1.16 : formation === 'maneuver' ? 1.1 : formation === 'guard' ? 0.9 : 1
    const wallRate = formation === 'charge' ? 1.35 : formation === 'guard' ? 0.75 : formation === 'maneuver' ? 1.05 : 1
    const attackerLoss = Math.floor(this.siegeState.attackerTroops * (victory ? 0.08 + (1 - playerRemainRatio) * 0.14 : 0.18 + (1 - playerRemainRatio) * 0.2) * attackerLossRate)
    const defenderLoss = Math.floor(this.siegeState.defenderTroops * (victory ? 0.18 + (1 - enemyRemainRatio) * 0.22 : 0.08 + (1 - enemyRemainRatio) * 0.12) * defenderLossRate)
    const wallLoss = Math.floor((victory ? Math.max(4, this.roundKills * 3) : Math.max(1, this.roundKills)) * wallRate)
    this.siegeState.attackerTroops = Math.max(400, this.siegeState.attackerTroops - attackerLoss)
    this.siegeState.defenderTroops = Math.max(0, this.siegeState.defenderTroops - defenderLoss)
    this.siegeState.wallHp = Math.max(0, this.siegeState.wallHp - wallLoss)
    const attackerOfficers = this.marchArmy.officerIds
      .map((id) => this.campaignOfficers.find((officer) => officer.id === id))
      .filter((officer): officer is StrategyOfficer => Boolean(officer))
    const defenderCity = this.campaignCities.find((city) => city.id === this.siegeState?.defenderCityId)
    const defenderOfficers = defenderCity
      ? this.campaignOfficers.filter((officer) => officer.location === defenderCity.id && officer.faction === defenderCity.owner && this.isOfficerAvailable(officer))
      : []
    const attackerOfficerLoss = this.distributeOfficerTroopLoss(attackerOfficers, attackerLoss)
    const defenderOfficerLoss = this.distributeOfficerTroopLoss(defenderOfficers, defenderLoss)
    attackerOfficers.forEach((officer) => {
      this.addOfficerMerit(officer, victory ? 12 : 5)
      this.addOfficerFatigue(officer, victory ? 12 : 18)
    })
    defenderOfficers.forEach((officer) => {
      this.addOfficerMerit(officer, victory ? 4 : 10)
      this.addOfficerFatigue(officer, 14)
    })
    this.marchArmy.troops = this.siegeState.attackerTroops
    this.marchArmy.food = Math.max(0, this.marchArmy.food - 5)
    this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + (victory ? 4 : -6), 0, 100)
    this.persistSiegeDamageToCity()
    return `${fieldBattleFormations[formation].name}会战｜我军损兵 ${attackerLoss}（诸将-${attackerOfficerLoss}）｜守军损兵 ${defenderLoss}（守将-${defenderOfficerLoss}）｜城防 -${wallLoss}`
  }

  private distributeOfficerTroopLoss(officers: StrategyOfficer[], totalLoss: number) {
    const floor = 80
    const active = officers.filter((officer) => officerTroops(officer) > floor)
    if (totalLoss <= 0 || active.length === 0) return 0
    const totalTroops = active.reduce((sum, officer) => sum + officerTroops(officer), 0)
    let remainingLoss = totalLoss
    let appliedLoss = 0
    active.forEach((officer, index) => {
      const current = officerTroops(officer)
      const capacity = Math.max(0, current - floor)
      const rawShare = index === active.length - 1
        ? remainingLoss
        : Math.max(1, Math.floor(totalLoss * (current / Math.max(1, totalTroops))))
      const loss = Math.min(capacity, rawShare, remainingLoss)
      officer.troops = current - loss
      if (loss >= Math.floor(current * 0.22) || officer.troops <= 160) this.woundOfficer(officer, 1)
      remainingLoss -= loss
      appliedLoss += loss
    })
    return appliedLoss
  }

  private applyBattleOutcome(victory: boolean) {
    const source = this.selectedCity
    const target = this.selectedTargetCity
    const player = this.forceSummary('player')
    const enemy = this.forceSummary('enemy')
    if (!source || !target) return '战果未能回写。'
    const playerRemainRatio = Phaser.Math.Clamp(player.total / Math.max(1, player.max), 0, 1)
    const enemyRemainRatio = Phaser.Math.Clamp(enemy.total / Math.max(1, enemy.max), 0, 1)
    const sourceLoss = Math.floor(source.troops * (victory ? 0.08 + (1 - playerRemainRatio) * 0.18 : 0.18 + (1 - playerRemainRatio) * 0.22))
    source.troops = Math.max(600, source.troops - sourceLoss)
    if (victory) {
      const seizedGold = Math.floor(target.gold * 0.22)
      const seizedFood = Math.floor(target.food * 0.22)
      const targetRemain = Math.max(500, Math.floor(target.troops * Math.max(0.12, enemyRemainRatio * 0.35)))
      target.owner = this.playerFactionId
      target.troops = targetRemain
      target.defense = Math.max(20, Math.floor(target.defense * 0.72))
      target.gold = Math.max(180, target.gold - seizedGold)
      target.food = Math.max(260, target.food - seizedFood)
      source.gold = Math.min(3000, source.gold + seizedGold)
      source.food = Math.min(5000, source.food + seizedFood)
      this.recordMonthlyAction(`攻取${target.name}，损兵${sourceLoss}`)
      this.syncSelectedCityState()
      return `损兵 ${sourceLoss}｜缴获 金${seizedGold} 粮${seizedFood}｜${target.name}城防降至 ${target.defense}`
    }
    const defenderLoss = Math.floor(target.troops * (0.06 + (1 - enemyRemainRatio) * 0.16))
    target.troops = Math.max(500, target.troops - defenderLoss)
    target.defense = Math.max(15, target.defense - Math.max(2, this.roundKills * 2))
    this.recordMonthlyAction(`攻${target.name}失利，损兵${sourceLoss}`)
    this.syncSelectedCityState()
    return `损兵 ${sourceLoss}｜敌军损兵 ${defenderLoss}｜${target.name}城防降至 ${target.defense}`
  }

  private flashAt(pos: GridPosition, color: number) {
    const { x, y } = gridToWorld(pos)
    const flash = this.add.circle(x, y, 34, color, 0.7)
    this.unitLayer.add(flash)
    this.tweens.add({
      targets: flash,
      scale: 1.8,
      alpha: 0,
      duration: 260,
      onComplete: () => flash.destroy(),
    })
  }

  private addLog(message: string) {
    this.logLines.push(message)
  }

  private unitAt(pos: GridPosition) {
    return this.units.find((unit) => unit.alive && samePos(unit.position, pos))
  }

  private living(faction: Faction) {
    return this.units.filter((unit) => unit.faction === faction && unit.alive)
  }

  private get selectedUnit() {
    return this.units.find((unit) => unit.id === this.selectedUnitId)
  }

  private terrainColor(type: TerrainType) {
    return {
      plain: 0x76885b,
      forest: 0x315c3f,
      hill: 0x8b6f47,
      water: 0x2c6b8d,
      fort: 0x9a7a3b,
    }[type]
  }
}

function createUnit(
  id: string,
  name: string,
  title: string,
  faction: Faction,
  classId: UnitClass,
  position: GridPosition,
  stats: UnitStats,
  unitSkills: string[],
  palette: Unit['palette'],
): Unit {
  return {
    id,
    name,
    title,
    faction,
    classId,
    level: 1,
    exp: 0,
    stats,
    skills: unitSkills,
    position,
    hasMoved: false,
    hasActed: false,
    alive: true,
    palette,
  }
}

function reachableTiles(unit: Unit) {
  const results: GridPosition[] = []
  for (let y = 0; y < MAP_H; y += 1) {
    for (let x = 0; x < MAP_W; x += 1) {
      const pos = { x, y }
      const tile = terrain[mapRows[y][x]]
      if (!tile.walkable) continue
      if (distance(unit.position, pos) <= unit.stats.move + (tile.moveCost === 2 ? -1 : 0)) {
        results.push(pos)
      }
    }
  }
  return results
}

function tilesInRange(origin: GridPosition, range: number) {
  const results: GridPosition[] = []
  for (let y = origin.y - range; y <= origin.y + range; y += 1) {
    for (let x = origin.x - range; x <= origin.x + range; x += 1) {
      const pos = { x, y }
      if (distance(origin, pos) <= range && !samePos(origin, pos)) results.push(pos)
    }
  }
  return results
}

function nearestUnit(unit: Unit, candidates: Unit[]) {
  return candidates.toSorted((a, b) => distance(unit.position, a.position) - distance(unit.position, b.position))[0]
}

function heroById(id: string) {
  return baseUnits.find((unit) => unit.id === id)
}

function unitIdForOfficerId(officerId: string, playerFactionOfficers?: StrategyOfficer[]) {
  const staticMap: Record<string, string> = {
    liu_bei: 'yun',
    guan_yu: 'lan',
    zhuge_liang: 'xuan',
    zhang_fei: 'qing',
  }
  if (staticMap[officerId]) return staticMap[officerId]
  if (playerFactionOfficers) {
    const unitIds = ['yun', 'lan', 'xuan', 'qing']
    const index = playerFactionOfficers.findIndex((o) => o.id === officerId)
    return index >= 0 && index < unitIds.length ? unitIds[index] : undefined
  }
  return undefined
}

function officerIdForUnitId(unitId: string, playerFactionOfficers?: StrategyOfficer[]) {
  const staticMap: Record<string, string> = {
    yun: 'liu_bei',
    lan: 'guan_yu',
    xuan: 'zhuge_liang',
    qing: 'zhang_fei',
  }
  if (staticMap[unitId]) return staticMap[unitId]
  if (playerFactionOfficers) {
    const unitIds = ['yun', 'lan', 'xuan', 'qing']
    const index = unitIds.indexOf(unitId)
    return index >= 0 && index < playerFactionOfficers.length ? playerFactionOfficers[index].id : undefined
  }
  return undefined
}

function factionById(id: FactionId) {
  return strategyFactions.find((faction) => faction.id === id)
}

function cityName(id: CityId) {
  return strategyCities.find((city) => city.id === id)?.name ?? id
}

function officerPortraitKey(officerId: string) {
  return {
    liu_bei: 'portrait-yun',
    guan_yu: 'portrait-lan',
    zhuge_liang: 'portrait-xuan',
    zhang_fei: 'portrait-qing',
  }[officerId] ?? 'portrait-yun'
}

function officerTroops(officer: StrategyOfficer) {
  return officer.troops ?? initialOfficerTroops(officer)
}

function officerWeapons(officer: StrategyOfficer) {
  return officer.weapons ?? initialOfficerWeapons(officer)
}

function officerEquipment(officer: StrategyOfficer): OfficerEquipment {
  const initial = initialOfficerEquipment(officer)
  return {
    spear: officer.spear ?? initial.spear,
    bow: officer.bow ?? initial.bow,
    horse: officer.horse ?? initial.horse,
    armor: officer.armor ?? initial.armor,
  }
}

function officerTroopTypeName(officer: StrategyOfficer) {
  const equipment = officerEquipment(officer)
  const scores = [
    { name: '枪兵', score: equipment.spear * 2 + Math.floor(officer.war / 28) },
    { name: '弓兵', score: equipment.bow * 2 + Math.floor(officer.intel / 30) },
    { name: '骑兵', score: equipment.horse * 2 + Math.floor(officer.command / 30) },
    { name: '重步', score: equipment.armor * 2 + Math.floor((officer.command + officer.gov) / 54) },
  ]
  return scores.toSorted((a, b) => b.score - a.score)[0].name
}

function officerTraining(officer: StrategyOfficer) {
  return officer.training ?? initialOfficerTraining(officer)
}

function officerMerit(officer: StrategyOfficer) {
  return officer.merit ?? initialOfficerMerit(officer)
}

function officerSalary(officer: StrategyOfficer) {
  return officer.salary ?? initialOfficerSalary(officer)
}

function officerStatusName(officer: StrategyOfficer) {
  if (officer.status === 'captured') return '被俘'
  if (officer.status === 'wounded') return `伤疲${officer.statusTurns ?? 1}月`
  return '正常'
}

function initialOfficerTroops(officer: StrategyOfficer, playerFactionId: FactionId = 'liu') {
  if (officer.faction !== playerFactionId) return Math.max(600, Math.floor(officer.command * 28))
  return Math.max(700, Math.floor(officer.command * 22))
}

function initialOfficerWeapons(officer: StrategyOfficer) {
  if (officer.war >= 95) return 3
  if (officer.war >= 80) return 2
  if (officer.war >= 55) return 1
  return 0
}

function initialOfficerEquipment(officer: StrategyOfficer): OfficerEquipment {
  const base = initialOfficerWeapons(officer)
  return {
    spear: Phaser.Math.Clamp(base + (officer.war >= 82 ? 1 : 0), 0, 5),
    bow: Phaser.Math.Clamp(Math.floor(base / 2) + (officer.intel >= 82 ? 1 : 0), 0, 5),
    horse: Phaser.Math.Clamp(Math.floor(base / 2) + (officer.command >= 84 ? 1 : 0), 0, 5),
    armor: Phaser.Math.Clamp(base + (officer.command >= 82 ? 1 : 0), 0, 5),
  }
}

function initialOfficerTraining(officer: StrategyOfficer) {
  return Phaser.Math.Clamp(Math.floor((officer.command + officer.war) / 3), 12, 70)
}

function initialOfficerMerit(officer: StrategyOfficer) {
  if (officer.role === '君主') return 220
  return Math.max(0, Math.floor((officer.command + officer.war + officer.gov + officer.intel) / 5) - 35)
}

function initialOfficerSalary(officer: StrategyOfficer) {
  if (officer.role === '君主') return 0
  return Math.max(8, Math.floor((officer.command + officer.war + officer.gov + officer.intel + officer.charm) / 34))
}

function recruitScaleConfig(scale: RecruitScale) {
  return {
    small: { label: '小募', troops: 450, goldCost: 90, publicOrderCost: 1, moraleGain: 1 },
    medium: { label: '中募', troops: 900, goldCost: 160, publicOrderCost: 2, moraleGain: 3 },
    large: { label: '大募', troops: 1500, goldCost: 260, publicOrderCost: 5, moraleGain: 4 },
  }[scale]
}

function taxRateConfig(rate: TaxRate) {
  return {
    light: { label: '轻税', goldMultiplier: 0.72, publicOrderDelta: 3 },
    normal: { label: '常税', goldMultiplier: 1, publicOrderDelta: 0 },
    heavy: { label: '重税', goldMultiplier: 1.42, publicOrderDelta: -5 },
  }[rate]
}

function transportAmountConfig(amount: TransportAmount) {
  return {
    small: { label: '小运', sourceFood: 120, expeditionGain: 9, cityGain: 110 },
    medium: { label: '中运', sourceFood: 240, expeditionGain: 18, cityGain: 220 },
    large: { label: '大运', sourceFood: 360, expeditionGain: 28, cityGain: 330 },
  }[amount]
}

function transportCityGain(kind: MoveResourceKind, amount: TransportAmount) {
  if (kind === 'food') return transportAmountConfig(amount).cityGain
  const source = moveResourceConfig(kind, amount).amount
  return kind === 'troops' ? Math.floor(source * 0.92) : Math.floor(source * 0.96)
}

function moveResourceName(kind: MoveResourceKind) {
  return {
    troops: '兵力',
    food: '粮草',
    gold: '金',
  }[kind]
}

function moveResourceCap(kind: MoveResourceKind) {
  return {
    troops: 30000,
    food: 5000,
    gold: 3000,
  }[kind]
}

function moveResourceConfig(kind: MoveResourceKind, amount: TransportAmount) {
  return {
    troops: {
      small: { label: '小调', amount: 500 },
      medium: { label: '中调', amount: 1000 },
      large: { label: '大调', amount: 1800 },
    },
    food: {
      small: { label: '小调', amount: 160 },
      medium: { label: '中调', amount: 320 },
      large: { label: '大调', amount: 520 },
    },
    gold: {
      small: { label: '小调', amount: 80 },
      medium: { label: '中调', amount: 160 },
      large: { label: '大调', amount: 260 },
    },
  }[kind][amount]
}

function militaryAllocationMeta(kind: MilitaryAllocationKind) {
  return {
    recruit: {
      command: '征兵',
      actor: '兵营',
      get goldCost() { return recruitScaleConfig('medium').goldCost },
      effect: (officer: StrategyOfficer, scale: RecruitScale = 'medium') => {
        const config = recruitScaleConfig(scale)
        return `${config.label}｜金 -${config.goldCost}｜${officer.name}兵 +${config.troops}｜民心 -${config.publicOrderCost}｜士气 +${config.moraleGain}`
      },
      resultText: (officer: StrategyOfficer) => `新募士卒入营，现统兵${officerTroops(officer)}`,
    },
    weapon: {
      command: '武器',
      actor: '军械库',
      goldCost: 180,
      effect: (officer: StrategyOfficer) => `金 -180｜${officer.name}武装 +1｜枪弓马甲择弱补强｜士气 +2`,
      resultText: (officer: StrategyOfficer) => {
        const equipment = officerEquipment(officer)
        return `军械配发完毕，武装${officerWeapons(officer)}，枪弓马甲${equipment.spear}/${equipment.bow}/${equipment.horse}/${equipment.armor}`
      },
    },
    training: {
      command: '训练',
      actor: '校场',
      goldCost: 90,
      effect: (officer: StrategyOfficer) => `金 -90｜${officer.name}训练 +12｜士气 +3｜情报 +2`,
      resultText: (officer: StrategyOfficer) => `部曲操练有成，训练${officerTraining(officer)}`,
    },
  }[kind]
}

function diplomacyCommandMeta(kind: DiplomacyCommandKind) {
  return {
    alliance: { command: '同盟', targetKind: 'faction' },
    scout: { command: '情报', targetKind: 'city' },
    borrow: { command: '借款', targetKind: 'faction' },
    repay: { command: '还款', targetKind: 'faction' },
    sabotage: { command: '离间', targetKind: 'city' },
    assassination: { command: '暗杀', targetKind: 'city' },
    fire: { command: '火计', targetKind: 'city' },
    persuade: { command: '劝降', targetKind: 'city' },
  }[kind] as { command: string; targetKind: 'faction' | 'city' }
}

function roleLabels(officerId: string, appointments: { governor: string; vanguard: string; strategist: string }) {
  const labels = []
  if (appointments.governor === officerId) labels.push('太守')
  if (appointments.vanguard === officerId) labels.push('先锋')
  if (appointments.strategist === officerId) labels.push('军师')
  return labels.length > 0 ? `｜${labels.join('/')}` : ''
}

function nearestAttackable(unit: Unit, candidates: Unit[]) {
  return candidates
    .filter((candidate) => distance(unit.position, candidate.position) <= unit.stats.range || unit.skills.some((id) => distance(unit.position, candidate.position) <= skills[id].range))
    .toSorted((a, b) => a.stats.hp - b.stats.hp)[0]
}

function bestStepToward(unit: Unit, target: GridPosition, units: Unit[]) {
  const candidates = tilesInRange(unit.position, 1)
    .filter((pos) => isInside(pos))
    .filter((pos) => terrain[mapRows[pos.y][pos.x]].walkable)
    .filter((pos) => !units.some((other) => other.alive && other.id !== unit.id && samePos(other.position, pos)))
  return candidates.toSorted((a, b) => distance(a, target) - distance(b, target))[0]
}

function computeDamage(attacker: Unit, defender: Unit, skill?: Skill) {
  const attackerTile = terrain[mapRows[attacker.position.y][attacker.position.x]]
  const defenderTile = terrain[mapRows[defender.position.y][defender.position.x]]
  if (skill?.type === 'damage' && skill.damageType === 'magic') {
    return Math.max(1, attacker.stats.mag + skill.power - defender.stats.res)
  }
  const power = skill?.type === 'damage' ? skill.power : 0
  return Math.max(1, attacker.stats.atk + power + attackerTile.attackBonus - defender.stats.def - defenderTile.defenseBonus)
}

function gridToWorld(pos: GridPosition) {
  return {
    x: BOARD_X + pos.x * TILE + TILE / 2,
    y: BOARD_Y + pos.y * TILE + TILE / 2,
  }
}

function worldToGrid(x: number, y: number): GridPosition | undefined {
  const gridX = Math.floor((x - BOARD_X) / TILE)
  const gridY = Math.floor((y - BOARD_Y) / TILE)
  const pos = { x: gridX, y: gridY }
  return isInside(pos) ? pos : undefined
}

function isInside(pos: GridPosition) {
  return pos.x >= 0 && pos.x < MAP_W && pos.y >= 0 && pos.y < MAP_H
}

function distance(a: GridPosition, b: GridPosition) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function samePos(a: GridPosition, b: GridPosition) {
  return a.x === b.x && a.y === b.y
}

function terrainName(type: TerrainType) {
  return {
    plain: '平原',
    forest: '树林',
    hill: '山丘',
    water: '河道',
    fort: '据点',
  }[type]
}

function campaignModeName(mode: CampaignMode) {
  return {
    inspection: '视察情况',
    march: '行军',
  }[mode]
}

function mapDisplayModeName(mode: MapDisplayMode) {
  return {
    compact: '精简',
    faction: '势力',
    full: '全名',
  }[mode]
}

function talentScopeName(scope: TalentScope) {
  return {
    local: '本城',
    nearby: '周边',
    all: '天下',
  }[scope]
}

function factionShortName(factionId: FactionId) {
  return {
    cao: '曹',
    liu: '刘',
    sun: '孙',
    yuan: '袁',
    dong: '董',
    neutral: '郡',
  }[factionId]
}

function campaignWeatherName(weather: CampaignWeather) {
  return {
    clear: '晴',
    rain: '雨',
    heat: '暑',
  }[weather]
}

function campaignWeatherEffect(weather: CampaignWeather) {
  return {
    clear: '道路与火计无额外修正。',
    rain: '渡口耗粮、险道疲劳增加，火计威力下降。',
    heat: '行军耗粮疲劳略增，火计威力上升。',
  }[weather]
}

function campaignMapPoint(city: StrategyCity) {
  return {
    x: 58 + city.x * 0.88,
    y: 76 + city.y * 0.48,
  }
}

function difficultySetupDesc(difficulty: Difficulty) {
  return {
    easy: '敌势较缓\n适合熟悉循环',
    normal: '标准节奏\n每月有扩张压力',
    hard: '敌军整备更快\n需要谨慎用兵',
  }[difficulty]
}

function marchStatusName(status: MarchArmy['status']) {
  return {
    ready: '待命',
    marching: '行军',
    besieging: '攻城',
    retreating: '撤退',
    routed: '溃散',
  }[status]
}

function routeKey(a: CityId, b: CityId) {
  return [a, b].sort().join('-')
}

function routeFeatureName(feature: RouteFeature) {
  return {
    village: '村落',
    supply: '粮道',
    pass: '险道',
    ferry: '渡口',
  }[feature]
}

function appointmentRoleName(role: 'governor' | 'vanguard' | 'strategist') {
  return {
    governor: '太守',
    vanguard: '先锋',
    strategist: '军师',
  }[role]
}

function duelActionName(action: DuelAction) {
  return {
    attack: '攻击',
    guard: '防御',
    evade: '回避',
    focus: '蓄气',
    special: '必杀',
    retreat: '退却',
  }[action]
}

function diplomacyName(kind: 'alliance' | 'scout' | 'sabotage' | 'persuade') {
  return {
    alliance: '同盟',
    scout: '侦察',
    sabotage: '离间',
    persuade: '劝降',
  }[kind]
}

function modalInfoLines(label: string, value: string, limit: number) {
  const chunks = wrapModalValue(value, limit)
  return chunks.map((chunk, index) => `${index === 0 ? label.padEnd(4, '　') : '　　　　'}${chunk}`)
}

function wrapModalValue(value: string, limit: number) {
  const parts = value.split('｜')
  const lines: string[] = []
  let line = ''
  for (const part of parts) {
    const token = line.length > 0 ? `｜${part}` : part
    if ((line + token).length <= limit) {
      line += token
      continue
    }
    if (line) lines.push(line)
    if (part.length <= limit) {
      line = part
      continue
    }
    for (let index = 0; index < part.length; index += limit) {
      const chunk = part.slice(index, index + limit)
      if (chunk.length === limit) lines.push(chunk)
      else line = chunk
    }
  }
  if (line) lines.push(line)
  return lines.length > 0 ? lines : ['-']
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 760,
  backgroundColor: '#151a20',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [KingdomsScene],
}

new Phaser.Game(config)
