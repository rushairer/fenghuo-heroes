import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { queueMarch } from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'
import { StrategyScene } from '../src/scenes/strategy-march.js'

function sceneFor(store){
  const scene=Object.create(StrategyScene.prototype)
  const alerts=[]
  scene.app={store,audio:{confirm(){},cancel(){},move(){},alert(){alerts.push('alert')}}}
  scene.resetForActiveTurn=()=>{}
  scene.stage='march'
  scene.view='map'
  return {scene,alerts}
}

test('an unresolved battle blocks month advancement before any army moves',()=>{
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  store.finishCurrentTurn()
  const home=store.mapProfile.cities.find((c)=>c.id==='xuchang')
  const start=cityWorldPoint(home)
  const army=queueMarch(store,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  store.pendingConflict={kind:'field',attackerArmyId:'a',defenderArmyId:'b'}
  const before=structuredClone(store.state)
  const {scene,alerts}=sceneFor(store)
  assert.equal(scene.finishTurn(),false)
  assert.deepEqual(store.state,before)
  assert.equal(army.routeIndex,0)
  assert.equal(scene.view,'message')
  assert.equal(alerts.length,1)
})

test('a normal last human turn advances march and the month together',()=>{
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  store.finishCurrentTurn()
  const home=store.mapProfile.cities.find((c)=>c.id==='xuchang')
  const start=cityWorldPoint(home)
  const army=queueMarch(store,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  const {scene}=sceneFor(store)
  assert.equal(scene.finishTurn(),true)
  assert.equal(store.state.month,3)
  assert.equal(army.routeIndex,1)
  assert.equal(army.status,'waiting')
})
