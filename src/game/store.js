import { CITIES, CITY_BY_ID } from './data.js'

const SAVE_KEY = 'fenghuo-heroes.cleanroom.v1'

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

function makeCities() {
  return Object.fromEntries(CITIES.map((city) => [city.id, {
    id: city.id,
    owner: city.owner,
    gold: city.gold,
    food: city.food,
    troops: city.troops,
    development: 35,
    morale: 60,
    defense: 40
  }]))
}

export class GameStore {
  constructor(storage = null) {
    this.storage = storage
    this.state = null
    this.pendingConflict = null
  }

  newGame(humanFaction, difficulty = 'normal') {
    const firstCity = CITIES.find((city) => city.owner === humanFaction)?.id ?? 'xuchang'
    this.state = {
      scenarioId: 'qunxiong-189',
      difficulty,
      year: 189,
      month: 1,
      humanFaction,
      activeCity: firstCity,
      cities: makeCities(),
      log: ['初平元年，群雄并起。', '单数月：视察情况。双数月：行军。']
    }
    this.pendingConflict = null
    this.save()
    return this.state
  }

  get mode() {
    this.assertState()
    return this.state.month % 2 === 1 ? 'inspection' : 'march'
  }

  hasGame() { return Boolean(this.state) }

  assertState() {
    if (!this.state) throw new Error('Game not initialized')
  }

  addLog(message) {
    this.assertState()
    this.state.log.unshift(message)
    this.state.log = this.state.log.slice(0, 8)
  }

  setActiveCity(cityId) {
    this.assertState()
    this.state.activeCity = cityId
  }

  executeInspection(command, cityId) {
    this.assertState()
    const city = this.state.cities[cityId]
    if (!city || city.owner !== this.state.humanFaction) return '只能对本势力城池执行视察指令。'
    let result = ''
    switch (command) {
      case 'develop':
        if (city.gold < 80) return '金不足，无法开发。'
        city.gold -= 80; city.development = clamp(city.development + 6, 0, 100); city.food += 90
        result = `${CITY_BY_ID[cityId].name}完成开发，生产力提高。`; break
      case 'transfer': result = '调动需要选择目标城；交互等待逐帧校准。'; break
      case 'intel': result = `情报：兵${city.troops} 金${city.gold} 粮${city.food} 民心${city.morale}。`; break
      case 'welfare':
        if (city.gold < 60) return '金不足，无法福利。'
        city.gold -= 60; city.morale = clamp(city.morale + 8, 0, 100)
        result = `${CITY_BY_ID[cityId].name}施行福利，民心上升。`; break
      case 'appoint': result = '任命将在武将数据校准后接入。'; break
      case 'tax': city.gold += 110; city.morale = clamp(city.morale - 7, 0, 100); result = '税收增加，民心下降。'; break
      case 'educate':
        if (city.gold < 70) return '金不足，无法教育。'
        city.gold -= 70; city.morale = clamp(city.morale + 4, 0, 100); city.development = clamp(city.development + 3, 0, 100)
        result = `${CITY_BY_ID[cityId].name}推行教育。`; break
      case 'transport': result = '运输将在补给规则校准后接入。'; break
      case 'ally': result = '同盟状态机已预留，条件等待实机校准。'; break
      case 'alienate':
        if (city.gold < 100) return '金不足，无法离间。'
        city.gold -= 100; result = '已派出离间使者。'; break
      case 'assassinate':
        if (city.gold < 160) return '金不足，无法暗杀。'
        city.gold -= 160; result = '已派出刺客。'; break
      case 'fire':
        if (city.gold < 120) return '金不足，无法火计。'
        city.gold -= 120; result = '火计准备完成。'; break
      case 'borrow': city.gold += 250; result = '借款到账；利息等待实机校准。'; break
      case 'repay':
        if (city.gold < 200) return '金不足，无法还款。'
        city.gold -= 200; result = '偿还部分借款。'; break
      case 'recruit': {
        const recruits = Math.min(1200, Math.floor(city.food * 0.6))
        if (recruits < 200) return '粮不足，无法征兵。'
        city.food -= Math.floor(recruits * 0.45); city.troops += recruits; city.morale = clamp(city.morale - 2, 0, 100)
        result = `${CITY_BY_ID[cityId].name}征兵${recruits}。`; break
      }
      case 'weapons':
        if (city.gold < 120) return '金不足，无法购置武器。'
        city.gold -= 120; city.troops += 250; result = '购置武器，战备提高。'; break
      case 'talent': result = '人才搜索将在武将表完成后接入。'; break
      case 'defense':
        if (city.gold < 90) return '金不足，无法加强防卫。'
        city.gold -= 90; city.defense = clamp(city.defense + 8, 0, 100); result = '城防提高。'; break
      case 'train':
        if (city.food < 100) return '粮不足，无法训练。'
        city.food -= 100; city.morale = clamp(city.morale + 5, 0, 100); result = '完成训练，士气提高。'; break
      default: result = '该指令尚未实现。'
    }
    this.addLog(result)
    this.save()
    return result
  }

