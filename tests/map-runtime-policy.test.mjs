import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')
const manifest=JSON.parse(read('public/assets/manifests/asset-manifest.v1.json'))
const generated=JSON.parse(read('public/assets/generated/generated-assets.v1.json'))
const spec=JSON.parse(read('public/assets/manifests/production-spec.v1.json'))

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

test('strategic map raster resources are absent from the production asset chain',()=>{
  assert.equal(manifest.policy.mapRuntime,'vector')
  assert.equal(manifest.policy.mapRasterResources,'forbidden')
  assert.equal(manifest.map,undefined)
  assert.ok(Object.keys(generated.assets??{}).every((key)=>!key.startsWith('map.')))
  assert.ok(Object.keys(spec.assets??{}).every((key)=>!key.startsWith('map.')))
  assert.equal(existsSync(new URL('../public/assets/map',import.meta.url)),false)
  assert.equal(existsSync(new URL('../src/game/terrain-style.js',import.meta.url)),false)
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
