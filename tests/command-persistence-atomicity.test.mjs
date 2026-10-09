import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { marchSupplyOrder } from '../src/game/march-supply.js'

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

test('failed tax-rate save restores old city data and log',()=>{
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({humanFactions:['cao']})
  store.lockInspectionCategory('domestic')
  const city=store.state.cities.xuchang
  const original=structuredClone(store.state)
  const raw=storage.getItem(SAVE_KEY)
  assert.equal('taxRate' in city,false)
  storage.fail=true
  assert.throws(()=>store.setTaxRate('xuchang',45),/QuotaExceededError/)
  assert.deepEqual(store.state,original)
  assert.equal(storage.getItem(SAVE_KEY),raw)
  assert.equal('taxRate' in city,false)
  storage.fail=false
  store.setTaxRate('xuchang',45)
  assert.equal(city.taxRate,45)
})

test('failed tax-rate save preserves an existing rate and previous log',()=>{
  const storage=new FlakyStorage()
  const store=new GameStore(storage)
  store.newGame({humanFactions:['cao']})
  store.lockInspectionCategory('domestic')
  store.setTaxRate('xuchang',33)
  const before=structuredClone(store.state)
  const disk=storage.getItem(SAVE_KEY)
  storage.fail=true
  assert.throws(()=>store.setTaxRate('xuchang',99),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(storage.getItem(SAVE_KEY),disk)
})

function supplyStore(){
  const logs=[]
  const store={
    humanFaction:'cao',
    mode:'march',
    mapProfile:{villages:[{id:'v1',x:80,y:96}]},
    state:{
      armies:[{id:'army-1',faction:'cao',x:80,y:96,food:100,gold:10,troops:500}],
      log:['old order'],
    },
    addLog(message){this.state.log.unshift(message);this.state.log=this.state.log.slice(0,8);logs.push(message)},
    save(){throw new Error('QuotaExceededError')},
    logs,
  }
  return store
}

test('failed village intent persistence restores previously saved supply order and game log',()=>{
  const store=supplyStore()
  const army=store.state.armies[0]
  const oldOrder={armyId:'army-1',villageId:'v1',optionId:'heal'}
  army.lastSupplyOrder=oldOrder
  const before=structuredClone(store.state)
  assert.throws(()=>marchSupplyOrder(store,'army-1','buy-rice'),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal(army.lastSupplyOrder,oldOrder)
})

test('failed first supply order does not create phantom supply state',()=>{
  const store=supplyStore()
  const before=structuredClone(store.state)
  assert.throws(()=>marchSupplyOrder(store,'army-1','buy-weapons'),/QuotaExceededError/)
  assert.deepEqual(store.state,before)
  assert.equal('lastSupplyOrder' in store.state.armies[0],false)
})