  planMarch(from, target) {
    this.assertState()
    if (this.mode !== 'march') throw new Error('只有双数月可以行军。')
    const sourceDef = CITY_BY_ID[from]
    if (!sourceDef?.neighbors.includes(target)) throw new Error('目标不在相邻路线。')
    const source = this.state.cities[from]
    const destination = this.state.cities[target]
    if (source.owner !== this.state.humanFaction) throw new Error('必须从本势力城池出发。')
    const troops = Math.min(3000, Math.max(1000, Math.floor(source.troops * 0.35)))
    if (source.troops - troops < 1000) { this.addLog('守军不足，无法出征。'); return null }
    source.troops -= troops
    if (destination.owner === source.owner) {
      destination.troops += troops
      this.addLog(`${CITY_BY_ID[from].name}向${CITY_BY_ID[target].name}调动兵力${troops}。`)
      this.advanceMonth()
      return null
    }
    this.pendingConflict = { from, target, attacker: source.owner, defender: destination.owner, attackerTroops: troops, defenderTroops: destination.troops }
    this.addLog(`${CITY_BY_ID[from].name}军逼近${CITY_BY_ID[target].name}。`)
    this.save()
    return this.pendingConflict
  }

  resolveConflict(attackerWon) {
    this.assertState()
    const conflict = this.pendingConflict
    if (!conflict) return
    const source = this.state.cities[conflict.from]
    const target = this.state.cities[conflict.target]
    if (attackerWon) {
      target.owner = conflict.attacker
      target.troops = Math.max(800, Math.floor(conflict.attackerTroops * 0.7))
      target.morale = 40
      this.addLog(`${CITY_BY_ID[conflict.target].name}被攻占。`)
    } else {
      source.troops += Math.max(400, Math.floor(conflict.attackerTroops * 0.3))
      target.troops = Math.max(500, Math.floor(target.troops * 0.82))
      this.addLog(`攻打${CITY_BY_ID[conflict.target].name}失败。`)
    }
    this.pendingConflict = null
    this.advanceMonth()
  }

  advanceMonth() {
    this.assertState()
    this.state.month += 1
    if (this.state.month > 12) { this.state.month = 1; this.state.year += 1 }
    this.addLog(`${this.state.year}年${this.state.month}月：${this.mode === 'inspection' ? '视察情况' : '行军'}。`)
    this.save()
  }

  save() {
    if (!this.state || !this.storage?.setItem) return
    this.storage.setItem(SAVE_KEY, JSON.stringify(this.state))
  }

  load() {
    if (!this.storage?.getItem) return false
    const raw = this.storage.getItem(SAVE_KEY)
    if (!raw) return false
    try {
      this.state = JSON.parse(raw)
      this.pendingConflict = null
      return Boolean(this.state?.cities && this.state?.humanFaction)
    } catch {
      this.storage.removeItem?.(SAVE_KEY)
      return false
    }
  }

  clearSave() {
    this.state = null
    this.pendingConflict = null
    this.storage?.removeItem?.(SAVE_KEY)
  }
}
