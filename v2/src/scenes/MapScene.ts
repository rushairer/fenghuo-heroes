// ============================================================
// MapScene.ts — 全屏战役地图场景
// Phase 1 核心：中国地图渲染，城池标注，道路连线，势力着色
// ============================================================

import Phaser from 'phaser'
import { CANVAS_W, CANVAS_H, FRAME, UI, TXT } from '../ui/theme'
import { strategyCities } from '../data/cities'
import { strategyFactions } from '../data/factions'
import { routeFeatures } from '../data/routes'
import { gameState } from '../state/GameState'
import { DomesticSystem, DOMESTIC_COMMANDS } from '../systems/DomesticSystem'
import { DiplomacySystem, DIPLOMACY_COMMANDS } from '../systems/DiplomacySystem'
import { MilitarySystem, MILITARY_COMMANDS } from '../systems/MilitarySystem'
import { strategyOfficers } from '../data/officers'
import type { FactionId, CityId, DiplomacyCommandKind, RouteFeature, MapDisplayMode } from '../data/types'

// ---- 坐标变换 ----
// 城池数据坐标范围: x 58-680, y 44-552
// 数据中心: (369, 298), 画布中心: (640, 380)
const DATA_CENTER_X = 369
const DATA_CENTER_Y = 298
const SCREEN_CENTER_X = CANVAS_W / 2
const SCREEN_CENTER_Y = CANVAS_H / 2
// 缩放系数：确保40城在FRAME内留出足够padding（襄平Y不溢出上沿，云南Y不溢出下沿）
const MAP_SCALE = 1.25

function dataToScreen(dx: number, dy: number): [number, number] {
  return [
    (dx - DATA_CENTER_X) * MAP_SCALE + SCREEN_CENTER_X,
    (dy - DATA_CENTER_Y) * MAP_SCALE + SCREEN_CENTER_Y,
  ]
}

// ---- 势力颜色映射 ----
const factionColorMap: Record<FactionId, number> = {} as Record<FactionId, number>
for (const f of strategyFactions) {
  factionColorMap[f.id] = f.color
}

// ============================================================
// MapScene
// ============================================================
export class MapScene extends Phaser.Scene {
  private playerFactionId: FactionId | null = null
  // 城池图形对象映射
  private cityMarkers: Map<string, Phaser.GameObjects.Arc> = new Map()
  private cityLabels: Map<string, Phaser.GameObjects.Text> = new Map()
  private routeGraphics!: Phaser.GameObjects.Graphics
  private featureGraphics!: Phaser.GameObjects.Graphics
  private highlightGraphics!: Phaser.GameObjects.Rectangle

  private displayMode: MapDisplayMode = 'full'
  private selectedCityId: string | null = null

  // 行军月状态
  private commandBarContainer: Phaser.GameObjects.Container | null = null
  private armyMarkers: Map<string, Phaser.GameObjects.Arc> = new Map()
  private armyLabels: Map<string, Phaser.GameObjects.Text> = new Map()
  private selectedArmyId: string | null = null
  private marchArmyPanel: Phaser.GameObjects.Container | null = null
  private marchRouteGraphics: Phaser.GameObjects.Graphics | null = null
  private marchBtns: Phaser.GameObjects.Rectangle[] = []

  // 模式切换按钮
  constructor() {
    super('MapScene')
  }

  // ============================================================
  // init — 接收开局数据
  // ============================================================
  init(data: { playerFactionId?: FactionId }) {
    this.playerFactionId = data?.playerFactionId ?? null
  }

  // ============================================================
  // create
  // ============================================================
  create() {
    this.cameras.main.setBackgroundColor(UI.page)

    // 分层绘制
    this.drawTerrain()
    this.drawRouteLines()
    this.drawRouteFeatures()
    this.drawCityMarkers()
    this.drawCityLabels()
    this.drawPlayerCitiesHighlight()
    this.setupInteraction()
    this.drawCommandBar()
  }

  // ============================================================
  // 地形背景
  // ============================================================
  private drawTerrain() {
    const g = this.add.graphics()

    // 底色 — 仿羊皮纸
    g.fillStyle(0x1a1410, 1)
    g.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height)

