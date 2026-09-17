import { WORLD_H, WORLD_W } from './world.js'

export const FULL_MAP_BOUNDS=Object.freeze({x:30,y:48,w:194,h:112})

export function fullMapPoint(point,bounds=FULL_MAP_BOUNDS) {
  const px=Number.isFinite(point?.x)?point.x:0
  const py=Number.isFinite(point?.y)?point.y:0
  const nx=Math.max(0,Math.min(WORLD_W,px))/WORLD_W
  const ny=Math.max(0,Math.min(WORLD_H,py))/WORLD_H
  return Object.freeze({x:bounds.x+nx*bounds.w,y:bounds.y+ny*bounds.h})
}

// This is the current world-space river scaffold expressed once for the
// overview screen. It is not claimed to be the original game's exact river
// geometry and should be replaced when canonical map geometry is verified.
export const FULL_MAP_RIVER=Object.freeze({
  start:Object.freeze({x:205,y:-12}),
  curves:Object.freeze([
    Object.freeze([{x:229,y:48},{x:287,y:69},{x:323,y:126}]),
    Object.freeze([{x:360,y:184},{x:421,y:218},{x:473,y:235}]),
    Object.freeze([{x:526,y:254},{x:579,y:278},{x:658,y:326}]),
  ]),
})
