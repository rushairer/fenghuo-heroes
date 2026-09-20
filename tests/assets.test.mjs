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


test('registry sharpness gate evaluates loaded image density',()=>{
  const registry=new AssetRegistry({fetchFn:null,imageFactory:null})
  registry.images.set('title.main',{naturalWidth:640,naturalHeight:448})
  assert.equal(registry.isSharpEnough('title.main',320,224),false)
  assert.deepEqual(registry.sharpness('title.main',320,224).required,{width:1600,height:1120})
  registry.images.set('title.main',{naturalWidth:1600,naturalHeight:1120})
  assert.equal(registry.isSharpEnough('title.main',320,224),true)
})


test('getForDisplay returns only raster assets dense enough for their logical footprint',()=>{
  const registry=new AssetRegistry({fetchFn:null,imageFactory:null})
  const sharp={naturalWidth:128,naturalHeight:128}
  const soft={naturalWidth:64,naturalHeight:64}
  registry.images.set('map.flag.sharp',sharp)
  registry.images.set('map.flag.soft',soft)
  assert.equal(registry.getForDisplay('map.flag.sharp',20,20),sharp)
  assert.equal(registry.getForDisplay('map.flag.soft',20,20),null)
  assert.equal(registry.getForDisplay('missing',20,20),null)
})
