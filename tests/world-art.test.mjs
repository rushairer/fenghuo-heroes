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
  assert.equal(marks.length,WORLD_RIVER_PATH.curves.length*9)
  assert.deepEqual(marks,riverSurfaceMarks())
  assert.ok(marks.every((mark)=>Number.isFinite(mark.x)&&Number.isFinite(mark.y)&&Number.isFinite(mark.angle)))
  assert.ok(marks.every((mark)=>mark.length>=6&&mark.length<=10.5))
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
  assert.ok(mods.every((item)=>item.offsetFactor>=.32&&item.offsetFactor<.43))
  assert.ok(mods.every((item)=>item.radiusFactor>=.16&&item.radiusFactor<.22))
  assert.deepEqual(WORLD_RIVER_PATH.curves.length,3)
})


test('river edge scallops alternate banks without changing the canonical center path',()=>{
  const scallops=riverEdgeScallops()
  assert.equal(scallops.length,riverSurfaceMarks().filter((_,index)=>index%3!==0).length)
  assert.deepEqual(scallops,riverEdgeScallops())
  assert.ok(scallops.some((item)=>item.side<0))
  assert.ok(scallops.some((item)=>item.side>0))
  assert.ok(scallops.every((item)=>item.offsetFactor>=.43&&item.offsetFactor<.53))
  assert.ok(scallops.every((item)=>item.radiusFactor>=.14&&item.radiusFactor<.19))
  assert.equal(WORLD_RIVER_PATH.curves.length,3)
})


test('river presentation keeps broad flat water and subordinate highlights',()=>{
  const world=riverStrokeStyle()
  const overview=riverStrokeStyle({projected:true})
  assert.ok(world.waterWidth>=17)
  assert.ok(world.highlightWidth<world.waterWidth*.1)
  assert.ok(world.highlightAlpha<=.18)
  assert.ok(overview.waterWidth>=4.5)
  assert.ok(overview.highlightAlpha<=.2)
})


test('retired visible-road helpers stay absent from world art',()=>{
  const source=readFileSync(new URL('../src/game/world-art.js',import.meta.url),'utf8')
  assert.doesNotMatch(source,/drawRoadNetwork/)
  assert.doesNotMatch(source,/uniqueRoadPairs/)
  assert.doesNotMatch(source,/roadSegmentStyle/)
})
