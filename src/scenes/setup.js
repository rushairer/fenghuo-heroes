import { COLORS, SERIF } from '../game/constants.js'
import { DIFFICULTIES, SCENARIOS } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { runtimeScenarioSupported, scenarioRulerOptions } from '../game/scenario-target.js'

const SPEEDS = [['slow', '慢'], ['normal', '普通'], ['fast', '快']]

export class SetupScene {
  constructor(app) {
    this.app = app
    this.focus = 0
    this.scenario = 0
    this.difficulty = 0
    this.animation = 0
    this.speed = 1
    this.rulerCursor = 0
    this.rulers = new Set()
    this.message = `請選擇 ${app.playerCount ?? 1} 位君主`
  }

  currentScenario() { return SCENARIOS[this.scenario] }
  rulerOptions() { return scenarioRulerOptions(this.currentScenario()?.year) }

  update(_dt, input) {
    const key = input.consume()
    if (!key) return
    const b = mdButton(key)
    if (b === 'HD') return this.app.toggleHd()

    if (this.focus < 4) {
      if (b === 'UP') { this.changeTop(-1); this.app.audio.move() }
      if (b === 'DOWN') { this.changeTop(1); this.app.audio.move() }
      if (b === 'LEFT') { this.focus = (this.focus + 3) % 4; this.app.audio.move() }
      if (b === 'RIGHT') { this.focus = (this.focus + 1) % 4; this.app.audio.move() }
      if (b === 'C') { this.focus = this.focus === 3 ? 4 : this.focus + 1; this.app.audio.confirm() }
      if (b === 'B') {
        if (this.focus === 0) this.app.go('players')
        else this.focus--
        this.app.audio.cancel()
      }
      return
    }

    const count = this.rulerOptions().length
    if (b === 'LEFT' && count) { this.rulerCursor = (this.rulerCursor - 1 + count) % count; this.app.audio.move() }
    if (b === 'RIGHT' && count) { this.rulerCursor = (this.rulerCursor + 1) % count; this.app.audio.move() }
    if (b === 'UP') { this.focus = 3; this.app.audio.move() }
    if (b === 'B') { this.focus = 3; this.app.audio.cancel() }
    if (b === 'C' || b === 'A') this.toggleRuler()
    if (b === 'START') this.start()
  }

  changeTop(delta) {
    if (this.focus === 0) {
      this.scenario = (this.scenario + delta + SCENARIOS.length) % SCENARIOS.length
      this.rulers.clear()
      this.rulerCursor = 0
      const scenario = this.currentScenario()
      this.message = runtimeScenarioSupported(scenario.year)
        ? `請選擇 ${this.app.playerCount ?? 1} 位君主`
        : `${scenario.year}年初始勢力／城池資料待實機校準`
    }
    if (this.focus === 1) this.difficulty = (this.difficulty + delta + DIFFICULTIES.length) % DIFFICULTIES.length
    if (this.focus === 2) this.animation = (this.animation + delta + 2) % 2
    if (this.focus === 3) this.speed = (this.speed + delta + 3) % 3
  }

  toggleRuler() {
    const options = this.rulerOptions()
    if (!options.length) return
    const required = this.app.playerCount ?? 1
    if (this.rulers.has(this.rulerCursor)) this.rulers.delete(this.rulerCursor)
    else if (this.rulers.size < required) this.rulers.add(this.rulerCursor)
    else {
      this.message = `本局為 ${required} 人遊戲，請先取消一位君主`
      this.app.audio.alert()
      return
    }
    this.message = `已選 ${this.rulers.size}/${required} 位君主`
    this.app.audio.confirm()
  }

