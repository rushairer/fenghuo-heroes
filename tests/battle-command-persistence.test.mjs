import test from 'node:test'
import assert from 'node:assert/strict'
import { FieldBattleScene } from '../src/scenes/field-battle.js'
import { SiegeScene } from '../src/scenes/siege.js'
import { FIELD_BATTLE_COMMANDS } from '../src/game/field-battle-parity.js'

function harness(kind,{day=1,ordersClosed=false}={}){
  const conflict={
    kind,attackerOfficers:['曹操'],attackerTroops:1500,defenderTroops:1200,
    attacker:'cao',defender:'liu',ownTerrain:'forest',enemyTerrain:'forest',
    strategyAvailable:true,
    runtime:{
      phase:kind==='field'?'battle':'siege',speed:'normal',
      ...(kind==='field'?{day,ordersClosed,order:ordersClosed?{commandId:'end'}:null}:{}),
    },
  }
  const navigation=[]
  let fail=true
  const app={
    store:{pendingConflict:conflict,save(){if(fail)throw Error('QuotaExceededError')}},
    audio:{confirm(){},cancel(){},move(){},alert(){}},
    go:(name)=>navigation.push(name),
  }
  const Scene=kind==='field'?FieldBattleScene:SiegeScene
  const scene=new Scene(app)
  return {
    conflict,scene,navigation,
    press:(key)=>scene.update(0,{consume:()=>key}),
    setFail:(value)=>{fail=value},
  }
}

test('field end order rollback preserves the day and command availability',()=>{
  const {conflict,scene,press,setFail}=harness('field')
  scene.window='command'
  scene.commandIndex=FIELD_BATTLE_COMMANDS.findIndex((x)=>x.id==='end')
  scene.executeCommand()
  assert.equal(scene.window,'command')
  assert.equal(conflict.runtime.ordersClosed,false)
  assert.equal(conflict.runtime.order,null)
  assert.match(scene.message,/QuotaExceededError/)
  press('c')
  setFail(false)
  scene.executeCommand()
  assert.equal(scene.window,null)
  assert.equal(scene.runtime.ordersClosed,true)
  assert.deepEqual(conflict.runtime.order,{commandId:'end'})
})

test('field manual-day advance rolls back day number and carryover flag on failed save',()=>{
  const {conflict,scene,press,setFail}=harness('field',{day:29,ordersClosed:true})
  press('Enter')
  assert.equal(scene.runtime.day,29)
  assert.equal(scene.runtime.carryoverPending,false)
  assert.equal(scene.runtime.ordersClosed,true)
  assert.match(scene.message,/戰鬥命令未保存/)
  press('c')
  setFail(false)
  press('Enter')
  assert.equal(scene.runtime.day,30)
  assert.equal(scene.runtime.carryoverPending,true)
  assert.equal('winner' in conflict.runtime,false)
})

test('field wait ambush and tactic intents commit together with storage',()=>{
  const {conflict,scene,press,setFail}=harness('field')
  scene.window='command'
  scene.commandIndex=FIELD_BATTLE_COMMANDS.findIndex((x)=>x.id==='wait')
  scene.executeCommand()
  assert.equal(scene.runtime.ambush,false)
  assert.equal(scene.runtime.order,null)
  press('c')
  setFail(false)
  scene.executeCommand()
  assert.equal(scene.runtime.ambush,true)
  assert.deepEqual(scene.runtime.order,{commandId:'wait'})

  // Restart a pending field command scene to verify strategy effect atomicity.
  const other=harness('field')
  other.scene.window='strategy'
  other.scene.tacticIndex=0
  other.scene.executeTactic()
  assert.equal(other.conflict.runtime.order,null)
  assert.equal(other.scene.window,'strategy')
  other.press('c')
  other.setFail(false)
  other.scene.executeTactic()
  assert.deepEqual(other.conflict.runtime.order,{commandId:'strategy',tacticId:'fire'})
  assert.equal(other.scene.window,null)
})

test('siege attack sequence and last intent are restored if persistence fails',()=>{
  const {conflict,scene,press,setFail}=harness('siege')
  press('c')
  assert.equal(scene.runtime.attackOrders,0)
  assert.equal(scene.runtime.lastAttackIntent,null)
  assert.match(scene.message,/攻城命令未保存/)
  assert.equal('winner' in conflict,false)
  press('c')
  setFail(false)
  press('c')
  assert.equal(scene.runtime.attackOrders,1)
  assert.deepEqual(scene.runtime.lastAttackIntent,{
    sequence:1,effect:'lower-defense-rate',numericDelta:null,entryBattleProbability:null,
  })
  assert.equal(conflict.defenderTroops,1200)
})
