import test from 'node:test'
import assert from 'node:assert/strict'
import { FIELD_BATTLE_COMMANDS } from '../src/game/field-battle-parity.js'
import { FieldBattleScene } from '../src/scenes/field-battle.js'
import { SiegeScene } from '../src/scenes/siege.js'

function battleScene(Scene,conflict){
  const saves=[]
  const navigation=[]
  const store={
    pendingConflict:conflict,
    save(){saves.push(structuredClone(conflict))},
  }
  const app={
    store,
    audio:{confirm(){},cancel(){},alert(){},move(){}},
    go(name,options){navigation.push({name,options})},
    toggleHd(){},
  }
  const scene=new Scene(app)
  const send=(key)=>scene.update(0,{consume:()=>key})
  return {scene,send,saves,navigation,store}
}

test('field end order synchronizes UI state, allowing manual day advancement without fake casualties',()=>{
  const conflict={
    kind:'field',attackerTroops:1200,defenderTroops:900,
    runtime:{phase:'battle',speed:'normal'},
  }
  const {scene,send,saves,store}=battleScene(FieldBattleScene,conflict)
  scene.window='command'
  scene.commandIndex=FIELD_BATTLE_COMMANDS.findIndex((cmd)=>cmd.id==='end')
  scene.executeCommand()
  assert.equal(scene.runtime.ordersClosed,true)
  assert.equal(conflict.runtime.ordersClosed,true)
  assert.equal(conflict.runtime.day,1)
  send('c') // dismiss the command-result text
  send('Enter')
  assert.equal(scene.runtime.day,2)
  assert.equal(scene.runtime.ordersClosed,false)
  assert.equal(scene.runtime.order,null)
  assert.equal(store.pendingConflict,conflict)
  assert.deepEqual([conflict.attackerTroops,conflict.defenderTroops],[1200,900])
  assert.ok(saves.length>=2)
})

test('a day-30 boundary pauses rather than inventing a winner or dropping the conflict',()=>{
  const conflict={
    kind:'field',attackerTroops:1200,defenderTroops:900,
    runtime:{phase:'battle',speed:'normal',day:29,ordersClosed:true,order:{commandId:'end'}},
  }
  const {scene,send,navigation,store}=battleScene(FieldBattleScene,conflict)
  send('Enter')
  assert.equal(scene.runtime.day,30)
  assert.equal(scene.runtime.carryoverPending,true)
  assert.equal(scene.runtime.ordersClosed,true)
  assert.equal(conflict.runtime.winner,undefined)
  send('c') // dismiss 30-day status
  send('Enter')
  assert.equal(scene.runtime.day,30)
  assert.match(scene.message,/30日段落/)
  assert.equal(store.pendingConflict,conflict)
  assert.deepEqual(navigation,[])
})

test('siege scene refreshes its attack count on successive commands',()=>{
  const conflict={
    kind:'siege',attackerTroops:1200,defenderTroops:800,defenderDefense:40,
    runtime:{phase:'siege',speed:'normal'},
  }
  const {scene,send,saves,store}=battleScene(SiegeScene,conflict)
  send('c')
  assert.equal(scene.runtime.attackOrders,1)
  assert.equal(scene.runtime.lastAttackIntent.sequence,1)
  send('c') // dismiss message
  send('c')
  assert.equal(scene.runtime.attackOrders,2)
  assert.equal(scene.runtime.defenseRateSnapshot,40)
  assert.equal(scene.runtime.lastAttackIntent.numericDelta,null)
  assert.equal(store.pendingConflict,conflict)
  assert.ok(saves.length>=2)
})
