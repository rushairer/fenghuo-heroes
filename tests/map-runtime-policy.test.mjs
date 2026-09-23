import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const manifest=JSON.parse(read('public/assets/manifests/asset-manifest.v1.json'))

function leaves(value,prefix=''){
  const out=[]
  if(!value||typeof value!=='object')return out
  if(typeof value.src==='string')return [{key:prefix,...value}]
  for(const [key,child] of Object.entries(value)){
    if(key==='policy'||key==='version')continue
    out.push(...leaves(child,prefix?`${prefix}.${key}`:key))
  }
  return out
}

test('map runtime policy is vector-only and raster archive is reference-only',()=>{
  assert.equal(manifest.policy.mapRuntime,'vector')
  assert.equal(manifest.policy.mapRasterArchive,'reference-only')
  const mapAssets=leaves(manifest.map,'map')
  assert.ok(mapAssets.length>0)
  assert.ok(mapAssets.every((entry)=>entry.status==='disabled'))
})

test('strategy map scenes do not request raster map assets',()=>{
  for(const path of ['src/scenes/strategy-info.js','src/scenes/strategy-full-map.js']){
    const source=read(path)
    assert.doesNotMatch(source,/getForDisplay\(['`"]map\./)
    assert.doesNotMatch(source,/getForDisplay\(`map\./)
  }
})

test('vector-only map keeps raster UI assets independent',()=>{
  const readyUi=leaves(manifest.ui,'ui').filter((entry)=>entry.status==='ready')
  assert.ok(readyUi.length>0)
})
