export const WORLD_SCALE = 2
export const WORLD_W = 640
export const WORLD_H = 448
export const MAP_VIEW_W = 320
export const MAP_VIEW_H = 156

export function worldPoint(point) {
  return { x: Math.round(point.x * WORLD_SCALE), y: Math.round(point.y * WORLD_SCALE) }
}

export function clampWorldPoint(point, margin = 8) {
  return {
    x: Math.max(margin, Math.min(WORLD_W - margin, point.x)),
    y: Math.max(margin, Math.min(WORLD_H - margin, point.y)),
  }
}

export function cameraFor(point) {
  return {
    x: Math.max(0, Math.min(WORLD_W - MAP_VIEW_W, Math.round(point.x - MAP_VIEW_W / 2))),
    y: Math.max(0, Math.min(WORLD_H - MAP_VIEW_H, Math.round(point.y - MAP_VIEW_H / 2))),
  }
}

export function toScreen(point, camera) {
  return { x: point.x - camera.x, y: point.y - camera.y }
}

export function isVisible(point, camera, padding = 16) {
  const p = toScreen(point, camera)
  return p.x >= -padding && p.x <= MAP_VIEW_W + padding && p.y >= -padding && p.y <= MAP_VIEW_H + padding
}

export function cityWorldPoint(city) {
  return worldPoint(city)
}
