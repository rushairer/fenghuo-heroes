import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  PRESENTATION_HILL_CLUSTERS,
  PRESENTATION_MOUNTAIN_RANGES,
  STRATEGY_PRESENTATION_GEOGRAPHY,
} from '../src/game/strategy-map-presentation.js'

test('presentation geography is explicitly non-canonical',()=>{
  assert.equal(STRATEGY_PRESENTATION_GEOGRAPHY.canonical,false)
  assert.equal(STRATEGY_PRESENTATION_GEOGRAPHY.evidenceBoundary,'composition-only')
})

test('presentation mountain belts are dense deterministic world-space features',()=>{
  assert.ok(PRESENTATION_MOUNTAIN_RANGES.length>=70)
  assert.deepEqual(PRESENTATION_MOUNTAIN_RANGES,PRESENTATION_MOUNTAIN_RANGES)
  assert.ok(PRESENTATION_MOUNTAIN_RANGES.every((item)=>Number.isFinite(item.x)&&Number.isFinite(item.y)))
  assert.ok(PRESENTATION_MOUNTAIN_RANGES.every((item)=>item.scale>.8&&item.scale<1.2))
})

test('presentation hills stay much sparser than mountain ranges',()=>{
  assert.ok(PRESENTATION_HILL_CLUSTERS.length>=15)
  assert.ok(PRESENTATION_HILL_CLUSTERS.length<PRESENTATION_MOUNTAIN_RANGES.length/3)
})

test('presentation geography cannot import canonical evidence or runtime scaffold data',()=>{
  const source=readFileSync(new URL('../src/game/strategy-map-presentation.js',import.meta.url),'utf8')
  assert.doesNotMatch(source,/canonical-map-evidence|runtime-map-scaffold|original-data/)
})
