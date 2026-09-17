import test from 'node:test'
import assert from 'node:assert/strict'
import { AssetRegistry, assetUrl, manifestEntry, readyAssetEntries } from '../src/game/assets.js'

const MANIFEST = {
  version:'1.0.0',
  title:{
    main:{src:'assets/title/title.webp',status:'ready'},
    border:{src:'assets/title/border.webp',status:'planned'},
  },
  ui:{panel:{src:'assets/ui/panel.webp',status:'ready'}},
}

test('manifest dotted lookup returns leaf entries',()=>{
  assert.equal(manifestEntry(MANIFEST,'title.main').src,'assets/title/title.webp')
  assert.equal(manifestEntry(MANIFEST,'title.missing'),null)
})

test('only ready assets are selected for preload',()=>{
  assert.deepEqual(readyAssetEntries(MANIFEST).map(([key])=>key),['title.main','ui.panel'])
})

test('asset URLs remain page-relative for GitHub Pages project paths',()=>{
  assert.equal(assetUrl('assets/title/title.webp'),'./assets/title/title.webp')
  assert.equal(assetUrl('./assets/title/title.webp'),'./assets/title/title.webp')
})

test('registry loads ready assets and ignores planned assets',async()=>{
  class FakeImage {
    set src(value) { this._src=value; queueMicrotask(()=>this.onload?.()) }
    get src() { return this._src }
  }
  const registry=new AssetRegistry({
    fetchFn:async()=>({ok:true,json:async()=>MANIFEST}),
    imageFactory:()=>new FakeImage(),
  })
  await registry.load()
  assert.equal(registry.loaded,true)
  assert.equal(registry.has('title.main'),true)
  assert.equal(registry.has('ui.panel'),true)
  assert.equal(registry.has('title.border'),false)
  assert.equal(registry.isPlanned('title.border'),true)
})

test('registry fails closed so canvas fallback can continue',async()=>{
  const registry=new AssetRegistry({fetchFn:async()=>({ok:false,status:404})})
  await registry.load()
  assert.equal(registry.loaded,false)
  assert.match(registry.error.message,/manifest request failed/i)
  assert.equal(registry.get('title.main'),null)
})
