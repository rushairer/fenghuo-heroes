import Phaser from 'phaser'
import './style.css'

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
  | 'xuchang'
  | 'luoyang'
  | 'ye'
  | 'puyang'
  | 'xiapi'
  | 'shouchun'
  | 'chengdu'
  | 'jiangzhou'
  | 'hanzhong'
  | 'jianye'
  | 'wujun'
  | 'jiangxia'
  | 'xiangyang'
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
}

type MarchArmy = {
  id: string
  factionId: FactionId
  sourceCityId: CityId
  targetCityId?: CityId
  leaderOfficerId: string
  officerIds: string[]
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

type SiegeState = {
  attackerArmyId: string
  defenderCityId: CityId
  wallHp: number
  defenderTroops: number
  attackerTroops: number
  turns: number
  lastAction?: 'assault' | 'surround' | 'fire' | 'challenge' | 'fieldBattle' | 'retreat'
}

type DuelState = {
  attackerOfficerId: string
  defenderOfficerId: string
  attackerHp: number
  defenderHp: number
  attackerStamina: number
  defenderStamina: number
  round: number
  log: string[]
  outcome?: 'attackerWin' | 'defenderWin' | 'draw'
}

const TILE = 64
const MAP_W = 12
const MAP_H = 8
const BOARD_X = 36
const BOARD_Y = 92
const UI_X = BOARD_X + MAP_W * TILE + 24

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
  { id: 'xuchang', name: '许昌', region: '中原', owner: 'cao', x: 378, y: 178, gold: 900, food: 1300, troops: 9000, defense: 68, routes: ['luoyang', 'puyang', 'shouchun'] },
  { id: 'luoyang', name: '洛阳', region: '司隶', owner: 'neutral', x: 282, y: 178, gold: 500, food: 700, troops: 3500, defense: 55, routes: ['xuchang', 'chang_an', 'ye'] },
  { id: 'ye', name: '邺城', region: '河北', owner: 'yuan', x: 386, y: 92, gold: 1000, food: 1500, troops: 11000, defense: 70, routes: ['luoyang', 'puyang'] },
  { id: 'puyang', name: '濮阳', region: '兖州', owner: 'cao', x: 468, y: 208, gold: 420, food: 760, troops: 4200, defense: 48, routes: ['xuchang', 'ye', 'xiapi'] },
  { id: 'xiapi', name: '下邳', region: '徐州', owner: 'neutral', x: 558, y: 268, gold: 520, food: 850, troops: 4800, defense: 52, routes: ['puyang', 'shouchun', 'jiangxia'] },
  { id: 'shouchun', name: '寿春', region: '淮南', owner: 'neutral', x: 488, y: 326, gold: 580, food: 920, troops: 5200, defense: 56, routes: ['xuchang', 'xiapi', 'jianye'] },
  { id: 'chengdu', name: '成都', region: '益州', owner: 'liu', x: 118, y: 342, gold: 850, food: 1600, troops: 7600, defense: 72, routes: ['jiangzhou', 'hanzhong'] },
  { id: 'jiangzhou', name: '江州', region: '巴郡', owner: 'liu', x: 230, y: 374, gold: 390, food: 880, troops: 3600, defense: 50, routes: ['chengdu', 'jiangxia'] },
  { id: 'hanzhong', name: '汉中', region: '汉中', owner: 'neutral', x: 172, y: 244, gold: 360, food: 780, troops: 3800, defense: 62, routes: ['chengdu', 'chang_an'] },
  { id: 'jianye', name: '建业', region: '江东', owner: 'sun', x: 614, y: 384, gold: 950, food: 1200, troops: 7800, defense: 66, routes: ['wujun', 'shouchun', 'jiangxia'] },
  { id: 'wujun', name: '吴郡', region: '江东', owner: 'sun', x: 642, y: 454, gold: 650, food: 980, troops: 4600, defense: 48, routes: ['jianye', 'changsha'] },
  { id: 'jiangxia', name: '江夏', region: '荆州', owner: 'neutral', x: 376, y: 402, gold: 500, food: 860, troops: 4300, defense: 54, routes: ['jianye', 'xiangyang', 'jiangzhou', 'xiapi'] },
  { id: 'xiangyang', name: '襄阳', region: '荆州', owner: 'neutral', x: 318, y: 312, gold: 780, food: 1250, troops: 6500, defense: 74, routes: ['jiangxia', 'changsha', 'luoyang'] },
  { id: 'changsha', name: '长沙', region: '荆南', owner: 'neutral', x: 406, y: 486, gold: 460, food: 900, troops: 3900, defense: 46, routes: ['xiangyang', 'wujun'] },
  { id: 'chang_an', name: '长安', region: '关中', owner: 'dong', x: 190, y: 168, gold: 900, food: 1100, troops: 12000, defense: 78, routes: ['luoyang', 'hanzhong'] },
]

