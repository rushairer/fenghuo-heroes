import { COLORS, SERIF } from '../game/constants.js'
import { mdButton } from '../game/input.js'

export class TitleScene {
  constructor(app) {
    this.app = app
    this.hasSave = app.store.load()
    this.selection = 0
    this.blink = 0
    this.phase = 'splash'
  }

  update(dt, input) {
    this.blink = (this.blink + dt) % 1200
    const key = input.consume()
    if (!key) return
    const b = mdButton(key)
    if (b === 'HD') return this.app.toggleHd()

    if (this.phase === 'splash') {
      if (b === 'START' || b === 'C') {
        this.phase = 'menu'
        this.app.audio.confirm()
      }
      return
    }

    const count = this.hasSave ? 2 : 1
    if (b === 'UP') {
      this.selection = (this.selection - 1 + count) % count
      this.app.audio.move()
    }
    if (b === 'DOWN') {
      this.selection = (this.selection + 1) % count
      this.app.audio.move()
    }
    if (b === 'B') {
      this.phase = 'splash'
      this.app.audio.cancel()
    }
    if (b === 'START' || b === 'C') {
      this.app.audio.confirm()
      if (this.selection === 1 && this.hasSave) this.app.go('strategy')
      else this.app.go('players')
    }
  }

  draw() {
    const r = this.app.r
    const c = r.ctx
    r.clear('#a85b62')
    const grad = c.createLinearGradient(0, 0, 0, r.H * r.S)
    grad.addColorStop(0, '#de8087')
    grad.addColorStop(.5, '#bd686e')
    grad.addColorStop(1, '#7c3439')
    c.fillStyle = grad
    c.fillRect(0, 0, r.W * r.S, r.H * r.S)

    r.portraitBust(42, 151, 1.58, '#d8a078', false, 1)
    r.portraitBust(104, 119, 1.34, '#cb8e66', false, 2)
    r.portraitBust(190, 89, 1.23, '#bd7e59', true, 3)
    r.portraitBust(260, 88, 1.34, '#c58b64', true, 4)
    r.portraitBust(232, 166, 1.68, '#dda47b', true, 0)
    r.ornateFrame(3, 3, 314, 218)

    r.shadowText('三國志列傳', 160, 22, 14, '#fff0c9', 'center', 'middle', SERIF, '800')
    r.shadowText('亂 世 群 英', 160, 48, 24, '#ffd15a', 'center', 'middle', SERIF, '900')

    if (this.phase === 'splash') {
      if (this.blink < 820) r.text('PUSH START BUTTON', 160, 202, 7, '#fff0c9', 'center')
    } else {
      r.panel(104, 166, 112, this.hasSave ? 39 : 25, '#050505', '#6f390d')
      const opts = this.hasSave ? ['START', 'CONTINUE'] : ['START']
      opts.forEach((v, i) => r.text(`${i === this.selection ? '▶' : '　'}${v}`, 160, 172 + i * 14, 9, i === this.selection ? COLORS.cyan : '#eee2c2', 'center'))
    }
    r.scanlines(.02)
  }
}
