import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_SEPARATION_EDGES,
  TITLE_SHOULDER_GLOWS,
} from '../src/game/title-silhouette-depth.js'

test('title silhouette depth contains multiple overlap separators and shoulder glows',()=>{
  assert.ok(TITLE_SEPARATION_EDGES.length>=5)
  assert.ok(TITLE_SHOULDER_GLOWS.length>=4)
})

test('title silhouette depth stays inside the 320x224 logical composition',()=>{
  for(const edge of TITLE_SEPARATION_EDGES){
    assert.ok(edge.width>0)
    assert.ok(edge.alpha>0&&edge.alpha<1)
    for(const [x,y] of edge.points){
      assert.ok(x>=0&&x<=320)
      assert.ok(y>=0&&y<=224)
    }
  }
  for(const glow of TITLE_SHOULDER_GLOWS){
    assert.ok(glow.x-glow.rx>=0)
    assert.ok(glow.x+glow.rx<=320)
    assert.ok(glow.y-glow.ry>=0)
    assert.ok(glow.y+glow.ry<=224)
  }
})
