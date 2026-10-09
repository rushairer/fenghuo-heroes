import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { queueMarch,rerouteArmy } from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'

const SAVE_KEY='fenghuo-heroes.cleanroom.v4'

class FlakyStorage{
  constructor(){this.data=new Map();this.fail=false}
  getItem(key){return this.data.get(key)??null}
  setItem(key,value){
    if(this.fail)throw new Error('QuotaExceededError')
    this.data.set(key,value)
  }
  removeItem(key){this.data.delete(key)}
}

function campaign(){
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const order={
    from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:500,food:100,gold:40,officerNames:['曹操'],
  }
  return {store,storage,start,order}
}

test('failed save when deploying the first army refunds all resources and restores uninitialized IDs',()=>{
  const {store,storage,order}=campaign()
  const before=structuredClone(store.state)
  const raw=storage.getItem(SAVE_KEY)
  assert.equal('armies' in store.state,false)
  assert.equal('nextArmyId' in store.state,false)
  storage.fail=true
  assert.throws(()=>queueMarch(store,order),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(storage.getItem(SAVE_KEY),raw)
  storage.fail=false
  const army=queueMarch(store,order)
  assert.equal(army.id,'army-1')
  assert.equal(store.state.armies.length,1)
  assert.equal(store.state.cities.xuchang.troops,before.cities.xuchang.troops-500)
  assert.equal(store.state.cities.xuchang.food,before.cities.xuchang.food-100)
  assert.equal(store.state.cities.xuchang.gold,before.cities.xuchang.gold-40)
})

test('failed dispatch preserves existing armies and the next ID without duplicates',()=>{
  const {store,storage,start,order}=campaign()
  const first=queueMarch(store,order)
  const before=structuredClone(store.state)
  const raw=storage.getItem(SAVE_KEY)
  storage.fail=true
  assert.throws(()=>queueMarch(store,{
    from:'xuchang',
    route:[start,{x:start.x,y:start.y+8}],
    troops:500,food:50,gold:0,officerNames:['曹仁'],
  }),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(store.state.armies[0],first)
  assert.equal(storage.getItem(SAVE_KEY),raw)
  storage.fail=false
  const next=queueMarch(store,{
    from:'xuchang',
    route:[start,{x:start.x,y:start.y+8}],
    troops:500,food:50,gold:0,officerNames:['曹仁'],
  })
  assert.equal(next.id,'army-2')
})

test('failed reroute leaves the same army object, route, status and log untouched',()=>{
  const {store,storage,start,order}=campaign()
  const army=queueMarch(store,order)
  const priorRoute=army.route
  const before=structuredClone(store.state)
  const bytes=storage.getItem(SAVE_KEY)
  storage.fail=true
  assert.throws(()=>rerouteArmy(store,army.id,[start,{x:start.x,y:start.y+8}]),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(army.route,priorRoute)
  assert.equal(store.state.armies[0],army)
  assert.equal(storage.getItem(SAVE_KEY),bytes)
  storage.fail=false
  rerouteArmy(store,army.id,[start,{x:start.x,y:start.y+8}])
  assert.equal(army.route.at(-1).y,start.y+8)
})

test('unknown army reroute has no initialization or storage side effects',()=>{
  const {store,storage,start}=campaign()
  const before=structuredClone(store.state)
  const bytes=storage.getItem(SAVE_KEY)
  assert.throws(()=>rerouteArmy(store,'missing',[start,{x:start.x+8,y:start.y}]),/找不到/)
  assert.deepEqual(store.state,before)
  assert.equal(storage.getItem(SAVE_KEY),bytes)
})
