# CLAUDE.md

本文件为 DeepSeek TUI / Claude Code 等 AI Agent 提供项目工作指引。

## 项目定位

复刻世嘉MD《三国志列传：乱世群英》(1991)——回合制三国策略游戏。
目标：功能同构+现代美术重制，向原版体验完全靠拢。

## 项目状态

**当前阶段：Phase 4 — 行军月（Phase 1-3 已完成）**
- ✅ Phase 1: 全屏地图渲染（13/13）
- ✅ Phase 2: 标题→开局流程（4/4）TitleScene→ScenarioScene→FactionSelectScene→MapScene
- ✅ Phase 3: 视察月（7/7）内政/外交/军事/情报/月令 全部可用
- ⏳ Phase 4: 行军月（待开发）
- ⏳ Phase 5: 攻城+单挑+会战
- ⏳ Phase 6: AI+结局

## 技术栈

- Phaser 4.1.0 + TypeScript 6.0 + Vite 8
- 无外部UI框架，纯Phaser.GameObjects渲染

## 文件结构

```
v2/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── assets/images/
│       ├── portraits/       # 武将头像（4个已复用）
│       └── backgrounds/     # 背景图（1个已复用）
├── asset-prompts/           # GPT Codex 图片生成提示词
├── TASK.md                  # 详细任务清单
├── DECISIONS.md             # 架构决策记录
├── PROGRESS.md              # 进度快照
└── src/
    ├── main.ts              # Phaser配置 + 场景入口
    ├── data/
    │   ├── types.ts         # 全局类型定义
    │   ├── factions.ts      # 6势力数据
    │   ├── cities.ts        # 40城池数据（经纬度映射坐标）
    │   ├── officers.ts      # 84武将数据
    │   └── routes.ts        # 道路特性数据
    ├── state/
    │   └── GameState.ts     # 运行时游戏状态管理
    ├── ui/
    │   └── theme.ts         # 颜色/字体/布局常量
    ├── scenes/
    │   ├── TitleScene.ts        # 标题画面
    │   ├── ScenarioScene.ts     # 剧本选择
    │   ├── FactionSelectScene.ts # 势力/君主选择
    │   └── MapScene.ts          # 战役地图+视察月
    ├── systems/
    │   ├── DomesticSystem.ts    # 内政8命令
    │   ├── DiplomacySystem.ts   # 外交8命令
    │   └── MilitarySystem.ts    # 出征编成
    └── ai/                  # AI决策（待开发）
```

## 命令

| 命令 | 用途 |
|------|------|
| `cd v2 && npm run dev` | 启动开发服务器 |
| `cd v2 && npm run build` | 类型检查 + 构建 |
| `cd v2 && npm run preview` | 预览生产构建 |

## 关键约束

- 不逐像素复刻原版画面；目标是"功能同构"
- 不使用任何商业游戏ROM、截图、音乐、文本
- 素材全部原创或代码生成
- 缺失图片使用Phaser Graphics程序化占位，在 asset-prompts/ 提供GPT Codex提示词
- 所有游戏逻辑和渲染代码模块化，避免单文件膨胀
- `verbatimModuleSyntax` 已启用，type导入用 `import type`

## 续接指引

新session启动时，AI应依次读取：
1. 本文件 (CLAUDE.md) — 项目全局
2. TASK.md — 当前任务清单
3. PROGRESS.md — 最新进度
4. DECISIONS.md — 架构决策

然后从 PROGRESS.md 标记的"下一步"继续执行。
