import { COLORS, H, W } from '../game/constants.js'

const DIFFICULTIES = ['easy', 'normal', 'hard']
const LABELS = { easy: '简单', normal: '普通', hard: '困难' }

export class ScenarioScene {
  constructor(app) { this.app = app; this.difficultyIndex = 1 }
  update(_dt, input) {
    const key = input.consume(); if (!key) return
    if (key === 'ArrowLeft') this.difficultyIndex = (this.difficultyIndex + 2) % 3
    if (key === 'ArrowRight') this.difficultyIndex = (this.difficultyIndex + 1) % 3
    if (key === 'x' || key === 'X' || key === 'Escape') this.app.go('title')
    if (key === 'z' || key === 'Z' || key === 'Enter') this.app.go('faction', { difficulty: DIFFICULTIES[this.difficultyIndex] })
  }
  draw() {
    const r = this.app.r
    r.clear(COLORS.black); r.shadowText('剧 本 选 择', 14, 14, 14, '#e6cb6a')
    r.panel(14, 40, 292, 98); r.text('189年', 28, 54, 13, '#f0d27b'); r.text('群雄并起', 28, 76, 18, COLORS.ivory)
    r.wrapText('首个研究剧本。当前数值是可运行基线，后续以实机逐帧复盘持续校准。', 28, 106, 252, 10, 8, '#a99b7d')
    r.panel(52, 151, 216, 36, COLORS.panel2); r.text('难度', 66, 163, 9, '#a99b7d')
    r.text(LABELS[DIFFICULTIES[this.difficultyIndex]], 160, 162, 10, '#ffe08a', 'center'); r.text('← →', 246, 163, 8, '#847b67', 'center')
    r.text('Z / Enter 下一步   X 返回', W / 2, H - 20, 7, '#756e60', 'center', 'middle'); r.scanlines()
  }
}
