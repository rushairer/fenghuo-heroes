import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { StrategyScene } from '../src/scenes/strategy-full-map.js'
import { inspectionCommandItems } from '../src/game/inspection-command-parity.js'

const key=(scene,k)=>scene.update(0,{consume:()=>k})

function fixture(category='domestic'){
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  store.lockInspectionCategory(category)
  const source=store.mapProfile.cities.find(c=>store.state.cities[c.id].owner==='cao')
  const foreign=store.mapProfile.cities.find(c=>store.state.cities[c.id].owner==='liu')
  assert.ok(source&&foreign)
  const scene=new StrategyScene({store,audio:{confirm(){},move(){},cancel(){},alert(){}}})
  const index=inspectionCommandItems(category).findIndex(item=>item.id==='intel')
  Object.assign(scene,{stage:'command',view:'commands',category,targetCity:source.id,menuIndex:index})
  return {scene,store,source,foreign,index}
}

for(const category of ['domestic','diplomacy','military']){
  test(category+' intel drilldown restores the original command city and selection',()=>{
    const {scene,store,source,foreign,index}=fixture(category)
    const before=structuredClone(store.state)
    key(scene,'c')
    assert.equal(scene.view,'info')
    scene.countryOverviewCursor=store.mapProfile.cities.findIndex(c=>c.id===foreign.id)
    key(scene,'c')
    assert.equal(scene.view,'city-status')
    assert.equal(scene.targetCity,foreign.id)
    key(scene,'c')
    assert.equal(scene.view,'officer-list')
    key(scene,'x')
    assert.equal(scene.view,'city-status')
    key(scene,'x')
    assert.equal(scene.view,'info')
    key(scene,'x')
    assert.equal(scene.view,'commands')
    assert.equal(scene.targetCity,source.id)
    assert.equal(scene.menuIndex,index)
    assert.equal(scene.infoCommandBrowse,false)
    assert.equal(scene.infoCommandCity,null)
    assert.deepEqual(store.state,before)
  })
}

test('intel exit with a lost source city falls back to owned-city targeting',()=>{
  const {scene,store,source}=fixture()
  key(scene,'c')
  store.state.cities[source.id].owner='liu'
  key(scene,'x')
  assert.equal(scene.view,'target')
  assert.equal(scene.targetCity,null)
  assert.equal(scene.infoCommandCity,null)
})

test('ordinary survey overview still closes to the map',()=>{
  const {scene}=fixture()
  scene.stage='survey'
  scene.view='map'
  key(scene,'z')
  assert.equal(scene.view,'info')
  key(scene,'x')
  assert.equal(scene.view,'map')
  assert.equal(scene.infoCommandBrowse,false)
})
