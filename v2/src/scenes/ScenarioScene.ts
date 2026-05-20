// ============================================================
// ScenarioScene.ts — 剧本选择 + 难度选择
// Phase 2.2：MD 复古风格，预留给后续多剧本扩展
// ============================================================

import Phaser from 'phaser'
import { CANVAS_W, CANVAS_H, UI, TXT } from '../ui/theme'
import type { Difficulty } from '../data/types'

// 剧本定义（当前仅群雄割据，后续可扩展）
interface ScenarioDef {
  id: string
  name: string
  year: number
  description: string
  available: boolean
}

const SCENARIOS: ScenarioDef[] = [
  {
    id: 'qunxiong',
    name: '群雄割据',
    year: 189,
    description: '董卓专权，诸侯并起。曹操、刘备、孙坚、袁绍各据一方，天下大势未定。',
    available: true,
  },
  // 预留扩展位
  {
    id: 'chibi',
    name: '赤壁之战',
    year: 208,
    description: '曹操南下，孙刘联军，赤壁烽火即将点燃。',
    available: false,
  },
  {
    id: 'sanfen',
    name: '三分天下',
    year: 220,
    description: '魏蜀吴鼎立，诸葛亮北伐在即。',
    available: false,
  },
]

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '简 单',
  normal: '普 通',
  hard: '困 难',
}

export class ScenarioScene extends Phaser.Scene {
  private selectedScenario = 0
  private selectedDifficulty: Difficulty = 'normal'

  // 场景卡片容器
  private scenarioCards: Phaser.GameObjects.Container[] = []
  private difficultyText!: Phaser.GameObjects.Text
  private startPrompt!: Phaser.GameObjects.Text

  constructor() {
    super('ScenarioScene')
  }

  create() {
    this.cameras.main.setBackgroundColor(UI.page)

    this.drawBackground()
    this.drawFrame()
    this.drawScanlines()
    this.drawTitle()
    this.drawScenarioCards()
    this.drawDifficultySelector()
    this.drawStartPrompt()
    this.drawHint()
    this.setupInput()
  }

  // ============================================================
  // 背景
  // ============================================================
  private drawBackground() {
    const g = this.add.graphics().setDepth(0)
    // 渐变底色
    const steps = 30
    const stepH = CANVAS_H / steps
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const r = Math.floor(18 + t * 20)
      const gv = Math.floor(8 + t * 12)
      const b = Math.floor(4 + t * 8)
      g.fillStyle((r << 16) | (gv << 8) | b, 0.9)
      g.fillRect(0, i * stepH, CANVAS_W, stepH + 1)
    }

