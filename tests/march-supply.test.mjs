import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MARCH_SUPPLY_EVIDENCE,
  MARCH_SUPPLY_OPTIONS,
  marchSupplyOrder,
  villageAtArmy,
  villageAtPoint,
} from '../src/game/march-supply.js'

function storeAtVillage(){
  const logs=[]
  const store={
    humanFaction:'liu',
    mapProfile:{villages:[{id:'village-01',x:80,y:96}]},
    state:{armies:[{
      id:'army-1',faction:'liu',x:80,y:96,troops:900,food:100,gold:50,officerNames:['劉備'],
    }]},
    addLog(message){logs.push(message)},
    save(){this.saved=true},
    logs,
  }
  return store
}

test('supply command exists only at an evidence-backed village coordinate',()=>{
  const store=storeAtVillage()
  assert.equal(villageAtPoint(store.mapProfile,80,96)?.id,'village-01')
  assert.equal(villageAtPoint(store.mapProfile,81,96),null)
  assert.equal(villageAtArmy(store,'army-1')?.id,'village-01')
  store.state.armies[0].x=88
  assert.equal(villageAtArmy(store,'army-1'),null)
})

test('Chinese target supply menu exposes weapons rice and healing only',()=>{
  assert.equal(MARCH_SUPPLY_EVIDENCE.targetEdition,'zh-hk-manual')
  assert.deepEqual(MARCH_SUPPLY_OPTIONS.map((item)=>item.id),['buy-weapons','buy-rice','heal'])
})

test('supply order persists intent without inventing price purchase amount or healing formula',()=>{
  const store=storeAtVillage()
  const before={
    gold:store.state.armies[0].gold,
    food:store.state.armies[0].food,
    troops:store.state.armies[0].troops,
  }
  const order=marchSupplyOrder(store,'army-1','buy-rice')
  assert.deepEqual(order,{
    armyId:'army-1',
    villageId:'village-01',
    optionId:'buy-rice',
    status:'awaiting-calibrated-effect',
  })
  assert.deepEqual({
    gold:store.state.armies[0].gold,
    food:store.state.armies[0].food,
    troops:store.state.armies[0].troops,
  },before)
  assert.equal(store.state.armies[0].lastSupplyOrder.optionId,'buy-rice')
  assert.equal(store.saved,true)
})

test('supply is rejected outside a village and for enemy armies',()=>{
  const store=storeAtVillage()
  store.state.armies[0].x=72
  assert.throws(()=>marchSupplyOrder(store,'army-1','heal'),/進入村莊/)
  store.state.armies[0].x=80
  store.state.armies[0].faction='cao'
  assert.throws(()=>marchSupplyOrder(store,'army-1','heal'),/找不到可補給/)
})
