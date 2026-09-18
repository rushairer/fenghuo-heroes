import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES } from '../src/game/data.js'
import { GameStore } from '../src/game/store.js'
import { advanceMarchArmies,beginSiegeFromArmy,dailyFoodFor,enemyArmyNearArmy,ensureMarchState,friendlyArmyStack,queueMarch,rerouteArmy } from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'

class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}
const city=(id)=>CITIES.find((item)=>item.id===id)

function marchingCaoStore(){
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  return store
}

test('manual daily grain formula is soldiers / 100 + officers',()=>{
  assert.equal(dailyFoodFor(3000,2),32)
  assert.equal(dailyFoodFor(999,1),10)
  assert.equal(dailyFoodFor(1000,3),13)
})

test('free cursor route creates persistent march army',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y+8}],troops:1000,food:400,gold:50,officerCount:1})
  assert.equal(ensureMarchState(s).length,1)
  assert.equal(army.dailyFood,11)
  assert.equal(army.route.length,3)
})

test('selected officer names persist on army and drive grain consumption',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{
    from:'xuchang',
    route:[start,{x:start.x+8,y:start.y}],
    troops:1000,
    food:400,
    gold:50,
    officerNames:['曹操','曹仁','夏候惇'],
  })
  assert.deepEqual(army.officerNames,['曹操','曹仁','夏候惇'])
  assert.equal(army.officerCount,3)
  assert.equal(army.dailyFood,13)
  advanceMarchArmies(s,1)
  assert.equal(army.food,387)
})

test('officer names are trimmed deduplicated and empty entries are ignored',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{
    from:'xuchang',
    route:[start,{x:start.x+8,y:start.y}],
    troops:1000,
    food:400,
    gold:0,
    officerNames:[' 曹操 ','曹操','','曹洪'],
  })
  assert.deepEqual(army.officerNames,['曹操','曹洪'])
  assert.equal(army.officerCount,2)
  assert.equal(army.dailyFood,12)
})

test('march execution consumes grain per route day and leaves army on map',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y},{x:start.x+24,y:start.y}],troops:1000,food:400,gold:0,officerCount:1})
  advanceMarchArmies(s,30)
  assert.equal(army.x,start.x+24)
  assert.equal(army.food,367)
  assert.equal(army.status,'waiting')
})

test('an existing army can receive a new free route',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:1000,food:400,gold:0})
  advanceMarchArmies(s,1)
  rerouteArmy(s,army.id,[{x:army.x,y:army.y},{x:army.x,y:army.y+8}])
  assert.equal(army.routeIndex,0)
  assert.equal(army.status,'marching')
  assert.equal(army.route.at(-1).y,start.y+8)
})

test('siege conflict inherits the selected attacking officers',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const target=cityWorldPoint(city('xinye'))
  const army=queueMarch(s,{
    from:'xuchang',
    route:[start,target],
    troops:1200,
    food:400,
    gold:0,
    officerNames:['曹操','夏候惇'],
  })
  advanceMarchArmies(s,1)
  const conflict=beginSiegeFromArmy(s,army.id,'xinye')
  assert.deepEqual(conflict.attackerOfficers,['曹操','夏候惇'])
  assert.equal(ensureMarchState(s).length,0)
})


test('friendly stack detection requires armies to share the same map point',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const a=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  const b=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y+8}],troops:500,food:100,gold:0})
  assert.equal(friendlyArmyStack(s,a.id).length,2)
  b.x+=8
  assert.equal(friendlyArmyStack(s,a.id).length,1)
})

test('enemy attack proximity is one route-step engineering baseline and excludes friendly armies',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const own=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  s.state.armies.push({
    id:'enemy-near',faction:'liu',from:'xinye',x:start.x+8,y:start.y,
    route:[{x:start.x+8,y:start.y}],routeIndex:0,troops:500,food:100,gold:0,
    officerCount:1,officerNames:['劉備'],dailyFood:6,starving:false,status:'waiting',
  })
  s.state.armies.push({
    id:'enemy-far',faction:'liu',from:'xinye',x:start.x+16,y:start.y,
    route:[{x:start.x+16,y:start.y}],routeIndex:0,troops:500,food:100,gold:0,
    officerCount:1,officerNames:['關羽'],dailyFood:6,starving:false,status:'waiting',
  })
  assert.equal(enemyArmyNearArmy(s,own.id)?.id,'enemy-near')
  s.state.armies.find((army)=>army.id==='enemy-near').x=start.x
  s.state.armies.find((army)=>army.id==='enemy-near').y=start.y
  assert.equal(enemyArmyNearArmy(s,own.id),null)
})