const strategyOfficers: StrategyOfficer[] = [
  { id: 'cao_cao', name: '曹操', faction: 'cao', location: 'xuchang', role: '君主', war: 72, intel: 92, gov: 88, charm: 86, command: 94, loyalty: 100 },
  { id: 'xiahou_dun', name: '夏侯惇', faction: 'cao', location: 'puyang', role: '武将', war: 86, intel: 58, gov: 55, charm: 70, command: 82, loyalty: 92 },
  { id: 'guo_jia', name: '郭嘉', faction: 'cao', location: 'xuchang', role: '军师', war: 32, intel: 96, gov: 74, charm: 78, command: 70, loyalty: 88 },
  { id: 'liu_bei', name: '刘备', faction: 'liu', location: 'chengdu', role: '君主', war: 68, intel: 76, gov: 80, charm: 96, command: 78, loyalty: 100 },
  { id: 'guan_yu', name: '关羽', faction: 'liu', location: 'chengdu', role: '武将', war: 97, intel: 72, gov: 60, charm: 88, command: 90, loyalty: 100 },
  { id: 'zhang_fei', name: '张飞', faction: 'liu', location: 'jiangzhou', role: '武将', war: 96, intel: 45, gov: 35, charm: 65, command: 84, loyalty: 98 },
  { id: 'zhuge_liang', name: '诸葛亮', faction: 'liu', location: 'chengdu', role: '军师', war: 38, intel: 99, gov: 96, charm: 90, command: 88, loyalty: 95 },
  { id: 'sun_quan', name: '孙权', faction: 'sun', location: 'jianye', role: '君主', war: 62, intel: 80, gov: 84, charm: 86, command: 76, loyalty: 100 },
  { id: 'zhou_yu', name: '周瑜', faction: 'sun', location: 'jianye', role: '都督', war: 74, intel: 95, gov: 78, charm: 88, command: 94, loyalty: 92 },
  { id: 'lu_su', name: '鲁肃', faction: 'sun', location: 'wujun', role: '外交', war: 42, intel: 88, gov: 86, charm: 84, command: 66, loyalty: 90 },
  { id: 'yuan_shao', name: '袁绍', faction: 'yuan', location: 'ye', role: '君主', war: 66, intel: 70, gov: 72, charm: 82, command: 80, loyalty: 100 },
  { id: 'yan_liang', name: '颜良', faction: 'yuan', location: 'ye', role: '武将', war: 91, intel: 40, gov: 30, charm: 62, command: 78, loyalty: 84 },
  { id: 'dong_zhuo', name: '董卓', faction: 'dong', location: 'chang_an', role: '君主', war: 82, intel: 58, gov: 42, charm: 38, command: 84, loyalty: 100 },
  { id: 'lv_bu', name: '吕布', faction: 'dong', location: 'chang_an', role: '武将', war: 100, intel: 38, gov: 22, charm: 74, command: 86, loyalty: 62 },
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
  private sabotagedFactionIds = new Set<FactionId>()
  private monthlyActionLog: string[] = []
  private marchArmy?: MarchArmy
  private siegeState?: SiegeState
  private duelState?: DuelState
  private selectedScenarioId: (typeof scenarioOptions)[number]['id'] = 'heroes_190'
  private selectedDifficulty: Difficulty = 'normal'
  private campaignClock = {
    year: 190,
    month: 1,
    mode: 'inspection' as CampaignMode,
    enemyThreat: 28,
  }
  private appointments = {
    governor: 'yun',
    vanguard: 'yun',
    strategist: 'xuan',
  }
  private recruitedNeutralIds = new Set<string>()

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
    this.load.image('title-bg', '/assets/images/backgrounds/title.png')
    this.load.image('battlefield-bg', '/assets/images/backgrounds/battlefield.png')
    for (const unitId of ['yun', 'lan', 'xuan', 'qing', 'banditA', 'banditB', 'raider', 'boss']) {
      this.load.image(`portrait-${unitId}`, `/assets/images/portraits/${unitId}.png`)
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
    if (this.phase === 'playerSelect') {
      this.handleBattleKeyboard(event)
      return
    }
    if (this.phase !== 'inspectionMonth' && this.phase !== 'marchMonth') return
    const commands: Record<string, () => void> = this.phase === 'inspectionMonth'
      ? {
          '1': () => this.showDomesticCommand(),
          '2': () => this.showDiplomacy(),
          '3': () => this.showMilitaryCommand(),
          '4': () => this.showInspection(),
          '5': () => this.showPersonnelCommand(),
          '6': () => this.showSystemCommand(),
          '7': () => this.resolveStageAdvance(),
        }
      : {
          '1': () => this.showMarchArmyStatus(),
          '2': () => this.resolveMarchMove(),
          '3': () => this.resolveMarchAttack(),
          '4': () => this.showBriefing(),
          '5': () => this.retreatMarchArmy(),
          '6': () => this.showCampaignMessage('远征军按兵待命，等待主公号令。'),
          '7': () => this.advanceCampaignMonth(),
        }
    commands[event.key]?.()
  }

  private handleBattleKeyboard(event: KeyboardEvent) {
    const selected = this.selectedUnit
    if (!selected || selected.faction !== 'player' || selected.hasActed) {
      const index = Number(event.key) - 1
      const unit = Number.isInteger(index) ? this.living('player')[index] : undefined
      if (unit) {
        this.selectedUnitId = unit.id
        this.highlighted = []
        this.renderBattle()
      }
      return
    }
    const commands: Record<string, () => void> = {
      '1': () => this.enterMoveMode(selected),
      '2': () => this.enterAttackMode(selected, undefined),
      '3': () => this.enterAttackMode(selected, selected.skills[0]),
      '4': () => this.finishUnit(selected),
      '5': () => this.delegateUnit(selected),
      '6': () => this.retreatBattle(),
    }
    commands[event.key]?.()
  }

  private showTitle() {
    this.phase = 'title'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.addTitleText('三国志列传：群英新篇', '群雄割据 · 天下布武')
    this.makeButton(520, 492, '开始游戏', () => {
      this.music.start()
      this.showScenarioSetup()
    }, this.overlayLayer)
    this.makeButton(520, 552, '继续游戏', () => this.showContinueStub(), this.overlayLayer)
    this.makeButton(520, 612, '环境设定', () => this.showSettingsOverlay(), this.overlayLayer)
  }

  private showScenarioSetup() {
    this.phase = 'scenarioSetup'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.92).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '初始设定', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1010, 72, '剧本 / 年代 / 难度 / 玩家数', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))

    this.overlayLayer.add(this.add.rectangle(86, 140, 710, 392, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(120, 168, '选择年代', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    scenarioOptions.forEach((scenario, index) => {
      const y = 232 + index * 92
      const active = this.selectedScenarioId === scenario.id
      this.overlayLayer.add(this.add.rectangle(122, y - 32, 614, 72, active ? 0x342415 : 0x21160f, 0.94).setOrigin(0).setStrokeStyle(2, active ? 0xf8df9d : 0xd4af37, active ? 0.95 : 0.5))
      this.overlayLayer.add(this.add.text(150, y - 18, `${scenario.year}年  ${scenario.name}${scenario.locked ? '（后续开放）' : ''}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: active ? '#fff0bd' : '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(150, y + 12, scenario.desc, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '17px',
        color: '#ead7b3',
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

    this.overlayLayer.add(this.add.rectangle(838, 140, 350, 392, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(870, 168, '选择难度', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    difficultyOptions.forEach((difficulty, index) => {
      const y = 232 + index * 82
      const active = this.selectedDifficulty === difficulty.id
      this.overlayLayer.add(this.add.rectangle(872, y - 30, 274, 64, active ? 0x342415 : 0x21160f, 0.94).setOrigin(0).setStrokeStyle(2, active ? 0xf8df9d : 0xd4af37, active ? 0.95 : 0.45))
      this.overlayLayer.add(this.add.text(898, y - 16, difficulty.name, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: active ? '#fff0bd' : '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(898, y + 12, difficulty.desc, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#ead7b3',
        wordWrap: { width: 180 },
      }))
      this.makeButton(1086, y + 4, active ? '已定' : '选择', () => {
        this.selectedDifficulty = difficulty.id
        this.showScenarioSetup()
      }, this.overlayLayer, 86, 34)
    })
    this.overlayLayer.add(this.add.text(872, 478, '玩家数：一人\n胜利目标：统一核心州郡\n操作顺序：选城 → 命令 → 月令', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f4dfb3',
      lineSpacing: 8,
    }))

    this.makeButton(438, 636, '返回标题', () => this.showTitle(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '决定', () => this.showRulerSelect(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '环境设定', () => this.showSettingsOverlay(), this.overlayLayer, 180, 44)
  }

  private showRulerSelect() {
    this.phase = 'rulerSelect'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.92).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '选择君主', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1000, 72, `当前剧本：${this.selectedScenarioLabel()}｜${this.selectedDifficultyLabel()}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
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
      }))
      const available = faction.id === 'liu'
      this.makeButton(x + 224, y + 108, available ? '开始' : '未开放', () => {
        if (available) {
          this.resetCampaignState()
          this.showCampaign()
        } else {
          this.showTitleNotice('势力未开放', '当前版本先以刘备军完成机制复刻，其他势力将在多剧本阶段开放。')
        }
      }, this.overlayLayer, 112, 36)
    })
    this.makeButton(640, 636, '返回标题', () => this.showTitle(), this.overlayLayer, 180, 44)
  }

  private showCampaign() {
    this.syncCampaignModeToMonth()
    this.phase = this.campaignClock.mode === 'inspection' ? 'inspectionMonth' : 'marchMonth'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.9).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, this.campaignClock.mode === 'inspection' ? '视察情况' : '行军', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1018, 72, `${this.campaignClock.year}年${this.campaignClock.month}月   ${campaignModeName(this.campaignClock.mode)}｜${this.selectedDifficultyLabel()}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.drawCampaignMap()
    this.drawCampaignSidePanel()
    this.drawMainCommandMenu()
  }

  private drawMainCommandMenu() {
    if (this.campaignClock.mode === 'march') {
      this.drawMarchCommandMenu()
      return
    }
    const coreCommands: [string, () => void][] = [
      ['内政', () => this.showDomesticCommand()],
      ['外交', () => this.showDiplomacy()],
      ['军事', () => this.showMilitaryCommand()],
    ]
    this.overlayLayer.add(this.add.rectangle(70, 584, 1140, 122, 0x21160f, 0.97).setOrigin(0).setStrokeStyle(2, 0xd4af37, 0.82))
    this.overlayLayer.add(this.add.text(102, 598, `视察情况    ${this.selectedCity?.name ?? '未选'}城    ${this.campaignClock.year}年${this.campaignClock.month}月    政令 ${this.councilState.actions}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8df9d',
    }))
    this.overlayLayer.add(this.add.text(720, 600, this.marchArmy ? '出征令已下达：下月进入行军面' : '本月只从内政、外交、军事下达城池命令', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f4dfb3',
    }))
    coreCommands.forEach(([label, callback], index) => {
      const x = 210 + index * 190
      this.overlayLayer.add(this.add.text(x - 58, 634, `${index + 1}.`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '19px',
        color: '#d4af37',
      }).setOrigin(0.5))
      this.makeButton(x, 664, label, callback, this.overlayLayer, 150, 50)
    })
    this.makeButton(826, 664, '月令', () => this.advanceCampaignMonth(), this.overlayLayer, 132, 42)
    this.makeButton(986, 664, '势力', () => this.showFactionOverview(), this.overlayLayer, 132, 42)
    this.makeButton(1124, 664, '机能', () => this.showSystemCommand(), this.overlayLayer, 106, 38)
  }

  private drawMarchCommandMenu() {
    const coreCommands: [string, () => void][] = [
      ['部队', () => this.showMarchArmyStatus()],
      ['移动', () => this.resolveMarchMove()],
      ['攻击', () => this.resolveMarchAttack()],
    ]
    const auxCommands: [string, () => void][] = [
      ['情报', () => this.showBriefing()],
      ['撤退', () => this.retreatMarchArmy()],
      ['待机', () => this.showCampaignMessage('远征军按兵待命，等待主公号令。')],
      ['月令', () => this.advanceCampaignMonth()],
    ]
    this.overlayLayer.add(this.add.rectangle(70, 584, 1140, 122, 0x21160f, 0.97).setOrigin(0).setStrokeStyle(2, 0xd4af37, 0.82))
    this.overlayLayer.add(this.add.text(102, 598, `行军命令    ${this.campaignClock.year}年${this.campaignClock.month}月    ${this.marchArmySummary()}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8df9d',
    }))
    this.overlayLayer.add(this.add.text(740, 600, this.marchArmy ? '行军面：先移动整队，再攻击目标城' : '本月暂无远征军，可直接进入月令', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f4dfb3',
    }))
    coreCommands.forEach(([label, callback], index) => {
      const x = 210 + index * 190
      this.overlayLayer.add(this.add.text(x - 58, 634, `${index + 1}.`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '19px',
        color: '#d4af37',
      }).setOrigin(0.5))
      this.makeButton(x, 664, label, callback, this.overlayLayer, 150, 50)
    })
    auxCommands.forEach(([label, callback], index) => {
      const x = 790 + index * 104
      this.overlayLayer.add(this.add.text(x - 42, 632, `${index + 4}.`, {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: '16px',
        color: '#d4af37',
      }).setOrigin(0.5))
      this.makeButton(x, 664, label, callback, this.overlayLayer, 88, 38)
    })
  }

  private showBriefing() {
    this.phase = 'briefing'
    this.ensureDeploymentTarget()
    const source = this.selectedCity
    const target = this.selectedTargetCity
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.addTitleText('敌城情报', `${source?.name ?? '本城'}至${target?.name ?? '邻境'}军情。`)
    const panel = this.add.rectangle(520, 392, 820, 300, 0x101722, 0.9).setStrokeStyle(2, 0xd4af37, 0.8)
    this.overlayLayer.add(panel)
    const owner = target ? factionById(target.owner) : undefined
    const officers = target ? this.campaignOfficers.filter((officer) => officer.location === target.id && officer.faction === target.owner) : []
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
    this.overlayLayer.add(this.add.text(180, 258, copy, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      lineSpacing: 11,
      color: '#f7ead0',
    }))
    this.makeButton(520, 568, '进入军事命令', () => this.showDeployment(), this.overlayLayer)
  }

  private advanceCampaignMonth() {
    let liuFoodGain = 0
    let liuGoldGain = 0
    const enemyBefore = this.strongestEnemySummary()
    for (const city of this.campaignCities) {
      const foodGain = Math.max(60, Math.floor(city.food * 0.08))
      const goldGain = Math.max(40, Math.floor(city.gold * 0.08))
      const enemyGrowth = city.owner === 'liu' ? 1 : this.difficultyConfig().enemyGrowth
      const troopGain = Math.max(120, Math.floor(city.troops * 0.035 * enemyGrowth))
      city.food = Math.min(5000, city.food + foodGain)
      city.gold = Math.min(3000, city.gold + goldGain)
      city.troops = Math.min(30000, city.troops + troopGain)
      if (city.owner === 'liu') {
        liuFoodGain += foodGain
        liuGoldGain += goldGain
      }
    }
    const aiReports = this.runEnemyFactionTurns()
    const enemyAfter = this.strongestEnemySummary()
    this.syncSelectedCityState()
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + (this.cityState.publicOrder >= 70 ? 2 : -1), 0, 100)
    this.councilState.actions = 3
    this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat + 6 - this.cityState.walls, 0, 100)
    this.campaignClock.month += 1
    if (this.campaignClock.month > 12) {
      this.campaignClock.month = 1
      this.campaignClock.year += 1
    }
    this.syncCampaignModeToMonth()
    const eventText = this.resolveMonthlyEvent()
    const commandLines = this.monthlyActionLog.length > 0
      ? [`本月命令：${this.monthlyActionLog.join('；')}。`]
      : ['本月命令：未执行城池命令。']
    this.monthlyActionLog = []
    this.showMonthReport([
      ...commandLines,
      `刘备军收入：粮 +${liuFoodGain}，金 +${liuGoldGain}。`,
      `${enemyAfter.name}整备最盛：总兵 ${enemyBefore.troops} → ${enemyAfter.troops}。`,
      ...(aiReports.length > 0 ? aiReports.slice(0, 4) : ['诸势力暂未有大规模行动。']),
      eventText,
      `新月份：${campaignModeName(this.campaignClock.mode)}，政令恢复为 ${this.councilState.actions}，当前城池 ${this.selectedCity?.name ?? '-'}。`,
    ])
  }

  private syncCampaignModeToMonth() {
    this.campaignClock.mode = this.campaignClock.month % 2 === 1 ? 'inspection' : 'march'
  }

  private showMonthReport(lines: string[]) {
    this.phase = 'monthReport'
    this.showCampaign()
    this.phase = 'monthReport'
    this.overlayLayer.add(this.add.rectangle(640, 382, 760, 390, 0x101722, 0.98).setStrokeStyle(3, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(640, 226, '月令报告', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '44px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.text(640, 286, `${this.campaignClock.year}年${this.campaignClock.month}月`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.text(316, 330, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      lineSpacing: 12,
      wordWrap: { width: 650 },
    }))
    this.makeButton(640, 536, '回到版图', () => this.showCampaign(), this.overlayLayer, 180, 44)
  }

  private showCampaignMessage(message: string) {
    this.showCampaign()
    this.playCommandSignal(message)
    this.overlayLayer.add(this.add.text(640, 584, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#fff4cf',
      backgroundColor: '#3c2417',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5))
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
    this.overlayLayer.add(this.add.rectangle(640, 408, 650, 210, 0x101722, 0.97).setStrokeStyle(2, 0xd4af37, 0.9))
    this.overlayLayer.add(this.add.text(640, 338, '远征军', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '38px',
      color: '#f8df9d',
    }).setOrigin(0.5))
    const copy = [
      `出发城    ${cityName(this.marchArmy.sourceCityId)}`,
      `目标城    ${target}`,
      `位置      ${position}`,
      `兵粮      兵${this.marchArmy.troops}  粮${this.marchArmy.food}  士气${this.marchArmy.morale}`,
      `主将      ${this.officerName(this.marchArmy.leaderOfficerId)}`,
      `随军      ${this.marchArmy.officerIds.map((id) => this.officerName(id)).join('、')}`,
      `状态      ${marchStatusName(this.marchArmy.status)}  移动${this.marchArmy.movePoints}`,
    ].join('\n')
    this.overlayLayer.add(this.add.text(398, 382, copy, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f8ecd0',
      lineSpacing: 10,
    }))
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
    if (!this.marchArmy.targetCityId) {
      this.showCampaignMessage('远征军尚未指定目标城。')
      return
    }
    const from = this.marchArmy.position.cityId ?? this.marchArmy.sourceCityId
    const target = this.marchArmy.targetCityId
    this.showCommandConfirm({
      category: '行军',
      command: '移动',
      actor: `${cityName(this.marchArmy.sourceCityId)}远征军`,
      target: cityName(target),
      scope: `${cityName(from)} → ${cityName(target)}`,
      effect: '移动 -1｜随军粮 -4｜状态改为行军',
      hint: '确认后执行远征军命令',
      onConfirm: () => this.executeMarchMove(),
      onCancel: () => this.showCampaign(),
    })
  }

  private executeMarchMove() {
    if (!this.marchArmy?.targetCityId) return
    const from = this.marchArmy.position.cityId ?? this.marchArmy.sourceCityId
    const target = this.marchArmy.targetCityId
    this.marchArmy.position = { kind: 'route', route: [from, target], progress: 1 }
    this.marchArmy.movePoints -= 1
    this.marchArmy.food = Math.max(0, this.marchArmy.food - 4)
    this.marchArmy.status = 'marching'
    this.focusedCityId = target
    this.selectedTargetCityId = target
    this.showCampaignMessage(`${cityName(from)}军沿道路向${cityName(target)}推进，粮道已展开。`)
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

  private retreatMarchArmy() {
    if (!this.marchArmy) {
      this.showCampaignMessage('当前没有远征军需要撤退。')
      return
    }
    const message = `${cityName(this.marchArmy.sourceCityId)}军撤回本城，士气略降。`
    this.marchArmy = undefined
    this.councilState.morale = Math.max(0, this.councilState.morale - 4)
    this.recordMonthlyAction(message)
    this.showCampaignMessage(message)
  }

  private describeMarchPosition(army: MarchArmy) {
    if (army.position.kind === 'city' && army.position.cityId) return cityName(army.position.cityId)
    if (army.position.kind === 'route' && army.position.route) {
      return `${cityName(army.position.route[0])} → ${cityName(army.position.route[1])}`
    }
    return '行军途中'
  }

  private officerName(officerId: string) {
    return this.campaignOfficers.find((officer) => officer.id === officerId)?.name ?? officerId
  }

  private beginSiege() {
    if (!this.marchArmy?.targetCityId) {
      this.showCampaignMessage('远征军没有目标城，无法攻城。')
      return
    }
    const target = this.campaignCities.find((city) => city.id === this.marchArmy?.targetCityId)
    if (!target || target.owner === 'liu') {
      this.showCampaignMessage('目标城已非敌城，无需攻城。')
      return
    }
    this.marchArmy.status = 'besieging'
    this.siegeState = {
      attackerArmyId: this.marchArmy.id,
      defenderCityId: target.id,
      wallHp: target.defense,
      defenderTroops: target.troops,
      attackerTroops: this.marchArmy.troops,
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
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.93).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, `${city.name}攻城`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1010, 72, `${this.campaignClock.year}年${this.campaignClock.month}月  第${this.siegeState.turns}合`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))

    this.overlayLayer.add(this.add.rectangle(86, 142, 430, 416, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(118, 172, '攻城态势', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    const lines = [
      `攻方      ${cityName(this.marchArmy.sourceCityId)}军`,
      `主将      ${this.officerName(this.marchArmy.leaderOfficerId)}`,
      `兵力      ${this.siegeState.attackerTroops}`,
      `粮草      ${this.marchArmy.food}`,
      `士气      ${this.marchArmy.morale}`,
      '',
      `守城      ${city.name}`,
      `归属      ${factionById(city.owner)?.name ?? '-'}`,
      `城防      ${this.siegeState.wallHp}/${city.defense}`,
      `守军      ${this.siegeState.defenderTroops}`,
      `府库      ${city.gold}`,
      `存粮      ${city.food}`,
    ]
    this.overlayLayer.add(this.add.text(122, 232, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      lineSpacing: 11,
    }))

    this.overlayLayer.add(this.add.rectangle(558, 142, 636, 416, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(590, 172, '攻城命令', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
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

    if (message) {
      this.overlayLayer.add(this.add.text(640, 610, message, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#fff4cf',
        backgroundColor: '#3c2417',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5))
    }
    this.makeButton(640, 660, '返回行军', () => this.showCampaign(), this.overlayLayer, 180, 42)
  }

  private confirmSiegeAction(action: SiegeState['lastAction']) {
    if (!this.marchArmy || !this.siegeState || !action) return
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    const config = {
      assault: { command: '强攻', target: `${city.name}城门与守军`, scope: '攻城正面', effect: '城防下降｜敌我均有兵损｜随军粮 -5' },
      surround: { command: '围城', target: `${city.name}守城军粮道`, scope: '城外包围', effect: '守军损耗｜我军粮 -7｜士气 -1' },
      fire: { command: '火计', target: `${city.name}城内粮仓`, scope: '敌城营寨', effect: '消耗情报，成功则烧粮并降城防' },
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
      this.startMarchArmy()
      return
    }
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    if (!city) return
    this.siegeState.lastAction = action
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
      const defenderLoss = 260 + Math.floor(this.councilState.intel * 3)
      this.siegeState.defenderTroops = Math.max(0, this.siegeState.defenderTroops - defenderLoss)
      this.marchArmy.food = Math.max(0, this.marchArmy.food - 7)
      this.marchArmy.morale = Math.max(0, this.marchArmy.morale - 1)
      message = `围城断援，守军 -${defenderLoss}，我军粮草 -7。`
    } else if (action === 'fire') {
      if (this.councilState.intel < 18) {
        this.marchArmy.food = Math.max(0, this.marchArmy.food - 3)
        message = '情报不足，火计未成，仅耗粮草。'
      } else {
        const wallDamage = 7 + Math.floor(this.councilState.intel / 12)
        const foodLoss = Math.floor(city.food * 0.18)
        this.councilState.intel = Math.max(0, this.councilState.intel - 18)
        this.siegeState.wallHp = Math.max(0, this.siegeState.wallHp - wallDamage)
        city.food = Math.max(120, city.food - foodLoss)
        this.marchArmy.food = Math.max(0, this.marchArmy.food - 4)
        message = `火计焚营，城防 -${wallDamage}，敌粮 -${foodLoss}。`
      }
    }
    this.siegeState.turns += 1
    if (this.siegeState.wallHp <= 0 || this.siegeState.defenderTroops <= Math.max(500, Math.floor(city.troops * 0.18))) {
      this.completeSiegeVictory()
      return
    }
    if (this.marchArmy.food <= 0 || this.siegeState.attackerTroops <= 500) {
      this.completeSiegeFailure('粮尽兵疲，攻城失败。')
      return
    }
    this.showSiege(message)
  }

  private beginDuelChallenge() {
    if (!this.marchArmy || !this.siegeState) return
    const defender = this.defenderForDuel(this.siegeState.defenderCityId)
    const attacker = this.campaignOfficers.find((officer) => officer.id === this.marchArmy?.leaderOfficerId)
    if (!attacker || !defender) {
      this.showSiege('敌我主将未列阵，挑战未成。')
      return
    }
    this.siegeState.lastAction = 'challenge'
    this.duelState = {
      attackerOfficerId: attacker.id,
      defenderOfficerId: defender.id,
      attackerHp: 100,
      defenderHp: 100,
      attackerStamina: 72,
      defenderStamina: 72,
      round: 1,
      log: [`${attacker.name}拍马出阵，${defender.name}应声迎战。`],
    }
    this.showDuel()
  }

  private defenderForDuel(cityId: CityId) {
    const city = this.campaignCities.find((item) => item.id === cityId)
    if (!city) return undefined
    return this.campaignOfficers
      .filter((officer) => officer.location === cityId && officer.faction === city.owner)
      .sort((a, b) => b.war - a.war || b.command - a.command)[0]
      ?? this.campaignOfficers.filter((officer) => officer.faction === city.owner).sort((a, b) => b.war - a.war)[0]
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
    this.drawDuelantPanel(112, 130, attacker, this.duelState.attackerHp, this.duelState.attackerStamina, '攻方')
    this.drawDuelantPanel(748, 130, defender, this.duelState.defenderHp, this.duelState.defenderStamina, '守方')
    this.overlayLayer.add(this.add.text(640, 224, '对', {
      fontFamily: 'Georgia, serif',
      fontSize: '56px',
      color: '#c94b3b',
      stroke: '#120909',
      strokeThickness: 4,
    }).setOrigin(0.5))

    const recentLog = this.duelState.log.slice(-5).join('\n')
    this.overlayLayer.add(this.add.rectangle(230, 454, 820, 144, 0x151b22, 0.92).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.8))
    this.overlayLayer.add(this.add.text(258, 480, recentLog, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f7ecd5',
      lineSpacing: 10,
      wordWrap: { width: 770 },
    }))

    if (this.duelState.outcome) {
      const result = this.duelOutcomeText()
      this.overlayLayer.add(this.add.text(640, 622, result, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#fff4cf',
        backgroundColor: '#3c2417',
        padding: { x: 20, y: 10 },
      }).setOrigin(0.5))
      this.makeButton(640, 674, '返回攻城', () => this.finishDuelChallenge(), this.overlayLayer, 180, 42)
      return
    }

    this.overlayLayer.add(this.add.text(640, 622, `第${this.duelState.round}合：选择单挑命令`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.makeButton(438, 674, '攻击', () => this.resolveDuelRound('attack'), this.overlayLayer, 150, 42)
    this.makeButton(640, 674, '防守', () => this.resolveDuelRound('guard'), this.overlayLayer, 150, 42)
    this.makeButton(842, 674, '蓄势', () => this.resolveDuelRound('focus'), this.overlayLayer, 150, 42)
  }

  private drawDuelantPanel(x: number, y: number, officer: StrategyOfficer, hp: number, stamina: number, camp: string) {
    this.overlayLayer.add(this.add.rectangle(x, y, 420, 260, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
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
    this.drawMeter(x + 30, y + 168, 330, 18, hp, 100, 0xc94b3b, '体力')
    this.drawMeter(x + 30, y + 210, 330, 18, stamina, 100, 0xd4af37, '气力')
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

  private resolveDuelRound(action: 'attack' | 'guard' | 'focus') {
    if (!this.duelState) return
    const attacker = this.campaignOfficers.find((officer) => officer.id === this.duelState?.attackerOfficerId)
    const defender = this.campaignOfficers.find((officer) => officer.id === this.duelState?.defenderOfficerId)
    if (!attacker || !defender) return
    const defenderAction = this.defenderDuelAction(defender)
    const attackPower = this.duelPower(attacker, action, this.duelState.attackerStamina)
    const defensePower = this.duelPower(defender, defenderAction, this.duelState.defenderStamina)
    let attackerDamage = Math.max(3, defensePower - Math.floor(attacker.command / 10))
    let defenderDamage = Math.max(3, attackPower - Math.floor(defender.command / 10))

    if (action === 'guard') attackerDamage = Math.floor(attackerDamage * 0.45)
    if (defenderAction === 'guard') defenderDamage = Math.floor(defenderDamage * 0.45)
    if (action === 'focus') defenderDamage = Math.floor(defenderDamage * 0.35)
    if (defenderAction === 'focus') attackerDamage = Math.floor(attackerDamage * 0.35)

    this.duelState.attackerHp = Math.max(0, this.duelState.attackerHp - attackerDamage)
    this.duelState.defenderHp = Math.max(0, this.duelState.defenderHp - defenderDamage)
    this.duelState.attackerStamina = Phaser.Math.Clamp(this.duelState.attackerStamina + (action === 'focus' ? 22 : action === 'guard' ? 8 : -14), 0, 100)
    this.duelState.defenderStamina = Phaser.Math.Clamp(this.duelState.defenderStamina + (defenderAction === 'focus' ? 22 : defenderAction === 'guard' ? 8 : -14), 0, 100)
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

  private defenderDuelAction(officer: StrategyOfficer): 'attack' | 'guard' | 'focus' {
    if (!this.duelState) return 'attack'
    if (this.duelState.defenderHp < 34) return 'guard'
    if (this.duelState.defenderStamina < 30) return 'focus'
    return officer.war >= 86 || this.duelState.attackerHp < 42 ? 'attack' : 'guard'
  }

  private duelPower(officer: StrategyOfficer, action: 'attack' | 'guard' | 'focus', stamina: number) {
    if (action === 'focus') return Math.max(4, Math.floor(officer.war / 8))
    const base = action === 'attack' ? 12 : 7
    return base + Math.floor(officer.war / 7) + Math.floor(officer.command / 16) + Math.floor(stamina / 18)
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
      this.duelState.log.push(`${defender.name}败退，守军震动，损兵${defenderLoss}。`)
    } else if (this.duelState.outcome === 'defenderWin') {
      const attackerLoss = 320 + defender.war * 6
      this.siegeState.attackerTroops = Math.max(0, this.siegeState.attackerTroops - attackerLoss)
      this.marchArmy.troops = this.siegeState.attackerTroops
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 10, 0, 100)
      this.duelState.log.push(`${attacker.name}失利退阵，我军损兵${attackerLoss}。`)
    } else {
      this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale - 2, 0, 100)
      this.duelState.log.push('两将难分胜负，各自收兵。')
    }
    this.siegeState.turns += 1
  }

  private duelOutcomeText() {
    if (!this.duelState) return '单挑结束。'
    if (this.duelState.outcome === 'attackerWin') return '我将得胜，敌军军心动摇。'
    if (this.duelState.outcome === 'defenderWin') return '守将得势，我军士气受挫。'
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
    if (city && (this.siegeState.wallHp <= 0 || this.siegeState.defenderTroops <= Math.max(500, Math.floor(city.troops * 0.18)))) {
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
    const city = this.campaignCities.find((item) => item.id === this.siegeState?.defenderCityId)
    const source = this.campaignCities.find((item) => item.id === this.marchArmy?.sourceCityId)
    if (!city || !source) return
    const oldOwner = factionById(city.owner)?.name ?? '敌军'
    const seizedGold = Math.floor(city.gold * 0.18)
    const seizedFood = Math.floor(city.food * 0.18)
    city.owner = 'liu'
    city.troops = Math.max(600, Math.floor(this.siegeState.attackerTroops * 0.35))
    city.defense = Math.max(18, Math.floor(this.siegeState.wallHp * 0.75))
    city.gold = Math.max(120, city.gold - seizedGold)
    city.food = Math.max(160, city.food - seizedFood)
    source.gold = Math.min(3000, source.gold + seizedGold)
    source.food = Math.min(5000, source.food + seizedFood)
    this.recordMonthlyAction(`攻取${city.name}`)
    this.marchArmy = undefined
    this.siegeState = undefined
    this.syncSelectedCityState()
    this.showCampaignMessage(`${oldOwner}弃守，${city.name}归入刘备军。缴获金${seizedGold}粮${seizedFood}。`)
  }

  private completeSiegeFailure(message: string) {
    if (!this.marchArmy || !this.siegeState) return
    const source = this.campaignCities.find((item) => item.id === this.marchArmy?.sourceCityId)
    if (source) source.troops = Math.max(500, source.troops - Math.floor(this.marchArmy.troops * 0.12))
    this.recordMonthlyAction(`攻${cityName(this.siegeState.defenderCityId)}失利`)
    this.marchArmy = undefined
    this.siegeState = undefined
    this.councilState.morale = Math.max(0, this.councilState.morale - 6)
    this.showCampaignMessage(message)
  }

  private showDomesticCommand() {
    this.showCommandPanel('内政', [
      ['开发', () => this.confirmCityPolicy('内政', '开发', '本城', '兴修水利，田亩渐丰，城池存粮增加。', '金 -130｜粮 +260｜民心 +2', { treasury: -130, farms: 1, publicOrder: 2, food: 260 })],
      ['调动', () => this.moveCurrentCityOfficer()],
      ['情报', () => this.showBriefing()],
      ['福利', () => this.confirmCityPolicy('内政', '福利', '本城百姓', '赈济百姓，民心上升。', '金 -120｜民心 +6｜士气 +2', { treasury: -120, publicOrder: 6, morale: 2 })],
      ['任命', () => this.showHeroManagement()],
      ['税率', () => this.confirmCityPolicy('内政', '税率', '本城府库', '调整税率，府库增加但民心微降。', '金 +180｜民心 -3', { treasury: 180, publicOrder: -3 })],
      ['教育', () => this.confirmCityPolicy('内政', '教育', '本城吏士', '设学讲武，政略与情报上升。', '金 -100｜情报 +4｜士气 +2', { treasury: -100, intel: 4, morale: 2 })],
      ['运输', () => this.confirmTransportSupplies()],
    ])
  }

  private showMilitaryCommand() {
    this.showCommandPanel('军事', [
      ['征兵', () => this.confirmCityPolicy('军事', '征兵', '本城兵营', '征募乡勇入营，兵力增加。', '金 -160｜兵 +900｜士气 +3｜民心 -2', { treasury: -160, recruits: 900, morale: 3, publicOrder: -2 })],
      ['武器', () => this.confirmCityPolicy('军事', '武器', '本城军械库', '打造军械甲胄，出征士气上升。', '金 -180｜士气 +5', { treasury: -180, morale: 5 })],
      ['人材', () => this.showTalentSearch()],
      ['防卫', () => this.confirmCityPolicy('军事', '防卫', '本城城防', '修缮城垣箭楼，城防上升。', '金 -140｜城防 +8', { treasury: -140, walls: 8 })],
      ['训练', () => this.confirmCityPolicy('军事', '训练', '本城军士', '校场练兵，士气与情报上升。', '金 -90｜士气 +7｜情报 +3', { treasury: -90, morale: 7, intel: 3 })],
      ['出征', () => this.showDeployment()],
    ])
  }

  private showPersonnelCommand() {
    this.showCommandPanel('人事', [
      ['搜索', () => this.showTalentSearch()],
      ['登用', () => this.showTalentSearch()],
      ['赏赐', () => this.showHeroManagement()],
      ['移动', () => this.moveCurrentCityOfficer()],
      ['俘虏', () => this.showCampaignMessage('俘虏处置将在战后系统中开放。')],
    ])
  }

  private showSystemCommand() {
    this.showCommandPanel('机能', [
      ['势力', () => this.showFactionOverview()],
      ['保存', () => this.showTitleNotice('保存', '保存功能尚未开放。当前可继续进行本局。')],
      ['读取', () => this.showContinueStub()],
      ['环境', () => this.showSettingsOverlay()],
      ['标题', () => this.showTitle()],
    ])
  }

  private showCommandPanel(title: string, items: [string, () => void][]) {
    const panelWidth = 700
    const panelHeight = items.length > 6 ? 340 : 260
    const panel = this.add.rectangle(640, 456, panelWidth, panelHeight, 0x101722, 0.98).setStrokeStyle(2, 0xd4af37, 0.9)
    const heading = this.add.text(640 - panelWidth / 2 + 34, 342, `${title}命令  ｜  ${this.selectedCity?.name ?? '未选'}城`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px',
      color: '#f8df9d',
    })
    this.overlayLayer.add([panel, heading])
    const buttons: Phaser.GameObjects.Text[] = []
    items.forEach(([label, callback], index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      const x = 428 + col * 212
      const y = 414 + row * 72
      const button = this.makeButton(x, 466, label, () => {
        panel.destroy()
        heading.destroy()
        buttons.forEach((item) => item.destroy())
        callback()
      }, this.overlayLayer, 158, 46)
      button.setPosition(x, y)
      buttons.push(button)
    })
    const closeY = items.length > 6 ? 646 : 574
    const close = this.makeButton(640, closeY, '取消', () => {
      panel.destroy()
      heading.destroy()
      buttons.forEach((item) => item.destroy())
      this.showCampaign()
    }, this.overlayLayer, 110, 38)
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
    const panel = this.add.rectangle(640, 448, 680, 318, 0x101722, 0.985).setStrokeStyle(3, 0xd4af37, 0.9)
    const heading = this.add.text(342, 316, `${config.category}｜${config.command}`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f8df9d',
    })
    const body = this.add.text(370, 372, [
      `发起方    ${config.actor}`,
      `目标      ${config.target}`,
      `范围      ${config.scope}`,
      `效果      ${config.effect}`,
    ].join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      lineSpacing: 12,
    })
    const hint = this.add.text(640, 566, config.hint ?? '确认后消耗政令并执行命令', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#d8c092',
    }).setOrigin(0.5)
    const nodes: Phaser.GameObjects.GameObject[] = [panel, heading, body, hint]
    const close = () => nodes.forEach((node) => node.destroy())
    const cancel = this.makeButton(540, 626, '取消', () => {
      close()
      config.onCancel?.()
    }, this.overlayLayer, 136, 40)
    const confirm = this.makeButton(740, 626, '确认', () => {
      close()
      config.onConfirm()
    }, this.overlayLayer, 136, 40)
    nodes.push(cancel, confirm)
    this.overlayLayer.add(nodes)
  }

  private confirmCityPolicy(category: string, command: string, target: string, message: string, effect: string, delta: { treasury?: number; publicOrder?: number; recruits?: number; farms?: number; walls?: number; food?: number; supplies?: number; morale?: number; intel?: number }) {
    const city = this.selectedCity
    if (!city) return
    this.showCommandConfirm({
      category,
      command,
      actor: `${city.name}太守府`,
      target,
      scope: `${city.name}城`,
      effect,
      onConfirm: () => this.applyCityPolicy(message, delta),
    })
  }

  private confirmTransportSupplies() {
    const city = this.selectedCity
    if (!city) return
    this.showCommandConfirm({
      category: '内政',
      command: '运输',
      actor: `${city.name}太守府`,
      target: '远征粮仓',
      scope: `${city.name}存粮 → 刘备军行军粮`,
      effect: '城池粮 -240｜行军粮 +18',
      onConfirm: () => this.transportSupplies(),
    })
  }

  private showInspection() {
    this.phase = 'inspect'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.92).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '视察情况', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1010, 72, `${this.campaignClock.year}年${this.campaignClock.month}月   ${campaignModeName(this.campaignClock.mode)}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.drawInspectionCity()
    this.drawInspectionHeroes()
    this.drawInspectionThreat()
    this.makeButton(438, 636, '势力一览', () => this.showFactionOverview(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '军事命令', () => this.showMilitaryCommand(), this.overlayLayer, 180, 44)
  }

  private drawInspectionCity() {
    this.overlayLayer.add(this.add.rectangle(82, 140, 330, 430, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(112, 170, '城池', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    const lines = [
      `势力    刘备军`,
      `主城    成都`,
      `城池    ${this.countCities('liu')}`,
      `武将    ${this.countOfficers('liu')}`,
      `总兵    ${this.sumCityField('liu', 'troops')}`,
      `总粮    ${this.sumCityField('liu', 'food')}`,
      `府库    ${this.cityState.treasury}`,
      `民心    ${this.cityState.publicOrder}`,
      `邻敌    ${this.neighborEnemyCities('liu').join('、') || '无'}`,
    ]
    this.overlayLayer.add(this.add.text(118, 230, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '19px',
      color: '#f8ecd0',
      lineSpacing: 13,
    }))
  }

  private drawInspectionHeroes() {
    this.overlayLayer.add(this.add.rectangle(450, 140, 380, 430, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(480, 170, '武将', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    this.campaignOfficers.filter((officer) => officer.faction === 'liu').forEach((officer, index) => {
      const y = 218 + index * 64
      const key = officerPortraitKey(officer.id)
      this.overlayLayer.add(this.add.rectangle(480, y - 22, 310, 58, 0x21160f, 0.9).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.45))
      if (this.textures.exists(key)) {
        this.overlayLayer.add(this.add.image(510, y + 6, key).setDisplaySize(42, 50))
      }
      this.overlayLayer.add(this.add.text(542, y - 12, `${officer.name}｜${officer.role}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '19px',
        color: '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(542, y + 16, `武 ${officer.war}  智 ${officer.intel}  政 ${officer.gov}  忠 ${officer.loyalty}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '16px',
        color: '#f8ecd0',
      }))
    })
  }

  private drawInspectionThreat() {
    this.overlayLayer.add(this.add.rectangle(868, 140, 326, 430, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(898, 170, '敌情', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
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

  private showFactionOverview() {
    this.phase = 'factions'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.92).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '势力一览', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1000, 72, '观天下强弱，择交战时机', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.rectangle(94, 142, 1092, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(124, 170, '势力        君主        城池    武将    总兵       总粮       特性', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f5d487',
    }))
    strategyFactions.filter((faction) => faction.id !== 'neutral').forEach((faction, index) => {
      const y = 220 + index * 60
      this.overlayLayer.add(this.add.rectangle(120, y - 12, 1010, 44, 0x21160f, index % 2 === 0 ? 0.88 : 0.72).setOrigin(0).setStrokeStyle(1, faction.color, 0.7))
      const line = `${faction.name.padEnd(6, '　')}  ${faction.ruler.padEnd(4, '　')}    ${String(this.countCities(faction.id)).padStart(2, ' ')}      ${String(this.countOfficers(faction.id)).padStart(2, ' ')}    ${String(this.sumCityField(faction.id, 'troops')).padStart(5, ' ')}    ${String(this.sumCityField(faction.id, 'food')).padStart(5, ' ')}    ${faction.trait}`
      this.overlayLayer.add(this.add.text(134, y, line, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8ecd0',
      }))
    })
    this.makeButton(540, 636, '返回视察', () => this.showInspection(), this.overlayLayer, 180, 44)
    this.makeButton(740, 636, '外交交涉', () => this.showDiplomacy(), this.overlayLayer, 180, 44)
  }

  private showTalentSearch() {
    this.phase = 'talent'
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.92).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '访贤登用', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1010, 72, '搜索在野、举荐名士、补强阵营', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.rectangle(92, 140, 470, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.rectangle(604, 140, 590, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(124, 170, '传闻', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    this.overlayLayer.add(this.add.text(636, 170, '在野人才', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    this.overlayLayer.add(this.add.text(124, 230, [
      `政令：${this.councilState.actions}`,
      `府库：${this.cityState.treasury}`,
      `民心：${this.cityState.publicOrder}`,
      `刘备魅力影响登用成功率。`,
      `高情报会发现更多人才。`,
      '',
      this.recruitedNeutralIds.size > 0 ? '已有名士投效，声望渐起。' : '洛阳传来名士流落消息。',
    ].join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      lineSpacing: 13,
      wordWrap: { width: 390 },
    }))
    const candidates = this.campaignOfficers.filter((officer) => officer.faction === 'neutral')
    candidates.forEach((officer, index) => {
      const y = 244 + index * 96
      const recruited = this.recruitedNeutralIds.has(officer.id)
      this.overlayLayer.add(this.add.rectangle(636, y - 26, 500, 76, 0x21160f, 0.9).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
      this.overlayLayer.add(this.add.text(660, y - 10, `${officer.name}｜${officer.role}｜${officer.location}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(660, y + 18, `智 ${officer.intel}  政 ${officer.gov}  魅 ${officer.charm}  成功率 ${this.recruitChance(officer)}%`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '17px',
        color: '#f8ecd0',
      }))
      this.makeButton(1038, y + 10, recruited ? '已登用' : '登用', () => this.tryRecruitOfficer(officer.id), this.overlayLayer, 108, 36)
    })
    this.makeButton(540, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(740, 636, '推进月份', () => this.advanceCampaignMonth(), this.overlayLayer, 180, 44)
  }

  private tryRecruitOfficer(officerId: string) {
    const officer = this.campaignOfficers.find((item) => item.id === officerId)
    if (!officer) return
    if (this.recruitedNeutralIds.has(officer.id)) {
      this.showTalentMessage(`${officer.name}已经投效。`)
      return
    }
    if (this.councilState.actions <= 0) {
      this.showTalentMessage('政令已用尽，需等下月再访。')
      return
    }
    if (this.cityState.treasury < 20) {
      this.showTalentMessage('府库不足，无法备礼访贤。')
      return
    }
    this.councilState.actions -= 1
    this.cityState.treasury -= 20
    if (Phaser.Math.Between(1, 100) <= this.recruitChance(officer)) {
      this.recruitedNeutralIds.add(officer.id)
      officer.faction = 'liu'
      officer.location = this.selectedCityId
      officer.role = '客将'
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 6, 0, 100)
      this.showTalentMessage(`${officer.name}愿赴${this.selectedCity?.name ?? '本城'}效力，士气 +6。`)
    } else {
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 6, 0, 100)
      this.showTalentMessage(`${officer.name}暂未应允，但留下线索，情报 +6。`)
    }
  }

  private recruitChance(officer: StrategyOfficer) {
    const liuBei = this.campaignOfficers.find((item) => item.id === 'liu_bei')
    const charm = liuBei?.charm ?? 80
    return Phaser.Math.Clamp(28 + Math.floor(charm / 4) + Math.floor(this.councilState.intel / 10) + Math.floor(this.cityState.publicOrder / 20) - Math.floor(officer.loyalty / 10), 12, 88)
  }

  private showTalentMessage(message: string) {
    this.showTalentSearch()
    this.overlayLayer.add(this.add.text(640, 590, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#fff4cf',
      backgroundColor: '#3c2417',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5))
  }

  private drawCampaignMap() {
    const map = this.add.container(86, 140)
    map.add(this.add.rectangle(0, 0, 720, 430, 0x101722, 0.95).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    map.add(this.add.text(28, 24, '天下形势', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '30px',
      color: '#f5d487',
    }))
    const route = this.add.graphics()
    route.lineStyle(2, 0xc9a45a, 0.38)
    for (const city of this.campaignCities) {
      for (const routeId of city.routes) {
        const target = this.campaignCities.find((item) => item.id === routeId)
        if (!target || city.id > target.id) continue
        route.beginPath()
        route.moveTo(city.x, city.y)
        route.lineTo(target.x, target.y)
        route.strokePath()
      }
    }
    map.add(route)
    for (const city of this.campaignCities) {
      const faction = factionById(city.owner)
      this.drawCityNode(map, city, faction?.name.replace('军', '') ?? '群雄', faction?.color ?? 0x8a8f98)
    }
    map.add(this.add.rectangle(26, 342, 666, 64, 0x21160f, 0.92).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
    map.add(this.add.text(42, 352, this.strategicDirective(), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '17px',
      color: '#f4dfb3',
      lineSpacing: 5,
      wordWrap: { width: 630 },
    }))
    this.overlayLayer.add(map)
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

  private drawCityNode(layer: Phaser.GameObjects.Container, city: StrategyCity, status: string, color: number) {
    const selected = city.id === this.selectedCityId
    const focused = city.id === this.focusedCityId
    const ownCity = city.owner === 'liu'
    const target = city.id === this.selectedTargetCityId
    const ringColor = selected ? 0xffffff : target ? 0xffd166 : focused ? 0x9fd7ff : ownCity ? 0xf8df9d : 0x7f6a48
    const radius = selected ? 25 : focused || target ? 23 : 20
    const circle = this.add.circle(city.x, city.y, radius, color, ownCity ? 0.96 : 0.84).setStrokeStyle(selected || focused || target ? 4 : 2, ringColor, selected || focused || target ? 1 : 0.85)
    circle.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.focusMapCity(city.id))
    layer.add(circle)
    if (selected || focused || target) {
      layer.add(this.add.circle(city.x, city.y, selected ? 32 : 29, 0xf8df9d, 0).setStrokeStyle(2, ringColor, 0.7))
    }
    layer.add(this.add.text(city.x, city.y - 8, city.name, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '13px',
      color: '#fff6d8',
    }).setOrigin(0.5))
    layer.add(this.add.text(city.x, city.y + 26, status, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '12px',
      color: '#e8d4a9',
    }).setOrigin(0.5))
  }

  private focusMapCity(cityId: CityId) {
    const city = this.campaignCities.find((item) => item.id === cityId)
    if (!city) return
    this.focusedCityId = city.id
    if (city.owner === 'liu') {
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
      fontSize: '30px',
      color: '#f5d487',
    }))
    const focusedCity = this.focusedCity
    const focusedFaction = focusedCity ? factionById(focusedCity.owner) : undefined
    const lines = [
      `光标    ${focusedCity?.name ?? '-'}`,
      `归属    ${focusedFaction?.name ?? '-'}`,
      `区域    ${focusedCity?.region ?? '-'}`,
      `兵力    ${focusedCity?.troops ?? 0}`,
      `城防    ${focusedCity?.defense ?? 0}`,
      `府库    ${focusedCity?.gold ?? 0}`,
      `存粮    ${focusedCity?.food ?? 0}`,
      '',
      `命令城  ${this.selectedCity?.name ?? '未选'}`,
      `粮草    ${this.councilState.supplies}`,
      `士气    ${this.councilState.morale}`,
      `情报    ${this.councilState.intel}`,
      `政令    ${this.councilState.actions}`,
      `民心    ${this.cityState.publicOrder}`,
      `敌势    ${this.campaignClock.enemyThreat}`,
      `军行    ${this.marchArmy ? `${this.marchArmy.targetCityId ? cityName(this.marchArmy.targetCityId) : '目标'}${marchStatusName(this.marchArmy.status)}` : '无'}`,
    ]
    this.overlayLayer.add(this.add.text(884, 216, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8ecd0',
      lineSpacing: 7,
    }))
    this.overlayLayer.add(this.add.rectangle(880, 476, 264, 62, 0x21160f, 0.94).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.65))
    this.overlayLayer.add(this.add.text(900, 490, `行军粮 ${this.councilState.supplies}｜士气 ${this.councilState.morale}\n邻接：${this.selectedCity?.routes.map((id) => cityName(id)).join('、') ?? '-'}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '17px',
      color: '#f4dfb3',
      wordWrap: { width: 224 },
      lineSpacing: 5,
    }))
    this.overlayLayer.add(this.add.text(884, 548, `本月：${this.monthlyActionLog.slice(-2).join('；') || '尚未下令'}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '15px',
      color: '#ead7b3',
      wordWrap: { width: 282 },
    }))
    this.drawFactionSummary()
  }

  private drawFactionSummary() {
    const counts = strategyFactions.filter((faction) => faction.id !== 'neutral').map((faction) => {
      const cities = this.countCities(faction.id)
      const officers = this.countOfficers(faction.id)
      return `${faction.name}  城${cities} 将${officers}`
    })
    this.overlayLayer.add(this.add.rectangle(86, 520, 720, 50, 0x21160f, 0.9).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
    this.overlayLayer.add(this.add.text(112, 535, counts.join('    '), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f8ecd0',
    }))
  }

  private showCityGovernance() {
    this.phase = 'city'
    this.syncSelectedCityState()
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.91).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, `${this.cityState.name} 政厅`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1030, 72, '内政结果会转化为粮草、士气和出征兵源', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.drawCityStatsPanel()
    this.drawCityCommandPanel()
    this.drawCitySelector()
    this.makeButton(438, 636, '切换城池', () => this.cycleControlledCity(), this.overlayLayer, 180, 44)
    this.makeButton(640, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(842, 636, '任命武将', () => this.showHeroManagement(), this.overlayLayer, 180, 44)
  }

  private drawCityStatsPanel() {
    this.overlayLayer.add(this.add.rectangle(84, 144, 472, 430, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(116, 174, '城池状态', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
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
      ['开发', '金 -120，粮 +300', () => this.confirmCityPolicy('内政', '开发', '本城', '开发田地，粮仓渐实。', '金 -120｜粮 +300', { treasury: -120, food: 300 })],
      ['调动', '移驻一名武将到邻城', () => this.moveCurrentCityOfficer()],
      ['情报', '查看本城与邻城军情', () => this.showCityIntel()],
      ['福利', '金 -100，民心 +10，士气 +2', () => this.confirmCityPolicy('内政', '福利', '本城百姓', '开仓赈济，民心渐定。', '金 -100｜民心 +10｜士气 +2', { treasury: -100, publicOrder: 10, morale: 2 })],
      ['任命', '任命太守、先锋、军师', () => this.showHeroManagement()],
      ['税率', '金 +220，民心 -6', () => this.confirmCityPolicy('内政', '税率', '本城府库', '本月税率加重，府库充盈，民心略降。', '金 +220｜民心 -6', { treasury: 220, publicOrder: -6 })],
      ['教育', '金 -80，情报 +8，士气 +2', () => this.confirmCityPolicy('内政', '教育', '本城吏士', '开设讲武讲堂，吏士见闻增长。', '金 -80｜情报 +8｜士气 +2', { treasury: -80, intel: 8, morale: 2 })],
      ['运输', '粮 -240，随军粮 +18', () => this.confirmTransportSupplies()],
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

  private showCityIntel() {
    const city = this.selectedCity
    if (!city) return
    const neighbors = city.routes.map((id) => this.campaignCities.find((item) => item.id === id)).filter((item): item is StrategyCity => Boolean(item))
    const copy = [
      `${city.name}：兵${city.troops} 城防${city.defense} 金${city.gold} 粮${city.food}`,
      ...neighbors.map((neighbor) => `${neighbor.name}：${factionById(neighbor.owner)?.name ?? '-'} 兵${neighbor.troops} 防${neighbor.defense}`),
    ].join('\n')
    this.showCityGovernance()
    this.overlayLayer.add(this.add.rectangle(640, 406, 650, 250, 0x101722, 0.98).setStrokeStyle(2, 0xd4af37))
    this.overlayLayer.add(this.add.text(640, 318, '城池情报', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '36px',
      color: '#f8df9d',
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.text(360, 360, copy, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8ecd0',
      lineSpacing: 10,
    }))
    this.makeButton(640, 512, '收起', () => this.showCityGovernance(), this.overlayLayer, 140, 38)
  }

  private transportSupplies() {
    const city = this.selectedCity
    if (!city) return
    if (this.councilState.actions <= 0) {
      this.showCityMessage('本月政令已用尽，无法转运军粮。')
      return
    }
    if (city.food < 240) {
      this.showCityMessage('存粮不足，无法转运军粮。')
      return
    }
    city.food = Math.max(0, city.food - 240)
    this.councilState.supplies = Phaser.Math.Clamp(this.councilState.supplies + 18, 0, 150)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}转运军粮`)
    this.syncSelectedCityState()
    this.showCityMessage('转运军粮入远征仓，行军粮草增加。')
  }

  private drawCitySelector() {
    const controlled = this.campaignCities.filter((city) => city.owner === 'liu')
    this.overlayLayer.add(this.add.text(116, 540, `刘备军城池：${controlled.map((city) => city.name).join('、')}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f4dfb3',
    }))
  }

  private applyCityPolicy(message: string, delta: { treasury?: number; publicOrder?: number; recruits?: number; farms?: number; walls?: number; food?: number; supplies?: number; morale?: number; intel?: number }) {
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
    city.gold = Phaser.Math.Clamp(city.gold + (delta.treasury ?? 0), 0, 3000)
    city.food = Phaser.Math.Clamp(city.food + (delta.food ?? 0), 0, 5000)
    this.councilState.supplies = Phaser.Math.Clamp(this.councilState.supplies + (delta.supplies ?? 0), 0, 150)
    city.troops = Phaser.Math.Clamp(city.troops + (delta.recruits ?? 0), 0, 30000)
    city.defense = Phaser.Math.Clamp(city.defense + (delta.walls ?? 0), 0, 100)
    this.cityState.publicOrder = Phaser.Math.Clamp(this.cityState.publicOrder + (delta.publicOrder ?? 0), 0, 100)
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + (delta.morale ?? 0), 0, 100)
    this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + (delta.intel ?? 0), 0, 100)
    this.councilState.actions -= 1
    this.recordMonthlyAction(message.startsWith(city.name) ? message : `${city.name}${message}`)
    this.syncSelectedCityState()
    this.showCityMessage(message)
  }

  private showCityMessage(message: string) {
    this.showCampaign()
    this.playCommandSignal(message)
    this.overlayLayer.add(this.add.text(640, 548, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#fff4cf',
      backgroundColor: '#3c2417',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5))
  }

  private cycleControlledCity() {
    const controlled = this.campaignCities.filter((city) => city.owner === 'liu')
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
  }

  private showHeroManagement() {
    this.phase = 'heroes'
    this.ensureLocalAppointments()
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.91).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '武将任命', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1018, 72, '太守影响内政，先锋影响出征，军师影响情报', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.drawHeroCards()
    this.drawAppointmentPanel()
    this.makeButton(540, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(740, 636, '移动武将', () => this.moveCurrentCityOfficer(), this.overlayLayer, 180, 44)
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
    heroes.forEach((officer, index) => {
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
        `智 ${officer.intel}  政 ${officer.gov}`,
        `忠诚 ${officer.loyalty}`,
      ]
      this.overlayLayer.add(this.add.text(x + 112, y + 84, lines.join('\n'), {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '17px',
        color: '#f8ecd0',
        lineSpacing: 6,
      }))
    })
  }

  private drawAppointmentPanel() {
    this.overlayLayer.add(this.add.rectangle(182, 510, 916, 84, 0x21160f, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    const governor = this.officerForUnit(this.appointments.governor)
    const vanguard = this.officerForUnit(this.appointments.vanguard)
    const strategist = this.officerForUnit(this.appointments.strategist)
    this.overlayLayer.add(this.add.text(210, 532, `太守：${governor?.name ?? '-'}    先锋：${vanguard?.name ?? '-'}    军师：${strategist?.name ?? '-'}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#f8df9d',
    }))
    this.makeButton(720, 552, '任太守', () => this.showAppointmentSelection('governor'), this.overlayLayer, 132, 36)
    this.makeButton(858, 552, '任先锋', () => this.showAppointmentSelection('vanguard'), this.overlayLayer, 132, 36)
    this.makeButton(996, 552, '任军师', () => this.showAppointmentSelection('strategist'), this.overlayLayer, 132, 36)
  }

  private showAppointmentSelection(role: keyof typeof this.appointments) {
    const officers = this.currentCityOfficers()
    if (officers.length === 0) {
      this.showHeroMessage('本城没有可任命武将。')
      return
    }
    this.showHeroManagement()
    this.overlayLayer.add(this.add.rectangle(640, 394, 760, 330, 0x101722, 0.985).setStrokeStyle(3, 0xd4af37, 0.9))
    this.overlayLayer.add(this.add.text(640, 276, `选择${appointmentRoleName(role)}`, {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#f8df9d',
    }).setOrigin(0.5))
    officers.forEach((officer, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      const x = 410 + col * 230
      const y = 346 + row * 74
      this.makeButton(x, y, officer.name, () => this.confirmAppointment(role, officer), this.overlayLayer, 168, 40)
      this.overlayLayer.add(this.add.text(x, y + 34, `统${officer.command} 武${officer.war} 智${officer.intel} 政${officer.gov}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#ead7b3',
      }).setOrigin(0.5))
    })
    this.makeButton(640, 548, '取消', () => this.showHeroManagement(), this.overlayLayer, 130, 38)
  }

  private confirmAppointment(role: keyof typeof this.appointments, officer: StrategyOfficer) {
    const city = this.selectedCity
    if (!city) return
    this.showCommandConfirm({
      category: '内政',
      command: '任命',
      actor: `${city.name}太守府`,
      target: `${officer.name}任${appointmentRoleName(role)}`,
      scope: `${city.name}武将任命`,
      effect: this.appointmentEffectText(role, officer),
      hint: '确认后调整本城职任',
      onConfirm: () => this.executeAppointment(role, officer),
      onCancel: () => this.showAppointmentSelection(role),
    })
  }

  private executeAppointment(role: keyof typeof this.appointments, officer: StrategyOfficer) {
    const unitId = unitIdForOfficerId(officer.id)
    if (!unitId) {
      this.showHeroMessage('该武将暂不能映射到战斗单位。')
      return
    }
    this.appointments[role] = unitId
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
    this.overlayLayer.add(this.add.text(640, 602, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#fff4cf',
      backgroundColor: '#3c2417',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5))
  }

  private applyAppointmentEffects() {
    const governor = heroById(this.appointments.governor)
    const strategist = heroById(this.appointments.strategist)
    if (governor) {
      this.cityState.publicOrder = Phaser.Math.Clamp(58 + Math.floor((governor.stats.def + governor.stats.res) / 2), 0, 100)
    }
    if (strategist) {
      this.councilState.intel = Phaser.Math.Clamp(16 + strategist.stats.mag + strategist.stats.res, 0, 100)
    }
  }

  private moveCurrentCityOfficer() {
    const officers = this.currentCityOfficers().filter((officer) => officer.role !== '君主')
    const destinations = this.controlledNeighborCities()
    if (officers.length === 0) {
      this.showHeroMessage('本城没有可移动武将。')
      return
    }
    if (destinations.length === 0) {
      this.showHeroMessage('本城没有相邻己方城池，暂不能移动武将。')
      return
    }
    if (this.councilState.actions <= 0) {
      this.showHeroMessage('本月政令已用尽，不能调动武将。')
      return
    }
    this.showMoveOfficerSelection(officers[0].id, destinations[0].id)
  }

  private showMoveOfficerSelection(officerId: string, destinationId: CityId) {
    const officers = this.currentCityOfficers().filter((officer) => officer.role !== '君主')
    const destinations = this.controlledNeighborCities()
    const officer = officers.find((item) => item.id === officerId) ?? officers[0]
    const destination = destinations.find((item) => item.id === destinationId) ?? destinations[0]
    if (!officer || !destination) {
      this.showHeroMessage('当前没有可调动的武将或目的城。')
      return
    }
    this.showHeroManagement()
    this.overlayLayer.add(this.add.rectangle(640, 402, 820, 350, 0x101722, 0.985).setStrokeStyle(3, 0xd4af37, 0.9))
    this.overlayLayer.add(this.add.text(640, 276, '调动武将', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '34px',
      color: '#f8df9d',
    }).setOrigin(0.5))
    this.overlayLayer.add(this.add.text(282, 318, '选择武将', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '19px',
      color: '#f8df9d',
    }))
    officers.forEach((item, index) => {
      this.makeButton(354, 362 + index * 48, item.id === officer.id ? `${item.name}✓` : item.name, () => this.showMoveOfficerSelection(item.id, destination.id), this.overlayLayer, 154, 36)
    })
    this.overlayLayer.add(this.add.text(710, 318, '目的城', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '19px',
      color: '#f8df9d',
    }))
    destinations.forEach((item, index) => {
      this.makeButton(770, 362 + index * 48, item.id === destination.id ? `${item.name}✓` : item.name, () => this.showMoveOfficerSelection(officer.id, item.id), this.overlayLayer, 154, 36)
    })
    this.overlayLayer.add(this.add.text(640, 540, `${officer.name}：${cityName(officer.location)} → ${destination.name}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f7ecd5',
    }).setOrigin(0.5))
    this.makeButton(540, 594, '取消', () => this.showHeroManagement(), this.overlayLayer, 130, 38)
    this.makeButton(740, 594, '确认', () => this.confirmMoveOfficer(officer, destination), this.overlayLayer, 130, 38)
  }

  private confirmMoveOfficer(officer: StrategyOfficer, destination: StrategyCity) {
    const city = this.selectedCity
    if (!city) return
    this.showCommandConfirm({
      category: '内政',
      command: '调动',
      actor: `${city.name}太守府`,
      target: officer.name,
      scope: `${city.name} → ${destination.name}`,
      effect: `移动${officer.name}至${destination.name}｜政令 -1`,
      hint: '确认后调动武将',
      onConfirm: () => this.executeMoveOfficer(officer, destination),
      onCancel: () => this.showMoveOfficerSelection(officer.id, destination.id),
    })
  }

  private executeMoveOfficer(officer: StrategyOfficer, destination: StrategyCity) {
    officer.location = destination.id
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${officer.name}移驻${destination.name}`)
    this.ensureLocalAppointments()
    this.showHeroMessage(`${officer.name}已移往${destination.name}。`)
  }

  private showDeployment() {
    this.phase = 'deploy'
    this.ensureDeploymentTarget()
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.92).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '行军出征', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1000, 72, '确认兵粮、任命与敌情后发兵', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.drawDeploymentSummary()
    this.drawDeploymentRoster()
    this.makeButton(520, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(740, 636, '确认出征', () => this.confirmDeployment(), this.overlayLayer, 180, 44)
  }

  private drawDeploymentSummary() {
    const vanguard = heroById(this.appointments.vanguard)
    const strategist = heroById(this.appointments.strategist)
    const supplyNeed = this.deploymentSupplyNeed()
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
      `行军粮草    ${this.councilState.supplies}/${supplyNeed}`,
      `敌势        ${this.campaignClock.enemyThreat}（${risk}）`,
      `预计消耗    粮草 ${supplyNeed}`,
      `补给来源    内政「运输」转入`,
    ]
    this.overlayLayer.add(this.add.text(122, 230, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '18px',
      color: '#f8ecd0',
      lineSpacing: 7,
    }))
  }

  private drawDeploymentRoster() {
    this.overlayLayer.add(this.add.rectangle(548, 140, 646, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(580, 170, '出战武将', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    const units = this.currentCityUnits()
    units.forEach((unit, index) => {
      const x = 590 + (index % 2) * 294
      const y = 238 + Math.floor(index / 2) * 138
      this.overlayLayer.add(this.add.rectangle(x, y, 250, 104, 0x21160f, 0.92).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.65))
      const key = `portrait-${unit.id}`
      if (this.textures.exists(key)) {
        this.overlayLayer.add(this.add.image(x + 46, y + 52, key).setDisplaySize(64, 78))
      }
      const roles = roleLabels(unit.id, this.appointments)
      this.overlayLayer.add(this.add.text(x + 92, y + 18, `${unit.name} ${roles}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '20px',
        color: '#f8df9d',
      }))
      this.overlayLayer.add(this.add.text(x + 92, y + 50, `兵力 ${heroTroops(unit, this.appointments)}  攻 ${unit.stats.atk}  谋 ${unit.stats.mag}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '17px',
        color: '#f8ecd0',
      }))
    })
    if (units.length === 0) {
      this.overlayLayer.add(this.add.text(872, 322, '本城暂无可出战武将。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '22px',
        color: '#f8ecd0',
      }).setOrigin(0.5))
    }
    this.drawDeploymentTargets()
  }

  private drawDeploymentTargets() {
    const targets = this.availableDeploymentTargets()
    this.overlayLayer.add(this.add.text(580, 468, '邻接目标', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '28px',
      color: '#f5d487',
    }))
    if (targets.length === 0) {
      this.overlayLayer.add(this.add.text(704, 476, '当前城池周边暂无可攻目标。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#ead7b3',
      }))
      return
    }
    targets.forEach((city, index) => {
      const x = 690 + index * 156
      const selected = city.id === this.selectedTargetCityId
      this.makeButton(x, 502, selected ? `${city.name}✓` : city.name, () => {
        this.selectedTargetCityId = city.id
        this.showDeployment()
      }, this.overlayLayer, 136, 36)
      this.overlayLayer.add(this.add.text(x, 534, `${factionById(city.owner)?.name ?? '群雄'} 兵${city.troops}`, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '14px',
        color: '#ead7b3',
      }).setOrigin(0.5))
    })
  }

  private confirmDeployment() {
    this.ensureDeploymentTarget()
    if (!this.selectedTargetCity) {
      this.showDeploymentMessage('没有邻接敌城，无法出征。请先切换城池。')
      return
    }
    if (this.currentCityUnits().length === 0) {
      this.showDeploymentMessage('本城没有可出战武将，请先移动武将。')
      return
    }
    const supplyNeed = this.deploymentSupplyNeed()
    if (this.councilState.supplies < supplyNeed) {
      this.showDeploymentMessage('粮草不足，无法出征。请先治理城池或运输军粮。')
      return
    }
    const source = this.selectedCity
    const target = this.selectedTargetCity
    const cityTroops = source?.troops ?? 0
    const troops = Math.max(800, Math.min(5200, Math.floor(cityTroops * 0.38)))
    this.showCommandConfirm({
      category: '军事',
      command: '出征',
      actor: `${source?.name ?? '本城'}太守府`,
      target: target.name,
      scope: `${source?.name ?? '本城'} → ${target.name}`,
      effect: `编成远征军 兵${troops}｜行军粮 -${supplyNeed}｜下月行军`,
      hint: '确认后编成远征军',
      onConfirm: () => this.executeDeployment(),
      onCancel: () => this.showDeployment(),
    })
  }

  private executeDeployment() {
    this.ensureDeploymentTarget()
    if (!this.selectedTargetCity) return
    const supplyNeed = this.deploymentSupplyNeed()
    if (this.councilState.supplies < supplyNeed) {
      this.showDeploymentMessage('粮草不足，无法出征。请先治理城池或运输军粮。')
      return
    }
    this.councilState.supplies -= supplyNeed
    const officerIds = this.currentCityOfficers().map((officer) => officer.id)
    const leaderOfficerId = this.officerForUnit(this.appointments.vanguard)?.id ?? officerIds[0] ?? 'liu_bei'
    const cityTroops = this.selectedCity?.troops ?? 0
    this.marchArmy = {
      id: `army-${this.campaignClock.year}-${this.campaignClock.month}-${this.selectedCityId}`,
      factionId: 'liu',
      sourceCityId: this.selectedCityId,
      targetCityId: this.selectedTargetCity.id,
      leaderOfficerId,
      officerIds: officerIds.slice(0, 4),
      troops: Math.max(800, Math.min(5200, Math.floor(cityTroops * 0.38))),
      food: supplyNeed,
      morale: this.councilState.morale,
      position: { kind: 'city', cityId: this.selectedCityId },
      routePlan: [this.selectedCityId, this.selectedTargetCity.id],
      movePoints: 1,
      status: 'ready',
    }
    this.recordMonthlyAction(`${this.selectedCity?.name ?? '本城'}下令出征${this.selectedTargetCity.name}`)
    this.showCampaignMessage(`出征令已下达：${this.selectedCity?.name ?? '本城'} → ${this.selectedTargetCity.name}。月令后将在行军月移动与攻击。`)
  }

  private deploymentSupplyNeed() {
    const target = this.selectedTargetCity
    const distanceCost = this.selectedCity?.routes.includes(target?.id ?? 'chengdu') ? 0 : 8
    const garrisonCost = target ? Math.floor(target.troops / 2200) : 0
    return 18 + distanceCost + garrisonCost + Math.floor(this.campaignClock.enemyThreat / 12)
  }

  private showDeploymentMessage(message: string) {
    this.showDeployment()
    this.overlayLayer.add(this.add.text(640, 590, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#fff4cf',
      backgroundColor: '#3c2417',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5))
  }

  private showDiplomacy() {
    this.phase = 'diplomacy'
    this.ensureDiplomacyTarget()
    this.overlayLayer.removeAll(true)
    this.drawBackdrop()
    this.overlayLayer.add(this.add.rectangle(42, 34, 1196, 690, 0x071017, 0.92).setOrigin(0).setStrokeStyle(4, 0xd4af37, 0.95))
    this.overlayLayer.add(this.add.text(82, 62, '外交交涉', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '42px',
      color: '#f8df9d',
      stroke: '#2a120c',
      strokeThickness: 4,
    }))
    this.overlayLayer.add(this.add.text(1010, 72, '同盟、侦察、离间、劝降会改变出征难度', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f4dfb3',
    }).setOrigin(0.5))
    this.drawDiplomacyStatus()
    this.drawDiplomacyActions()
    this.makeButton(540, 636, '返回总览', () => this.showCampaign(), this.overlayLayer, 180, 44)
    this.makeButton(740, 636, '敌城情报', () => this.showBriefing(), this.overlayLayer, 180, 44)
  }

  private drawDiplomacyStatus() {
    this.overlayLayer.add(this.add.rectangle(86, 140, 420, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(118, 170, '外交态势', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    const lines = [
      `出使城      ${this.selectedCity?.name ?? '-'}`,
      `对象        ${this.selectedDiplomacyFaction()?.name ?? '未定'}`,
      `政令        ${this.councilState.actions}`,
      `粮草        ${this.councilState.supplies}`,
      `士气        ${this.councilState.morale}`,
      `情报        ${this.councilState.intel}`,
      `敌势        ${this.campaignClock.enemyThreat}`,
      `盟约        ${this.councilState.alliance}${this.alliedFactionIds.size > 0 ? '方' : ''}`,
      `离间        ${this.sabotagedFactionIds.size > 0 ? '已成' : '未行'}`,
      `劝降        ${this.councilState.persuaded ? '已送' : '未送'}`,
    ]
    this.overlayLayer.add(this.add.text(122, 230, lines.join('\n'), {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#f8ecd0',
      lineSpacing: 12,
    }))
  }

  private drawDiplomacyActions() {
    this.overlayLayer.add(this.add.rectangle(548, 140, 646, 420, 0x101722, 0.96).setOrigin(0).setStrokeStyle(2, 0x8f6c2b, 0.9))
    this.overlayLayer.add(this.add.text(580, 170, '交涉命令', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '32px',
      color: '#f5d487',
    }))
    this.drawDiplomacyTargets()
    const actions: [string, string, () => void][] = [
      ['同盟', `成功率 ${this.diplomacyChance('alliance')}%，暂缓该势力攻刘`, () => this.confirmDiplomacyAction('同盟', this.selectedDiplomacyFaction()?.name ?? '邻接势力', `成功率 ${this.diplomacyChance('alliance')}%｜士气 +10｜敌势 -8`, () => this.resolveDiplomacy('alliance'))],
      ['计策', `离间为主，成功率 ${this.diplomacyChance('sabotage')}%`, () => this.showDiplomacyPlotMenu()],
      ['情报', `成功率 ${this.diplomacyChance('scout')}%，探明邻城守军`, () => this.confirmDiplomacyAction('情报', this.selectedTargetCity?.name ?? '邻境', `成功率 ${this.diplomacyChance('scout')}%｜情报 +32`, () => this.resolveDiplomacy('scout'))],
      ['借款', '金 +260，士气 -2，欠下人情', () => this.confirmDiplomacyAction('借款', this.selectedDiplomacyFaction()?.name ?? '邻接势力', '府库 +260｜士气 -2', () => this.borrowFunds())],
      ['还款', '金 -180，士气 +3，邦交缓和', () => this.confirmDiplomacyAction('还款', this.selectedDiplomacyFaction()?.name ?? '邻接势力', '府库 -180｜士气 +3｜敌势 -3', () => this.repayFunds())],
    ]
    actions.forEach(([label, desc, callback], index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = 670 + col * 250
      const y = 314 + row * 76
      this.makeButton(x, y, label, callback, this.overlayLayer, 136, 40)
      this.overlayLayer.add(this.add.text(x - 66, y + 30, desc, {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '15px',
        color: '#ead7b3',
        wordWrap: { width: 210 },
      }))
    })
  }

  private showDiplomacyPlotMenu() {
    this.showCommandPanel('计策', [
      ['离间', () => this.confirmDiplomacyAction('离间', this.selectedTargetCity?.name ?? '敌营', `成功率 ${this.diplomacyChance('sabotage')}%｜敌兵动摇｜敌势下降`, () => this.resolveDiplomacy('sabotage'))],
      ['暗杀', () => this.confirmDiplomacyAction('暗杀', this.selectedTargetCity?.name ?? '敌营', '扰乱守备，失败则敌势上升', () => this.resolveAssassination())],
      ['火计', () => this.confirmDiplomacyAction('火计', this.selectedTargetCity?.name ?? '敌城', '烧敌粮并削城防，失败则情报下降', () => this.resolveDiplomacyFire())],
      ['劝降', () => this.confirmDiplomacyAction('劝降', this.selectedTargetCity?.name ?? '敌营', `成功率 ${this.diplomacyChance('persuade')}%｜守军动摇｜情报 +10`, () => this.resolveDiplomacy('persuade'))],
    ])
  }

  private confirmDiplomacyAction(command: string, target: string, effect: string, onConfirm: () => void) {
    const city = this.selectedCity
    if (!city) return
    this.showCommandConfirm({
      category: '外交',
      command,
      actor: `${city.name}使者`,
      target,
      scope: `${city.name}邻接外交`,
      effect,
      onConfirm,
      onCancel: () => this.showDiplomacy(),
    })
  }

  private borrowFunds() {
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，无法遣使借款。')
      return
    }
    const city = this.selectedCity
    if (!city) return
    city.gold = Phaser.Math.Clamp(city.gold + 260, 0, 3000)
    this.councilState.morale = Math.max(0, this.councilState.morale - 2)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}向邻国借款`)
    this.syncSelectedCityState()
    this.showDiplomacyMessage('使者借得军资，府库增加，士气略降。')
  }

  private repayFunds() {
    if (this.councilState.actions <= 0) {
      this.showDiplomacyMessage('政令已用尽，无法遣使还款。')
      return
    }
    const city = this.selectedCity
    if (!city) return
    if (city.gold < 180) {
      this.showDiplomacyMessage('府库不足，无法还款。')
      return
    }
    city.gold -= 180
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 3, 0, 100)
    this.campaignClock.enemyThreat = Math.max(0, this.campaignClock.enemyThreat - 3)
    this.councilState.actions -= 1
    this.recordMonthlyAction(`${city.name}遣使还款`)
    this.syncSelectedCityState()
    this.showDiplomacyMessage('债契已清，邦交缓和，敌势略降。')
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

  private drawDiplomacyTargets() {
    const factions = this.availableDiplomacyFactions()
    this.overlayLayer.add(this.add.text(580, 214, '交涉对象', {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '20px',
      color: '#f8df9d',
    }))
    if (factions.length === 0) {
      this.overlayLayer.add(this.add.text(696, 214, '当前城池周边暂无可交涉势力。', {
        fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
        fontSize: '18px',
        color: '#ead7b3',
      }))
      return
    }
    factions.forEach((faction, index) => {
      const x = 666 + index * 132
      const selected = faction.id === this.selectedDiplomacyFactionId
      this.makeButton(x, 256, selected ? `${faction.ruler}✓` : faction.ruler, () => {
        this.selectedDiplomacyFactionId = faction.id
        const target = this.availableDeploymentTargets().find((city) => city.owner === faction.id)
        if (target) this.selectedTargetCityId = target.id
        this.showDiplomacy()
      }, this.overlayLayer, 116, 34)
    })
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
    const targetCity = this.availableDeploymentTargets().find((city) => city.owner === faction?.id) ?? this.selectedTargetCity
    if (!faction) return
    if (kind === 'alliance') {
      this.councilState.alliance += 1
      this.alliedFactionIds.add(faction.id)
      this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale + 10, 0, 100)
      this.campaignClock.enemyThreat = Phaser.Math.Clamp(this.campaignClock.enemyThreat - 8, 0, 100)
      this.recordMonthlyAction(`与${faction.ruler}同盟`)
      this.showDiplomacyMessage(`与${faction.ruler}暂结盟约，士气 +10，敌势 -8。`)
      return
    }
    if (kind === 'scout') {
      this.councilState.scouted = true
      this.councilState.intel = Phaser.Math.Clamp(this.councilState.intel + 32, 0, 100)
      if (targetCity) this.selectedTargetCityId = targetCity.id
      this.recordMonthlyAction(`侦察${targetCity?.name ?? faction.ruler}`)
      this.showDiplomacyMessage(`密探探得${targetCity?.name ?? faction.ruler}虚实，情报 +32。`)
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
    return Phaser.Math.Clamp(base + intelBonus + moraleBonus - threatPenalty - garrisonPenalty, 15, 92)
  }

  private showDiplomacyMessage(message: string) {
    this.showDiplomacy()
    this.overlayLayer.add(this.add.text(640, 590, message, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '22px',
      color: '#fff4cf',
      backgroundColor: '#3c2417',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5))
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
    this.logLines = [
      `战斗开始：${source?.name ?? '我城'}军向${target?.name ?? '敌境'}进发，遭遇守军拦截。`,
      `战前态势：补给 ${this.councilState.supplies}，士气 ${this.councilState.morale}，情报 ${this.councilState.intel}，敌势 ${this.campaignClock.enemyThreat}。`,
      '会战分支：选择武将后以下达移动、攻击、计略、待机、委任、撤退等战斗命令。',
    ]
    if (this.councilState.intel >= 40) this.logLines.push(`密探回报：${target?.name ?? '目标城'}守军布防已明，计略与夹击更有效。`)
    if (this.campaignClock.enemyThreat >= 55) this.logLines.push('敌势已盛，敌军攻击提高。')
    this.overlayLayer.removeAll(true)
    this.renderBattle()
  }

  private createBattleUnits() {
    const playerUnitIds = new Set(this.currentCityUnits().map((unit) => unit.id))
    const playerUnits = baseUnits
      .filter((unit) => unit.faction === 'player' && playerUnitIds.has(unit.id))
      .map((unit) => ({ ...unit, stats: { ...unit.stats }, position: { ...unit.position } }))
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

  private showContinueStub() {
    this.showTitleNotice('继续游戏', '存档系统尚未开放。当前版本请从“开始游戏”进入。')
  }

  private showSettingsOverlay() {
    this.showTitleNotice('环境设定', '当前可用设置：音乐随开始游戏自动播放。音量、文字速度和存档位将在机能菜单中继续补齐。')
  }

  private showTitleNotice(title: string, message: string) {
    const bg = this.add.rectangle(640, 420, 660, 220, 0x111821, 0.97).setStrokeStyle(2, 0xd4af37)
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
    const close = this.makeButton(640, 506, '关闭', () => {
      bg.destroy()
      heading.destroy()
      body.destroy()
      close.destroy()
    }, this.overlayLayer, 140, 40)
    this.overlayLayer.add([bg, heading, body])
  }

  private drawBattleBackground() {
    this.uiLayer.add(this.add.rectangle(0, 0, 1280, 760, 0x151a20).setOrigin(0))
    if (this.textures.exists('battlefield-bg')) {
      this.uiLayer.add(this.add.image(BOARD_X + MAP_W * TILE / 2, BOARD_Y + MAP_H * TILE / 2, 'battlefield-bg').setDisplaySize(MAP_W * TILE, MAP_H * TILE).setAlpha(0.48))
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
    const playerWidth = Math.max(12, 390 * (player.total / total))
    const enemyWidth = Math.max(12, 390 * (enemy.total / total))
    this.uiLayer.add(this.add.rectangle(330, 14, 430, 44, 0x101722, 0.88).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
    this.uiLayer.add(this.add.rectangle(350, 42, 390, 8, 0x1c1b18, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.rectangle(350, 42, playerWidth, 8, 0x45d483, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.text(350, 20, `我军 兵${player.total}/${player.max}  将${player.alive}  士气${this.councilState.morale}`, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '16px',
      color: '#f8ecd0',
    }))
    this.uiLayer.add(this.add.rectangle(778, 14, 430, 44, 0x101722, 0.88).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.55))
    this.uiLayer.add(this.add.rectangle(798, 42, 390, 8, 0x1c1b18, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.rectangle(798 + 390 - enemyWidth, 42, enemyWidth, 8, 0xf25f5c, 0.95).setOrigin(0))
    this.uiLayer.add(this.add.text(798, 20, `敌军 兵${enemy.total}/${enemy.max}  将${enemy.alive}  敌势${this.campaignClock.enemyThreat}`, {
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

  private resetCampaignState() {
    this.resetCouncilState()
    this.campaignCities = strategyCities.map((city) => ({ ...city, routes: [...city.routes] }))
    this.campaignOfficers = strategyOfficers.map((officer) => ({ ...officer }))
    this.selectedCityId = 'chengdu'
    this.focusedCityId = 'chengdu'
    this.selectedTargetCityId = 'hanzhong'
    this.selectedDiplomacyFactionId = 'neutral'
    this.alliedFactionIds = new Set<FactionId>()
    this.sabotagedFactionIds = new Set<FactionId>()
    this.monthlyActionLog = []
    this.marchArmy = undefined
    const scenario = this.scenarioConfig()
    const difficulty = this.difficultyConfig()
    this.cityState = {
      name: '成都',
      publicOrder: 62,
      treasury: 850,
      recruits: 7600,
      farms: 1,
      walls: 72,
    }
    this.campaignClock = {
      year: scenario.year,
      month: 1,
      mode: 'inspection',
      enemyThreat: difficulty.threat,
    }
    this.appointments = {
      governor: 'yun',
      vanguard: 'yun',
      strategist: 'xuan',
    }
    this.recruitedNeutralIds = new Set<string>()
    this.syncSelectedCityState()
    this.ensureLocalAppointments()
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
    return this.campaignOfficers.filter((officer) => officer.faction === 'liu' && officer.location === this.selectedCityId)
  }

  private currentCityUnits() {
    const localUnitIds = new Set(this.currentCityOfficers().map((officer) => unitIdForOfficerId(officer.id)).filter((id): id is string => id !== undefined))
    return baseUnits.filter((unit) => unit.faction === 'player' && localUnitIds.has(unit.id))
  }

  private officerForUnit(unitId: string) {
    const officerId = officerIdForUnitId(unitId)
    return this.campaignOfficers.find((officer) => officer.id === officerId)
  }

  private controlledNeighborCities() {
    const city = this.selectedCity
    if (!city) return []
    return city.routes
      .map((routeId) => this.campaignCities.find((item) => item.id === routeId))
      .filter((item): item is StrategyCity => item !== undefined && item.owner === 'liu')
  }

  private ensureLocalAppointments() {
    const units = this.currentCityUnits()
    if (units.length === 0) return
    for (const role of Object.keys(this.appointments) as (keyof typeof this.appointments)[]) {
      if (!units.some((unit) => unit.id === this.appointments[role])) {
        this.appointments[role] = units[0].id
      }
    }
    this.applyAppointmentEffects()
  }

  private availableDeploymentTargets() {
    const city = this.selectedCity
    if (!city) return []
    return city.routes
      .map((routeId) => this.campaignCities.find((item) => item.id === routeId))
      .filter((item): item is StrategyCity => item !== undefined && item.owner !== 'liu')
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
    const target = this.availableDeploymentTargets().find((city) => city.owner === this.selectedDiplomacyFactionId)
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
    for (const faction of strategyFactions.filter((item) => item.id !== 'liu' && item.id !== 'neutral')) {
      const cities = this.campaignCities.filter((city) => city.owner === faction.id)
      if (cities.length === 0) continue
      const strongest = cities.toSorted((a, b) => b.troops - a.troops)[0]
      const neighbors = strongest.routes
        .map((routeId) => this.campaignCities.find((city) => city.id === routeId))
        .filter((city): city is StrategyCity => city !== undefined)
    const target = neighbors.find((city) => city.owner !== faction.id)
    if (!target) {
      strongest.troops = Math.min(30000, strongest.troops + 420)
      reports.push(`${faction.name}在${strongest.name}练兵。`)
      continue
    }
      if (target.owner === 'liu' && this.alliedFactionIds.has(faction.id)) {
        strongest.troops = Math.min(30000, strongest.troops + 260)
        reports.push(`${faction.name}顾及盟约，在${strongest.name}暂缓进犯。`)
        continue
      }
      if (strongest.troops > target.troops * 1.45 && strongest.troops > 6500) {
        const attackerLoss = Math.floor(strongest.troops * 0.22)
        const defenderRemain = Math.floor(target.troops * 0.35)
        strongest.troops -= attackerLoss
        target.owner = faction.id
        target.troops = Math.max(1200, defenderRemain)
        reports.push(`${faction.name}攻取${target.name}。`)
      } else {
        strongest.troops = Math.min(30000, strongest.troops + 520)
        strongest.food = Math.min(5000, strongest.food + 180)
        reports.push(`${faction.name}屯兵${strongest.name}，窥伺${target.name}。`)
      }
    }
    return reports
  }

  private resolveMonthlyEvent() {
    const roll = Phaser.Math.Between(1, 100)
    const city = this.selectedCity
    if (roll <= 25 && city) {
      const gain = 320
      city.food = Math.min(5000, city.food + gain)
      this.syncSelectedCityState()
      return `${city.name}丰收，粮 +${gain}。`
    }
    if (roll <= 45 && city) {
      const loss = Math.min(city.gold, 120)
      city.gold -= loss
      this.cityState.publicOrder = Phaser.Math.Clamp(this.cityState.publicOrder - 6, 0, 100)
      this.syncSelectedCityState()
      return `${city.name}盗贼滋扰，金 -${loss}，民心 -6。`
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
      .filter((faction) => faction.id !== 'liu' && faction.id !== 'neutral')
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
    this.uiLayer.add(this.add.rectangle(UI_X - 18, 86, 420, 498, 0x111820, 0.92).setOrigin(0).setStrokeStyle(2, 0x9f7e3a, 0.8))
    this.uiLayer.add(this.add.rectangle(UI_X - 2, 386, 388, 188, 0x21160f, 0.86).setOrigin(0).setStrokeStyle(1, 0xd4af37, 0.6))
    this.uiLayer.add(this.add.text(UI_X + 18, 400, '战斗命令', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '24px',
      color: '#f8df9d',
    }))
    this.uiLayer.add(this.add.rectangle(24, 612, 1190, 114, 0x111820, 0.92).setOrigin(0).setStrokeStyle(2, 0x9f7e3a, 0.8))
    this.uiLayer.add([this.statusText, this.infoText, this.logText])
    this.makeButton(1110, 24, '退却', () => this.retreatBattle(), this.uiLayer, 132, 38)
    this.makeButton(960, 24, this.siegeState ? '攻城' : '版图', () => {
      if (this.siegeState) this.showSiege('会战暂停，攻城态势未结算。')
      else this.showCampaign()
    }, this.uiLayer, 132, 38)
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
      if (this.currentFaction === 'player' && selected.faction === 'player' && !selected.hasActed && this.phase === 'playerSelect') {
        this.addActionButton('1 移动', 438, () => this.enterMoveMode(selected))
        this.addActionButton('2 攻击', 480, () => this.enterAttackMode(selected, undefined))
        const skill = skills[selected.skills[0]]
        this.addActionButton(skill.type === 'heal' ? '3 救护' : '3 计略', 522, () => this.enterAttackMode(selected, skill.id))
        this.addActionButton('4 待机', 564, () => this.finishUnit(selected))
        this.addActionButton('5 委任', 438, () => this.delegateUnit(selected), UI_X + 298)
        this.addActionButton('6 撤退', 480, () => this.retreatBattle(), UI_X + 298)
      }
    } else {
      const roster = this.living('player').map((unit, index) => `${index + 1}. ${unit.name} 兵${unit.stats.hp}/${unit.stats.maxHp}`).join('\n')
      this.infoText.setText(`军势态势：${this.battlePosture()}\n目标：击破守军主将并夺取${this.selectedTargetCity?.name ?? '目标城'}。\n数字键可选武将。\n\n${roster}`)
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

  private makeButton(x: number, y: number, label: string, callback: () => void, layer: Phaser.GameObjects.Container, width = 220, height = 48) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
      fontSize: '21px',
      color: '#21140f',
      align: 'center',
      backgroundColor: '#f5d487',
      padding: { x: 18, y: 9 },
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
    this.councilState.morale = Phaser.Math.Clamp(this.councilState.morale - 8, 0, 100)
    this.councilState.supplies = Math.max(0, this.councilState.supplies - 8)
    this.marchArmy = undefined
    this.campaignClock.mode = 'inspection'
    this.recordMonthlyAction(`${this.selectedCity?.name ?? '我军'}撤退`)
    this.showResult(false, '我军鸣金收兵，士气 -8，补给 -8。')
  }

  private afterPlayerAction() {
    this.selectedUnitId = undefined
    this.highlighted = []
    if (this.living('player').every((unit) => unit.hasActed)) {
      this.startEnemyTurn()
    } else {
      this.phase = 'playerSelect'
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
    this.addLog(`第 ${this.turn} 阵开始，${this.battlePosture()}。`)
    this.renderBattle()
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
    const copy = overrideCopy ?? (inSiege
      ? `会战结果已回写攻城态势。\n残兵：我军 ${playerForce.total}｜敌军 ${enemyForce.total}\n${battleReport}\n阵数：${this.turn}  击破：${this.roundKills}`
      : victory
      ? `敌军主将已败，${target?.name ?? '目标城'}归入刘备军。\n残兵：我军 ${playerForce.total}｜敌军 ${enemyForce.total}\n${battleReport}\n阵数：${this.turn}  击破：${this.roundKills}`
      : `我方军势受挫，粮道失守。\n残兵：我军 ${playerForce.total}｜敌军 ${enemyForce.total}\n${battleReport}\n阵数：${this.turn}`)
    this.overlayLayer.add(this.add.rectangle(640, 382, 620, 320, 0x101722, 0.96).setStrokeStyle(3, victory ? 0xf8df9d : 0xd65f5f))
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
      this.makeButton(540, 500, '返回攻城', () => this.showSiege(), this.overlayLayer, 170, 42)
      this.makeButton(740, 500, '撤退', () => this.resolveSiegeAction('retreat'), this.overlayLayer, 150, 42)
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
    const attackerLoss = Math.floor(this.siegeState.attackerTroops * (victory ? 0.08 + (1 - playerRemainRatio) * 0.14 : 0.18 + (1 - playerRemainRatio) * 0.2))
    const defenderLoss = Math.floor(this.siegeState.defenderTroops * (victory ? 0.18 + (1 - enemyRemainRatio) * 0.22 : 0.08 + (1 - enemyRemainRatio) * 0.12))
    const wallLoss = victory ? Math.max(4, this.roundKills * 3) : Math.max(1, this.roundKills)
    this.siegeState.attackerTroops = Math.max(400, this.siegeState.attackerTroops - attackerLoss)
    this.siegeState.defenderTroops = Math.max(0, this.siegeState.defenderTroops - defenderLoss)
    this.siegeState.wallHp = Math.max(0, this.siegeState.wallHp - wallLoss)
    this.marchArmy.troops = this.siegeState.attackerTroops
    this.marchArmy.food = Math.max(0, this.marchArmy.food - 5)
    this.marchArmy.morale = Phaser.Math.Clamp(this.marchArmy.morale + (victory ? 4 : -6), 0, 100)
    return `我军损兵 ${attackerLoss}｜守军损兵 ${defenderLoss}｜城防 -${wallLoss}`
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
      target.owner = 'liu'
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

function unitIdForOfficerId(officerId: string) {
  return {
    liu_bei: 'yun',
    guan_yu: 'lan',
    zhuge_liang: 'xuan',
    zhang_fei: 'qing',
  }[officerId]
}

function officerIdForUnitId(unitId: string) {
  return {
    yun: 'liu_bei',
    lan: 'guan_yu',
    xuan: 'zhuge_liang',
    qing: 'zhang_fei',
  }[unitId]
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

function heroTroops(unit: Unit, appointments: { governor: string; vanguard: string; strategist: string }) {
  const base = unit.stats.maxHp * 10
  const roleBonus = (appointments.vanguard === unit.id ? 80 : 0) + (appointments.governor === unit.id ? 40 : 0) + (appointments.strategist === unit.id ? 30 : 0)
  return base + roleBonus
}

function roleLabels(unitId: string, appointments: { governor: string; vanguard: string; strategist: string }) {
  const labels = []
  if (appointments.governor === unitId) labels.push('太守')
  if (appointments.vanguard === unitId) labels.push('先锋')
  if (appointments.strategist === unitId) labels.push('军师')
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

function marchStatusName(status: MarchArmy['status']) {
  return {
    ready: '待命',
    marching: '行军',
    besieging: '攻城',
    retreating: '撤退',
    routed: '溃散',
  }[status]
}

function appointmentRoleName(role: 'governor' | 'vanguard' | 'strategist') {
  return {
    governor: '太守',
    vanguard: '先锋',
    strategist: '军师',
  }[role]
}

function duelActionName(action: 'attack' | 'guard' | 'focus') {
  return {
    attack: '攻击',
    guard: '防守',
    focus: '蓄势',
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
