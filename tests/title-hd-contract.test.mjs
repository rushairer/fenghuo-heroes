import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const readJson=(path)=>JSON.parse(readFileSync(new URL(`../${path}`,import.meta.url),'utf8'))
const manifest=readJson('public/assets/manifests/asset-manifest.v1.json')
const spec=readJson('public/assets/manifests/production-spec.v1.json')
const generated=readJson('public/assets/generated/generated-assets.v1.json')
const titleScene=readFileSync(new URL('../src/scenes/title.js',import.meta.url),'utf8')
const titleArt=readFileSync(new URL('../src/game/title-art.js',import.meta.url),'utf8')

test('legacy 640x448 title raster stays disabled below the true-HD runtime floor',()=>{
  assert.equal(manifest.title.main.status,'disabled')
  assert.deepEqual(generated.assets['title.main'].runtimeSize,{width:640,height:448})
  assert.deepEqual(spec.assets['title.main'].minimumRuntime,{width:1600,height:1120})
  assert.ok(generated.assets['title.main'].runtimeSize.width<spec.assets['title.main'].minimumRuntime.width)
  assert.ok(generated.assets['title.main'].runtimeSize.height<spec.assets['title.main'].minimumRuntime.height)
})

test('title scene uses HD-aware lookup and scalable fallback paths',()=>{
  assert.match(titleScene,/getForDisplay\('title\.main', r\.W, r\.H\)/)
  assert.match(titleScene,/drawTitleComposition\(r\)/)
  assert.match(titleScene,/drawPromptPlate\(r,87,197,132,17\)/)
})

test('title menu frame cannot bypass its nine-slice contract',()=>{
  assert.deepEqual(spec.assets['title.menuFrame'].nineSlice,{sourceSlice:32,destEdge:6})
  assert.match(titleScene,/getNineSlice\('title\.menuFrame',\{sourceSlice:32,destEdge:6\}\)/)
  assert.doesNotMatch(titleScene,/assets\?\.get\('title\.menuFrame'\)/)
})


test('vector title fallback includes the scalable HD micro-detail pass',()=>{
  assert.match(titleArt,/drawTitleHdDetail/)
  assert.match(titleArt,/drawFrontRightGeneral\(r\)[\s\S]*drawTitleHdDetail\(r\)[\s\S]*drawBrocadeStrip\(r\)/)
})


test('vector title fallback applies material depth before micro-detail',()=>{
  assert.match(titleArt,/drawTitleMaterialPass/)
  assert.match(titleArt,/drawFrontRightGeneral\(r\)[\s\S]*drawTitleMaterialPass\(r\)[\s\S]*drawTitleHdDetail\(r\)[\s\S]*drawBrocadeStrip\(r\)/)
})
