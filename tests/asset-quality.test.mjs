import test from 'node:test'
import assert from 'node:assert/strict'
import {
  HD_RASTER_MIN_SCALE,
  assetPixelSize,
  assetSharpnessReport,
  isAssetSharpEnough,
  requiredRasterPixels,
} from '../src/game/asset-quality.js'

test('runtime raster HD floor is independent from backing-store supersampling',()=>{
  assert.equal(HD_RASTER_MIN_SCALE,5)
  assert.deepEqual(requiredRasterPixels(320,224),{width:1600,height:1120})
  assert.deepEqual(requiredRasterPixels(20,20),{width:100,height:100})
})

test('640x448 title raster cannot masquerade as HD',()=>{
  const image={naturalWidth:640,naturalHeight:448}
  const report=assetSharpnessReport(image,320,224)
  assert.equal(report.ok,false)
  assert.deepEqual(report.required,{width:1600,height:1120})
  assert.equal(isAssetSharpEnough(image,320,224),false)
})

test('small map sprites remain usable when their pixels cover their logical footprint',()=>{
  assert.equal(isAssetSharpEnough({width:128,height:128},20,20),true)
  assert.equal(isAssetSharpEnough({width:256,height:256},31,35),true)
  assert.equal(isAssetSharpEnough({width:64,height:64},20,20),false)
})

test('natural image dimensions take priority over layout dimensions',()=>{
  assert.deepEqual(assetPixelSize({naturalWidth:256,naturalHeight:128,width:32,height:16}),{
    width:256,
    height:128,
  })
})
