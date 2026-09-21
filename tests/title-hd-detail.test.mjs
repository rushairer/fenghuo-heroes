import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_DETAIL_STROKES,
  TITLE_EMBROIDERY_MARKS,
  titleDetailBounds,
} from '../src/game/title-hd-detail.js'

test('title micro-detail contains enough vector strokes to survive HD rendering',()=>{
  assert.ok(TITLE_DETAIL_STROKES.length>=20)
  assert.ok(TITLE_EMBROIDERY_MARKS.length>=7)
})

test('title micro-detail stays inside the 320x224 logical composition',()=>{
  const bounds=titleDetailBounds()
  assert.ok(bounds.minX>=0)
  assert.ok(bounds.minY>=0)
  assert.ok(bounds.maxX<=320)
  assert.ok(bounds.maxY<=224)
})

test('every title detail stroke has finite geometry and positive line width',()=>{
  for(const stroke of TITLE_DETAIL_STROKES){
    assert.equal(stroke.length,6)
    assert.ok(stroke.slice(0,4).every(Number.isFinite))
    assert.ok(stroke[5]>0)
  }
})
