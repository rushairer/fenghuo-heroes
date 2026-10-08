import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'

const KEY='fenghuo-heroes.cleanroom.v4'
class FlakyStorage{
  constructor(){this.data=new Map();this.fail=false}
  getItem(k){return this.data.get(k)??null}
  setItem(k,value){
    if(this.fail)throw new Error('QuotaExceededError')
    this.data.set(k,value)
  }
  removeItem(k){this.data.delete(k)}
}

test('failed localStorage write preserves the existing in-memory campaign and old save',()=>{
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  const before=structuredClone(store.state)
  const bytes=storage.getItem(KEY)
  const activeConflict={kind:'field',attackerArmyId:'a',defenderArmyId:'b'}
  store.pendingConflict=activeConflict
  storage.fail=true
  assert.throws(()=>store.newGame({scenarioYear:189,humanFactions:['liu']}),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(store.pendingConflict,activeConflict)
  assert.equal(storage.getItem(KEY),bytes)
})

test('failed first-time persistence does not leave a phantom playable campaign',()=>{
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  storage.fail=true
  assert.throws(()=>store.newGame({scenarioYear:189,humanFactions:['cao']}),/QuotaExceededError/)
  assert.equal(store.hasGame(),false)
  assert.equal(store.pendingConflict,null)
  assert.equal(storage.getItem(KEY),null)
})

test('successful new game replaces both the active state and old conflict',()=>{
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.pendingConflict={kind:'field',attackerArmyId:'a',defenderArmyId:'b'}
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  assert.equal(store.humanFaction,'liu')
  assert.equal(store.pendingConflict,null)
  const parsed=JSON.parse(storage.getItem(KEY))
  assert.deepEqual(parsed.humanFactions,['liu'])
  assert.equal(parsed.pendingConflict,null)
})
