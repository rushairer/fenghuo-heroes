import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  advanceMarchArmies,
  beginFieldBattleFromArmies,
  beginSiegeFromArmy,
  cancelFieldBattleFromArmies,
  cancelSiegeFromArmy,
  queueMarch,
} from '../src/game/march.js'
import {
  ensureFieldBattleRuntime,
  setFieldBattleAmbush,
  setFieldBattleOrder,
  setFieldBattlePhase,
  setFieldBattleSpeed,
} from '../src/game/field-battle-runtime.js'
import {
  ensureSiegeRuntime,
  queueSiegeAttackIntent,
  setSiegePhase,
  setSiegeSpeed,
} from '../src/game/siege-runtime.js'
import { MARCH_RUNTIME_PROJECTION } from '../src/game/march-runtime-projection.js'
import { cityWorldPoint } from '../src/game/world.js'

class MemoryStorage{
  constructor(){this.data=new Map()}
  getItem(k){return this.data.get(k)??null}
  setItem(k,v){this.data.set(k,v)}
  removeItem(k){this.data.delete(k)}
}

function evenMonthStore(storage){
  const store=new GameStore(storage)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  return store
}

function routeToward(start,target){
  const route=[{...start}]
  const step=MARCH_RUNTIME_PROJECTION.routeStepWorld
  let x=start.x,y=start.y
  while(x!==target.x||y!==target.y){
    x+=Math.sign(target.x-x)*Math.min(step,Math.abs(target.x-x))
    y+=Math.sign(target.y-y)*Math.min(step,Math.abs(target.y-y))
    route.push({x,y})
    if(route.length>256)throw new Error('Invalid test fixture route')
  }
  return route
}

test('field battle phase and command survive title Continue-style save/load',()=>{
  const storage=new MemoryStorage()
  const store=evenMonthStore(storage)
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const attacker=queueMarch(store,{
    from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:800,food:300,gold:0,officerNames:['曹操'],
  })
  const enemy={
    id:'enemy-field-test',faction:'liu',from:'xinye',
    x:start.x+8,y:start.y,route:[{x:start.x+8,y:start.y}],routeIndex:0,
    troops:700,food:200,gold:0,officerCount:1,officerNames:['劉備'],status:'waiting',
  }
  store.state.armies.push(enemy)
  const conflict=beginFieldBattleFromArmies(store,attacker.id,enemy.id)
  setFieldBattleSpeed(conflict,'fast')
  setFieldBattlePhase(conflict,'battle')
  setFieldBattleOrder(conflict,{commandId:'wait'})
  setFieldBattleAmbush(conflict,true)
  store.save()

  const restored=new GameStore(storage)
  assert.equal(restored.load(),true)
  assert.equal(restored.pendingConflict?.kind,'field')
  const runtime=ensureFieldBattleRuntime(restored.pendingConflict)
  assert.equal(runtime.phase,'battle')
  assert.equal(runtime.speed,'fast')
  assert.deepEqual(runtime.order,{commandId:'wait'})
  assert.equal(runtime.ambush,true)
  assert.equal(restored.state.armies.find((a)=>a.id===attacker.id)?.status,'engaged')
  assert.equal(restored.state.armies.find((a)=>a.id===enemy.id)?.status,'engaged')

  assert.equal(cancelFieldBattleFromArmies(restored),true)
  const again=new GameStore(storage)
  assert.equal(again.load(),true)
  assert.equal(again.pendingConflict,null)
  assert.equal(again.state.armies.find((a)=>a.id===attacker.id)?.status,'marching')
  assert.equal(again.state.armies.find((a)=>a.id===enemy.id)?.status,'waiting')
})

test('siege orders and defense snapshot survive save/load without imaginary casualties',()=>{
  const storage=new MemoryStorage()
  const store=evenMonthStore(storage)
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const target=cityWorldPoint(store.mapProfile.cityById.xinye)
  const route=routeToward(start,target)
  const army=queueMarch(store,{
    from:'xuchang',route,troops:1200,food:400,gold:0,officerNames:['曹操'],
  })
  advanceMarchArmies(store,route.length)
  const targetState=structuredClone(store.state.cities.xinye)
  const conflict=beginSiegeFromArmy(store,army.id,'xinye')
  setSiegeSpeed(conflict,'fast')
  setSiegePhase(conflict,'siege')
  queueSiegeAttackIntent(conflict)
  queueSiegeAttackIntent(conflict)
  store.save()

  const restored=new GameStore(storage)
  assert.equal(restored.load(),true)
  assert.equal(restored.pendingConflict?.kind,'siege')
  const runtime=ensureSiegeRuntime(restored.pendingConflict)
  assert.equal(runtime.phase,'siege')
  assert.equal(runtime.speed,'fast')
  assert.equal(runtime.attackOrders,2)
  assert.equal(runtime.lastAttackIntent.numericDelta,null)
  assert.equal(runtime.defenseRateSnapshot,targetState.defense)
  assert.deepEqual(restored.state.cities.xinye,targetState)

  assert.equal(cancelSiegeFromArmy(restored),true)
  const again=new GameStore(storage)
  assert.equal(again.load(),true)
  assert.equal(again.pendingConflict,null)
  assert.equal(again.state.armies.find((a)=>a.id===army.id)?.status,'waiting')
  assert.deepEqual(again.state.cities.xinye,targetState)
})
