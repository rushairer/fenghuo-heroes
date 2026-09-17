import test from 'node:test'
import assert from 'node:assert/strict'
import { FULL_MAP_BOUNDS, fullMapPoint } from '../src/game/full-map.js'
import { WORLD_H, WORLD_W } from '../src/game/world.js'

test('full-map projection maps world corners into overview bounds',()=>{
  assert.deepEqual(fullMapPoint({x:0,y:0}),{x:FULL_MAP_BOUNDS.x,y:FULL_MAP_BOUNDS.y})
  assert.deepEqual(fullMapPoint({x:WORLD_W,y:WORLD_H}),{x:FULL_MAP_BOUNDS.x+FULL_MAP_BOUNDS.w,y:FULL_MAP_BOUNDS.y+FULL_MAP_BOUNDS.h})
})

test('full-map projection clamps points outside the current world scaffold',()=>{
  assert.deepEqual(fullMapPoint({x:-50,y:-50}),{x:FULL_MAP_BOUNDS.x,y:FULL_MAP_BOUNDS.y})
  assert.deepEqual(fullMapPoint({x:WORLD_W+50,y:WORLD_H+50}),{x:FULL_MAP_BOUNDS.x+FULL_MAP_BOUNDS.w,y:FULL_MAP_BOUNDS.y+FULL_MAP_BOUNDS.h})
})
