import { COLORS, H, W } from '../game/constants.js'
import { FACTIONS } from '../game/data.js'

export class FactionScene {
  constructor(app, data = {}) { this.app = app; this.selection = 0; this.difficulty = data.difficulty ?? 'normal' }
  update(_dt, input) {
    const key = input.consume(); if (!key) return
    if (key === 'ArrowUp') this.selection = (this.selection - 1 + FACTIONS.length) % FACTIONS.length
    if (key === 'ArrowDown') this.selection = (this.selection + 1) % FACTIONS.length
    if (key === 'x' || key === 'X' || key === 'Escape') this.app.go('scenario')
    if (key === 'z' || key === 'Z' || key === 'Enter') { const faction = FACTIONS[this.selection]; this.app.store.newGame(faction.id, this.difficulty); this.app.go('strategy') }
  }
  draw() {
    const r = this.app.r
    r.clear(COLORS.black); r.shadowText('君 主 选 择', 14, 14, 14, '#e6cb6a'); r.text(`难度:${this.difficulty}`, 306, 18, 7, '#776f5d', 'right'); r.panel(20, 42, 280, 142)
    FACTIONS.forEach((faction, index) => { const y = 54 + index * 20; r.ctx.fillStyle = faction.color; r.ctx.fillRect(30, y + 2, 8, 8); r.text(`${index === this.selection ? '▶' : ' '} ${faction.ruler}   ${faction.label}`, 49, y, 10, index === this.selection ? '#ffe08a' : faction.color) })
    r.text('↑ ↓ 选择   Z / Enter 确定   X 返回', W / 2, H - 20, 7, '#756e60', 'center', 'middle'); r.scanlines()
  }
}
