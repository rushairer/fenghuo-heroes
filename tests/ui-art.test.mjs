import test from 'node:test'
import assert from 'node:assert/strict'
import { focusFrameGeometry, promptPlateGeometry, strategyPanelGeometry, strategyTextWindowGeometry } from '../src/game/ui-art.js'
import { MAP_VIEW_H } from '../src/game/world.js'

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


test('strategy dialogue window reserves the MD lower text band',()=>{
  const g=strategyTextWindowGeometry(320,224-MAP_VIEW_H)
  assert.equal(MAP_VIEW_H,156)
  assert.equal(g.width,320)
  assert.equal(g.height,68)
  assert.equal(g.railHeight,5)
  assert.ok(g.primaryY<g.secondaryY)
  assert.ok(g.secondaryY<g.height-g.railHeight)
})

test('strategy vector panel geometry stays bounded at logical MD sizes',()=>{
  const g=strategyPanelGeometry(144,91)
  assert.equal(g.width,144)
  assert.equal(g.height,91)
  assert.ok(g.innerInset>g.goldInset)
  assert.ok(g.corner<=5)
})
