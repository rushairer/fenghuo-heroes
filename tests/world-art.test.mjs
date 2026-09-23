import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  WORLD_RIVER_PATH,
  riverStrokeStyle,
  riverBankModulations,
  riverEdgeScallops,
  projectRiverSurfaceMark,
  riverSurfaceMarks,
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
    assert.ok(style.bankOuterWidth>style.bankHighlightWidth)
    assert.ok(style.bankHighlightWidth>style.bankInnerWidth)
    assert.ok(style.bankHighlightAlpha>0&&style.bankHighlightAlpha<1)
    assert.ok(style.bankInnerWidth>style.waterWidth)
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


test('river surface marks are deterministic samples of the shared river path',()=>{
  const marks=riverSurfaceMarks()
  assert.equal(marks.length,WORLD_RIVER_PATH.curves.length*5)
  assert.deepEqual(marks,riverSurfaceMarks())
  assert.ok(marks.every((mark)=>Number.isFinite(mark.x)&&Number.isFinite(mark.y)&&Number.isFinite(mark.angle)))
  assert.ok(marks.every((mark)=>mark.length>=8&&mark.length<=12))
})


test('river surface mark angle follows non-uniform projected geometry',()=>{
  const mark={x:10,y:20,angle:Math.PI/4,length:10}
  const projected=projectRiverSurfaceMark(mark,(point)=>({x:point.x*2,y:point.y*.5}))
  assert.equal(projected.x,20)
  assert.equal(projected.y,10)
  assert.ok(projected.angle<Math.PI/4)
  assert.ok(projected.angle>0)
  assert.ok(projected.length>10)
  assert.ok(projected.length<15)
})


test('world river renderer exposes presentation zoom independently from canonical path data',()=>{
  const source=readFileSync(new URL('../src/game/world-art.js',import.meta.url),'utf8')
  assert.match(source,/viewScale=1/)
  assert.match(source,/const strokeScale=widthScale\*viewScale/)
  assert.deepEqual(WORLD_RIVER_PATH.curves.length,3)
})


test('river bank modulation adds deterministic irregularity without changing the canonical center path',()=>{
  const mods=riverBankModulations()
  assert.equal(mods.length,riverSurfaceMarks().length)
  assert.deepEqual(mods,riverBankModulations())
  assert.ok(mods.some((item)=>item.side<0))
  assert.ok(mods.some((item)=>item.side>0))
  assert.ok(mods.every((item)=>item.offsetFactor>=.3&&item.offsetFactor<.4))
  assert.ok(mods.every((item)=>item.radiusFactor>.14&&item.radiusFactor<.22))
  assert.deepEqual(WORLD_RIVER_PATH.curves.length,3)
})


test('river edge scallops alternate banks without changing the canonical center path',()=>{
  const scallops=riverEdgeScallops()
  assert.equal(scallops.length,Math.floor(riverSurfaceMarks().length/2))
  assert.deepEqual(scallops,riverEdgeScallops())
  assert.ok(scallops.some((item)=>item.side<0))
  assert.ok(scallops.some((item)=>item.side>0))
  assert.ok(scallops.every((item)=>item.offsetFactor>=.42&&item.offsetFactor<.5))
  assert.ok(scallops.every((item)=>item.radiusFactor>=.13&&item.radiusFactor<.18))
  assert.equal(WORLD_RIVER_PATH.curves.length,3)
})
