import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_CLOTH_RIDGES,
  TITLE_HEADGEAR_STITCHES,
  TITLE_SKIN_SHADOWS,
} from '../src/game/title-material-art.js'

test('title material pass contains multiple skin, cloth and headgear detail regions',()=>{
  assert.ok(TITLE_SKIN_SHADOWS.length>=4)
  assert.ok(TITLE_CLOTH_RIDGES.length>=8)
  assert.ok(TITLE_HEADGEAR_STITCHES.length>=3)
})

test('title material geometry stays inside the 320x224 logical composition',()=>{
  for(const item of TITLE_SKIN_SHADOWS){
    assert.ok(item.x-item.rx>=0)
    assert.ok(item.x+item.rx<=320)
    assert.ok(item.y-item.ry>=0)
    assert.ok(item.y+item.ry<=224)
    assert.ok(item.alpha>0&&item.alpha<1)
  }
  for(const [x1,y1,x2,y2,,width] of TITLE_CLOTH_RIDGES){
    assert.ok([x1,y1,x2,y2,width].every(Number.isFinite))
    assert.ok(x1>=0&&x1<=320&&x2>=0&&x2<=320)
    assert.ok(y1>=0&&y1<=224&&y2>=0&&y2<=224)
    assert.ok(width>0)
  }
})

test('headgear stitch guides always have positive spacing',()=>{
  for(const stitch of TITLE_HEADGEAR_STITCHES){
    assert.ok(stitch.step>0)
    assert.ok(stitch.x1>=0&&stitch.x2<=320)
    assert.ok(stitch.y1>=0&&stitch.y2<=224)
  }
})
