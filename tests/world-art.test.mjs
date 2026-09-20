import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WORLD_RIVER_PATH,
  roadSegmentStyle,
  worldRiverBounds,
} from '../src/game/world-art.js'

test('world river scaffold remains a single deterministic path',()=>{
  assert.equal(WORLD_RIVER_PATH.curves.length,3)
  assert.deepEqual(WORLD_RIVER_PATH.start,{x:205,y:-12})
  assert.deepEqual(worldRiverBounds(),{
    minX:205,
    maxX:658,
    minY:-12,
    maxY:326,
  })
})

test('road segment style varies deterministically within narrow HD-safe bounds',()=>{
  for(let index=0;index<16;index++){
    const style=roadSegmentStyle(index)
    assert.ok(style.width>=.48&&style.width<=.56)
    assert.ok(style.alpha>=.34&&style.alpha<=.43)
    assert.deepEqual(style,roadSegmentStyle(index))
  }
})
