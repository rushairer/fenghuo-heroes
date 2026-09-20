import { COLORS, SERIF } from '../game/constants.js'
import { mdButton } from '../game/input.js'

export class PlayerCountScene {
  constructor(app) {
    this.app = app
    this.index = Math.max(0, Math.min(2, (app.playerCount ?? 1) - 1))
  }

  update(_dt, input) {
    const key = input.consume()
    if (!key) return
    const b = mdButton(key)
    if (b === 'HD') return this.app.toggleHd()
    if (b === 'UP') {
      this.index = (this.index + 2) % 3
      this.app.audio.move()
    }
    if (b === 'DOWN') {
      this.index = (this.index + 1) % 3
      this.app.audio.move()
    }
    if (b === 'B') {
      this.app.audio.cancel()
      this.app.go('title')
    }
    if (b === 'C' || b === 'START') {
      this.app.playerCount = this.index + 1
      this.app.audio.confirm()
      this.app.go('setup')
    }
  }

  draw() {
    const r = this.app.r
    const frame = this.app.assets?.getNineSlice('ui.frames.small',{sourceSlice:48,destEdge:7})
    const pointer = this.app.assets?.getForDisplay('ui.cursors.pointer',15,15)
    r.clear('#000')
    r.ornateFrame(23, 24, 274, 176, frame)
    r.text('參加人數', 160, 48, 15, '#f3efe4', 'center', 'top', SERIF, '700')
    r.line(49, 72, 271, 72, COLORS.red, 2)
    ;['一 人', '二 人', '三 人'].forEach((label, i) => {
      const y = 92 + i * 26
      const selected = i === this.index
      if (selected && pointer) r.drawImageCentered(pointer, 108, y + 7, 15, 15)
      r.text(`${selected && !pointer ? '▶ ' : ''}${label}`, 160, y, 13, selected ? COLORS.cyan : '#777', 'center')
    })
    r.text('方向鍵選擇　C 決定　B 返回', 160, 177, 7, '#a79a7f', 'center')
    r.scanlines(.02)
  }
}
