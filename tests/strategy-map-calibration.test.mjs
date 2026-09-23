import test from 'node:test'
import assert from 'node:assert/strict'
import { TARGET_STRATEGY_CALIBRATION, inspectionWorldViewport } from '../src/game/strategy-map-calibration.js'

test('target strategy calibration remains inside the 320x224 logical frame',()=>{
  const c=TARGET_STRATEGY_CALIBRATION
  assert.equal(c.view.height,224)
  assert.ok(c.view.scale>1&&c.view.scale<1.5)
  assert.ok(c.plaque.width<80&&c.plaque.height<24)
  assert.equal(c.cursor.width,c.cursor.height)
  assert.ok(c.cursor.width>=16&&c.cursor.width<=20)
})

test('inspection viewport density is derived without mutating world coordinates',()=>{
  const viewport=inspectionWorldViewport()
  assert.ok(viewport.width<320)
  assert.ok(viewport.height<224)
  assert.equal(viewport.width,320/TARGET_STRATEGY_CALIBRATION.view.scale)
  assert.equal(viewport.height,224/TARGET_STRATEGY_CALIBRATION.view.scale)
})

test('target landmark scales preserve compact forts and stronger natural masses',()=>{
  const c=TARGET_STRATEGY_CALIBRATION
  const fort=c.fort.inspectionScale*c.view.scale
  const mountain=c.mountain.inspectionScale*c.view.scale
  const hill=c.hill.inspectionScale*c.view.scale
  assert.ok(mountain>fort)
  assert.ok(hill>=fort)
  assert.ok(c.village.inspectionScale>c.village.standardScale)
})
