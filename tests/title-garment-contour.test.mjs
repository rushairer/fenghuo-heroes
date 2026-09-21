import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_COLLAR_EDGES,
  TITLE_GARMENT_CONTOURS,
} from '../src/game/title-garment-contour.js'

test('title garment contour covers multiple robe and shoulder regions',()=>{
  assert.ok(TITLE_GARMENT_CONTOURS.length>=6)
  assert.ok(TITLE_COLLAR_EDGES.length>=4)
})

test('title garment contour stays inside the logical composition',()=>{
  for(const contour of TITLE_GARMENT_CONTOURS){
    assert.ok(contour.alpha>0&&contour.alpha<1)
    assert.ok(contour.width>0)
    for(const [x,y] of contour.points){
      assert.ok(x>=0&&x<=320)
      assert.ok(y>=0&&y<=224)
    }
  }
  for(const points of TITLE_COLLAR_EDGES){
    for(const [x,y] of points){
      assert.ok(x>=0&&x<=320)
      assert.ok(y>=0&&y<=224)
    }
  }
})
