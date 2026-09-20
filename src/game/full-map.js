import { WORLD_H, WORLD_W } from './world.js'
import { WORLD_RIVER_PATH } from './world-art.js'

export const FULL_MAP_BOUNDS=Object.freeze({x:30,y:48,w:194,h:112})

export function fullMapPoint(point,bounds=FULL_MAP_BOUNDS) {
  const px=Number.isFinite(point?.x)?point.x:0
  const py=Number.isFinite(point?.y)?point.y:0
  const nx=Math.max(0,Math.min(WORLD_W,px))/WORLD_W
  const ny=Math.max(0,Math.min(WORLD_H,py))/WORLD_H
  return Object.freeze({x:bounds.x+nx*bounds.w,y:bounds.y+ny*bounds.h})
}

// Backward-compatible alias. The river scaffold itself now lives in world-art.js
// so strategy and full-map views cannot silently drift apart.
export const FULL_MAP_RIVER=WORLD_RIVER_PATH
