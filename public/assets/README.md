# HD Asset Contract

运行时图片资产统一从 `assets/manifests/asset-manifest.v1.json` 读取。

## 状态

- `planned`：已定义文件名与用途，但尚未进入公开仓库；运行时不请求，继续使用 Canvas fallback。
- `ready`：文件已存在于 `public/assets/...`，允许运行时预加载。
- `disabled`：暂时停用，不加载。

## 目录

```text
assets/
  manifests/
  title/hd/
  title/slices/
  map/terrain/
  map/cities/
  map/villages/
  map/flags/
  ui/panels/
  ui/frames/
  ui/cursors/
  ui/icons/
  portraits/rulers/
  portraits/officers/
  battle/duel/
  battle/effects/
```

图片文件使用版本号，禁止无版本覆盖，例如 `title-main-hd-v1.webp`。

生成母版可以保留 PNG；网页运行时优先提交经过视觉确认和体积优化的 WebP/PNG 切片。交互文字、按钮标签和 HUD 数字保持 code-native，不烘焙进背景图。