    // 装饰墨斑
    g.fillStyle(0x1a1008, 0.3)
    g.fillCircle(CANVAS_W * 0.2, CANVAS_H * 0.3, 100)
    g.fillCircle(CANVAS_W * 0.8, CANVAS_H * 0.7, 130)
    g.fillStyle(0x201510, 0.25)
    g.fillCircle(CANVAS_W * 0.5, CANVAS_H * 0.5, 160)
  }

  // ============================================================
  // 边框
  // ============================================================
  private drawFrame() {
    const g = this.add.graphics().setDepth(2)
    const m = 20
    const fw = CANVAS_W - m * 2
    const fh = CANVAS_H - m * 2

    g.lineStyle(2, UI.borderDim, 0.6)
    g.strokeRect(m, m, fw, fh)
    g.lineStyle(1, UI.borderDim, 0.3)
    g.strokeRect(m + 8, m + 8, fw - 16, fh - 16)

    // 四角 L 形标
    const cl = 35
    const cg = 20
    g.lineStyle(3, UI.accent, 0.45)
    g.lineBetween(cg, cg, cg + cl, cg)
    g.lineBetween(cg, cg, cg, cg + cl)
    g.lineBetween(CANVAS_W - cg - cl, cg, CANVAS_W - cg, cg)
    g.lineBetween(CANVAS_W - cg, cg, CANVAS_W - cg, cg + cl)
    g.lineBetween(cg, CANVAS_H - cg, cg + cl, CANVAS_H - cg)
    g.lineBetween(cg, CANVAS_H - cg - cl, cg, CANVAS_H - cg)
    g.lineBetween(CANVAS_W - cg - cl, CANVAS_H - cg, CANVAS_W - cg, CANVAS_H - cg)
    g.lineBetween(CANVAS_W - cg, CANVAS_H - cg - cl, CANVAS_W - cg, CANVAS_H - cg)
  }

  // ============================================================
  // 扫描线
  // ============================================================
  private drawScanlines() {
    const g = this.add.graphics().setDepth(99)
    for (let y = 0; y < CANVAS_H; y += 4) {
      g.fillStyle(0x000000, 0.10)
      g.fillRect(0, y, CANVAS_W, 2)
    }
  }

  // ============================================================
  // 标题
  // ============================================================
  private drawTitle() {
    const titleY = 68

    // 阴影
    for (const [ox, oy] of [[3, 3], [-1, 2], [2, -1]]) {
      this.add.text(CANVAS_W / 2 + ox, titleY + oy, '选 择 剧 本', {
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '42px',
        color: '#000000',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(5).setAlpha(0.5)
    }

    this.add.text(CANVAS_W / 2, titleY, '选 择 剧 本', {
      fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
      fontSize: '42px',
      color: TXT.accent,
      stroke: '#3a2010',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6)

    // 分隔线
    const lineY = titleY + 38
    const lg = this.add.graphics().setDepth(5)
    lg.lineStyle(2, UI.accent, 0.5)
    lg.lineBetween(CANVAS_W / 2 - 180, lineY, CANVAS_W / 2 + 180, lineY)
    lg.lineStyle(1, UI.borderDim, 0.35)
    lg.lineBetween(CANVAS_W / 2 - 180, lineY + 4, CANVAS_W / 2 + 180, lineY + 4)
  }

  // ============================================================
  // 剧本卡片
  // ============================================================
  private drawScenarioCards() {
    const cardW = 240
    const cardH = 200
    const cardGap = 30
    const totalW = SCENARIOS.length * cardW + (SCENARIOS.length - 1) * cardGap
    const startX = (CANVAS_W - totalW) / 2
    const cardY = 160

    for (let i = 0; i < SCENARIOS.length; i++) {
      const sc = SCENARIOS[i]
      const cx = startX + i * (cardW + cardGap) + cardW / 2
      const cy = cardY + cardH / 2
      const isSelected = i === this.selectedScenario

      const container = this.add.container(0, 0).setDepth(5)

      // 卡片底板
      const bg = this.add.rectangle(cx, cy, cardW, cardH,
        isSelected ? 0x2a1a0c : 0x15100c,
        isSelected ? 0.9 : 0.6,
      )
      bg.setStrokeStyle(isSelected ? 2 : 1.5, isSelected ? UI.accent : UI.borderDim, isSelected ? 0.8 : 0.4)
      container.add(bg)

      // 年代
      const yearText = this.add.text(cx, cy - 55, `${sc.year}年`, {
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontSize: '26px',
        color: isSelected ? '#f5d678' : '#7a5c2e',
        stroke: '#0a0604',
        strokeThickness: 2,
      }).setOrigin(0.5)
      container.add(yearText)

      // 剧本名
      const nameText = this.add.text(cx, cy - 20, sc.name, {
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '22px',
        color: isSelected ? TXT.bright : TXT.muted,
        stroke: '#0a0604',
        strokeThickness: 3,
      }).setOrigin(0.5)
      container.add(nameText)

      // 描述
      const descText = this.add.text(cx, cy + 25, sc.description, {
        fontFamily: '"SimSun", "STSong", "宋体", serif',
        fontSize: '11px',
        color: isSelected ? '#c0a870' : '#5a4a30',
        lineSpacing: 2,
        align: 'center',
        wordWrap: { width: 190, useAdvancedWrap: true },
      }).setOrigin(0.5, 0)
      container.add(descText)

      // 不可用标记
      if (!sc.available) {
        const lockText = this.add.text(cx, cy + 70, '—— 即将开放 ——', {
          fontFamily: '"SimSun", "STSong", "宋体", serif',
          fontSize: '13px',
          color: '#5a3a2a',
        }).setOrigin(0.5)
        container.add(lockText)
      }

      this.scenarioCards.push(container)
    }
  }

  // ============================================================
  // 难度选择
  // ============================================================
  private drawDifficultySelector() {
    const diffY = 420

    // 标签
    this.add.text(CANVAS_W / 2, diffY - 18, '难 度 选 择', {
      fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
      fontSize: '20px',
      color: TXT.muted,
      stroke: '#0a0604',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6)

    // 左右箭头 + 当前难度
    this.difficultyText = this.add.text(CANVAS_W / 2, diffY + 28, DIFFICULTY_LABELS[this.selectedDifficulty], {
      fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
      fontSize: '28px',
      color: TXT.bright,
      stroke: '#1a0e04',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6)

    // 左箭头
    const leftArrow = this.add.text(CANVAS_W / 2 - 120, diffY + 28, '◀', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: TXT.muted,
      stroke: '#0a0604',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6).setInteractive()

    // 右箭头
    const rightArrow = this.add.text(CANVAS_W / 2 + 120, diffY + 28, '▶', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: TXT.muted,
      stroke: '#0a0604',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(6).setInteractive()

    // 箭头交互
    leftArrow.on('pointerover', () => leftArrow.setColor('#f5d678'))
    leftArrow.on('pointerout', () => leftArrow.setColor(TXT.muted))
    leftArrow.on('pointerdown', () => this.cycleDifficulty(-1))

    rightArrow.on('pointerover', () => rightArrow.setColor('#f5d678'))
    rightArrow.on('pointerout', () => rightArrow.setColor(TXT.muted))
    rightArrow.on('pointerdown', () => this.cycleDifficulty(1))
  }

  private cycleDifficulty(dir: number) {
    const difficulties: Difficulty[] = ['easy', 'normal', 'hard']
    const idx = difficulties.indexOf(this.selectedDifficulty)
    const newIdx = (idx + dir + difficulties.length) % difficulties.length
    this.selectedDifficulty = difficulties[newIdx]
    this.difficultyText.setText(DIFFICULTY_LABELS[this.selectedDifficulty])

    // 根据难度改变文字颜色
    const diffColors: Record<Difficulty, string> = {
      easy: '#80c080',
      normal: TXT.bright,
      hard: '#e08060',
    }
    this.difficultyText.setColor(diffColors[this.selectedDifficulty])
  }

  // ============================================================
  // 开始提示
  // ============================================================
  private drawStartPrompt() {
    this.startPrompt = this.add.text(CANVAS_W / 2, CANVAS_H - 80, '▶  开 始 游 戏   ◀', {
      fontFamily: '"SimSun", "STSong", "宋体", serif',
      fontSize: '22px',
      color: '#f5e0a0',
      stroke: '#1a0e04',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10)

    this.tweens.add({
      targets: this.startPrompt,
      alpha: { from: 1, to: 0.2 },
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  // ============================================================
  // 操作提示
  // ============================================================
  private drawHint() {
    this.add.text(CANVAS_W / 2, CANVAS_H - 40, '← → 选择剧本  ·  点击卡片确认  ·  Enter 开始', {
      fontFamily: '"SimSun", "STSong", "宋体", serif',
      fontSize: '12px',
      color: TXT.muted,
    }).setOrigin(0.5).setDepth(6).setAlpha(0.5)
  }

  // ============================================================
  // 输入
  // ============================================================
  private setupInput() {
    // 键盘：左右切换剧本
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.selectScenario((this.selectedScenario - 1 + SCENARIOS.length) % SCENARIOS.length)
    })
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.selectScenario((this.selectedScenario + 1) % SCENARIOS.length)
    })

    // Enter 开始
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.startGame()
    })

    // 点击卡片切换选中
    for (let i = 0; i < this.scenarioCards.length; i++) {
      const card = this.scenarioCards[i]
      // 对卡片区域做简单的点击检测
      card.setInteractive(
        new Phaser.Geom.Rectangle(-120, -100, 240, 200),
        Phaser.Geom.Rectangle.Contains,
      )
      card.on('pointerdown', () => {
        if (SCENARIOS[i].available) {
          this.selectScenario(i)
        }
      })
      card.on('pointerover', () => {
        this.input.setDefaultCursor(SCENARIOS[i].available ? 'pointer' : 'default')
      })
    }

    // 点击开始提示
    this.startPrompt.setInteractive()
    this.startPrompt.on('pointerdown', () => this.startGame())
    this.startPrompt.on('pointerover', () => this.input.setDefaultCursor('pointer'))
    this.startPrompt.on('pointerout', () => this.input.setDefaultCursor('default'))
  }

  private selectScenario(index: number) {
    if (!SCENARIOS[index].available) return
    this.selectedScenario = index

    // 销毁旧卡片重建
    for (const card of this.scenarioCards) {
      card.destroy()
    }
    this.scenarioCards = []
    this.drawScenarioCards()
    // 重新绑定卡片交互
    this.setupCardInteraction()
  }

  private setupCardInteraction() {
    for (let i = 0; i < this.scenarioCards.length; i++) {
      const card = this.scenarioCards[i]
      card.setInteractive(
        new Phaser.Geom.Rectangle(-120, -100, 240, 200),
        Phaser.Geom.Rectangle.Contains,
      )
      card.on('pointerdown', () => {
        if (SCENARIOS[i].available) {
          this.selectScenario(i)
        }
      })
    }
  }

  private startGame() {
    if (!SCENARIOS[this.selectedScenario].available) return

    this.input.keyboard?.off('keydown-ENTER')
    this.input.keyboard?.off('keydown-LEFT')
    this.input.keyboard?.off('keydown-RIGHT')

    // 淡出过渡到地图（Phase 2.3 将插入势力选择）
    this.cameras.main.fadeOut(500, 0, 0, 0)
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('FactionSelectScene')
    })
  }
}