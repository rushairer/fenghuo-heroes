# PROGRESS.md — 进度快照

**最后更新：** 2026-05-17

**当前Phase：** Phase 4 进行中 → Phase 4.1 完成

**Phase 1 ✅ — 数据层 + 全屏地图渲染** (13/13)

**Phase 2 ✅ — 标题 → 开局流程** (4/4)

**Phase 3 ✅ — 视察月** (7/7)

**Phase 4 ⏳ — 行军月** (1/5)
- ✅ 4.1 行军月主界面 — 模式切换、军队标记、选中、详情面板、行军/撤退/结束
- ⏳ 4.2 部队移动（逐帧动画）— 当前为瞬移，需改为沿路线动画
- ⏳ 4.3 路线设定与改道 — 基础BFS已实现，需支持多段路线和改道
- ⏳ 4.4 截粮/占村 — 路线特性交互（village/supply/pass/ferry）
- ⏳ 4.5 攻城入口 — 到达敌城进入攻城模式

**系统文件：**
- `src/state/GameState.ts` — 运行时状态管理（含军队数组 + deployedOfficerIds）
- `src/systems/DomesticSystem.ts` — 内政8命令
- `src/systems/DiplomacySystem.ts` — 外交8命令+势力关系
- `src/systems/MilitarySystem.ts` — 出征编成 + deployArmy + BFS寻路 + executeMarch + recallArmy

**场景流：**
```
TitleScene → ScenarioScene → FactionSelectScene → MapScene
                             初始化GameState      视察月 ↔ 行军月（交替循环）
```

**Phase 4.1 实现内容：**
- GameState: armies[] + deployedOfficerIds + enterMarchMode/endMarchMode
- MilitarySystem: deployArmy（创建MarchArmy）、computeRoute（BFS寻路）、executeMarch（瞬移+战斗）、recallArmy
- MapScene: drawCommandBar改Container、drawMarchCommandBar、enterMarchMode/exitMarchMode、drawArmyMarkers、selectArmy、showArmyInfoPanel、setArmyDestination、executeArmyMarch、recallSelectedArmy、endMarch、showArmyListPanel、drawRouteOnMap

**下一步：** Phase 4.2 — 部队移动逐帧动画
