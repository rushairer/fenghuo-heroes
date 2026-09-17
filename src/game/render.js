import { COLORS, FONT, H, W } from './constants.js'

export function makeRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false })
  ctx.imageSmoothingEnabled = false

  function clear(color = COLORS.black) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, W, H)
  }

  function text(value, x, y, size = 8, color = COLORS.ivory, align = 'left', baseline = 'top') {
    ctx.font = `${size}px ${FONT}`
    ctx.textAlign = align
    ctx.textBaseline = baseline
    ctx.fillStyle = color
    ctx.fillText(String(value), Math.round(x), Math.round(y))
  }

  function shadowText(value, x, y, size = 8, color = COLORS.ivory, align = 'left', baseline = 'top') {
    text(value, x + 1, y + 1, size, '#000', align, baseline)
    text(value, x, y, size, color, align, baseline)
  }

  function panel(x, y, width, height, fill = COLORS.panel, alpha = 0.97) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = fill
    ctx.fillRect(x, y, width, height)
    ctx.globalAlpha = 1
    ctx.strokeStyle = COLORS.borderDim
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, width - 1, height - 1)
    ctx.strokeStyle = COLORS.border
    ctx.globalAlpha = 0.72
    ctx.strokeRect(x + 2.5, y + 2.5, width - 5, height - 5)
    ctx.restore()
  }

  function scanlines(alpha = 0.08) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#000'
    for (let y = 1; y < H; y += 2) ctx.fillRect(0, y, W, 1)
    ctx.restore()
  }

  function wrapText(value, x, y, maxWidth, lineHeight = 10, size = 8, color = COLORS.ivory, align = 'left') {
    const chars = [...String(value)]
    let line = ''
    let lineY = y
    ctx.font = `${size}px ${FONT}`
    for (const char of chars) {
      const next = line + char
      if (ctx.measureText(next).width > maxWidth && line) {
        text(line, x, lineY, size, color, align)
        line = char
        lineY += lineHeight
      } else {
        line = next
      }
    }
    if (line) text(line, x, lineY, size, color, align)
  }

  return { ctx, clear, text, shadowText, panel, scanlines, wrapText }
}
