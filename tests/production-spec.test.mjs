import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HD_RASTER_MIN_SCALE } from '../src/game/asset-quality.js'

const manifest=JSON.parse(readFileSync(
  new URL('../public/assets/manifests/asset-manifest.v1.json',import.meta.url),
  'utf8',
))
const spec=JSON.parse(readFileSync(
  new URL('../public/assets/manifests/production-spec.v1.json',import.meta.url),
  'utf8',
))

const UI_NINE_SLICE_KEYS=[
  'ui.frames.small',
  'ui.frames.large',
  'ui.panels.small',
  'ui.panels.large',
]

function manifestEntry(key){
  return key.split('.').reduce((value,part)=>value?.[part],manifest)
}

test('every ready reusable UI frame/panel has an explicit nine-slice contract',()=>{
  for(const key of UI_NINE_SLICE_KEYS){
    assert.equal(manifestEntry(key)?.status,'ready',key)
    const contract=spec.assets?.[key]?.nineSlice
    assert.ok(contract,key)
    assert.ok(Number.isInteger(contract.sourceSlice)&&contract.sourceSlice>0,key)
    assert.ok(Number.isFinite(contract.destEdge)&&contract.destEdge>0,key)
  }
})

test('nine-slice source edges satisfy the runtime HD raster floor',()=>{
  for(const key of UI_NINE_SLICE_KEYS){
    const {sourceSlice,destEdge}=spec.assets[key].nineSlice
    assert.ok(
      sourceSlice>=Math.ceil(destEdge*HD_RASTER_MIN_SCALE),
      `${key}: ${sourceSlice}px source edge cannot cover ${destEdge} logical px at ${HD_RASTER_MIN_SCALE}x`,
    )
  }
})


test('planned title menu frame is already bound to the future nine-slice runtime contract',()=>{
  const entry=manifestEntry('title.menuFrame')
  assert.equal(entry?.status,'planned')
  const contract=spec.assets?.['title.menuFrame']?.nineSlice
  assert.deepEqual(contract,{sourceSlice:32,destEdge:6})
  assert.ok(contract.sourceSlice>=Math.ceil(contract.destEdge*HD_RASTER_MIN_SCALE))
})
