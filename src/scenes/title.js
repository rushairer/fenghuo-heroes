import { COLORS, H, W } from '../game/constants.js'

export class TitleScene {
  constructor(app) {
    this.app = app
    this.selection = 0
    this.hasSave = app.store.load()
  }

  update(_dt, input) {
    const key = input.consume()
    if (!key) return
    const count = this.hasSave ? 2 : 1
    if (key === 'ArrowUp') this.selection = (this.selection - 1 + count) % count
    if (key === 'ArrowDown') this.selection = (this.selection + 1) % count
    if (key === 'z' || key === 'Z' || key === 'Enter') {
      if (this.selection === 1 && this.hasSave) this.app.go('strategy')
      else this.app.go('scenario')
    }
  }

  draw() {
    const r = this.app.r
    const c = r.ctx
    r.clear('#111015')
    c.fillStyle = '#1b2130'
    c.beginPath(); c.moveTo(24,55); c.lineTo(94,18); c.lineTo(126,68); c.fill()
    c.beginPath(); c.moveTo(112,66); c.lineTo(180,23); c.lineTo(220,75); c.fill()
    c.beginPath(); c.moveTo(194,70); c.lineTo(284,35); c.lineTo(306,88); c.fill()
    c.fillStyle = '#242018'
    c.beginPath(); c.moveTo(8,126); c.lineTo(86,70); c.lineTo(135,131); c.fill()
    c.beginPath(); c.moveTo(128,126); c.lineTo(206,72); c.lineTo(257,135); c.fill()
    c.globalAlpha = 0.25; c.strokeStyle = '#6f643c'
    for (let x = 8; x < W; x += 26) { c.beginPath(); c.moveTo(x,8); c.lineTo(x - 30,125); c.stroke() }
    for (let y = 18; y < 126; y += 20) { c.beginPath(); c.moveTo(0,y); c.lineTo(W,y + 5); c.stroke() }
    c.globalAlpha = 1
    r.shadowText('三 国 志 列 传', W / 2, 52, 18, '#d5c08a', 'center', 'middle')
    r.shadowText('乱 世 群 英', W / 2, 84, 31, '#e6cb6a', 'center', 'middle')
    r.text('CLEAN-ROOM WEB REPLICA', W / 2, 108, 7, '#8f856b', 'center', 'middle')
    r.panel(92, 132, 136, 55, COLORS.ink, 0.9)
    const options = this.hasSave ? ['开始游戏', '继续游戏'] : ['开始游戏']
    options.forEach((label, index) => r.text(`${index === this.selection ? '▶' : ' '} ${label}`, W / 2, 143 + index * 18, 11, index === this.selection ? '#ffe08a' : '#d7caa6', 'center'))
    r.text('方向键选择  Z / Enter 确定', W / 2, 201, 7, '#776f5d', 'center', 'middle')
    r.scanlines()
  }
}
