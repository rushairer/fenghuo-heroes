import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_JAW_HIGHLIGHTS,
  TITLE_LOCAL_LIGHTS,
} from '../src/game/title-local-light.js'

test('title local-light pass covers all five portraits',()=>{
  assert.equal(TITLE_LOCAL_LIGHTS.length,5)
  assert.equal(TITLE_JAW_HIGHLIGHTS.length,5)
})

test('title local-light geometry stays inside the 320x224 composition',()=>{
  for(const light of TITLE_LOCAL_LIGHTS){
    assert.ok(light.x-light.rx>=0)
    assert.ok(light.x+light.rx<=320)
    assert.ok(light.y-light.ry>=0)
    assert.ok(light.y+light.ry<=224)
    assert.ok(light.alpha>0&&light.alpha<1)
  }
  for(const points of TITLE_JAW_HIGHLIGHTS){
    for(const [x,y] of points){
      assert.ok(x>=0&&x<=320)
      assert.ok(y>=0&&y<=224)
    }
  }
})
