// ============================================================
// FactionSelectScene.ts — 势力/君主选择
// Phase 2.3：MD 风格势力卡片 + 头像展示
// ============================================================

import Phaser from 'phaser'
import { CANVAS_W, CANVAS_H, UI, TXT } from '../ui/theme'
import { strategyFactions } from '../data/factions'
import { gameState } from '../state/GameState'
import type { StrategyFaction } from '../data/types'

export class FactionSelectScene extends Phaser.Scene {
  private selectedIndex = 0
  private factionCards: Phaser.GameObjects.Container[] = []
  private detailBg!: Phaser.GameObjects.Rectangle
  private detailTexts: Phaser.GameObjects.Text[] = []
  private startPrompt!: Phaser.GameObjects.Text

  // 可选势力（排除neutral）
  private playableFactions: StrategyFaction[]

  constructor() {
    super('FactionSelectScene')
    this.playableFactions = strategyFactions.filter(f => f.id !== 'neutral')
  }

  create() {
    this.cameras.main.setBackgroundColor(UI.page)

    this.drawBackground()
    this.drawFrame()
    this.drawScanlines()
    this.drawTitle()
    this.drawFactionCards()
    this.drawDetailPanel()
    this.drawStartPrompt()
    this.drawHint()
    this.setupInput()
    this.updateDetail()
  }

  // ============================================================
  // 背景
  // ============================================================
  private drawBackground() {
    const g = this.add.graphics().setDepth(0)
    const steps = 30
    const stepH = CANVAS_H / steps
    for (let i = 0; i < steps; i++) {
      const t = i / steps
      g.fillStyle(
        (Math.floor(18 + t * 20) << 16) | (Math.floor(8 + t * 12) << 8) | Math.floor(4 + t * 8),
        0.9,
      )
      g.fillRect(0, i * stepH, CANVAS_W, stepH + 1)
    }
    g.fillStyle(0x1a1008, 0.3)
    g.fillCircle(CANVAS_W * 0.2, CANVAS_H * 0.3, 100)
    g.fillCircle(CANVAS_W * 0.8, CANVAS_H * 0.7, 130)
  }

