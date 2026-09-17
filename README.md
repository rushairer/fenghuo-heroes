# fenghuo-heroes

《三国志列传：乱世群英》clean-room Web 复刻工程。

> 2026-09-17 起，项目从旧实现完全重启。`main` 不再继承旧 `v2/` 代码和旧生成资产；旧现场保存在 `archive/pre-cleanroom-reboot-2026-09-17`。

## 当前目标

目标不是做“类似三国 SLG”，而是逐项校准原作的：

- MD 逻辑画布与像素级布局节奏
- 标题 / 剧本 / 君主 / 主循环状态机
- 单数月「视察情况」与双数月「行军」交替
- 内政 / 外交 / 军事菜单结构
- 大地图自由行军、补给、截粮、占村与攻城
- 可手动操作的单挑
- 俘虏、继位、势力灭亡、AI 与统一判定

当前 `0.1.0` 是 **clean-room parity foundation**：先保证主循环方向正确、可玩、可测试、可持续校准；它不是“已经完成 1:1”的版本。

## 运行

```bash
npm run dev
```

打开 `http://localhost:4173`。

键位：

- 方向键：移动 / 选择
- `Z` / `Enter`：确定 / 攻击
- `X` / `Esc`：返回
- `C`：结束当前月份

## 质量门禁

```bash
npm run check
```

该命令会执行：

1. 全部 JS / MJS 语法检查
2. Node 内置测试（无第三方测试依赖）
3. 生成 `dist/` 静态部署产物

## GitHub Pages

`main` 每次 push 会触发：

- `CI`：语法检查 + 单元测试 + 构建
- `Deploy GitHub Pages`：构建并通过 GitHub Pages artifact 部署

预期站点：`https://rushairer.github.io/fenghuo-heroes/`

## Clean-room 边界

本仓库不包含 ROM，不从 ROM/第三方站点抽取或重新分发原作受版权保护的图片、音乐、音效、字库、地图素材或大段文本。复刻依据公开可观察到的游戏行为、用户提供的合法参考截图/录屏，以及重新实现的原创代码与原创资源。

详见 `docs/PARITY_ROADMAP.md` 和 `docs/RESEARCH_LOG.md`。
