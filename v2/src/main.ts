// ============================================================
// main.ts — 游戏入口
// Phaser 配置 + 场景启动
// 当前阶段：Phase 2 — 标题 → 开局流程
// ============================================================

import Phaser from 'phaser'
import { CANVAS_W, CANVAS_H } from './ui/theme'
import { TitleScene } from './scenes/TitleScene'
import { ScenarioScene } from './scenes/ScenarioScene'
import { FactionSelectScene } from './scenes/FactionSelectScene'
import { MapScene } from './scenes/MapScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CANVAS_W,
  height: CANVAS_H,
  parent: 'app',
  backgroundColor: '#0a0604',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, ScenarioScene, FactionSelectScene, MapScene],
}

new Phaser.Game(config)
