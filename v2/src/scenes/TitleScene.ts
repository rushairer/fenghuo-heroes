// ============================================================
// TitleScene.ts — MD 风格标题画面
// Phase 2.1：世嘉MD《乱世群英》复古标题体验
// ============================================================

import Phaser from 'phaser'
import { CANVAS_W, CANVAS_H, UI, TXT } from '../ui/theme'

export class TitleScene extends Phaser.Scene {
  private startPrompt!: Phaser.GameObjects.Text
  private bgImage: Phaser.GameObjects.Image | null = null

  constructor() {
    super('TitleScene')
  }

  preload() {
    this.load.image('title-bg', `${import.meta.env.BASE_URL}assets/images/backgrounds/title.png`)
  }

  create() {
    // ---- 背景 ----
    this.cameras.main.setBackgroundColor(UI.page)

    // 尝试加载背景图，失败则用程序化渐变
    if (this.textures.exists('title-bg')) {
      this.bgImage = this.add.image(CANVAS_W / 2, CANVAS_H / 2, 'title-bg')
      // 缩放适配画布
      const scaleX = CANVAS_W / (this.bgImage.width || CANVAS_W)
      const scaleY = CANVAS_H / (this.bgImage.height || CANVAS_H)
      const scale = Math.max(scaleX, scaleY)
      this.bgImage.setScale(scale)
      this.bgImage.setDepth(0)
    } else {
      this.drawProceduralBackground()
    }

    // ---- 装饰边框 ----
    this.drawDecorativeFrame()

    // ---- 扫描线效果 ----
    this.drawScanlines()

    // ---- 标题文字 ----
    this.drawTitle()

    // ---- 副标题 ----
    this.drawSubtitle()

    // ---- 开始提示 ----
    this.drawStartPrompt()

    // ---- 版本信息 ----
    this.drawVersionInfo()

    // ---- 交互 ----
    this.setupInput()
  }

  // ============================================================
  // 程序化背景（背景图加载失败时兜底）
  // ============================================================
  private drawProceduralBackground() {
    const g = this.add.graphics()
    g.setDepth(0)

    // 从上到下的深褐渐变（模拟古画卷）
    const steps = 40
    const stepH = CANVAS_H / steps
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      // 从深褐到暗金渐变
      const r = Math.floor(20 + t * 30)
      const gv = Math.floor(10 + t * 15)
      const b = Math.floor(5 + t * 10)
      const color = (r << 16) | (gv << 8) | b
      g.fillStyle(color, 0.9)
      g.fillRect(0, i * stepH, CANVAS_W, stepH + 1)
    }

