import test from 'node:test'
import assert from 'node:assert/strict'
import { focusFrameGeometry, promptPlateGeometry } from '../src/game/ui-art.js'

test('focus frame corners stay bounded for large and small selections',()=>{
  for(const [w,h] of [[34,18],[66,96],[82,96]]){
    const g=focusFrameGeometry(w,h)
    assert.equal(g.width,w)
    assert.equal(g.height,h)
    assert.ok(g.corner>0)
    assert.ok(g.corner<=6)
    assert.ok(g.corner<w/2)
    assert.ok(g.corner<h/2)
  }
})

test('prompt plate geometry remains valid at title-menu sizes',()=>{
  const g=promptPlateGeometry(132,17)
  assert.equal(g.width,132)
  assert.equal(g.height,17)
  assert.ok(g.inset>0&&g.inset<g.height/2)
})
