import test from 'node:test'
import assert from 'node:assert/strict'
import { executeMarchTurn } from '../src/game/march.js'

function storeWithFood(food){
  return {
    mode:'march',
    assertState(){if(!this.state)throw new Error('Game not initialized')},
    state:{
      cities:{},
      nextArmyId:2,
      armies:[{
        id:'test-army',
        faction:'liu',
        x:500,
        y:400,
        troops:100,
        gold:0,
        food,
        officerCount:1,
        officerNames:[],
        route:[
          {x:500,y:400},
          {x:504,y:400},
          {x:508,y:400},
          {x:512,y:400},
        ],
        routeIndex:0,
        starving:false,
        starvingDaysTotal:0,
        status:'marching',
      }],
    },
  }
}

test('army ending a fully fed turn at zero food is not marked starving',()=>{
  const store=storeWithFood(6) // 100 troops + 1 officer => 2 food/day × 3 days.
  const [event]=executeMarchTurn(store,3)
  const army=store.state.armies[0]
  assert.equal(event.steps,3)
  assert.equal(event.foodConsumed,6)
  assert.equal(event.starvingDays,0)
  assert.equal(army.food,0)
  assert.equal(army.starving,false)
  assert.equal(army.lastTurnStarvingDays,0)
})

test('army records only days whose full daily ration could not be paid',()=>{
  const store=storeWithFood(5)
  const [event]=executeMarchTurn(store,3)
  const army=store.state.armies[0]
  assert.equal(event.foodConsumed,5)
  assert.equal(event.starvingDays,1)
  assert.equal(army.food,0)
  assert.equal(army.starving,true)
  assert.equal(army.lastTurnStarvingDays,1)
  assert.equal(army.starvingDaysTotal,1)
})

test('starvation day totals accumulate across march turns without inventing attrition',()=>{
  const store=storeWithFood(1)
  executeMarchTurn(store,2)
  const army=store.state.armies[0]
  assert.equal(army.lastTurnStarvingDays,2)
  assert.equal(army.starvingDaysTotal,2)
  // No soldier-loss formula has been verified yet, so accounting must not mutate troops.
  assert.equal(army.troops,100)
})

test('zero elapsed days preserve the last starvation accounting and route state',()=>{
  const store=storeWithFood(1)
  executeMarchTurn(store,1)
  const before=structuredClone(store.state)
  assert.equal(store.state.armies[0].starving,true)
  assert.deepEqual(executeMarchTurn(store,0),[{
    armyId:'test-army',steps:0,daysElapsed:0,foodConsumed:0,starvingDays:0,status:'marching',
  }])
  assert.deepEqual(store.state,before)
})

test('invalid second army rejects the entire movement before any first-army debit',()=>{
  for(const invalidate of [
    army=>{army.food=-1},
    army=>{army.troops=NaN},
    army=>{army.officerCount=1.5},
    army=>{army.routeIndex=99},
    army=>{army.x+=1},
    army=>{army.route[1]=null},
    army=>{army.route[1]={x:600,y:400}},
    army=>{army.route[1]={x:500,y:400}},
  ]){
    const store=storeWithFood(20)
    const other=structuredClone(store.state.armies[0])
    other.id='other'
    invalidate(other)
    store.state.armies.push(other)
    const before=structuredClone(store.state)
    assert.throws(()=>executeMarchTurn(store,1),/行軍部隊/)
    assert.deepEqual(store.state,before)
  }
})

test('a restored army already at its last route node retains starvation accounting',()=>{
  const store=storeWithFood(1)
  executeMarchTurn(store,3)
  const army=store.state.armies[0]
  army.status='marching'
  const before=structuredClone(army)
  assert.deepEqual(executeMarchTurn(store,1),[{
    armyId:'test-army',steps:0,daysElapsed:0,foodConsumed:0,starvingDays:0,status:'waiting',
  }])
  assert.deepEqual(army,{...before,status:'waiting'})
})

test('an exhausted route with mismatched coordinates is rejected before another army moves',()=>{
  const store=storeWithFood(20)
  const other=structuredClone(store.state.armies[0])
  other.id='other'
  other.routeIndex=other.route.length-1
  store.state.armies.push(other)
  const before=structuredClone(store.state)
  assert.throws(()=>executeMarchTurn(store,1),/位置與路線進度不符/)
  assert.deepEqual(store.state,before)
})
