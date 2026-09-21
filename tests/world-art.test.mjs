import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WORLD_RIVER_PATH,
  riverStrokeStyle,
  roadSegmentStyle,
  uniqueRoadPairs,
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
    assert.ok(style.shadowWidth>style.width)
    assert.ok(style.highlightWidth<style.width)
    assert.ok(style.highlightAlpha>0&&style.highlightAlpha<style.alpha)
    assert.deepEqual(style,roadSegmentStyle(index))
  }
})


test('road-pair extraction removes reverse duplicates without changing identities',()=>{
  const pairs=uniqueRoadPairs([
    {id:'a',neighbors:['b','c']},
    {id:'b',neighbors:['a']},
    {id:'c',neighbors:['a']},
  ])
  assert.deepEqual(pairs,[['a','b'],['a','c']])
})


test('river stroke style keeps bank water and highlight widths ordered',()=>{
  const world=riverStrokeStyle()
  const projected=riverStrokeStyle({projected:true})
  for(const style of [world,projected]){
    assert.ok(style.bankOuterWidth>style.bankInnerWidth)
    assert.ok(style.bankInnerWidth>style.waterWidth)
    assert.ok(style.bankHighlightWidth<style.bankInnerWidth)
    assert.ok(style.bankHighlightAlpha>0&&style.bankHighlightAlpha<1)
    assert.ok(style.waterWidth>style.highlightWidth)
    assert.ok(style.highlightAlpha>0&&style.highlightAlpha<=1)
  }
})

test('pattern-backed river lowers highlight opacity without changing geometry',()=>{
  const plain=riverStrokeStyle()
  const patterned=riverStrokeStyle({pattern:true})
  assert.equal(patterned.bankOuterWidth,plain.bankOuterWidth)
  assert.equal(patterned.bankInnerWidth,plain.bankInnerWidth)
  assert.equal(patterned.waterWidth,plain.waterWidth)
  assert.equal(patterned.bankHighlightWidth,plain.bankHighlightWidth)
  assert.equal(patterned.bankHighlightAlpha,plain.bankHighlightAlpha)
  assert.equal(patterned.highlightWidth,plain.highlightWidth)
  assert.ok(patterned.highlightAlpha<plain.highlightAlpha)
})
