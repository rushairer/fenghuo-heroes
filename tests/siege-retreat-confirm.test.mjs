import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { beginSiegeFromArmy,queueMarch } from '../src/game/march.js'
import { setSiegePhase } from '../src/game/siege-runtime.js'
import { cityWorldPoint } from '../src/game/world.js'
import { SiegeScene } from '../src/scenes/siege.js'

function sceneAtSiege(phase='siege'){
  const store=new GameStore(null)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  const source=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const enemy=cityWorldPoint(store.mapProfile.cityById.xinye)
  const army=queueMarch(store,{
    from:'xuchang',route:[source,{x:source.x+8,y:source.y}],
    troops:500,food:100,gold:0,officerNames:['曹操'],
  })
  army.x=enemy.x-8
  army.y=enemy.y
  army.status='waiting'
  const conflict=beginSiegeFromArmy(store,army.id,'xinye')
  setSiegePhase(conflict,phase)
  const nav=[]
  const app={
    store,
    go:(name)=>nav.push(name),
    audio:{confirm(){},cancel(){},alert(){},move(){}},
    toggleHd(){},
  }
  const scene=new SiegeScene(app)
  const press=(key)=>scene.update(0,{consume:()=>key})
  return {store,conflict,army,nav,scene,press}
}

test('one B no longer discards a live siege during the siege phase',()=>{
  const {store,conflict,army,nav,scene,press}=sceneAtSiege()
  const cityBefore=structuredClone(store.state.cities.xinye)
  press('x')
  assert.equal(scene.retreatConfirm,true)
  assert.equal(store.pendingConflict,conflict)
  assert.equal(army.status,'besieging')
  assert.deepEqual(nav,[])
  press('x')
  assert.equal(scene.retreatConfirm,false)
  assert.equal(store.pendingConflict,conflict)
  assert.deepEqual(store.state.cities.xinye,cityBefore)
  assert.deepEqual(nav,[])
})

test('confirming the explicit engineering abort returns to strategy without fabricating losses',()=>{
  const {store,army,nav,scene,press}=sceneAtSiege()
  const defender=structuredClone(store.state.cities.xinye)
  const troops=army.troops
  press('x')
  assert.equal(scene.retreatConfirm,true)
  press('c')
  assert.equal(store.pendingConflict,null)
  assert.equal(army.status,'waiting')
  assert.equal(army.troops,troops)
  assert.deepEqual(store.state.cities.xinye,defender)
  assert.deepEqual(nav,['strategy'])
})

test('the speed menu also requires confirmation to abort a pending siege',()=>{
  const {store,conflict,nav,scene,press}=sceneAtSiege('speed')
  press('Escape')
  assert.equal(store.pendingConflict,conflict)
  assert.equal(scene.retreatConfirm,true)
  press('Escape')
  assert.equal(scene.retreatConfirm,false)
  assert.equal(store.pendingConflict,conflict)
  assert.deepEqual(nav,[])
})

test('B in formation returns to speed instead of aborting siege',()=>{
  const {store,conflict,nav,scene,press}=sceneAtSiege('formation')
  press('x')
  assert.equal(scene.phase,'speed')
  assert.equal(scene.retreatConfirm,false)
  assert.equal(store.pendingConflict,conflict)
  assert.deepEqual(nav,[])
})
