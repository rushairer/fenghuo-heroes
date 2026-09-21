# fenghuo-heroes

《三国志列传：乱世群英》clean-room Web 复刻工程。

> 2026-09-17 起，项目从旧实现完全重启。`main` 不再继承旧 `v2/` 代码和旧生成资产；旧现场保存在 `archive/pre-cleanroom-reboot-2026-09-17`。

## 当前目标

目标不是做“类似三国 SLG”，而是逐项校准原作的：

- MD 逻辑画布与像素级布局节奏
- 标题 / 剧本 / 君主 / 主循环状态机
- 单数月「视察情况」与双数月「行军」交替
- 内政 / 外交 / 军事菜单结构
- 大地图自由行军、补给、截粮与攻城
- 可手动操作的单挑
- 俘虏、继位、势力灭亡、AI 与统一判定

当前主线是 **HD parity**：原作 320×224 只作为参考坐标系，浏览器以 6× 高清 backing store 起步，并根据实际显示尺寸与设备像素比自适应提升，最高 10×；同时保持原作界面几何和操作节奏。HD 模式追求高分辨率重绘，不再把固定低分辨率画布用 CSS 二次放大冒充高清。运行时普通 raster 素材还必须达到至少约 5× 的实际显示像素密度，否则自动退回 Canvas/vector 绘制。nine-slice UI 则按角/边切片本身的源像素密度验收，避免把可安全拉伸的面板误判为低清，也避免低分边框被强行放大。 当前场景代码还禁止直接 `assets.get(...)` 绕过高清门禁；地图地形/城池/旗帜、Setup 选择框、标题提示板以及单挑/攻城画面都具备可随 backing store 原生重绘的 vector fallback。

> **地图状态警告**：当前可玩战略地图仍是迁移前的 40 节点工程脚手架，不是中文版原作 40 城地图。原作城市身份已进入独立 evidence layer；在坐标、村庄与 189 归属完成证据校准前，不得把当前地图称为 1:1。详见 `docs/MAP_MIGRATION_BLOCKER.md`。

### 防误操作约定

- 战略地图主界面的 `B` **不会退出到标题或重启游戏**。
- `B` 只在菜单、确认框和路线编辑等子状态中承担取消/返回。
- 后续如果增加“退出当前游戏”，必须使用独立确认流程，不能复用单次 B 按键。

## 运行

```bash
npm run dev
```

打开 `http://localhost:4173`。

键位：

- 方向键：移动 / 选择
- `Z`：MD A
- `X` / `Esc`：MD B（取消；战略地图主界面不会退出游戏）
- `C`：MD C
- `Enter`：START
- `H`：HD / 像素预览切换

## 质量门禁

```bash
npm run check
```

该命令会执行语法检查、Node 内置测试和静态 Pages 构建。

## 视觉 QA

以下查询参数用于把页面固定到确定状态，方便人工走查和截图 diff：

- `?qa=title-splash`
- `?qa=title-menu`
- `?qa=player-count`
- `?qa=setup`
- `?qa=strategy-map`
- `?qa=city-status`
- `?qa=country-overview`
- `?qa=full-map`
- `?qa=officer-list`
- `?qa=officer-status`
- `?qa=march-compose`
- `?qa=march-officers`
- `?qa=march-route-prompt`
- `?qa=army-menu`
- `?qa=siege-speed`
- `?qa=siege-formation`
- `?qa=duel-mode`
- `?qa=duel-manual`

这些 QA 状态只固定画面入口，不改变默认玩家流程。武将 QA 状态只使用仓库现有 evidence-backed 开局名册投影；行军/攻城/单挑深层页面所需的临时军队与冲突明确标记为 `qaFixture`，仅用于确定性视觉复核，不属于 parity 证据，也不会被当作 canonical 游戏数据。

## 地图迁移审计

### 地图证据采集工作台

构建后的静态站点还包含 `tools/map-evidence-capture.html`。它允许加载本地原版截图，点击城市/村庄标记中心，并按截图固有尺寸转换成 evidence 坐标；所有候选默认保持 `verified:false`。工作台直接加载 canonical 40 城列表，同一城市再次点击会覆盖旧候选，并提供自动下一城、撤销、进度统计与当前 frame 标记，减少重复/漏录。

推荐流程：

```bash
npm run map:evidence:template
npm run map:evidence:merge -- batch-a.json batch-b.json --out map-evidence.merged.json
npm run map:evidence:audit -- map-evidence.merged.json
npm run map:evidence:diff -- map-evidence.compiled.json
npm run map:evidence:compile -- map-evidence.merged.json map-geometry.compiled.json --scope geometry
npm run map:evidence:compile -- map-evidence.merged.json map-evidence.compiled.json --scope full
```

其中 `audit` 负责指出缺项/冲突，`diff` 负责与仓库当前 canonical ledger 做语义差异。`geometry` scope 只要求 40 城坐标、地名异体、村庄与路线 coverage 完成；`full` scope 还要求 189 ownership 完成。即使 full evidence 齐全，生产开局仍必须独立校准城市经济/兵力与武将城市配属，不能从地图坐标推导。


运行 `npm run map:report` 可以查看：

- 当前实际启用的地图 profile；
- canonical evidence ledger 是否 ready；
- 已验证 40 城坐标数量；
- 189 年归属覆盖数量；
- 地名异体、村庄与道路网络 gate；
- 当前 scaffold 与 Chinese-ROM 目标城市 identity 的差异。

即使 evidence 全部齐全，项目也不会自动切换 canonical 地图；还必须显式通过 `map-activation.js` 的第二道 activation gate，并完成 Store / 行军 / 存档兼容性验证。

## GitHub Pages

`main` 每次 push 会触发 CI 与 GitHub Pages 部署。

预期站点：`https://rushairer.github.io/fenghuo-heroes/`

## Clean-room 边界

本仓库不包含 ROM，不从 ROM/第三方站点抽取或重新分发原作受版权保护的图片、音乐、音效、字库、地图素材或大段文本。复刻依据公开可观察到的游戏行为、用户提供的合法参考截图/录屏，以及重新实现的原创代码与原创资源。

详见 `docs/PARITY_ROADMAP.md`、`docs/RESEARCH_LOG.md`、`docs/MARCH_PARITY_SPEC.md` 与 `docs/PARITY_INPUT_AND_MARCH.md`。


## Scenario start-state evidence

Canonical map geometry and scenario start state are independent.

The production evidence ledgers for 189 / 200 / 215 live in
`src/game/canonical-scenario-evidence.js`. Each year independently requires:

- 40-city ownership;
- 40-city gold / food / troops / development / rule / defense / training;
- complete officer-to-city placement.

Useful commands:

```bash
npm run scenario:evidence:template -- 189 scenario-189.capture.json
npm run scenario:evidence:audit -- scenario-189.capture.json --require-ownership-ready
npm run scenario:evidence:audit -- scenario-189.capture.json --require-economy-ready
npm run scenario:evidence:audit -- scenario-189.capture.json --require-officer-ready
npm run scenario:evidence:merge -- batch-a.json batch-b.json --out scenario-189.merged.json
npm run scenario:evidence:audit -- scenario-189.merged.json --require-ready
npm run scenario:evidence:compile -- scenario-189.merged.json scenario-189.compiled.json --scope full
```

The static workbench is available at `tools/scenario-evidence-capture.html`; it outputs merge-ready single-source batches while keeping every candidate `verified:false`.

See `docs/SCENARIO_EVIDENCE_CAPTURE.md` for the full workflow.

The playable scaffold still contains quarantined coordinate-derived economy values.
They are engineering placeholders only and cannot enter canonical scenario evidence.