    // 装饰性墨点/云纹（简化）
    g.fillStyle(0x1a1008, 0.4)
    g.fillCircle(CANVAS_W * 0.25, CANVAS_H * 0.6, 120)
    g.fillCircle(CANVAS_W * 0.75, CANVAS_H * 0.35, 100)
    g.fillStyle(0x251810, 0.3)
    g.fillCircle(CANVAS_W * 0.4, CANVAS_H * 0.25, 80)
    g.fillCircle(CANVAS_W * 0.6, CANVAS_H * 0.7, 140)
  }

  // ============================================================
  // 装饰边框
  // ============================================================
  private drawDecorativeFrame() {
    const g = this.add.graphics()
    g.setDepth(2)

    const margin = 20
    const fw = CANVAS_W - margin * 2
    const fh = CANVAS_H - margin * 2

    // 外框
    g.lineStyle(2, UI.borderDim, 0.6)
    g.strokeRect(margin, margin, fw, fh)
    // 内框
    g.lineStyle(1, UI.borderDim, 0.3)
    g.strokeRect(margin + 8, margin + 8, fw - 16, fh - 16)

    // 四角装饰（MD 风格的 L 形角标）
    const cornerLen = 40
    const cornerGap = 20
    g.lineStyle(3, UI.accent, 0.5)

    // 左上
    g.lineBetween(cornerGap, cornerGap, cornerGap + cornerLen, cornerGap)
    g.lineBetween(cornerGap, cornerGap, cornerGap, cornerGap + cornerLen)
    // 右上
    g.lineBetween(CANVAS_W - cornerGap - cornerLen, cornerGap, CANVAS_W - cornerGap, cornerGap)
    g.lineBetween(CANVAS_W - cornerGap, cornerGap, CANVAS_W - cornerGap, cornerGap + cornerLen)
    // 左下
    g.lineBetween(cornerGap, CANVAS_H - cornerGap, cornerGap + cornerLen, CANVAS_H - cornerGap)
    g.lineBetween(cornerGap, CANVAS_H - cornerGap - cornerLen, cornerGap, CANVAS_H - cornerGap)
    // 右下
    g.lineBetween(CANVAS_W - cornerGap - cornerLen, CANVAS_H - cornerGap, CANVAS_W - cornerGap, CANVAS_H - cornerGap)
    g.lineBetween(CANVAS_W - cornerGap, CANVAS_H - cornerGap - cornerLen, CANVAS_W - cornerGap, CANVAS_H - cornerGap)
  }

  // ============================================================
  // 扫描线效果（MD 显像管风格）
  // ============================================================
  private drawScanlines() {
    const g = this.add.graphics()
    g.setDepth(99)

    const lineH = 3
    const gap = 1
    for (let y = 0; y < CANVAS_H; y += lineH + gap) {
      g.fillStyle(0x000000, 0.12)
      g.fillRect(0, y, CANVAS_W, lineH)
    }
  }

  // ============================================================
  // 主标题
  // ============================================================
  private drawTitle() {
    const titleY = CANVAS_H * 0.28

    // 底层阴影 — 多层叠加模拟 MD 像素字体厚重感
    const shadowOffsets = [
      [4, 4], [-2, 3], [2, -2], [-3, -1],
    ]
    for (const [ox, oy] of shadowOffsets) {
      this.add.text(CANVAS_W / 2 + ox, titleY + oy, '三国志列传', {
        fontFamily: '"KaiTi", "STKaiti", "楷体", "SimSun", serif',
        fontSize: '72px',
        color: '#000000',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      }).setOrigin(0.5).setDepth(5).setAlpha(0.6)
    }

    // 主文字 — 金色
    this.add.text(CANVAS_W / 2, titleY, '三国志列传', {
      fontFamily: '"KaiTi", "STKaiti", "楷体", "SimSun", serif',
      fontSize: '72px',
      color: '#f5d678',
      stroke: '#5a3a1a',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(6)

    // 副标题行 — 稍小字号
    const subY = titleY + 82
    const shadowOffsets2 = [[3, 3], [-1, 2], [2, -1]]
    for (const [ox, oy] of shadowOffsets2) {
      this.add.text(CANVAS_W / 2 + ox, subY + oy, '乱 世 群 英', {
        fontFamily: '"KaiTi", "STKaiti", "楷体", "SimSun", serif',
        fontSize: '56px',
        color: '#000000',
        stroke: '#000000',
        strokeThickness: 8,
        align: 'center',
      }).setOrigin(0.5).setDepth(5).setAlpha(0.5)
    }

    this.add.text(CANVAS_W / 2, subY, '乱 世 群 英', {
      fontFamily: '"KaiTi", "STKaiti", "楷体", "SimSun", serif',
      fontSize: '56px',
      color: '#f5d678',
      stroke: '#5a3a1a',
      strokeThickness: 6,
      align: 'center',
    }).setOrigin(0.5).setDepth(6)

    // 标题分隔线 — MD 风格双线
    const lineY = subY + 50
    const lineG = this.add.graphics().setDepth(5)
    lineG.lineStyle(2, UI.accent, 0.6)
    lineG.lineBetween(CANVAS_W / 2 - 200, lineY, CANVAS_W / 2 + 200, lineY)
    lineG.lineStyle(1, UI.borderDim, 0.4)
    lineG.lineBetween(CANVAS_W / 2 - 200, lineY + 4, CANVAS_W / 2 + 200, lineY + 4)
  }

  // ============================================================
  // 副标题
  // ============================================================
  private drawSubtitle() {
    this.add.text(CANVAS_W / 2, CANVAS_H * 0.58, '世嘉MD经典 · 复刻重制', {
      fontFamily: '"SimSun", "STSong", "宋体", serif',
      fontSize: '20px',
      color: '#d4c09a',
      stroke: '#0a0604',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(6)
  }

  // ============================================================
  // 开始提示（闪烁）
  // ============================================================
  private drawStartPrompt() {
    this.startPrompt = this.add.text(CANVAS_W / 2, CANVAS_H * 0.78, '▶  点 击 开 始   ◀', {
      fontFamily: '"SimSun", "STSong", "宋体", serif',
      fontSize: '22px',
      color: '#f5e0a0',
      stroke: '#1a0e04',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setDepth(10)

    // MD 风格的闪烁效果
    this.tweens.add({
      targets: this.startPrompt,
      alpha: { from: 1, to: 0.15 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // ============================================================
  // 版本信息
  // ============================================================
  private drawVersionInfo() {
    this.add.text(CANVAS_W - 16, CANVAS_H - 10, 'Phase 2 · v0.2', {
      fontFamily: '"SimSun", "STSong", "宋体", serif',
      fontSize: '12px',
      color: TXT.muted,
      align: 'right',
    }).setOrigin(1, 1).setDepth(6).setAlpha(0.5)
  }

  // ============================================================
  // 输入处理
  // ============================================================
  private setupInput() {
    // 点击开始
    this.input.on('pointerdown', () => {
      this.startGame()
    })

    // 键盘任意键开始（排除功能键）
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      // 忽略修饰键
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) {
        return
      }
      this.startGame()
    })
  }

  private startGame() {
    // 防止重复触发
    this.input.off('pointerdown')

    // 简短的淡出过渡效果
    this.cameras.main.fadeOut(400, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('ScenarioScene')
    })
  }
}