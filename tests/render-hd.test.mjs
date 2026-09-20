import test from 'node:test'
import assert from 'node:assert/strict'
import { renderScaleFor, renderScaleForMode } from '../src/game/render.js'

test('HD renderer keeps a 6x minimum backing scale',()=>{
  assert.equal(renderScaleFor({cssWidth:320,cssHeight:224,dpr:1}),6)
  assert.equal(renderScaleFor({cssWidth:640,cssHeight:448,dpr:1}),6)
})

test('HD renderer follows display density without exceeding the cap',()=>{
  assert.equal(renderScaleFor({cssWidth:960,cssHeight:672,dpr:2}),6)
  assert.equal(renderScaleFor({cssWidth:1280,cssHeight:896,dpr:2}),8)
  assert.equal(renderScaleFor({cssWidth:1600,cssHeight:1120,dpr:2}),10)
  assert.equal(renderScaleFor({cssWidth:1920,cssHeight:1344,dpr:3}),10)
})

test('HD renderer sanitizes invalid display metrics',()=>{
  assert.equal(renderScaleFor({cssWidth:0,cssHeight:0,dpr:0}),6)
  assert.equal(renderScaleFor({cssWidth:Number.NaN,cssHeight:Number.NaN,dpr:Number.NaN}),6)
})


test('pixel preview is a real 1x Mega Drive backing store',()=>{
  assert.equal(renderScaleForMode({pixelPreview:true,cssWidth:1600,cssHeight:1120,dpr:3}),1)
  assert.equal(renderScaleForMode({pixelPreview:false,cssWidth:1600,cssHeight:1120,dpr:2}),10)
})
