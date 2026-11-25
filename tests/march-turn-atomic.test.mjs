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

class FlakyStorage{
  constructor(){this.raw=null;this.writes=0;this.fail=false}
  getItem(){return this.raw}
  setItem(_key,value){this.writes++;if(this.fail)throw new Error('QuotaExceededError');this.raw=value}
}

test('last march turn uses a single save and rolls back movement, rations and calendar on failure',()=>{
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({humanFactions:['cao']})
  store.finishCurrentTurn()
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const army=queueMarch(store,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  const original=structuredClone(store.state),disk=storage.raw
  const {scene,alerts}=sceneFor(store)
  storage.fail=true
  const writes=storage.writes
  assert.equal(scene.finishTurn(),false)
  assert.equal(storage.writes,writes+1)
  assert.deepEqual(store.state,original)
  assert.equal(store.state.armies[0],army)
  assert.equal(army.food,100)
  assert.equal(army.routeIndex,0)
  assert.equal(storage.raw,disk)
  assert.equal(scene.view,'message')
  assert.equal(alerts.length,1)
  storage.fail=false
  assert.equal(scene.finishTurn(),true)
  assert.equal(storage.writes,writes+2)
  assert.equal(store.state.month,3)
  assert.equal(army.routeIndex,1)
  assert.equal(army.food,94)
  const resumed=new GameStore(storage)
  assert.equal(resumed.load(),true)
  assert.equal(resumed.state.month,3)
  assert.equal(resumed.state.armies[0].food,94)
})

test('only the last human turn executes the monthly march, including direct store calls',()=>{
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao','liu']})
  store.finishCurrentTurn()
  store.finishCurrentTurn()
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const army=queueMarch(store,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  assert.equal(store.finishCurrentTurn().monthAdvanced,false)
  assert.equal(army.routeIndex,0)
  assert.equal(army.food,100)
  assert.equal(store.humanFaction,'liu')
  assert.equal(store.finishCurrentTurn().monthAdvanced,true)
  assert.equal(army.routeIndex,1)
  assert.equal(army.food,94)
  assert.equal(store.state.month,3)
})

test('failed turn handoff or forced month advancement restores the active human and log',()=>{
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({humanFactions:['cao','liu']})
  store.lockInspectionCategory('domestic')
  const before=structuredClone(store.state),disk=storage.raw
  storage.fail=true
  assert.throws(()=>store.finishCurrentTurn(),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.throws(()=>store.advanceMonth(),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(storage.raw,disk)
  storage.fail=false
  assert.equal(store.finishCurrentTurn().monthAdvanced,false)
  assert.equal(store.humanFaction,'liu')
})