  start() {
    const scenario = this.currentScenario()
    if (!runtimeScenarioSupported(scenario.year)) {
      this.message = `${scenario.year}年劇本尚未校準初始城池／勢力，暫不偽造開局`
      this.app.audio.alert()
      return
    }
    const required = this.app.playerCount ?? 1
    if (this.rulers.size !== required) {
      this.message = `請選滿 ${required} 位君主後再開始`
      this.app.audio.alert()
      return
    }
    const options = this.rulerOptions()
    const selected = [...this.rulers]
      .sort((a, b) => a - b)
      .map((i) => options[i]?.factionId)
    if (selected.some((id) => !id)) {
      this.message = '目前劇本的勢力 ID 尚未校準'
      this.app.audio.alert()
      return
    }
    this.app.store.newGame({
      scenarioYear: scenario.year,
      difficulty: DIFFICULTIES[this.difficulty].id,
      animation: this.animation === 0,
      textSpeed: SPEEDS[this.speed][0],
      humanFactions: selected,
    })
    this.app.audio.confirm()
    this.app.go('strategy')
  }

  rulerXs(count) {
    if (count <= 1) return [160]
    if (count === 3) return [72, 160, 248]
    const left = 29
    const right = 286
    const step = (right - left) / (count - 1)
    return Array.from({ length:count }, (_, i) => Math.round(left + step * i))
  }

  draw() {
    const r = this.app.r
    r.clear('#000')
    r.ornateFrame(7, 7, 306, 210)
    r.text('請 設 定 初 期 條 件', 160, 15, 15, '#f3efe4', 'center', 'top', SERIF, '600')
    r.line(10, 35, 310, 35, COLORS.red, 2)

    const xs = [46, 118, 190, 261]
    const titles = ['劇　本', '難易度', '動畫', '表　示']
    titles.forEach((title, i) => {
      r.line(xs[i] - 36, 36, xs[i] - 36, 140, COLORS.red, 2)
      r.text(title, xs[i], 46, 10, this.focus === i ? '#f7f0d5' : '#9d9d9d', 'center')
    })
    r.line(307, 36, 307, 140, COLORS.red, 2)

    SCENARIOS.forEach((scenario, i) => r.text(`${scenario.year}年`, 46, 69 + i * 28, 13, i === this.scenario ? COLORS.cyan : '#777', 'center'))
    DIFFICULTIES.forEach((difficulty, i) => r.text(difficulty.label, 118, 69 + i * 28, 12, i === this.difficulty ? COLORS.cyan : '#555', 'center'))
    ;['看', '不看'].forEach((value, i) => r.text(value, 190, 78 + i * 35, 12, i === this.animation ? COLORS.cyan : '#555', 'center'))
    SPEEDS.forEach((value, i) => r.text(value[1], 261, 67 + i * 27, 11, i === this.speed ? COLORS.cyan : '#555', 'center'))
    if (this.focus < 4) r.selector(xs[this.focus] - 33, 40, this.focus === 3 ? 82 : 66, 96, true)

    r.line(9, 141, 311, 141, COLORS.red, 2)
    const scenario = this.currentScenario()
    const options = this.rulerOptions()
    r.text(`君　主　（${this.app.playerCount ?? 1}人）`, 160, 145, 11, this.focus === 4 ? '#f3efe4' : '#777', 'center')
    r.text(`${scenario.name} · ${options.length}位`, 160, 158, 5.5, runtimeScenarioSupported(scenario.year) ? '#958a73' : '#b7795e', 'center')
    const rulerXs = this.rulerXs(options.length)
    options.forEach((option, i) => {
      const selected = this.rulers.has(i)
      const focused = this.focus === 4 && this.rulerCursor === i
      r.text(option.ruler, rulerXs[i], 174, 9.5, selected ? COLORS.cyan : '#666', 'center')
      if (focused) r.selector(rulerXs[i] - 17, 169, 34, 18, true)
    })
    r.text(this.message, 160, 197, 6, runtimeScenarioSupported(scenario.year) ? '#a99d82' : '#d58a6b', 'center')
    r.text('方向鍵選擇 · C 決定 · B 返回 · START 開始', 160, 207, 5.5, '#756d5c', 'center')
    r.scanlines(.02)
  }
}