  // ============================================================
  // 边框
  // ============================================================
  private drawFrame() {
    const g = this.add.graphics().setDepth(2)
    const m = 20
    g.lineStyle(2, UI.borderDim, 0.6)
    g.strokeRect(m, m, CANVAS_W - m * 2, CANVAS_H - m * 2)
    g.lineStyle(1, UI.borderDim, 0.3)
    g.strokeRect(m + 8, m + 8, CANVAS_W - (m + 8) * 2, CANVAS_H - (m + 8) * 2)

    const cl = 35, cg = 20
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
    const titleY = 64
    for (const [ox, oy] of [[3, 3], [-1, 2], [2, -1]]) {
      this.add.text(CANVAS_W / 2 + ox, titleY + oy, '选 择 君 主', {
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '40px',
        color: '#000000',
        stroke: '#000000',
        strokeThickness: 6,
      }).setOrigin(0.5).setDepth(5).setAlpha(0.5)
    }

    this.add.text(CANVAS_W / 2, titleY, '选 择 君 主', {
      fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
      fontSize: '40px',
      color: TXT.accent,
      stroke: '#3a2010',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(6)

    const lineY = titleY + 35
    const lg = this.add.graphics().setDepth(5)
    lg.lineStyle(2, UI.accent, 0.5)
    lg.lineBetween(CANVAS_W / 2 - 160, lineY, CANVAS_W / 2 + 160, lineY)
    lg.lineStyle(1, UI.borderDim, 0.35)
    lg.lineBetween(CANVAS_W / 2 - 160, lineY + 4, CANVAS_W / 2 + 160, lineY + 4)
  }

  // ============================================================
  // 势力卡片（一行5个）
  // ============================================================
  private drawFactionCards() {
    const cardW = 200
    const cardH = 160
    const totalW = this.playableFactions.length * cardW
    const startX = (CANVAS_W - totalW) / 2
    const cardY = 220

    for (let i = 0; i < this.playableFactions.length; i++) {
      const fac = this.playableFactions[i]
      const cx = startX + i * cardW + cardW / 2
      const cy = cardY
      const isSelected = i === this.selectedIndex

      const container = this.add.container(0, 0).setDepth(5)

      // 卡片背景
      const bg = this.add.rectangle(cx, cy, cardW - 10, cardH,
        isSelected ? 0x2a1a0c : 0x15100c,
        isSelected ? 0.9 : 0.5,
      )
      bg.setStrokeStyle(isSelected ? 2 : 1, isSelected ? UI.accent : UI.borderDim, isSelected ? 0.8 : 0.3)
      container.add(bg)

      // 势力色圆环（头像占位）
      const avatar = this.add.graphics().setDepth(6)
      avatar.fillStyle(fac.color, 0.9)
      avatar.fillCircle(cx, cy - 30, 28)
      avatar.lineStyle(2, isSelected ? 0xf5d678 : 0x5a4a30, isSelected ? 0.9 : 0.5)
      avatar.strokeCircle(cx, cy - 30, 28)
      container.add(avatar)

      // 君主名（姓氏大字）
      const surname = fac.ruler.charAt(0)
      const rulerText = this.add.text(cx, cy - 30, surname, {
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '24px',
        color: '#ffffff',
        stroke: '#0a0604',
        strokeThickness: 3,
      }).setOrigin(0.5).setDepth(7)
      container.add(rulerText)

      // 君主全名
      const nameText = this.add.text(cx, cy + 12, fac.ruler, {
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '20px',
        color: isSelected ? TXT.bright : TXT.muted,
        stroke: '#0a0604',
        strokeThickness: 2,
      }).setOrigin(0.5)
      container.add(nameText)

      // 势力名
      const factionText = this.add.text(cx, cy + 38, fac.name, {
        fontFamily: '"SimSun", "STSong", "宋体", serif',
        fontSize: '14px',
        color: isSelected ? '#c0a870' : '#5a4a30',
      }).setOrigin(0.5)
      container.add(factionText)

      // 特质
      const traitText = this.add.text(cx, cy + 56, fac.trait, {
        fontFamily: '"SimSun", "STSong", "宋体", serif',
        fontSize: '12px',
        color: isSelected ? '#908060' : '#3a3020',
      }).setOrigin(0.5)
      container.add(traitText)

      this.factionCards.push(container)
    }
  }

  // ============================================================
  // 详情面板（选中势力的信息）
  // ============================================================
  private drawDetailPanel() {
    const panelY = 410
    const panelW = 500
    const panelH = 80

    this.detailBg = this.add.rectangle(CANVAS_W / 2, panelY, panelW, panelH, UI.panel, 0.8)
    this.detailBg.setStrokeStyle(1, UI.borderDim, 0.4)
    this.detailBg.setDepth(5)

    // 详情文字占位
    this.detailTexts = [
      this.add.text(CANVAS_W / 2, panelY - 18, '', {
        fontFamily: '"SimSun", "STSong", "宋体", serif',
        fontSize: '14px',
        color: TXT.body,
      }).setOrigin(0.5).setDepth(6),
      this.add.text(CANVAS_W / 2, panelY + 6, '', {
        fontFamily: '"SimSun", "STSong", "宋体", serif',
        fontSize: '13px',
        color: TXT.muted,
        lineSpacing: 2,
      }).setOrigin(0.5).setDepth(6),
    ]
  }

  private updateDetail() {
    const fac = this.playableFactions[this.selectedIndex]

    this.detailTexts[0].setText(
      `【${fac.name}】  君主：${fac.ruler}  ·  都城：${this.getCapitalName(fac.capital)}`,
    )
    this.detailTexts[1].setText(
      `势力特质：${fac.trait}  ·  起始兵力雄厚，适合${fac.id === 'cao' ? '中原速攻' : fac.id === 'liu' ? '蜀地经营' : fac.id === 'sun' ? '江东发展' : fac.id === 'yuan' ? '河北扩张' : '西凉称霸'}路线`,
    )

    // 更新卡片高亮
    for (let i = 0; i < this.factionCards.length; i++) {
      this.factionCards[i].destroy()
    }
    this.factionCards = []
    this.drawFactionCards()
  }

  private getCapitalName(capitalId: string): string {
    const capitals: Record<string, string> = {
      xuchang: '许昌', chengdu: '成都', jianye: '建业', ye: '邺城', chang_an: '长安', luoyang: '洛阳',
    }
    return capitals[capitalId] ?? capitalId
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

  private drawHint() {
    this.add.text(CANVAS_W / 2, CANVAS_H - 40, '← → 选择势力  ·  点击卡片确认  ·  Enter 开始', {
      fontFamily: '"SimSun", "STSong", "宋体", serif',
      fontSize: '12px',
      color: TXT.muted,
    }).setOrigin(0.5).setDepth(6).setAlpha(0.5)
  }

  // ============================================================
  // 输入
  // ============================================================
  private setupInput() {
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.selectFaction((this.selectedIndex - 1 + this.playableFactions.length) % this.playableFactions.length)
    })
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.selectFaction((this.selectedIndex + 1) % this.playableFactions.length)
    })
    this.input.keyboard?.on('keydown-ENTER', () => this.startGame())

    // 点击卡片
    this.setupCardInteraction()

    // 开始提示
    this.startPrompt.setInteractive()
    this.startPrompt.on('pointerdown', () => this.startGame())
    this.startPrompt.on('pointerover', () => this.input.setDefaultCursor('pointer'))
    this.startPrompt.on('pointerout', () => this.input.setDefaultCursor('default'))
  }

  private setupCardInteraction() {
    for (let i = 0; i < this.factionCards.length; i++) {
      const card = this.factionCards[i]
      card.setInteractive(
        new Phaser.Geom.Rectangle(-100, -80, 200, 160),
        Phaser.Geom.Rectangle.Contains,
      )
      card.on('pointerdown', () => this.selectFaction(i))
      card.on('pointerover', () => this.input.setDefaultCursor('pointer'))
      card.on('pointerout', () => this.input.setDefaultCursor('default'))
    }
  }

  private selectFaction(index: number) {
    this.selectedIndex = index
    this.updateDetail()
    this.setupCardInteraction()
  }

  private startGame() {
    const fac = this.playableFactions[this.selectedIndex]
    // 初始化游戏状态
    gameState.playerFactionId = fac.id
    gameState.year = 189
    gameState.month = 1
    gameState.resetCities()
    console.log(`[FactionSelect] 选择势力: ${fac.name} (${fac.id})`)

    this.input.keyboard?.off('keydown-ENTER')
    this.input.keyboard?.off('keydown-LEFT')
    this.input.keyboard?.off('keydown-RIGHT')

    // 传递选中势力信息到下一个场景
    this.scene.start('MapScene', { playerFactionId: fac.id })
  }
}