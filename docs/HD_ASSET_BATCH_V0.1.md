# HD Asset Batch v0.1

## 已开始的 Image 2.5 资产生产

本批先建立标题视觉方向，再进入可切片生产资产。标题概念已生成多轮，用于确认：

- 五武将重叠群像是第一视觉焦点。
- 红/绯/粉色历史战争氛围。
- 右侧蓝金纹样装饰边。
- 黑金菜单语言与现有 code-native START / CONTINUE 相容。

概念图不是最终运行时文件：概念图中的文字、Logo、菜单不得直接作为交互 UI 烘焙进游戏。生产版本需要输出“纯背景/人物层”和可独立切片的装饰层。

## 第一批生产文件

| Asset | 母版建议 | Runtime | 当前 |
| --- | ---: | --- | --- |
| `title-main-hd-v1` | ≥1536×1024 | WebP | 概念完成，待纯背景生产版 |
| `title-menu-frame-v1` | 1024×512 | WebP/PNG | 待生成 |
| `title-border-right-v1` | 512×1434 | WebP/PNG | 待生成 |
| `ui-panel-black-gold-a-v1` | 1024×1024 | PNG/WebP + 9-slice | 待生成 |
| `map-terrain-sand-base-v1` | ≥2048×1434 | WebP | 待生成 |
| `map-terrain-mountain-cluster-a-v1` | 1024×1024 | transparent WebP/PNG | 待生成 |
| `map-terrain-river-segment-a-v1` | 1024×512 | transparent WebP/PNG | 待生成 |
| `city-fort-neutral-v1` | 512×512 | transparent WebP/PNG | 待生成 |

## 生产约束

1. 背景图不包含 START / CONTINUE、HUD、按键提示等交互文字。
2. 可复用物件优先透明背景；地图底纹和标题母版使用完整背景。
3. UI 面板必须保留足够平整的中心区域，以便 9-slice 拉伸。
4. 城寨/旗帜缩小到 24–96px 时仍需可辨认。
5. 所有最终 runtime 资产通过 manifest 标为 `ready` 后才加载。
6. Image 2.5 输出必须经过人工视觉选择、裁切和体积优化，不能把概念稿直接全量塞进仓库。

## 接入顺序

1. Title background → `title.main`
2. Title menu frame → `title.menuFrame`
3. UI panel family → Setup / message / march compose
4. Map terrain → strategy world renderer
5. Fort / village / flags → map entities
6. 189 ruler portraits → setup / officer info
