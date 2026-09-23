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


test('production spec records the current HD presentation fallback detail layers',()=>{
  const fallback=spec.presentationFallbacks
  assert.equal(fallback.strategyMap.canonical,false)
  assert.ok(fallback.strategyMap.layers.includes('target four-lobe dark-brown mountain masses'))
  assert.ok(fallback.strategyMap.layers.includes('full-map compact city and village symbols sharing the target palette'))
  assert.ok(fallback.duel.layers.includes('spectator depth rows'))
  assert.ok(fallback.siege.layers.includes('corner tower roofs and eaves'))
})

test('presentation fallback contract keeps non-canonical map art out of evidence',()=>{
  assert.match(
    spec.presentationFallbacks.strategyMap.boundary,
    /must never be promoted as Chinese-ROM map evidence/,
  )
})


test('production spec records third-pass HD ornaments and symbol consistency',()=>{
  const title=spec.assets['title.main'].vectorFallback.requiredLayers
  const fallback=spec.presentationFallbacks
  assert.ok(title.includes('all five visible faces in one facial-structure pass'))
  assert.ok(title.includes('headgear trim, studs, ribbons and cap-wing detail'))
  assert.ok(fallback.duel.layers.includes('helmet plume, shoulder plates and waist tassels'))
  assert.ok(fallback.duel.layers.includes('arena lantern and pennant accents'))
  assert.ok(fallback.siege.layers.includes('attacker and defender confrontation standards'))
  assert.ok(fallback.strategyMap.layers.includes('no visible provisional node-link road rendering'))
  assert.ok(fallback.strategyMap.layers.includes('full-map compact city and village symbols sharing the target palette'))
})


test('production spec records fourth-pass HD depth and motion detail',()=>{
  const title=spec.assets['title.main'].vectorFallback.requiredLayers
  const fallback=spec.presentationFallbacks
  assert.ok(title.includes('silhouette separation edges and shoulder contact depth'))
  assert.ok(fallback.duel.layers.includes('attack arcs, guard braces and attack dust from existing duel state'))
  assert.ok(fallback.siege.layers.includes('foreground earth, stones and haze depth below confrontation standards'))
  assert.ok(fallback.strategyMap.layers.includes('deep-blue layered river with deterministic shoreline modulation and scallops'))
  assert.ok(fallback.strategyMap.layers.includes('full-map compact city and village symbols sharing the target palette'))
})


test('production spec records fifth-pass HD focal and grounding detail',()=>{
  const title=spec.assets['title.main'].vectorFallback.requiredLayers
  const fallback=spec.presentationFallbacks
  assert.ok(title.includes('five-portrait local lighting and jaw-edge highlights'))
  assert.ok(fallback.duel.layers.includes('localized hit sparks anchored to the struck fighter'))
  assert.ok(fallback.siege.layers.includes('inner gate arch, plank seams and threshold depth'))
  assert.ok(fallback.strategyMap.layers.includes('compact target fort with hot-pink and gold banner'))
  assert.ok(fallback.strategyMap.layers.includes('hot-pink army flags with small faction identity accents'))
  assert.ok(fallback.strategyMap.layers.includes('green multi-lobe hill clusters'))
})


test('production spec records sixth-pass HD contour spacing and material detail',()=>{
  const title=spec.assets['title.main'].vectorFallback.requiredLayers
  const fallback=spec.presentationFallbacks
  assert.ok(title.includes('robe and collar contour highlights'))
  assert.ok(fallback.duel.layers.includes('proximity ground-contact cue derived only from fighter spacing'))
  assert.ok(fallback.siege.layers.includes('subtle deterministic wall stains and cracks'))
  assert.ok(fallback.strategyMap.layers.includes('deep-blue layered river with deterministic shoreline modulation and scallops'))
  assert.ok(fallback.strategyMap.layers.includes('compact target fort with hot-pink and gold banner'))
})


test('production spec records seventh-pass HD texture and contact detail',()=>{
  const title=spec.assets['title.main'].vectorFallback.requiredLayers
  const fallback=spec.presentationFallbacks
  assert.ok(title.includes('low-opacity robe weave and seam texture'))
  assert.ok(fallback.duel.layers.includes('weapon proximity/contact cue derived only from existing spacing and attack state'))
  assert.ok(fallback.siege.layers.includes('corner tower windows, timber beams and braces'))
  assert.ok(fallback.strategyMap.layers.includes('deterministic river surface micro-reflections'))
  assert.ok(fallback.strategyMap.layers.includes('compact target fort with hot-pink and gold banner'))
})
