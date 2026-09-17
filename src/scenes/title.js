import { COLORS } from '../game/constants.js'
import { mdButton } from '../game/input.js'
import { drawTitleComposition } from '../game/title-art.js'

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
    drawTitleComposition(r)

    // Observed original captures devote the title screen to the five overlapping
    // portraits. Do not cover them with the large invented two-line logo that
    // the old web prototype used.
    if (this.phase === 'splash') {
      if (this.blink < 820) {
        r.fillRect(87, 197, 132, 17, 'rgba(32,12,14,.68)')
        r.text('PUSH START BUTTON', 153, 202, 7, '#fff0c9', 'center')
      }
    } else {
      const height = this.hasSave ? 39 : 25
      r.panel(103, 171, 111, height, 'rgba(8,5,5,.92)', '#b47722')
      const opts = this.hasSave ? ['START', 'CONTINUE'] : ['START']
      opts.forEach((value, index) => {
        r.text(`${index === this.selection ? '▶' : '　'}${value}`, 158, 177 + index * 14, 8.5, index === this.selection ? COLORS.cyan : '#eee2c2', 'center')
      })
    }

    r.scanlines(.016)
  }
}
