import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { StrategyScene } from '../src/scenes/strategy-full-map.js'
import { WORLD_W, WORLD_H, cityWorldPoint } from '../src/game/world.js'

function fixture(){
  const store=new GameStore(null)
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  const scene=Object.create(StrategyScene.prototype)
  Object.assign(scene,{
    app:{store,audio:{confirm(){},move(){},cancel(){},alert(){}}},
    stage:'survey',view:'map',infoTab:0,officerListCursor:0,
    countryOverviewCursor:0,
  })
  return {scene,store}
}
const press=(scene,key)=>scene.update(0,{consume:()=>key})

test('full-map directional browsing shares the map cursor without issuing orders',()=>{
  const {scene,store}=fixture()
  store.setCursor(100,120)
  scene.view='info'
  scene.infoTab=1
  const before=structuredClone(store.state)
  press(scene,'ArrowRight')
  press(scene,'ArrowDown')
  assert.equal(scene.view,'info')
  assert.deepEqual(store.state.cursor,{x:108,y:128})
  press(scene,'c')
  press(scene,'z')
  assert.equal(scene.view,'info')
  press(scene,'Enter')
  assert.equal(scene.view,'map')
  assert.deepEqual(store.state,{...before,cursor:{x:108,y:128}})
})

test('full-map browsing retains existing world bounds and B closes it',()=>{
  const {scene,store}=fixture()
  scene.view='info'
  scene.infoTab=1
  store.setCursor(WORLD_W-8,WORLD_H-8)
  press(scene,'ArrowRight')
  press(scene,'ArrowDown')
  assert.deepEqual(store.state.cursor,{x:WORLD_W-8,y:WORLD_H-8})
  store.setCursor(8,8)
  press(scene,'ArrowLeft')
  press(scene,'ArrowUp')
  assert.deepEqual(store.state.cursor,{x:8,y:8})
  press(scene,'x')
  assert.equal(scene.view,'map')
})

test('officer status browses the same roster and returns to the selected list row',()=>{
  const {scene,store}=fixture()
  const city=store.mapProfile.cities.find(c=>store.state.cities[c.id].owner==='liu')
  scene.openOfficerList(city.id)
  const rows=scene.officerListProjection().rows
  assert.ok(rows.length>1)
  const before=structuredClone(store.state)
  press(scene,'c')
  assert.equal(scene.view,'officer-status')
  assert.equal(scene.officerStatusRow.name,rows[0].name)
  press(scene,'ArrowDown')
  assert.equal(scene.officerStatusRow.name,rows[1].name)
  assert.equal(scene.officerStatusRow.force,null)
  press(scene,'ArrowUp')
  press(scene,'ArrowUp')
  assert.equal(scene.officerStatusRow.name,rows.at(-1).name)
  press(scene,'x')
  assert.equal(scene.view,'officer-list')
  assert.equal(scene.officerListCursor,rows.length-1)
  press(scene,'c')
  assert.equal(scene.officerStatusRow.name,rows.at(-1).name)
  assert.deepEqual(store.state,before)
})

test('officer status handles a changed or empty live roster without inventing a row',()=>{
  const {scene,store}=fixture()
  const city=store.mapProfile.cities.find(c=>store.state.cities[c.id].owner==='liu')
  scene.openOfficerList(city.id)
  press(scene,'c')
  store.state.scenarioOfficerPlacementStatus='source-backed-189'
  store.state.cities[city.id].officers=['關羽']
  press(scene,'ArrowDown')
  assert.equal(scene.officerStatusRow.name,'關羽')
  store.state.cities[city.id].officers=[]
  press(scene,'ArrowDown')
  assert.equal(scene.view,'officer-list')
  assert.equal(scene.officerStatusRow,null)
  assert.equal(scene.officerListCursor,0)
})

test('survey overview sorts fields with A/C while preserving selected city and campaign state',()=>{
  const {scene,store}=fixture()
  scene.view='info'
  scene.countryOverviewCursor=1
  const selected=scene.countryOverviewProjection()[1].cityId
  const before=structuredClone(store.state)
  press(scene,'ArrowRight')
  press(scene,'z')
  assert.equal(scene.countryOverviewSortField,'industry')
  assert.equal(scene.countryOverviewAscending,false)
  assert.equal(scene.countryOverviewProjection()[scene.countryOverviewCursor].cityId,selected)
  press(scene,'c')
  assert.equal(scene.countryOverviewAscending,true)
  assert.equal(scene.countryOverviewProjection()[scene.countryOverviewCursor].cityId,selected)
  assert.deepEqual(store.state,before)
})

for(const button of ['z','c']){
  test('survey country name '+button+' returns to the selected map city without entering commands',()=>{
    const {scene,store}=fixture()
    scene.view='info'
    const city=store.mapProfile.cities.find(c=>store.state.cities[c.id].owner!=='liu')
    scene.countryOverviewCursor=store.mapProfile.cities.findIndex(c=>c.id===city.id)
    const before=structuredClone(store.state)
    press(scene,button)
    assert.equal(scene.view,'map')
    assert.equal(scene.stage,'survey')
    assert.deepEqual(store.state,{...before,cursor:cityWorldPoint(city)})
  })
}
