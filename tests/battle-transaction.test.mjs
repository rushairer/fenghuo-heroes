import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  beginFieldBattleFromArmies,beginSiegeFromArmy,
  cancelFieldBattleFromArmies,cancelSiegeFromArmy,queueMarch,
} from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'

const SAVE_KEY='fenghuo-heroes.cleanroom.v4'
class FlakyStorage{
  constructor(){this.data=new Map();this.fail=false}
  getItem(k){return this.data.get(k)??null}
  setItem(k,v){if(this.fail)throw new Error('QuotaExceededError');this.data.set(k,v)}
  removeItem(k){this.data.delete(k)}
}

function campaign(){
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const attacker=queueMarch(store,{
    from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:1000,food:300,gold:50,officerNames:['曹操'],
  })
  return {store,storage,start,attacker}
}

test('failed siege initiation preserves both army and world and permits safe retry',()=>{
  const {store,storage,attacker}=campaign()
  const target=cityWorldPoint(store.mapProfile.cityById.xinye)
  attacker.x=target.x-8;attacker.y=target.y;attacker.status='waiting'
  store.save()
  const original=structuredClone(store.state)
  const saved=storage.getItem(SAVE_KEY)
  storage.fail=true
  assert.throws(()=>beginSiegeFromArmy(store,attacker.id,'xinye'),/QuotaExceededError/)
  assert.deepEqual(store.state,original)
  assert.equal(store.pendingConflict,null)
  assert.equal(storage.getItem(SAVE_KEY),saved)
  storage.fail=false
  const conflict=beginSiegeFromArmy(store,attacker.id,'xinye')
  assert.equal(conflict.kind,'siege')
  assert.equal(attacker.status,'besieging')
})

test('failed siege abort leaves valid conflict and besieging army in place',()=>{
  const {store,storage,attacker}=campaign()
  const target=cityWorldPoint(store.mapProfile.cityById.xinye)
  attacker.x=target.x-8;attacker.y=target.y;attacker.status='waiting'
  const conflict=beginSiegeFromArmy(store,attacker.id,'xinye')
  const before=structuredClone(store.state)
  const raw=storage.getItem(SAVE_KEY)
  storage.fail=true
  assert.throws(()=>cancelSiegeFromArmy(store),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(store.pendingConflict,conflict)
  assert.equal(attacker.status,'besieging')
  assert.equal(storage.getItem(SAVE_KEY),raw)
  storage.fail=false
  assert.equal(cancelSiegeFromArmy(store),true)
  assert.equal(attacker.status,'waiting')
})

function fieldCampaign(){
  const result=campaign()
  const {store,attacker}=result
  const enemy={
    id:'enemy-test',faction:'liu',from:'xinye',x:attacker.x+8,y:attacker.y,
    route:[{x:attacker.x+8,y:attacker.y}],routeIndex:0,
    troops:1200,food:250,gold:10,officerCount:1,
    officerNames:['劉備'],status:'waiting',
  }
  store.state.armies.push(enemy)
  store.save()
  return {...result,enemy}
}

test('failed field-battle initiation does not engage or modify either army',()=>{
  const {store,storage,attacker,enemy}=fieldCampaign()
  const before=structuredClone(store.state)
  const raw=storage.getItem(SAVE_KEY)
  storage.fail=true
  assert.throws(()=>beginFieldBattleFromArmies(store,attacker.id,enemy.id),/QuotaExceededError/)
  assert.equal(store.pendingConflict,null)
  assert.deepEqual(store.state,before)
  assert.equal(storage.getItem(SAVE_KEY),raw)
  storage.fail=false
  const conflict=beginFieldBattleFromArmies(store,attacker.id,enemy.id)
  assert.equal(conflict.kind,'field')
  assert.equal(attacker.status,'engaged')
  assert.equal(enemy.status,'engaged')
})

test('failed field-battle abort keeps the same persistent conflict and original armies',()=>{
  const {store,storage,attacker,enemy}=fieldCampaign()
  const conflict=beginFieldBattleFromArmies(store,attacker.id,enemy.id)
  const original=structuredClone(store.state)
  const saved=storage.getItem(SAVE_KEY)
  storage.fail=true
  assert.throws(()=>cancelFieldBattleFromArmies(store),/QuotaExceededError/)
  assert.deepEqual(store.state,original)
  assert.equal(store.pendingConflict,conflict)
  assert.equal(storage.getItem(SAVE_KEY),saved)
  assert.equal(attacker.status,'engaged')
  assert.equal(enemy.status,'engaged')
  storage.fail=false
  assert.equal(cancelFieldBattleFromArmies(store),true)
  assert.equal(attacker.status,'marching')
  assert.equal(enemy.status,'waiting')
})
