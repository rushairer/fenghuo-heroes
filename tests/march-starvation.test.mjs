import test from 'node:test'
import assert from 'node:assert/strict'
import { executeMarchTurn } from '../src/game/march.js'

function storeWithFood(food){
  return {
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