    // 画布底色 (地图外区域)
    g.fillStyle(UI.page, 1)
    g.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // 地图区域底色
    g.fillStyle(0x1a1410, 1)
    g.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height)

    // 内边框
    g.lineStyle(2, UI.borderDim, 0.6)
    g.strokeRect(FRAME.x + 4, FRAME.y + 4, FRAME.width - 8, FRAME.height - 8)

    // ---- 山脉绘制 (三角形集群) ----
    this.drawMountains(g, [
      // 太行山脉 (晋阳-邺城西侧)
      { cx: 300, cy: 70, count: 5, spread: 30 },
      // 秦岭 (长安-汉中之间)
      { cx: 200, cy: 210, count: 6, spread: 35 },
      // 陇山 (天水-武威)
      { cx: 100, cy: 140, count: 4, spread: 28 },
      // 南中群山 (云南-南中)
      { cx: 150, cy: 500, count: 5, spread: 32 },
      // 荆南山脉 (武陵-零陵-桂林)
      { cx: 380, cy: 530, count: 4, spread: 30 },
      // 泰山周边 (北海-平原)
      { cx: 560, cy: 160, count: 3, spread: 22 },
      // 巫山 (永安-江陵)
      { cx: 310, cy: 400, count: 3, spread: 20 },
      // 大别山 (汝南-江夏)
      { cx: 370, cy: 340, count: 3, spread: 22 },
    ])

    // ---- 河流绘制 ----
    this.drawRiver(g, [
      // 黄河 (上游→下游，经洛阳北侧)
      { x: 100, y: 110 },
      { x: 170, y: 105 },
      { x: 240, y: 110 },
      { x: 350, y: 85 },
      { x: 460, y: 90 },
      { x: 550, y: 105 },
      { x: 620, y: 130 },
    ], 0x3a5a7a, 3)

    this.drawRiver(g, [
      // 长江 (上游→下游)
      { x: 130, y: 400 },
      { x: 200, y: 370 },
      { x: 270, y: 350 },
      { x: 340, y: 370 },
      { x: 420, y: 390 },
      { x: 520, y: 370 },
      { x: 600, y: 360 },
      { x: 680, y: 390 },
    ], 0x3a5a7a, 3)

    // 汉水 (汉中→襄阳→江夏)
    this.drawRiver(g, [
      { x: 190, y: 270 },
      { x: 260, y: 290 },
      { x: 320, y: 330 },
      { x: 370, y: 380 },
    ], 0x3a6a8a, 2)

    // 湘江 (长沙周边)
    this.drawRiver(g, [
      { x: 360, y: 470 },
      { x: 390, y: 510 },
      { x: 370, y: 550 },
    ], 0x3a6a8a, 2)
  }

  // 辅助：绘制山脉集群
  private drawMountains(
    g: Phaser.GameObjects.Graphics,
    clusters: { cx: number; cy: number; count: number; spread: number }[],
  ) {
    for (const cl of clusters) {
      const [sx, sy] = dataToScreen(cl.cx, cl.cy)
      for (let i = 0; i < cl.count; i++) {
        const ox = (Math.random() - 0.5) * cl.spread * 2
        const oy = (Math.random() - 0.5) * cl.spread * 2
        const size = 8 + Math.random() * 10
        const mx = sx + ox
        const my = sy + oy

        // 三角形山峰
        g.fillStyle(0x2a2018, 1)
        g.fillTriangle(mx, my - size, mx - size * 0.7, my + size * 0.3, mx + size * 0.7, my + size * 0.3)

        // 峰顶高光
        g.lineStyle(1, 0x3a3028, 1)
        g.lineBetween(mx - size * 0.7, my + size * 0.3, mx, my - size)
        g.lineBetween(mx, my - size, mx + size * 0.7, my + size * 0.3)
      }
    }
  }

  // 辅助：绘制河流曲线
  private drawRiver(
    g: Phaser.GameObjects.Graphics,
    points: { x: number; y: number }[],
    color: number,
    width: number,
  ) {
    if (points.length < 2) return
    g.lineStyle(width, color, 0.55)
    g.beginPath()
    const [sx0, sy0] = dataToScreen(points[0].x, points[0].y)
    g.moveTo(sx0, sy0)
    for (let i = 1; i < points.length; i++) {
      const [sx, sy] = dataToScreen(points[i].x, points[i].y)
      g.lineTo(sx, sy)
    }
    g.strokePath()
  }

  // ============================================================
  // 道路连线
  // ============================================================
  private drawRouteLines() {
    const g = this.add.graphics()
    this.routeGraphics = g

    // 去重：防止双向道路画两次
    const drawn = new Set<string>()

    for (const city of strategyCities) {
      const [ax, ay] = dataToScreen(city.x, city.y)
      for (const targetId of city.routes) {
        const pairKey = [city.id, targetId].sort().join('|')
        if (drawn.has(pairKey)) continue
        drawn.add(pairKey)

        const target = strategyCities.find(c => c.id === targetId)
        if (!target) continue

        const [bx, by] = dataToScreen(target.x, target.y)

        // 道路底色
        g.lineStyle(3, 0x3a2818, 0.7)
        g.lineBetween(ax, ay, bx, by)

        // 道路高光线
        g.lineStyle(1, 0x5a4a38, 0.4)
        g.lineBetween(ax, ay, bx, by)
      }
    }
  }

  // ============================================================
  // 路线特性标记（村庄/关隘/渡口）
  // ============================================================
  private drawRouteFeatures() {
    const g = this.add.graphics()
    this.featureGraphics = g

    for (const [key, features] of Object.entries(routeFeatures)) {
      const [cityAId, cityBId] = key.split('-') as [string, string]
      const cityA = strategyCities.find(c => c.id === cityAId)
      const cityB = strategyCities.find(c => c.id === cityBId)
      if (!cityA || !cityB) continue

      const [ax, ay] = dataToScreen(cityA.x, cityA.y)
      const [bx, by] = dataToScreen(cityB.x, cityB.y)

      // 在道路中点偏一侧画标记
      const mx = (ax + bx) / 2
      const my = (ay + by) / 2
      // 偏移方向：垂直于道路方向
      const dx = bx - ax
      const dy = by - ay
      const len = Math.sqrt(dx * dx + dy * dy)
      if (len < 1) continue
      const perpX = -dy / len
      const perpY = dx / len

      const featCount = features?.length ?? 0
      for (let fi = 0; fi < featCount; fi++) {
        const offset = (fi - (featCount - 1) / 2) * 18
        const fx = mx + perpX * offset
        const fy = my + perpY * offset
        const feat = features?.[fi]
        if (feat) this.drawFeatureIcon(g, fx, fy, feat)
      }
    }
  }

  private drawFeatureIcon(g: Phaser.GameObjects.Graphics, x: number, y: number, feature: RouteFeature) {
    switch (feature) {
      case 'village': {
        // 小房子图标
        g.fillStyle(0x4a6a3a, 0.8)
        g.fillRect(x - 4, y - 2, 8, 6)
        g.fillStyle(0x6a4a2a, 0.8)
        g.fillTriangle(x - 5, y - 2, x + 5, y - 2, x, y - 8)
        break
      }
      case 'supply': {
        // 粮草图标 (小菱形)
        g.fillStyle(0x8a7a3a, 0.8)
        g.fillTriangle(x, y - 5, x - 4, y + 1, x + 4, y + 1)
        g.fillTriangle(x, y + 5, x - 4, y - 1, x + 4, y - 1)
        break
      }
      case 'pass': {
        // 关隘图标 (城门形状)
        g.fillStyle(0x6a5a4a, 0.8)
        g.fillRect(x - 4, y - 2, 8, 7)
        g.fillStyle(0x2a1a0a, 0.8)
        g.fillRect(x - 2, y, 4, 5)
        // 拱顶
        g.lineStyle(1.5, 0x8a7a5a, 0.8)
        g.beginPath()
        g.arc(x, y - 2, 5, Math.PI, 0, false)
        g.strokePath()
        break
      }
      case 'ferry': {
        // 渡口图标 (波浪+船)
        g.lineStyle(1, 0x4a7a9a, 0.9)
        g.beginPath()
        g.moveTo(x - 4, y - 2)
        g.lineTo(x, y + 1)
        g.lineTo(x + 4, y - 2)
        g.strokePath()
        g.beginPath()
        g.moveTo(x - 4, y + 1)
        g.lineTo(x, y + 3)
        g.lineTo(x + 4, y + 1)
        g.strokePath()
        break
      }
    }
  }

  // ============================================================
  // 城池标记（圆点 + 势力色）
  // ============================================================
  private drawCityMarkers() {
    for (const sc of strategyCities) {
      const [cx, cy] = dataToScreen(sc.x, sc.y)
      // 使用运行时数据（攻占后颜色会变）
      const rt = gameState.getCity(sc.id)
      const owner = rt?.owner ?? sc.owner

      // 城池外圈（暗色阴影）
      const outer = this.add.circle(cx, cy, 10, 0x0a0604, 0.7)
      outer.setDepth(2)

      // 城池内圈（势力色填充）
      const factionColor = factionColorMap[owner] ?? 0x8a8f98
      const inner = this.add.circle(cx, cy, 7, factionColor, 0.9)
      inner.setDepth(3)
      inner.setStrokeStyle(1.5, 0xffe8b0, 0.5)

      // 都城特殊标记：外圈加金色环
      const faction = strategyFactions.find(f => f.capital === sc.id)
      if (faction) {
        const capitalRing = this.add.circle(cx, cy, 12, 0x000000, 0)
        capitalRing.setStrokeStyle(2, 0xf5d678, 0.8)
        capitalRing.setDepth(1)
      } else if (this.playerFactionId && owner === this.playerFactionId) {
        // 玩家攻占的新城池也加标记
        const newRing = this.add.circle(cx, cy, 12, 0x000000, 0)
        newRing.setStrokeStyle(2, 0x60ff60, 0.5)
        newRing.setDepth(1)
      }

      // 存储引用
      inner.setData('cityId', sc.id)
      inner.setInteractive(
        new Phaser.Geom.Circle(0, 0, 12),
        Phaser.Geom.Circle.Contains,
      )
      this.cityMarkers.set(sc.id, inner)
    }
  }

  // ============================================================
  // 城池地名标注（智能方向：根据屏幕象限选择偏移方向）
  // ============================================================
  private drawCityLabels() {
    const frameMidX = FRAME.x + FRAME.width / 2
    const frameMidY = FRAME.y + FRAME.height / 2

    for (const city of strategyCities) {
      const [cx, cy] = dataToScreen(city.x, city.y)

      // 根据城市在屏幕上的象限决定标签方向
      const isRight = cx > frameMidX + 60
      const isLeft = cx < frameMidX - 60
      const isBottom = cy > frameMidY + 40
      const isTop = cy < frameMidY - 40

      let originX = 0
      let originY = 0.5
      let labelX: number
      let labelY: number

      if (isRight && isTop) {
        // 右上 → 标签左下
        labelX = cx - 10
        labelY = cy + 14
        originX = 1
        originY = 0
      } else if (isRight && isBottom) {
        // 右下 → 标签左上
        labelX = cx - 10
        labelY = cy - 14
        originX = 1
        originY = 1
      } else if (isLeft && isTop) {
        // 左上 → 标签右下
        labelX = cx + 10
        labelY = cy + 14
        originX = 0
        originY = 0
      } else if (isLeft && isBottom) {
        // 左下 → 标签右上
        labelX = cx + 10
        labelY = cy - 14
        originX = 0
        originY = 1
      } else if (isRight) {
        // 右侧 → 标签左侧
        labelX = cx - 10
        labelY = cy
        originX = 1
        originY = 0.5
      } else if (isLeft) {
        // 左侧 → 标签右侧
        labelX = cx + 10
        labelY = cy
        originX = 0
        originY = 0.5
      } else if (isTop) {
        // 上方 → 标签下方
        labelX = cx
        labelY = cy + 14
        originX = 0.5
        originY = 0
      } else if (isBottom) {
        // 下方 → 标签上方
        labelX = cx
        labelY = cy - 14
        originX = 0.5
        originY = 1
      } else {
        // 中间 → 默认右偏移
        labelX = cx + 12
        labelY = cy - 2
        originX = 0
        originY = 0.5
      }

      // 边界裁剪：确保标签不超出 FRAME
      const padding = 8
      labelX = Phaser.Math.Clamp(labelX, FRAME.x + padding, FRAME.x + FRAME.width - padding)
      labelY = Phaser.Math.Clamp(labelY, FRAME.y + padding, FRAME.y + FRAME.height - padding)

      // 势力色文字
      const factionColor = factionColorMap[city.owner] ?? 0x8a8f98

      const label = this.add.text(labelX, labelY, city.name, {
        fontFamily: '"KaiTi", "STKaiti", "楷体", "Microsoft YaHei", serif',
        fontSize: '16px',
        color: '#' + factionColor.toString(16).padStart(6, '0'),
        stroke: '#0a0604',
        strokeThickness: 3,
      })
      label.setDepth(4)
      label.setOrigin(originX, originY)
      this.cityLabels.set(city.id, label)
    }
  }

  // ============================================================
  // 玩家城池高亮 — 绿色脉冲环
  // ============================================================
  private playerCityRings: Phaser.GameObjects.Arc[] = []

  private drawPlayerCitiesHighlight() {
    if (!this.playerFactionId) return

    const playerCities = strategyCities.filter(c => c.owner === this.playerFactionId)
    for (const city of playerCities) {
      const [cx, cy] = dataToScreen(city.x, city.y)

      const ring = this.add.circle(cx, cy, 15, 0x000000, 0)
      ring.setStrokeStyle(2.5, 0x60ff60, 0.9)
      ring.setDepth(5)
      this.playerCityRings.push(ring)

      this.tweens.add({
        targets: ring,
        radius: { from: 15, to: 20 },
        alpha: { from: 0.9, to: 0.3 },
        duration: 900,
        yoyo: true,
        repeat: -1,
      })
    }
  }

  // ============================================================
  // 底部命令栏（原版MD风格）
  // ============================================================
  private drawCommandBar() {
    this.commandBarContainer?.destroy()
    const container = this.add.container(0, 0).setDepth(90)
    this.commandBarContainer = container

    const barH = 40
    const barY = CANVAS_H - barH

    // 背景
    const g = this.add.graphics()
    g.fillStyle(0x0d0804, 0.92)
    g.fillRect(0, barY, CANVAS_W, barH)
    g.lineStyle(2, UI.borderDim, 0.5)
    g.lineBetween(0, barY, CANVAS_W, barY)
    g.lineStyle(1, 0x3a2818, 0.4)
    g.lineBetween(0, barY + 2, CANVAS_W, barY + 2)
    container.add(g)

    if (!this.playerFactionId) return

    const faction = strategyFactions.find(f => f.id === this.playerFactionId)
    if (!faction) return

    // 左侧：势力信息
    const infoX = 24
    const infoY = barY + barH / 2
    const dot = this.add.circle(infoX + 8, infoY, 6, faction.color, 0.9)
    dot.setStrokeStyle(1, 0xf5d678, 0.6)
    container.add(dot)
    const nameText = this.add.text(infoX + 22, infoY - 8, faction.name, {
      fontFamily: '"KaiTi", serif', fontSize: '15px', color: TXT.accent,
      stroke: '#0a0604', strokeThickness: 2,
    }).setOrigin(0, 0.5)
    container.add(nameText)
    const dateText = this.add.text(infoX + 22, infoY + 8, `${gameState.year}年 ${gameState.month}月  视察月`, {
      fontFamily: '"SimSun", serif', fontSize: '11px', color: TXT.muted,
    }).setOrigin(0, 0.5)
    container.add(dateText)

    // 右侧：命令按钮（水平排列）
    const commands = [
      { label: '内政', key: 'domestic' },
      { label: '外交', key: 'diplomacy' },
      { label: '军事', key: 'military' },
      { label: '情报', key: 'info' },
      { label: '月令', key: 'advance' },
    ]
    const btnW = 80, btnH = 30, btnGap = 8
    const totalBtnW = commands.length * btnW + (commands.length - 1) * btnGap
    const btnStartX = CANVAS_W - totalBtnW - 24

    for (let i = 0; i < commands.length; i++) {
      const bx = btnStartX + i * (btnW + btnGap)
      const by = barY + (barH - btnH) / 2

      const btnBg = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH,
        0x1a140c, 0.85,
      )
      btnBg.setStrokeStyle(1.5, UI.borderDim, 0.5)
      btnBg.setInteractive()
      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(0x2a1a0c, 0.95)
        this.input.setDefaultCursor('pointer')
      })
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x1a140c, 0.85))
      btnBg.on('pointerdown', () => this.onCommandSelect(commands[i].key))
      container.add(btnBg)

      const btnText = this.add.text(bx + btnW / 2, by + btnH / 2, commands[i].label, {
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '15px', color: TXT.body,
        stroke: '#0a0604', strokeThickness: 1,
      }).setOrigin(0.5)
      container.add(btnText)
    }

    // 键盘快捷键提示
    const hint = this.add.text(btnStartX - 16, barY + barH / 2, '1-5命令 M地图', {
      fontFamily: '"SimSun", serif', fontSize: '10px', color: TXT.muted,
    }).setOrigin(1, 0.5).setAlpha(0.4)
    container.add(hint)
  }

  private domesticSubPanel: Phaser.GameObjects.Container | null = null
  private resultModal: Phaser.GameObjects.Container | null = null
  private pendingCommand: string | null = null
  private toastText: Phaser.GameObjects.Text | null = null

  private closeAllSubPanels() {
    this.closeDomesticSubPanel()
    this.closeDiplomacyPanel()
    this.closeMilitaryPanel()
    this.closeResultModal()
    this.closeInfoModal()
    this.closeMarchArmyPanel()
  }

  private onCommandSelect(key: string) {
    this.closeAllSubPanels()

    // 行军月命令路由
    if (gameState.mode === 'march') {
      switch (key) {
        case 'army':    this.showArmyListPanel(); return
        case 'dest':    this.promptSetDestination(); return
        case 'march':   this.executeArmyMarch(); return
        case 'recall':  this.recallSelectedArmy(); return
        case 'end':     this.endMarch(); return
      }
      return
    }

    switch (key) {
      case 'domestic':
        this.showDomesticSubPanel()
        break
      case 'diplomacy':
        this.showDiplomacyFactionPicker()
        break
      case 'military':
        this.showMilitaryPanel()
        break
      case 'info':
        this.showCityInfoDetail()
        break
      case 'advance':
        this.advanceMonth()
        break
    }
  }

  // ============================================================
  // 内政子面板
  // ============================================================
  private showDomesticSubPanel() {
    if (!this.selectedCityId) {
      this.showToast('请先点击选择一座城池')
      this.pendingCommand = 'domestic'
      return
    }
    this.pendingCommand = null
    this.closeDomesticSubPanel()

    const city = gameState.getCity(this.selectedCityId as CityId)
    if (!city || city.owner !== this.playerFactionId) {
      this.showResultModal('内政', '只能对自己的城池执行内政', [])
      return
    }

    const panel = this.add.container(0, 0).setDepth(30)
    this.domesticSubPanel = panel

    // 半透明遮罩
    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeDomesticSubPanel())
    panel.add(veil)

    // 面板
    const pw = 420, ph = 480
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    // 标题
    const title = this.add.text(px + pw / 2, py + 20, `🏛  内 政  ·  ${city.name}`, {
      fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
      fontSize: '18px', color: TXT.accent,
    }).setOrigin(0.5)
    panel.add(title)

    // 城池资源条
    const resY = py + 44
    const resText = this.add.text(px + pw / 2, resY,
      `💰${city.gold}  🍚${city.food}  ⚔${city.troops}  🏰防${city.defense}`,
      { fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.body },
    ).setOrigin(0.5)
    panel.add(resText)

    // 分隔线
    const sep = this.add.graphics()
    sep.lineStyle(1, UI.borderDim, 0.4)
    sep.lineBetween(px + 20, resY + 16, px + pw - 20, resY + 16)
    panel.add(sep)

    // 九宫格布局（3×3，第9格为返回）
    const cols = 3
    const cellW = 110, cellH = 78
    const totalW = cols * cellW
    const gridX = px + (pw - totalW) / 2
    const gridY = resY + 28

    for (let i = 0; i < 9; i++) {
      const col = i % cols, row = Math.floor(i / cols)
      const cx = gridX + col * cellW + cellW / 2
      const cy = gridY + row * cellH + cellH / 2

      if (i < DOMESTIC_COMMANDS.length) {
        const cmd = DOMESTIC_COMMANDS[i]
        const cellBg = this.add.rectangle(cx, cy, cellW - 6, cellH - 6, 0x1a1208, 0.85)
        cellBg.setStrokeStyle(1.5, UI.borderDim, 0.35)
        cellBg.setInteractive()
        cellBg.on('pointerover', () => { cellBg.setFillStyle(0x2a1a0c, 0.9); this.input.setDefaultCursor('pointer') })
        cellBg.on('pointerout', () => cellBg.setFillStyle(0x1a1208, 0.85))
        cellBg.on('pointerdown', () => this.executeDomesticCommand(cmd.id, city.id))
        panel.add(cellBg)

        panel.add(this.add.text(cx, cy - 18, cmd.icon, {
          fontSize: '22px',
        }).setOrigin(0.5))

        panel.add(this.add.text(cx, cy + 8, cmd.name, {
          fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.body,
        }).setOrigin(0.5))

        const cost = cmd.cost(city.id)
        panel.add(this.add.text(cx, cy + 26, `${cost}金`, {
          fontFamily: 'Arial', fontSize: '10px',
          color: cost > city.gold ? '#c04040' : '#80a060',
        }).setOrigin(0.5))
      } else {
        // 返回格
        const cellBg = this.add.rectangle(cx, cy, cellW - 6, cellH - 6, 0x15100c, 0.6)
        cellBg.setStrokeStyle(1.5, UI.borderDim, 0.2)
        cellBg.setInteractive()
        cellBg.on('pointerover', () => { cellBg.setFillStyle(0x201810, 0.7); this.input.setDefaultCursor('pointer') })
        cellBg.on('pointerout', () => cellBg.setFillStyle(0x15100c, 0.6))
        cellBg.on('pointerdown', () => this.closeDomesticSubPanel())
        panel.add(cellBg)
        panel.add(this.add.text(cx, cy, '返回', {
          fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.muted,
        }).setOrigin(0.5))
      }
    }
  }

  private closeDomesticSubPanel() {
    this.domesticSubPanel?.destroy()
    this.domesticSubPanel = null
  }

  private executeDomesticCommand(commandId: string, cityId: CityId) {
    const result = DomesticSystem.execute(commandId, cityId)
    const cmd = DOMESTIC_COMMANDS.find(c => c.id === commandId)
    this.closeDomesticSubPanel()
    this.showResultModal(cmd?.name ?? '内政', result.message, result.effects)
    this.refreshCityDisplay()
  }

  // ============================================================
  // 外交系统
  // ============================================================
  private diplomacyPanel: Phaser.GameObjects.Container | null = null

  private showDiplomacyFactionPicker() {
    this.pendingCommand = null
    this.closeDiplomacyPanel()

    DiplomacySystem.init()

    const panel = this.add.container(0, 0).setDepth(30)
    this.diplomacyPanel = panel

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeDiplomacyPanel())
    panel.add(veil)

    // 面板
    const pw = 380, ph = 280
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    // 标题
    panel.add(this.add.text(px + pw / 2, py + 20, '🤝  外 交  ·  选择目标势力', {
      fontFamily: '"KaiTi", serif', fontSize: '18px', color: TXT.accent,
    }).setOrigin(0.5))

    // 目标势力按钮
    const targets = strategyFactions.filter(f =>
      f.id !== 'neutral' && f.id !== gameState.playerFactionId,
    )
    const btnW = 150, btnH = 36
    const startY = py + 50

    for (let i = 0; i < targets.length; i++) {
      const t = targets[i]
      const tx = px + pw / 2
      const ty = startY + i * (btnH + 8)

      const rel = DiplomacySystem.relations[t.id] ?? 50
      const btnBg = this.add.rectangle(tx, ty + btnH / 2, btnW, btnH, 0x1a140c, 0.85)
      btnBg.setStrokeStyle(1, t.color, 0.4)
      btnBg.setInteractive()
      btnBg.on('pointerover', () => { btnBg.setFillStyle(0x2a200c, 0.9); this.input.setDefaultCursor('pointer') })
      btnBg.on('pointerout', () => btnBg.setFillStyle(0x1a140c, 0.85))
      btnBg.on('pointerdown', () => this.showDiplomacyCommands(t.id))
      panel.add(btnBg)

      const relColor = rel >= 60 ? '#80c080' : rel >= 30 ? '#c0a040' : '#c06040'
      const label = this.add.text(tx, ty + btnH / 2, `${t.ruler} · ${t.name}  [好感:${rel}]`, {
        fontFamily: '"KaiTi", serif', fontSize: '14px', color: relColor,
      }).setOrigin(0.5)
      panel.add(label)
    }

    // 关闭
    const cls = this.add.text(px + pw - 16, py + 8, '✕', {
      fontFamily: 'Arial', fontSize: '16px', color: TXT.muted,
    }).setOrigin(1, 0).setInteractive()
    cls.on('pointerdown', () => this.closeDiplomacyPanel())
    panel.add(cls)
  }

  private showDiplomacyCommands(targetFactionId: FactionId) {
    this.closeDiplomacyPanel()

    const target = strategyFactions.find(f => f.id === targetFactionId)
    if (!target) return

    const panel = this.add.container(0, 0).setDepth(30)
    this.diplomacyPanel = panel

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeDiplomacyPanel())
    panel.add(veil)

    const pw = 440, ph = 380
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    const rel = DiplomacySystem.relations[target.id] ?? 50
    panel.add(this.add.text(px + pw / 2, py + 20, `🤝  外 交  ·  目标：${target.name}  [好感:${rel}]`, {
      fontFamily: '"KaiTi", serif', fontSize: '16px', color: TXT.accent,
    }).setOrigin(0.5))

    // 九宫格布局（3×3，第9格为返回）
    const cols = 3
    const cellW = 110, cellH = 72
    const totalW = cols * cellW
    const gridX = px + (pw - totalW) / 2
    const gridY = py + 44

    for (let i = 0; i < 9; i++) {
      const col = i % cols, row = Math.floor(i / cols)
      const cx = gridX + col * cellW + cellW / 2
      const cy = gridY + row * cellH + cellH / 2

      if (i < DIPLOMACY_COMMANDS.length) {
        const cmd = DIPLOMACY_COMMANDS[i]
        const cellBg = this.add.rectangle(cx, cy, cellW - 6, cellH - 6, 0x1a1208, 0.85)
        cellBg.setStrokeStyle(1.5, UI.borderDim, 0.35)
        cellBg.setInteractive()
        cellBg.on('pointerover', () => { cellBg.setFillStyle(0x2a1a0c, 0.9); this.input.setDefaultCursor('pointer') })
        cellBg.on('pointerout', () => cellBg.setFillStyle(0x1a1208, 0.85))
        cellBg.on('pointerdown', () => this.executeDiplomacyCommand(cmd.id, target.id))
        panel.add(cellBg)

        panel.add(this.add.text(cx, cy - 14, cmd.icon, { fontSize: '20px' }).setOrigin(0.5))
        panel.add(this.add.text(cx, cy + 8, cmd.name, {
          fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.body,
        }).setOrigin(0.5))
        panel.add(this.add.text(cx, cy + 24, `${cmd.cost}金`, {
          fontFamily: 'Arial', fontSize: '10px', color: '#80a060',
        }).setOrigin(0.5))
      } else {
        const cellBg = this.add.rectangle(cx, cy, cellW - 6, cellH - 6, 0x15100c, 0.6)
        cellBg.setStrokeStyle(1.5, UI.borderDim, 0.2)
        cellBg.setInteractive()
        cellBg.on('pointerover', () => { cellBg.setFillStyle(0x201810, 0.7); this.input.setDefaultCursor('pointer') })
        cellBg.on('pointerout', () => cellBg.setFillStyle(0x15100c, 0.6))
        cellBg.on('pointerdown', () => this.showDiplomacyFactionPicker())
        panel.add(cellBg)
        panel.add(this.add.text(cx, cy, '← 返回', {
          fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.muted,
        }).setOrigin(0.5))
      }
    }
  }

  private executeDiplomacyCommand(cmd: DiplomacyCommandKind, targetId: FactionId) {
    const result = DiplomacySystem.execute(cmd, targetId)
    this.closeDiplomacyPanel()
    this.showResultModal('外交', result.message, result.effects.map(e => ({ ...e, delta: 0 })))
    this.refreshCityDisplay()
  }

  private closeDiplomacyPanel() {
    this.diplomacyPanel?.destroy()
    this.diplomacyPanel = null
  }

  // ============================================================
  // 军事面板
  // ============================================================
  private militaryPanel: Phaser.GameObjects.Container | null = null

  private showMilitaryPanel() {
    if (!this.selectedCityId) {
      this.showToast('請先點擊選擇一座城池')
      this.pendingCommand = 'military'
      return
    }
    this.pendingCommand = null
    this.closeMilitaryPanel()

    const city = gameState.getCity(this.selectedCityId as CityId)
    if (!city || city.owner !== this.playerFactionId) {
      this.showResultModal('軍事', '只能對己方城池執行軍事命令', [])
      return
    }

    const panel = this.add.container(0, 0).setDepth(30)
    this.militaryPanel = panel

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeMilitaryPanel())
    panel.add(veil)

    const pw = 420, ph = 480
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    // 标题
    panel.add(this.add.text(px + pw / 2, py + 20, `⚔  軍 事  ·  ${city.name}`, {
      fontFamily: '"KaiTi", "STKaiti", "楷體", serif',
      fontSize: '18px', color: TXT.accent,
    }).setOrigin(0.5))

    // 城池资源条
    const resY = py + 44
    panel.add(this.add.text(px + pw / 2, resY,
      `💰${city.gold}  🍚${city.food}  ⚔${city.troops}  🏰防${city.defense}`,
      { fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.body },
    ).setOrigin(0.5))

    // 分隔线
    const sep = this.add.graphics()
    sep.lineStyle(1, UI.borderDim, 0.4)
    sep.lineBetween(px + 20, resY + 16, px + pw - 20, resY + 16)
    panel.add(sep)

    // 七宫格布局（3×3，第8/9格空或返回）
    const cols = 3
    const cellW = 110, cellH = 78
    const totalW = cols * cellW
    const gridX = px + (pw - totalW) / 2
    const gridY = resY + 28

    for (let i = 0; i < 9; i++) {
      const col = i % cols, row = Math.floor(i / cols)
      const cx = gridX + col * cellW + cellW / 2
      const cy = gridY + row * cellH + cellH / 2

      if (i < MILITARY_COMMANDS.length) {
        const cmd = MILITARY_COMMANDS[i]
        const cellBg = this.add.rectangle(cx, cy, cellW - 6, cellH - 6, 0x1a1208, 0.85)
        cellBg.setStrokeStyle(1.5, UI.borderDim, 0.35)
        cellBg.setInteractive()
        cellBg.on('pointerover', () => { cellBg.setFillStyle(0x2a1a0c, 0.9); this.input.setDefaultCursor('pointer') })
        cellBg.on('pointerout', () => cellBg.setFillStyle(0x1a1208, 0.85))
        cellBg.on('pointerdown', () => this.executeMilitaryCommand(cmd.id, city.id))
        panel.add(cellBg)

        panel.add(this.add.text(cx, cy - 18, cmd.icon, {
          fontSize: '22px',
        }).setOrigin(0.5))

        panel.add(this.add.text(cx, cy + 8, cmd.name, {
          fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.body,
        }).setOrigin(0.5))

        const cost = cmd.cost(city.id)
        panel.add(this.add.text(cx, cy + 26, cost > 0 ? `${cost}金` : '', {
          fontFamily: 'Arial', fontSize: '10px',
          color: cost > city.gold ? '#c04040' : '#80a060',
        }).setOrigin(0.5))
      } else {
        // 返回格
        const cellBg = this.add.rectangle(cx, cy, cellW - 6, cellH - 6, 0x15100c, 0.6)
        cellBg.setStrokeStyle(1.5, UI.borderDim, 0.2)
        cellBg.setInteractive()
        cellBg.on('pointerover', () => { cellBg.setFillStyle(0x201810, 0.7); this.input.setDefaultCursor('pointer') })
        cellBg.on('pointerout', () => cellBg.setFillStyle(0x15100c, 0.6))
        cellBg.on('pointerdown', () => this.closeMilitaryPanel())
        panel.add(cellBg)
        panel.add(this.add.text(cx, cy, '返回', {
          fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.muted,
        }).setOrigin(0.5))
      }
    }
  }

  private executeMilitaryCommand(commandId: string, cityId: CityId) {
    // 出征命令：进入出征编成流程
    if (commandId === 'deploy') {
      this.closeMilitaryPanel()
      this.showDeployCityPicker()
      return
    }

    // 其他命令：直接执行
    const result = MilitarySystem.execute(commandId, cityId)
    const cmd = MILITARY_COMMANDS.find(c => c.id === commandId)
    this.closeMilitaryPanel()
    this.showResultModal(cmd?.name ?? '軍事', result.message, result.effects)
    this.refreshCityDisplay()
  }

  // ---- 出征：选择出发城 ----
  private showDeployCityPicker() {
    const playerCities = gameState.getPlayerCities().filter(c => c.troops >= 500)
    if (playerCities.length === 0) {
      this.showToast('沒有可出征的城池（至少需要500兵力）')
      return
    }

    const panel = this.add.container(0, 0).setDepth(30)
    this.militaryPanel = panel

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeMilitaryPanel())
    panel.add(veil)

    const pw = 500, ph = 400
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    panel.add(this.add.text(px + pw / 2, py + 18, '⚔  出 征  ·  選擇出發城池', {
      fontFamily: '"KaiTi", serif', fontSize: '18px', color: TXT.accent,
    }).setOrigin(0.5))

    // 列标题
    const colX = [px + 30, px + 130, px + 230, px + 330, px + 430]
    const headerY = py + 42
    for (let i = 0; i < 3; i++) {
      panel.add(this.add.text(colX[i], headerY, ['城池', '兵力', '防禦'][i], {
        fontFamily: '"SimSun", serif', fontSize: '12px', color: TXT.muted,
      }).setOrigin(0, 0.5))
    }

    const listStartY = headerY + 22
    const itemH = 32

    for (let i = 0; i < Math.min(playerCities.length, 8); i++) {
      const pc = playerCities[i]
      const iy = listStartY + i * itemH

      const rowBg = this.add.rectangle(px + pw / 2, iy + itemH / 2, pw - 30, itemH - 2,
        i % 2 === 0 ? 0x18120c : 0x1a140c, 0.5,
      )
      panel.add(rowBg)

      panel.add(this.add.text(colX[0], iy + itemH / 2, pc.name, {
        fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.body,
      }).setOrigin(0, 0.5))
      panel.add(this.add.text(colX[1], iy + itemH / 2, `${pc.troops}`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#c0a870',
      }).setOrigin(0, 0.5))
      panel.add(this.add.text(colX[2], iy + itemH / 2, `${pc.defense}`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#c0a870',
      }).setOrigin(0, 0.5))

      const btn = this.add.text(colX[3] + 20, iy + itemH / 2, '⚔ 出征', {
        fontFamily: '"KaiTi", serif', fontSize: '13px', color: '#e0a050',
        stroke: '#0a0604', strokeThickness: 1,
      }).setOrigin(0.5).setInteractive()
      btn.on('pointerover', () => { btn.setColor('#f5d678'); this.input.setDefaultCursor('pointer') })
      btn.on('pointerout', () => btn.setColor('#e0a050'))
      btn.on('pointerdown', () => this.showDeployTargetPicker(pc.id))
      panel.add(btn)
    }

    const cls = this.add.text(px + pw - 16, py + 8, '✕', {
      fontFamily: 'Arial', fontSize: '16px', color: TXT.muted,
    }).setOrigin(1, 0).setInteractive()
    cls.on('pointerdown', () => this.closeMilitaryPanel())
    panel.add(cls)
  }

  private showDeployTargetPicker(sourceCityId: CityId) {
    this.closeMilitaryPanel()

    const source = gameState.getCity(sourceCityId)
    if (!source) return

    const targets = MilitarySystem.getAttackableCities()
    if (targets.length === 0) {
      this.showToast('没有可攻击的目标')
      return
    }

    const panel = this.add.container(0, 0).setDepth(30)
    this.militaryPanel = panel

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeMilitaryPanel())
    panel.add(veil)

    const pw = 420, ph = 380
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    panel.add(this.add.text(px + pw / 2, py + 18,
      `⚔  从 ${source.name} 出征  [兵力:${source.troops}]`, {
        fontFamily: '"KaiTi", serif', fontSize: '16px', color: TXT.accent,
      }).setOrigin(0.5))

    panel.add(this.add.text(px + pw / 2, py + 38, '选择攻击目标：', {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.muted,
    }).setOrigin(0.5))

    // 目标列表
    const listStartY = py + 58
    const itemH = 30
    const colX2 = [px + 30, px + 160, px + 280]

    for (let i = 0; i < Math.min(targets.length, 8); i++) {
      const { city, distance } = targets[i]
      if (!city) continue
      const owner = strategyFactions.find(f => f.id === city.owner)
      const iy = listStartY + i * itemH

      const rowBg = this.add.rectangle(px + pw / 2, iy + itemH / 2, pw - 30, itemH - 2,
        i % 2 === 0 ? 0x18120c : 0x1a140c, 0.5,
      )
      panel.add(rowBg)

      panel.add(this.add.text(colX2[0], iy + itemH / 2, city.name, {
        fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.body,
      }).setOrigin(0, 0.5))
      panel.add(this.add.text(colX2[1], iy + itemH / 2,
        `${owner?.name ?? '?'}  🛡${city.troops}  📏${distance}`, {
          fontFamily: '"SimSun", serif', fontSize: '12px', color: TXT.muted,
        }).setOrigin(0, 0.5))

      const atk = this.add.text(colX2[2], iy + itemH / 2, '⚔ 攻击', {
        fontFamily: '"KaiTi", serif', fontSize: '13px', color: '#e06040',
      }).setOrigin(0.5).setInteractive()
      atk.on('pointerover', () => { atk.setColor('#ff8060'); this.input.setDefaultCursor('pointer') })
      atk.on('pointerout', () => atk.setColor('#e06040'))
      atk.on('pointerdown', () => {
        const troops = Math.min(source.troops, Math.max(500, Math.floor(source.troops * 0.7)))
        const result = MilitarySystem.deployArmy(sourceCityId, city.id, troops)
        this.closeMilitaryPanel()
        this.showResultModal('军事', result.message, result.effects)
        this.refreshCityDisplay()
      })
      panel.add(atk)
    }

    // 返回
    const back = this.add.text(px + pw / 2, py + ph - 16, '← 返回', {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.muted,
    }).setOrigin(0.5).setInteractive()
    back.on('pointerdown', () => this.showMilitaryPanel())
    panel.add(back)
  }

  private closeMilitaryPanel() {
    this.militaryPanel?.destroy()
    this.militaryPanel = null
  }

  // ============================================================
  // 结果弹窗
  // ============================================================
  private showResultModal(title: string, message: string, effects: { label: string; value: string; delta: number }[]) {
    this.closeResultModal()

    const modal = this.add.container(0, 0).setDepth(40)
    this.resultModal = modal

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeResultModal())
    modal.add(veil)

    const mw = 340, mh = 200
    const mx = (CANVAS_W - mw) / 2, my = (CANVAS_H - mh) / 2

    const bg = this.add.rectangle(mx + mw / 2, my + mh / 2, mw, mh, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.accent, 0.6)
    modal.add(bg)

    const titleText = this.add.text(mx + mw / 2, my + 18, title, {
      fontFamily: '"KaiTi", serif', fontSize: '17px', color: TXT.accent,
    }).setOrigin(0.5)
    modal.add(titleText)

    const msgText = this.add.text(mx + mw / 2, my + 55, message, {
      fontFamily: '"SimSun", serif', fontSize: '14px', color: TXT.body,
      wordWrap: { width: mw - 30 }, align: 'center',
    }).setOrigin(0.5)
    modal.add(msgText)

    if (effects.length > 0) {
      const fxY = my + 95
      const fxLines = effects.map(e =>
        `${e.label}: ${e.value}  ${e.delta >= 0 ? '↑' : '↓'}${Math.abs(e.delta)}`
      ).join('  |  ')
      const fxText = this.add.text(mx + mw / 2, fxY, fxLines, {
        fontFamily: '"SimSun", serif', fontSize: '12px', color: '#c0a870',
      }).setOrigin(0.5)
      modal.add(fxText)
    }

    const okText = this.add.text(mx + mw / 2, my + mh - 20, '—— 点击确认 ——', {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.muted,
    }).setOrigin(0.5)
    modal.add(okText)
  }

  private closeResultModal() {
    this.resultModal?.destroy()
    this.resultModal = null
  }

  // ============================================================
  // 浮动提示（不阻塞地图交互）
  // ============================================================
  private showToast(message: string) {
    this.toastText?.destroy()

    const toast = this.add.text(CANVAS_W / 2, CANVAS_H - 80, message, {
      fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
      fontSize: '20px',
      color: '#f5d678',
      stroke: '#0a0604',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100).setAlpha(0)

    this.toastText = toast

    // 淡入 → 停留 → 淡出
    this.tweens.add({
      targets: toast,
      alpha: { from: 0, to: 1 },
      duration: 200,
      onComplete: () => {
        this.tweens.add({
          targets: toast,
          alpha: { from: 1, to: 0 },
          delay: 1500,
          duration: 500,
          onComplete: () => {
            this.toastText?.destroy()
            this.toastText = null
          },
        })
      },
    })
  }

  // ============================================================
  // 城池详情（情报按钮）
  // ============================================================
  private infoModal: Phaser.GameObjects.Container | null = null

  private showCityInfoDetail() {
    if (!this.selectedCityId) {
      this.showToast('请先点击选择一座城池')
      this.pendingCommand = 'info'
      return
    }
    this.pendingCommand = null
    this.closeInfoModal()

    const city = gameState.getCity(this.selectedCityId as CityId)
    if (!city) return

    const faction = strategyFactions.find(f => f.id === city.owner)
    const factionName = faction?.name ?? '未知'

    const modal = this.add.container(0, 0).setDepth(40)
    this.infoModal = modal

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeInfoModal())
    modal.add(veil)

    const mw = 400, mh = 340
    const mx = (CANVAS_W - mw) / 2, my = (CANVAS_H - mh) / 2
    const bg = this.add.rectangle(mx + mw / 2, my + mh / 2, mw, mh, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.accent, 0.6)
    modal.add(bg)

    // 标题
    modal.add(this.add.text(mx + mw / 2, my + 16, `🏯 ${city.name}  [${city.region}]`, {
      fontFamily: '"KaiTi", serif', fontSize: '16px', color: TXT.accent,
    }).setOrigin(0.5))

    // 领主
    modal.add(this.add.text(mx + mw / 2, my + 38, `领主：${factionName}`, {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.body,
    }).setOrigin(0.5))

    // 分隔线
    const sep = this.add.graphics()
    sep.lineStyle(1, UI.borderDim, 0.4)
    sep.lineBetween(mx + 20, my + 56, mx + mw - 20, my + 56)
    modal.add(sep)

    // 详情网格（2列）
    const rows = [
      ['💰 金钱', city.gold.toLocaleString(), '🍚 粮草', city.food.toLocaleString()],
      ['⚔ 兵力', city.troops.toLocaleString(), '🏰 守备', `${city.defense}`],
      ['🌾 土地', `${city.land}`, '💹 商业', `${city.commerce}`],
      ['🌊 灌溉', `${city.irrigation}`, '⚡ 灾害', `${city.disaster}`],
      ['👥 人口', city.population.toLocaleString(), '⚖ 治安', `${city.publicOrder}`],
    ]

    const col1X = mx + 40, col2X = mx + mw / 2 + 20
    const rowStartY = my + 68, rowH = 26

    for (let i = 0; i < rows.length; i++) {
      const ry = rowStartY + i * rowH
      modal.add(this.add.text(col1X, ry, `${rows[i][0]}：${rows[i][1]}`, {
        fontFamily: '"SimSun", serif', fontSize: '13px', color: '#c0a870',
      }))
      modal.add(this.add.text(col2X, ry, `${rows[i][2]}：${rows[i][3]}`, {
        fontFamily: '"SimSun", serif', fontSize: '13px', color: '#c0a870',
      }))
    }

    // 关闭
    const ok = this.add.text(mx + mw / 2, my + mh - 16, '—— 点击确认 ——', {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.muted,
    }).setOrigin(0.5)
    modal.add(ok)
  }

  private closeInfoModal() {
    this.infoModal?.destroy()
    this.infoModal = null
  }

  // ============================================================
  // 月令推进
  // ============================================================
  private confirmModal: Phaser.GameObjects.Container | null = null

  private advanceMonth() {
    this.closeConfirmModal()
    const modal = this.add.container(0, 0).setDepth(45)
    this.confirmModal = modal

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeConfirmModal())
    modal.add(veil)

    const mw = 300, mh = 180
    const mx = (CANVAS_W - mw) / 2, my = (CANVAS_H - mh) / 2
    const bg = this.add.rectangle(mx + mw / 2, my + mh / 2, mw, mh, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.accent, 0.6)
    modal.add(bg)

    modal.add(this.add.text(mx + mw / 2, my + 24, '⏭  月 令 推 进', {
      fontFamily: '"KaiTi", serif', fontSize: '18px', color: TXT.accent,
    }).setOrigin(0.5))

    modal.add(this.add.text(mx + mw / 2, my + 56, `即将进入行军月，部署的军队将可以移动`, {
      fontFamily: '"SimSun", serif', fontSize: '14px', color: TXT.body,
    }).setOrigin(0.5))

    modal.add(this.add.text(mx + mw / 2, my + 80, '请在视察月完成内政外交后再推进。确定？', {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.muted,
    }).setOrigin(0.5))

    // 确定按钮
    const confirmBg = this.add.rectangle(mx + mw / 2 - 50, my + mh - 40, 80, 30, 0x2a4a1a, 0.8)
    confirmBg.setStrokeStyle(1, 0x4a8a3a, 0.5)
    confirmBg.setInteractive()
    confirmBg.on('pointerdown', () => {
      this.closeConfirmModal()
      this.enterMarchMode()
    })
    modal.add(confirmBg)
    modal.add(this.add.text(mx + mw / 2 - 50, my + mh - 40, '确定', {
      fontFamily: '"KaiTi", serif', fontSize: '15px', color: '#a0d0a0',
    }).setOrigin(0.5))

    // 取消按钮
    const cancelBg = this.add.rectangle(mx + mw / 2 + 50, my + mh - 40, 80, 30, 0x2a1a1a, 0.8)
    cancelBg.setStrokeStyle(1, UI.borderDim, 0.5)
    cancelBg.setInteractive()
    cancelBg.on('pointerdown', () => this.closeConfirmModal())
    modal.add(cancelBg)
    modal.add(this.add.text(mx + mw / 2 + 50, my + mh - 40, '取消', {
      fontFamily: '"KaiTi", serif', fontSize: '15px', color: TXT.muted,
    }).setOrigin(0.5))
  }

  private closeConfirmModal() {
    this.confirmModal?.destroy()
    this.confirmModal = null
  }

  // ============================================================
  // 刷新城池显示
  // ============================================================
  private refreshCityDisplay() {
    // 销毁旧标记
    for (const marker of this.cityMarkers.values()) marker.destroy()
    for (const label of this.cityLabels.values()) label.destroy()
    this.cityMarkers.clear()
    this.cityLabels.clear()
    // 重绘
    this.drawCityMarkers()
    this.drawCityLabels()
    this.drawPlayerCitiesHighlight()
    // 行军月刷新军队标记
    if (gameState.mode === 'march') {
      this.refreshArmyMarkers()
    }
  }

  // ============================================================
  // 行军月：模式切换
  // ============================================================
  private enterMarchMode() {
    gameState.enterMarchMode()
    this.commandBarContainer?.destroy()
    this.commandBarContainer = null
    this.drawMarchCommandBar()
    this.drawArmyMarkers()
    this.marchRouteGraphics = this.add.graphics().setDepth(8)
    this.closeAllSubPanels()
    this.selectedArmyId = null
    this.showToast('进入行军月，请选择军队')
  }

  private exitMarchMode() {
    gameState.endMarchMode()
    // 销毁行军月专用元素
    this.clearArmyMarkers()
    this.marchRouteGraphics?.destroy()
    this.marchRouteGraphics = null
    this.closeMarchArmyPanel()
    this.selectedArmyId = null
    this.commandBarContainer?.destroy()
    this.commandBarContainer = null
    this.drawCommandBar()
    this.refreshCityDisplay()
    this.showResultModal('月令推进', `${gameState.year}年 ${gameState.month}月  视察月开始`, [])
  }

  // ============================================================
  // 行军月：底部命令栏
  // ============================================================
  private drawMarchCommandBar() {
    this.commandBarContainer?.destroy()
    const container = this.add.container(0, 0).setDepth(90)
    this.commandBarContainer = container

    const barH = 40
    const barY = CANVAS_H - barH

    const g = this.add.graphics()
    g.fillStyle(0x0d0804, 0.92)
    g.fillRect(0, barY, CANVAS_W, barH)
    g.lineStyle(2, UI.borderDim, 0.5)
    g.lineBetween(0, barY, CANVAS_W, barY)
    g.lineStyle(1, 0x4a3a18, 0.4)
    g.lineBetween(0, barY + 2, CANVAS_W, barY + 2)
    container.add(g)

    if (!this.playerFactionId) return
    const faction = strategyFactions.find(f => f.id === this.playerFactionId)
    if (!faction) return

    // 左侧
    const infoX = 24
    const infoY = barY + barH / 2
    const dot = this.add.circle(infoX + 8, infoY, 6, faction.color, 0.9)
    dot.setStrokeStyle(1, 0xf5d678, 0.6)
    container.add(dot)
    container.add(this.add.text(infoX + 22, infoY - 8, faction.name, {
      fontFamily: '"KaiTi", serif', fontSize: '15px', color: TXT.accent,
      stroke: '#0a0604', strokeThickness: 2,
    }).setOrigin(0, 0.5))
    container.add(this.add.text(infoX + 22, infoY + 8, `${gameState.year}年 ${gameState.month}月  行军月`, {
      fontFamily: '"SimSun", serif', fontSize: '11px', color: '#e0a050',
    }).setOrigin(0, 0.5))

    // 右侧：行军月命令
    const commands = [
      { label: '军队', key: 'army' },
      { label: '目的地', key: 'dest' },
      { label: '行军', key: 'march' },
      { label: '撤退', key: 'recall' },
      { label: '结束', key: 'end' },
    ]
    const btnW = 80, btnH = 30, btnGap = 8
    const totalBtnW = commands.length * btnW + (commands.length - 1) * btnGap
    const btnStartX = CANVAS_W - totalBtnW - 24

    this.marchBtns = []
    for (let i = 0; i < commands.length; i++) {
      const bx = btnStartX + i * (btnW + btnGap)
      const by = barY + (barH - btnH) / 2

      const btnBg = this.add.rectangle(bx + btnW / 2, by + btnH / 2, btnW, btnH,
        i === 4 ? 0x2a1a1a : 0x1a140c, 0.85,
      )
      btnBg.setStrokeStyle(1.5, i === 4 ? 0xc04438 : UI.borderDim, 0.5)
      btnBg.setInteractive()
      btnBg.on('pointerover', () => {
        btnBg.setFillStyle(i === 4 ? 0x3a2a2a : 0x2a1a0c, 0.95)
        this.input.setDefaultCursor('pointer')
      })
      btnBg.on('pointerout', () => btnBg.setFillStyle(i === 4 ? 0x2a1a1a : 0x1a140c, 0.85))
      btnBg.on('pointerdown', () => this.onCommandSelect(commands[i].key))
      container.add(btnBg)
      this.marchBtns.push(btnBg)

      container.add(this.add.text(bx + btnW / 2, by + btnH / 2, commands[i].label, {
        fontFamily: '"KaiTi", "STKaiti", "楷体", serif',
        fontSize: '15px', color: i === 4 ? '#e08080' : TXT.body,
        stroke: '#0a0604', strokeThickness: 1,
      }).setOrigin(0.5))
    }

    container.add(this.add.text(btnStartX - 16, barY + barH / 2, '1-5命令', {
      fontFamily: '"SimSun", serif', fontSize: '10px', color: TXT.muted,
    }).setOrigin(1, 0.5).setAlpha(0.4))

    this.updateMarchButtons()
  }

  private updateMarchButtons() {
    const hasSelected = this.selectedArmyId !== null
    const army = this.selectedArmyId ? gameState.getArmy(this.selectedArmyId) : null
    const hasRoute = army ? army.routePlan.length > 0 : false

    // 按钮: 0=军队, 1=目的地, 2=行军, 3=撤退, 4=结束
    // 目的地/撤退: 需要选中军队
    // 行军: 需要选中军队且有路线
    const enabled = [true, hasSelected, hasSelected && hasRoute, hasSelected, true]
    for (let i = 0; i < this.marchBtns.length; i++) {
      this.marchBtns[i].setAlpha(enabled[i] ? 1 : 0.35)
    }
  }

  // ============================================================
  // 行军月：军队标记渲染
  // ============================================================
  private drawArmyMarkers() {
    const armies = gameState.getPlayerArmies()
    // 按城池分组，同城军队偏移排列
    const cityArmyCounts = new Map<string, number>()

    for (const army of armies) {
      const cityId = army.position.cityId ?? army.sourceCityId
      const staticCity = strategyCities.find(c => c.id === cityId)
      if (!staticCity) continue

      const [cx, cy] = dataToScreen(staticCity.x, staticCity.y)
      const idx = cityArmyCounts.get(cityId) ?? 0
      cityArmyCounts.set(cityId, idx + 1)

      // 菱形标记偏移（右上方）
      const offsetX = 18 + idx * 16
      const offsetY = -18 - idx * 10
      const mx = cx + offsetX
      const my = cy + offsetY

      const faction = strategyFactions.find(f => f.id === army.factionId)
      const color = faction?.color ?? 0x8a8f98

      // 菱形（正方形旋转45°）
      const diamond = this.add.rectangle(mx, my, 14, 14, color, 0.9)
      diamond.setRotation(Math.PI / 4)
      diamond.setStrokeStyle(2, 0xf5d678, 0.8)
      diamond.setDepth(10)
      diamond.setInteractive(
        new Phaser.Geom.Rectangle(-10, -10, 20, 20),
        Phaser.Geom.Rectangle.Contains,
      )
      diamond.setData('armyId', army.id)
      diamond.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation()
        this.selectArmy(army.id)
      })
      this.armyMarkers.set(army.id, diamond as unknown as Phaser.GameObjects.Arc)

      // 兵力数字
      const label = this.add.text(mx + 12, my, `${army.troops}`, {
        fontFamily: 'Arial', fontSize: '10px', color: '#f5d678',
        stroke: '#0a0604', strokeThickness: 2,
      }).setOrigin(0, 0.5).setDepth(11)
      this.armyLabels.set(army.id, label)
    }
  }

  private clearArmyMarkers() {
    for (const m of this.armyMarkers.values()) m.destroy()
    for (const l of this.armyLabels.values()) l.destroy()
    this.armyMarkers.clear()
    this.armyLabels.clear()
  }

  private refreshArmyMarkers() {
    this.clearArmyMarkers()
    this.drawArmyMarkers()
  }

  // ============================================================
  // 行军月：军队选择
  // ============================================================
  private selectArmy(armyId: string) {
    // 取消之前的选中
    if (this.selectedArmyId) {
      const prev = this.armyMarkers.get(this.selectedArmyId)
      prev?.setScale(1)
    }

    this.selectedArmyId = armyId
    const marker = this.armyMarkers.get(armyId)
    if (marker) {
      marker.setScale(1.4)
      // 闪烁
      this.tweens.add({
        targets: marker,
        alpha: { from: 1, to: 0.4 },
        duration: 500,
        yoyo: true,
        repeat: -1,
      })
    }

    // 绘制路线
    const army = gameState.getArmy(armyId)
    if (army && army.routePlan.length > 0) {
      this.drawRouteOnMap(army.routePlan)
    } else if (this.marchRouteGraphics) {
      this.marchRouteGraphics.clear()
    }

    // 显示军队详情
    this.showArmyInfoPanel(armyId)
    this.updateMarchButtons()
  }

  private deselectArmy() {
    if (this.selectedArmyId) {
      const prev = this.armyMarkers.get(this.selectedArmyId)
      if (prev) {
        this.tweens.killTweensOf(prev)
        prev.setAlpha(1).setScale(1)
      }
    }
    this.selectedArmyId = null
    if (this.marchRouteGraphics) this.marchRouteGraphics.clear()
    this.closeMarchArmyPanel()
    this.updateMarchButtons()
  }

  // ============================================================
  // 行军月：军队详情面板
  // ============================================================
  private showArmyInfoPanel(armyId: string) {
    this.closeMarchArmyPanel()

    const army = gameState.getArmy(armyId)
    if (!army) return

    const panel = this.add.container(0, 0).setDepth(30)
    this.marchArmyPanel = panel

    // 面板（右下角，不遮挡地图）
    const pw = 320, ph = 280
    const px = CANVAS_W - pw - 20
    const py = CANVAS_H - ph - 60
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    // 标题
    panel.add(this.add.text(px + pw / 2, py + 16, '⚔ 军队详情', {
      fontFamily: '"KaiTi", serif', fontSize: '16px', color: TXT.accent,
    }).setOrigin(0.5))

    // 主将
    const leader = strategyOfficers.find(o => o.id === army.leaderOfficerId)
    panel.add(this.add.text(px + pw / 2, py + 38, `主将：${leader?.name ?? '未知'}`, {
      fontFamily: '"KaiTi", serif', fontSize: '14px', color: TXT.body,
    }).setOrigin(0.5))

    // 基本信息
    const sourceCity = strategyCities.find(c => c.id === army.sourceCityId)
    const destCityId = army.routePlan.length > 0 ? army.routePlan[army.routePlan.length - 1] : null
    const destCity = destCityId ? strategyCities.find(c => c.id === destCityId) : null

    const rows = [
      `兵力：${army.troops.toLocaleString()}  粮草：${army.food.toLocaleString()}`,
      `士气：${army.morale}  武将：${army.officerIds.length}人`,
      `出发：${sourceCity?.name ?? '?'}`,
      `目标：${destCity?.name ?? '未设定'}  ${army.routePlan.length > 0 ? `(途经${army.routePlan.length}站)` : ''}`,
    ]

    for (let i = 0; i < rows.length; i++) {
      panel.add(this.add.text(px + 20, py + 60 + i * 22, rows[i], {
        fontFamily: '"SimSun", serif', fontSize: '13px', color: '#c0a870',
      }))
    }

    // 武将列表
    panel.add(this.add.text(px + 20, py + 152, '━━━ 武将 ━━━', {
      fontFamily: '"SimSun", serif', fontSize: '11px', color: TXT.muted,
    }))

    const officerNames = army.officerIds.map(id => {
      const o = strategyOfficers.find(off => off.id === id)
      const troops = army.officerTroops[id] ?? 0
      return `${o?.name ?? '?'}(${troops})`
    }).join('  ')
    panel.add(this.add.text(px + 20, py + 170, officerNames, {
      fontFamily: '"SimSun", serif', fontSize: '12px', color: '#a09070',
      wordWrap: { width: pw - 40 },
    }))

    // 状态
    const statusMap: Record<string, string> = {
      ready: '待命', marching: '行军中', besieging: '攻城中', retreating: '撤退中', routed: '溃败',
    }
    panel.add(this.add.text(px + 20, py + 210, `状态：${statusMap[army.status] ?? army.status}`, {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: '#e0a050',
    }))

    // 提示
    panel.add(this.add.text(px + pw / 2, py + ph - 20, '点击城市设定目的地', {
      fontFamily: '"SimSun", serif', fontSize: '11px', color: TXT.muted,
    }).setOrigin(0.5))

    // 关闭按钮
    const cls = this.add.text(px + pw - 12, py + 6, '✕', {
      fontFamily: 'Arial', fontSize: '14px', color: TXT.muted,
    }).setOrigin(1, 0).setInteractive()
    cls.on('pointerdown', () => this.deselectArmy())
    panel.add(cls)
  }

  private closeMarchArmyPanel() {
    this.marchArmyPanel?.destroy()
    this.marchArmyPanel = null
  }

  // ============================================================
  // 行军月：路线绘制
  // ============================================================
  private drawRouteOnMap(route: CityId[]) {
    if (!this.marchRouteGraphics) return
    this.marchRouteGraphics.clear()

    if (route.length === 0) return

    // 从当前位置出发
    const army = this.selectedArmyId ? gameState.getArmy(this.selectedArmyId) : null
    const startPos = army?.position.cityId
    const fullPath = startPos ? [startPos, ...route] : route

    // 画路线
    this.marchRouteGraphics.lineStyle(3, 0xf5d678, 0.8)
    for (let i = 0; i < fullPath.length - 1; i++) {
      const a = strategyCities.find(c => c.id === fullPath[i])
      const b = strategyCities.find(c => c.id === fullPath[i + 1])
      if (!a || !b) continue
      const [ax, ay] = dataToScreen(a.x, a.y)
      const [bx, by] = dataToScreen(b.x, b.y)
      this.marchRouteGraphics.lineBetween(ax, ay, bx, by)
    }

    // 途经点标记
    for (let i = 0; i < fullPath.length; i++) {
      const city = strategyCities.find(c => c.id === fullPath[i])
      if (!city) continue
      const [sx, sy] = dataToScreen(city.x, city.y)
      const isEnd = i === fullPath.length - 1
      const isStart = i === 0
      if (isStart) {
        // 起点：绿色圆
        this.marchRouteGraphics.fillStyle(0x40c040, 0.9)
        this.marchRouteGraphics.fillCircle(sx, sy, 5)
      } else if (isEnd) {
        // 终点：红色三角
        this.marchRouteGraphics.fillStyle(0xe04040, 0.9)
        this.marchRouteGraphics.fillTriangle(sx, sy - 7, sx - 6, sy + 4, sx + 6, sy + 4)
      } else {
        // 途经：金色小点
        this.marchRouteGraphics.fillStyle(0xf5d678, 0.7)
        this.marchRouteGraphics.fillCircle(sx, sy, 3)
      }
    }
  }

  // ============================================================
  // 行军月：设定目的地
  // ============================================================
  private promptSetDestination() {
    if (!this.selectedArmyId) {
      this.showToast('请先选择一支军队')
      return
    }
    this.showToast('请点击目标城市')
  }

  private setArmyDestination(armyId: string, targetCityId: CityId) {
    const army = gameState.getArmy(armyId)
    if (!army) return

    const currentCityId = army.position.cityId ?? army.sourceCityId
    if (currentCityId === targetCityId) {
      this.showToast('已在该城')
      return
    }

    const route = MilitarySystem.computeRoute(currentCityId, targetCityId)
    if (route.length === 0) {
      this.showToast('无法到达目标城池')
      return
    }

    army.targetCityId = targetCityId
    army.routePlan = route

    const dest = strategyCities.find(c => c.id === targetCityId)
    this.drawRouteOnMap(route)
    this.showToast(`目的地：${dest?.name ?? targetCityId}，途经${route.length}站`)

    // 刷新详情面板
    this.showArmyInfoPanel(armyId)
    this.updateMarchButtons()
  }

  // ============================================================
  // 行军月：执行行军
  // ============================================================
  private executeArmyMarch() {
    if (!this.selectedArmyId) {
      this.showToast('请先选择一支军队')
      return
    }
    const army = gameState.getArmy(this.selectedArmyId)
    if (!army) return
    if (army.routePlan.length === 0) {
      this.showToast('请先设定目的地')
      return
    }

    const result = MilitarySystem.executeMarch(this.selectedArmyId)
    this.deselectArmy()
    this.refreshCityDisplay()
    this.showResultModal('行军', result.message, result.effects)
  }

  // ============================================================
  // 行军月：撤退
  // ============================================================
  private recallSelectedArmy() {
    if (!this.selectedArmyId) {
      this.showToast('请先选择一支军队')
      return
    }
    const result = MilitarySystem.recallArmy(this.selectedArmyId)
    this.deselectArmy()
    this.refreshCityDisplay()
    if (result.success) {
      this.showToast(result.message)
    } else {
      this.showToast(result.message)
    }
  }

  // ============================================================
  // 行军月：结束行军
  // ============================================================
  private endMarch() {
    this.closeConfirmModal()
    const modal = this.add.container(0, 0).setDepth(45)
    this.confirmModal = modal

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeConfirmModal())
    modal.add(veil)

    const mw = 300, mh = 160
    const mx = (CANVAS_W - mw) / 2, my = (CANVAS_H - mh) / 2
    const bg = this.add.rectangle(mx + mw / 2, my + mh / 2, mw, mh, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.accent, 0.6)
    modal.add(bg)

    modal.add(this.add.text(mx + mw / 2, my + 24, '⏭  结 束 行 军', {
      fontFamily: '"KaiTi", serif', fontSize: '18px', color: TXT.accent,
    }).setOrigin(0.5))

    modal.add(this.add.text(mx + mw / 2, my + 60, '未行动的军队将原地待命。确定结束？', {
      fontFamily: '"SimSun", serif', fontSize: '13px', color: TXT.muted,
    }).setOrigin(0.5))

    const confirmBg = this.add.rectangle(mx + mw / 2 - 50, my + mh - 40, 80, 30, 0x2a4a1a, 0.8)
    confirmBg.setStrokeStyle(1, 0x4a8a3a, 0.5)
    confirmBg.setInteractive()
    confirmBg.on('pointerdown', () => {
      this.closeConfirmModal()
      this.exitMarchMode()
    })
    modal.add(confirmBg)
    modal.add(this.add.text(mx + mw / 2 - 50, my + mh - 40, '确定', {
      fontFamily: '"KaiTi", serif', fontSize: '15px', color: '#a0d0a0',
    }).setOrigin(0.5))

    const cancelBg = this.add.rectangle(mx + mw / 2 + 50, my + mh - 40, 80, 30, 0x2a1a1a, 0.8)
    cancelBg.setStrokeStyle(1, UI.borderDim, 0.5)
    cancelBg.setInteractive()
    cancelBg.on('pointerdown', () => this.closeConfirmModal())
    modal.add(cancelBg)
    modal.add(this.add.text(mx + mw / 2 + 50, my + mh - 40, '取消', {
      fontFamily: '"KaiTi", serif', fontSize: '15px', color: TXT.muted,
    }).setOrigin(0.5))
  }

  // ============================================================
  // 行军月：军队列表面板
  // ============================================================
  private showArmyListPanel() {
    this.closeMarchArmyPanel()

    const panel = this.add.container(0, 0).setDepth(30)
    this.marchArmyPanel = panel

    const veil = this.add.rectangle(CANVAS_W / 2, CANVAS_H / 2, CANVAS_W, CANVAS_H, 0x000000, 0.5)
    veil.setInteractive()
    veil.on('pointerdown', () => this.closeMarchArmyPanel())
    panel.add(veil)

    const pw = 440, ph = 380
    const px = (CANVAS_W - pw) / 2, py = (CANVAS_H - ph) / 2
    const bg = this.add.rectangle(px + pw / 2, py + ph / 2, pw, ph, UI.panel, 0.95)
    bg.setStrokeStyle(2, UI.border, 0.7)
    panel.add(bg)

    panel.add(this.add.text(px + pw / 2, py + 18, '⚔  军 队 列 表', {
      fontFamily: '"KaiTi", serif', fontSize: '18px', color: TXT.accent,
    }).setOrigin(0.5))

    const armies = gameState.getPlayerArmies()

    if (armies.length === 0) {
      panel.add(this.add.text(px + pw / 2, py + 120, '暂无出征军队', {
        fontFamily: '"KaiTi", serif', fontSize: '16px', color: TXT.muted,
      }).setOrigin(0.5))
    } else {
      // 列标题
      const colX = [px + 20, px + 100, px + 200, px + 300, px + 390]
      const headerY = py + 44
      const headers = ['主将', '兵力', '出发', '目标', '状态']
      for (let i = 0; i < headers.length; i++) {
        panel.add(this.add.text(colX[i], headerY, headers[i], {
          fontFamily: '"SimSun", serif', fontSize: '11px', color: TXT.muted,
        }).setOrigin(0, 0.5))
      }

      const listStartY = headerY + 22
      const itemH = 32

      for (let i = 0; i < Math.min(armies.length, 8); i++) {
        const army = armies[i]
        const iy = listStartY + i * itemH

        const rowBg = this.add.rectangle(px + pw / 2, iy + itemH / 2, pw - 30, itemH - 2,
          i % 2 === 0 ? 0x18120c : 0x1a140c, 0.5,
        )
        rowBg.setInteractive()
        rowBg.on('pointerdown', () => {
          this.closeMarchArmyPanel()
          this.selectArmy(army.id)
        })
        panel.add(rowBg)

        const leader = strategyOfficers.find(o => o.id === army.leaderOfficerId)
        const sourceCity = strategyCities.find(c => c.id === army.sourceCityId)
        const destCityId = army.routePlan.length > 0 ? army.routePlan[army.routePlan.length - 1] : null
        const destCity = destCityId ? strategyCities.find(c => c.id === destCityId) : null
        const statusMap: Record<string, string> = {
          ready: '待命', marching: '行军中', besieging: '攻城中', retreating: '撤退中', routed: '溃败',
        }

        panel.add(this.add.text(colX[0], iy + itemH / 2, leader?.name ?? '?', {
          fontFamily: '"KaiTi", serif', fontSize: '13px', color: TXT.body,
        }).setOrigin(0, 0.5))
        panel.add(this.add.text(colX[1], iy + itemH / 2, `${army.troops}`, {
          fontFamily: 'Arial', fontSize: '12px', color: '#c0a870',
        }).setOrigin(0, 0.5))
        panel.add(this.add.text(colX[2], iy + itemH / 2, sourceCity?.name ?? '?', {
          fontFamily: '"SimSun", serif', fontSize: '12px', color: '#a09070',
        }).setOrigin(0, 0.5))
        panel.add(this.add.text(colX[3], iy + itemH / 2, destCity?.name ?? '未设定', {
          fontFamily: '"SimSun", serif', fontSize: '12px', color: destCity ? '#e0a050' : TXT.muted,
        }).setOrigin(0, 0.5))
        panel.add(this.add.text(colX[4], iy + itemH / 2, statusMap[army.status] ?? army.status, {
          fontFamily: '"SimSun", serif', fontSize: '12px', color: '#80c080',
        }).setOrigin(0, 0.5))
      }
    }

    // 关闭
    const cls = this.add.text(px + pw - 16, py + 8, '✕', {
      fontFamily: 'Arial', fontSize: '16px', color: TXT.muted,
    }).setOrigin(1, 0).setInteractive()
    cls.on('pointerdown', () => this.closeMarchArmyPanel())
    panel.add(cls)
  }

  private applyDisplayMode() {
    switch (this.displayMode) {
      case 'full':
        // 全部显示
        for (const [, marker] of this.cityMarkers) {
          marker.setVisible(true)
        }
        for (const [, label] of this.cityLabels) {
          label.setVisible(true)
        }
        this.routeGraphics.setVisible(true)
        this.featureGraphics.setVisible(true)
        break
      case 'compact':
        // 紧凑模式：隐藏地名标签，只显示城池点
        for (const [, marker] of this.cityMarkers) {
          marker.setVisible(true)
        }
        for (const [, label] of this.cityLabels) {
          label.setVisible(false)
        }
        this.routeGraphics.setVisible(true)
        this.featureGraphics.setVisible(true)
        break
      case 'faction':
        // 势力模式：只显示有主城池（非neutral）
        for (const city of strategyCities) {
          const marker = this.cityMarkers.get(city.id)
          const label = this.cityLabels.get(city.id)
          if (city.owner !== 'neutral') {
            marker?.setVisible(true)
            label?.setVisible(true)
          } else {
            marker?.setVisible(false)
            label?.setVisible(false)
          }
        }
        this.routeGraphics.setVisible(true)
        this.featureGraphics.setVisible(false)
        break
    }
  }

  // ============================================================
  // 交互：点击城池
  // ============================================================
  private setupInteraction() {
    // 选中标记 — 闪烁方块（原版MD风格）
    this.highlightGraphics = this.add.rectangle(0, 0, 16, 16, 0x000000, 0)
    this.highlightGraphics.setStrokeStyle(2.5, 0xf5d678, 0.9)
    this.highlightGraphics.setDepth(5)
    this.highlightGraphics.setVisible(false)

    // 信息面板
    const infoBg = this.add.rectangle(0, 0, 220, 120, UI.panel, 0.92)
    infoBg.setStrokeStyle(1.5, UI.border, 0.8)
    infoBg.setDepth(6)
    infoBg.setVisible(false)

    const infoText = this.add.text(0, 0, '', {
      fontFamily: '"Microsoft YaHei", Arial, sans-serif',
      fontSize: '13px',
      color: TXT.body,
      lineSpacing: 4,
    }).setDepth(7).setVisible(false)

    // 悬停效果
    for (const [id, marker] of this.cityMarkers) {
      marker.on('pointerover', () => {
        marker.setScale(1.3)
        this.input.setDefaultCursor('pointer')
      })
      marker.on('pointerout', () => {
        if (this.selectedCityId !== id) {
          marker.setScale(1.0)
        }
        this.input.setDefaultCursor('default')
      })
    }

    // 键盘数字键 1-5 对应命令栏按钮（根据模式动态切换）
    for (let i = 1; i <= 5; i++) {
      this.input.keyboard?.on(`keydown-${['ONE','TWO','THREE','FOUR','FIVE'][i-1]}`, () => {
        const inspectionKeys = ['domestic', 'diplomacy', 'military', 'info', 'advance']
        const marchKeys = ['army', 'dest', 'march', 'recall', 'end']
        const keys = gameState.mode === 'march' ? marchKeys : inspectionKeys
        this.onCommandSelect(keys[i - 1])
      })
    }

    // 方向键光标导航
    const dirKeys = ['UP', 'DOWN', 'LEFT', 'RIGHT'] as const
    const dirs: [number, number][] = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    for (let d = 0; d < 4; d++) {
      this.input.keyboard?.on(`keydown-${dirKeys[d]}`, () => {
        this.navigateCursor(dirs[d][0], dirs[d][1], infoBg, infoText)
      })
    }

    // 全局点击：城池间切换或取消选中
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // 行军月：先检查军队标记
      if (gameState.mode === 'march') {
        for (const [, m] of this.armyMarkers) {
          const r = m as unknown as Phaser.GameObjects.Rectangle
          if (r.getBounds().contains(pointer.x, pointer.y)) {
            return // 军队标记自己处理
          }
        }
      }

      let hitCity: string | null = null
      for (const [id, m] of this.cityMarkers) {
        if (m.getBounds().contains(pointer.x, pointer.y)) {
          hitCity = id
          break
        }
      }
      if (hitCity) {
        this.selectCity(hitCity, infoBg, infoText)
      } else if (this.selectedCityId) {
        this.deselectCity(infoBg, infoText)
      }
      // 行军月：点击空白区域取消军队选中
      if (gameState.mode === 'march' && !hitCity && this.selectedArmyId) {
        this.deselectArmy()
      }
    })

    // M键切换地图显示模式
    this.input.keyboard?.on('keydown-M', () => {
      const modes: MapDisplayMode[] = ['full', 'compact', 'faction']
      const idx = modes.indexOf(this.displayMode)
      this.displayMode = modes[(idx + 1) % modes.length]
      this.applyDisplayMode()
      this.showToast(`地图模式：${this.displayMode === 'full' ? '全图' : this.displayMode === 'compact' ? '紧凑' : '势力'}`)
    })
  }

  // ============================================================
  // 键盘方向键光标导航
  // ============================================================
  private navigateCursor(dx: number, dy: number, infoBg: Phaser.GameObjects.Rectangle, infoText: Phaser.GameObjects.Text) {
    const currentId = this.selectedCityId
    const cities = strategyCities

    if (!currentId) {
      // 无选中时选第一个己方城池
      const first = cities.find(c => c.owner === this.playerFactionId)
      if (first) this.selectCity(first.id, infoBg, infoText)
      return
    }

    const cur = cities.find(c => c.id === currentId)
    if (!cur) return

    const [curSX, curSY] = dataToScreen(cur.x, cur.y)

    // 在指定方向上找最近的城池
    let best: typeof cur | null = null
    let bestDist = Infinity

    for (const city of cities) {
      if (city.id === currentId) continue
      const [sx, sy] = dataToScreen(city.x, city.y)
      const tx = sx - curSX
      const ty = sy - curSY

      // 检查是否大致在目标方向
      const dotProduct = tx * dx + ty * dy
      if (dotProduct <= 0) continue // 在相反方向

      const dist = Math.sqrt(tx * tx + ty * ty)
      // 偏向：优先选方向对齐的（点积/距离 越大越对齐）
      const alignment = dotProduct / Math.max(dist, 1)
      const score = dist / (alignment + 0.1)

      if (score < bestDist) {
        bestDist = score
        best = city
      }
    }

    if (best) {
      this.selectCity(best.id, infoBg, infoText)
    }
  }

  private selectCity(
    cityId: string,
    infoBg: Phaser.GameObjects.Rectangle,
    infoText: Phaser.GameObjects.Text,
  ) {
    // 行军月：选中军队后点击城市 = 设定目的地
    if (gameState.mode === 'march' && this.selectedArmyId) {
      this.setArmyDestination(this.selectedArmyId, cityId as CityId)
      return
    }

    // 取消之前选中
    if (this.selectedCityId) {
      const prev = this.cityMarkers.get(this.selectedCityId)
      prev?.setScale(1.0)
    }

    this.selectedCityId = cityId
    const staticCity = strategyCities.find(c => c.id === cityId)
    if (!staticCity) return
    const marker = this.cityMarkers.get(cityId)
    marker?.setScale(1.3)

    const [cx, cy] = dataToScreen(staticCity.x, staticCity.y)

    // 选中标记 闪烁方块
    this.highlightGraphics.setPosition(cx - 8, cy - 8)
    this.highlightGraphics.setVisible(true)

    // 闪烁
    this.tweens.add({
      targets: this.highlightGraphics,
      alpha: { from: 1, to: 0.25 },
      duration: 500,
      yoyo: true,
      repeat: -1,
    })

    // 信息面板 — 城池右侧浮动
    const panelX = Math.min(cx + 26, CANVAS_W - 250)
    const panelY = Math.max(cy - 60, 40)

    infoBg.setPosition(panelX, panelY)
    infoBg.setVisible(true)

    const faction = strategyFactions.find(f => f.id === (gameState.getCity(cityId as CityId)?.owner ?? staticCity.owner))
    const factionName = faction?.name ?? '未知'

    const rtCity = gameState.getCity(cityId as CityId) ?? staticCity
    infoText.setText([
      `🏯 ${staticCity.name}  [${staticCity.region}]`,
      `━━━━━━━━━━━━━━━━━━`,
      `领主：${factionName}`,
      `兵力：${rtCity.troops.toLocaleString()}  守备：${rtCity.defense}`,
      `金钱：${rtCity.gold.toLocaleString()}  粮草：${rtCity.food.toLocaleString()}`,
    ].join('\n'))
    infoText.setPosition(panelX - 100, panelY - 46)
    infoText.setVisible(true)

    // 如果有待处理的命令且选中的是己方城池，自动执行
    if (this.pendingCommand && gameState.getCity(cityId as CityId)?.owner === this.playerFactionId) {
      const cmd = this.pendingCommand
      this.pendingCommand = null
      this.toastText?.destroy()
      this.toastText = null
      if (cmd === 'domestic') this.showDomesticSubPanel()
      else if (cmd === 'military') this.showMilitaryPanel()
      else if (cmd === 'info') this.showCityInfoDetail()
    }
  }

  private deselectCity(infoBg: Phaser.GameObjects.Rectangle, infoText: Phaser.GameObjects.Text) {
    if (this.selectedCityId) {
      const prev = this.cityMarkers.get(this.selectedCityId)
      prev?.setScale(1.0)
    }
    this.selectedCityId = null
    this.highlightGraphics.setVisible(false)
    infoBg.setVisible(false)
    infoText.setVisible(false)
  }
}