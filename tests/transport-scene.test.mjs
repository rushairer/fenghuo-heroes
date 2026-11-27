import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { StrategyScene } from '../src/scenes/strategy.js'

function fixture(){
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  const owned=store.mapProfile.cities.filter(city=>store.state.cities[city.id].owner==='cao')
  assert.ok(owned.length>=2)
  const [source,target]=owned
  store.state.cities[source.id].gold=20000
  store.state.cities[source.id].food=20000
  const scene=Object.create(StrategyScene.prototype)
  Object.assign(scene,{
    app:{store,audio:{confirm(){},move(){},cancel(){},alert(){}}},
    view:'commands',stage:'command',category:'domestic',targetCity:source.id,
    messageReturnView:'map',transportSource:null,transportDestination:null,
    transportHint:'',transportLoadIndex:0,
  })
  return {scene,store,source,target}
}

function openLoad(scene,target){
  scene.beginTransportTargeting()
  assert.equal(scene.view,'transport-target')
  // Map profiles may store logical rather than world coordinates;
  // inject the selected city through the same cityAt interface.
  scene.app.store.cityAt=()=>target
  scene.updateTransportTarget('C')
  assert.equal(scene.view,'transport-load')
}

test('transport preview returns to the source command menu without dispatch or debit',()=>{
  const {scene,store,source,target}=fixture()
  openLoad(scene,target)
  const before=structuredClone(store.state)
  scene.updateTransportLoad('C')
  assert.equal(scene.view,'message')
  assert.match(scene.message,/預覽/)
  assert.match(scene.message,/尚未執行/)
  assert.deepEqual(store.state,before)
  assert.equal(scene.transportSource,null)
  assert.equal(scene.transportDestination,null)
  scene.updateMessage('B')
  assert.equal(scene.view,'commands')
  assert.equal(scene.targetCity,source.id)
})

test('transport rechecks destination ownership before accepting the load',()=>{
  const {scene,store,target}=fixture()
  openLoad(scene,target)
  store.state.cities[target.id].owner='liu'
  const before=structuredClone(store.state)
  scene.updateTransportLoad('C')
  assert.equal(scene.view,'transport-target')
  assert.equal(scene.transportDestination,null)
  assert.match(scene.transportHint,/另一座本國/)
  assert.deepEqual(store.state,before)
})

test('transport cancellation clears destination and returns to the command menu',()=>{
  const {scene,target}=fixture()
  openLoad(scene,target)
  scene.updateTransportLoad('B')
  assert.equal(scene.view,'transport-target')
  assert.equal(scene.transportDestination,null)
  scene.updateTransportTarget('B')
  assert.equal(scene.view,'commands')
  assert.equal(scene.transportSource,null)
})

test('transport without an eligible destination returns to the same command menu',()=>{
  const {scene,store,source}=fixture()
  for(const city of Object.values(store.state.cities)){
    if(city.id!==source.id&&city.owner==='cao')city.owner='liu'
  }
  scene.beginTransportTargeting()
  assert.equal(scene.view,'message')
  scene.updateMessage('B')
  assert.equal(scene.view,'commands')
  assert.equal(scene.transportSource,null)
})

test('transport abandons a stale source at entry, targeting or cargo confirmation',()=>{
  for(const stage of ['entry','target','load']){
    const {scene,store,source,target}=fixture()
    if(stage==='target')scene.beginTransportTargeting()
    if(stage==='load')openLoad(scene,target)
    store.state.cities[source.id].owner='liu'
    const before=structuredClone(store.state)
    if(stage==='entry')scene.beginTransportTargeting()
    if(stage==='target')scene.updateTransportTarget('B')
    if(stage==='load')scene.updateTransportLoad('C')
    assert.equal(scene.view,'message')
    assert.equal(scene.transportSource,null)
    assert.equal(scene.transportDestination,null)
    assert.equal(scene.targetCity,null)
    assert.deepEqual(store.state,before)
    scene.updateMessage('B')
    assert.equal(scene.view,'target')
  }
})
