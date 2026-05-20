// ============================================================
// theme.ts — UI 主题系统
// 基于原版《乱世群英》MD 复古策略游戏的暖色/古铜色调
// ============================================================

// ---- 画布 ----
export const CANVAS_W = 1280
export const CANVAS_H = 760

// ---- 外框 ----
export const FRAME = { x: 42, y: 34, width: 1196, height: 690 } as const

// ---- 底部命令栏 ----
export const FOOTER = { x: 70, y: 584, width: 1140, height: 122 } as const

// ---- 标准弹窗 ----
export const MODAL = {
  x: 640,
  y: 402,
  width: 820,
  height: 470,
  insetX: 58,
  titleOffsetY: 58,
  helperOffsetY: 112,
  gridOffsetY: 202,
  actionOffsetY: 430,
  colWidth: 230,
  rowHeight: 82,
  optionWidth: 168,
  optionHeight: 40,
  actionWidth: 150,
  actionHeight: 38,
  actionGap: 40,
} as const

// ---- 颜色令牌 (MD 暖色/古铜调) ----
export const UI = {
  veil: 0x0a0604,      // 遮罩深褐
  page: 0x0a0604,      // 页面底色
  panel: 0x15100c,     // 面板深褐
  subPanel: 0x241a12,  // 子面板
  border: 0xc9a355,    // 边框古铜金
  borderDim: 0x7a5c2e, // 暗金
  shadow: 0x040201,    // 投影
  accent: 0xf5d678,    // 强调暖金
  warning: 0xc04438,   // 警告红
} as const

// ---- 文字颜色 ----
export const TXT = {
  accent: '#f5d678',   // 金色强调
  body: '#efe0c0',     // 正文暖黄
  muted: '#d4c09a',    // 次要文字
  bright: '#f5e0a0',   // 高亮文字
  dark: '#1a120c',     // 深色文字(按钮用)
} as const

// ---- 字体 ----
export const FONT = {
  title: 'Georgia, "Times New Roman", serif',
  body: 'Arial, "Microsoft YaHei", sans-serif',
} as const
