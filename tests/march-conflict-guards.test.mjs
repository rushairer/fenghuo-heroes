import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  advanceMarchArmies,executeMarchTurn,queueMarch,rerouteArmy,
} from '../src/game/march.js'
import { marchSupplyOrder } from '../src/game/march-supply.js'
import { cityWorldPoint } from '../src/game/world.js'

function setup(){
  const s=new GameStore(null)
  s.newGame({scenarioYear:189,humanFactions:['cao']})
  s.finishCurrentTurn()
  const start=cityWorldPoint(s.mapProfile.cityById.xuchang)
  const army=queueMarch(s,{
    from:'xuchang',route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y}],
    troops:500,food:300,gold:0,officerNames:['曹操'],
  })
  return {s,start,army}
}

test('active battle blocks march queue, reroute, advancement and village orders atomically',()=>{
  const {s,start,army}=setup()
  s.pendingConflict={kind:'field',attackerArmyId:'army-a',defenderArmyId:'army-b'}
  const before=structuredClone(s.state)
  assert.throws(()=>queueMarch(s,{
    from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:500,food:10,gold:0,officerNames:['曹仁'],
  }),/戰鬥尚未結束/)
  assert.throws(()=>rerouteArmy(s,army.id,[start,{x:start.x,y:start.y+8}]),/戰鬥尚未結束/)
  assert.throws(()=>executeMarchTurn(s,1),/戰鬥尚未結束/)
  assert.throws(()=>advanceMarchArmies(s,30),/戰鬥尚未結束/)
  assert.throws(()=>marchSupplyOrder(s,army.id,'buy-rice'),/戰鬥尚未結束/)
  assert.deepEqual(s.state,before)
  assert.equal(s.pendingConflict.kind,'field')
})

test('march steps only accept explicit nonnegative integer calendar days',()=>{
  const {s}=setup()
  const before=structuredClone(s.state)
  for(const days of [-1,1.5,NaN,Infinity,'1',null]){
    assert.throws(()=>executeMarchTurn(s,days),/非負整數/)
    assert.deepEqual(s.state,before)
  }
  assert.deepEqual(executeMarchTurn(s,0),[{
    armyId:'army-1',
    steps:0,daysElapsed:0,foodConsumed:0,starvingDays:0,status:'marching',
  }])
  assert.equal(s.state.armies[0].routeIndex,0)
})

test('march-only commands are unavailable during inspection months',()=>{
  const {s,start,army}=setup()
  s.finishCurrentTurn()
  const before=structuredClone(s.state)
  assert.equal(s.mode,'inspection')
  assert.throws(()=>rerouteArmy(s,army.id,[start,{x:start.x,y:start.y+8}]),/行軍月/)
  assert.throws(()=>executeMarchTurn(s,1),/行軍月/)
  assert.throws(()=>marchSupplyOrder(s,army.id,'buy-rice'),/行軍月/)
  assert.deepEqual(s.state,before)
})
