import { COLORS } from '../game/constants.js'
import { mdButton } from '../game/input.js'
import { drawTitleComposition } from '../game/title-art.js'
import { drawPromptPlate } from '../game/ui-art.js'

export class TitleScene {
  constructor(app) {
    this.app = app
    this.hasSave = app.store.load()
    this.selection = 0
    this.blink = 0
    this.phase = 'splash'
    this.overwriteChoice = 1
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

    if (this.phase === 'overwrite-confirm') {
      if (b === 'B') {
        this.phase = 'menu'
        this.app.audio.cancel()
        return
      }
      if (b === 'UP' || b === 'DOWN' || b === 'LEFT' || b === 'RIGHT') {
        this.overwriteChoice = 1 - this.overwriteChoice
        this.app.audio.move()
        return
      }
      if (b === 'C' || b === 'START') {
        if (this.overwriteChoice === 0) {
          this.app.audio.confirm()
          this.app.go('players')
        } else {
          this.phase = 'menu'
          this.app.audio.cancel()
        }
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
      else if (this.hasSave) {
        this.overwriteChoice = 1
        this.phase = 'overwrite-confirm'
      } else this.app.go('players')
    }
  }

  draw() {
    const r = this.app.r
    const titleImage = this.app.assets?.getForDisplay('title.main', r.W, r.H)
    const pointer = this.app.assets?.getForDisplay('ui.cursors.pointer', 12, 12)
    const hdArt = Boolean(titleImage && r.drawImageCover(titleImage, 0, 0, r.W, r.H))
    if (!hdArt) drawTitleComposition(r)

    // Image 2.5 provides only visual chrome/background. Interactive labels remain
    // code-native. The production title image contains an empty ornamental frame,
    // so avoid drawing a second frame over it when HD art is active.
    if (this.phase === 'splash') {
      if (this.blink < 820) {
        if (hdArt) r.shadowText('PUSH START BUTTON', 164, 173, 7, '#fff0c9', 'center')
        else {
          drawPromptPlate(r,87,197,132,17)
          r.text('PUSH START BUTTON', 153, 202, 7, '#fff0c9', 'center')
        }
      }
    } else if (this.phase === 'overwrite-confirm') {
      r.panel(44,66,232,103,'rgba(8,5,5,.96)','#b47722')
      r.text('已有遊戲存檔',160,77,12,'#efd27d','center')
      r.wrapText('開始新遊戲將在完成新劇本設定後覆蓋目前的存檔。',160,99,199,11,7,'#f0e4c5','center')
      const choices=['確定開始','返回繼續']
      choices.forEach((value,index)=>r.text(
        `${index===this.overwriteChoice?'▶ ':''}${value}`,
        160,131+index*16,8,index===this.overwriteChoice?COLORS.cyan:'#ddd0ad','center',
      ))
    } else {
      const opts = this.hasSave ? ['START', 'CONTINUE'] : ['START']
      if (!hdArt) {
        const height = this.hasSave ? 39 : 25
        const menuFrame=this.app.assets?.getNineSlice('title.menuFrame',{sourceSlice:32,destEdge:6})
        r.panel(103, 171, 111, height, 'rgba(8,5,5,.92)', '#b47722', menuFrame)
      }
      const centerX=hdArt?165:158
      const firstY=hdArt?(this.hasSave?164:171):177
      const step=hdArt?16:14
      opts.forEach((value, index) => {
        const selected=index===this.selection
        const y=firstY+index*step
        if(selected&&pointer)r.drawImageCentered(pointer,centerX-34,y+4,12,12)
        r.shadowText(`${selected&&!pointer?'▶ ':''}${value}`,centerX,y,8.5,selected?COLORS.cyan:'#eee2c2','center')
      })
    }

    r.scanlines(.016)
  }
}
