import test from 'node:test'
import assert from 'node:assert/strict'
import { FieldBattleScene } from '../src/scenes/field-battle.js'

function harness(officers=['曹操','曹仁']){
  const saved=[]
  const navigation=[]
  const conflict={
    kind:'field',attacker:'cao',defender:'liu',
    attackerOfficers:officers,defenderOfficers:['劉備'],
    attackerTroops:1200,defenderTroops:900,
    runtime:{phase:'battle',speed:'normal',day:3,ordersClosed:false},
  }
  const store={
    pendingConflict:conflict,
    save(){saved.push(structuredClone(conflict))},
  }
  const app={
    store,
    go(name,options){navigation.push({name,options})},
    audio:{confirm(){},move(){},cancel(){},alert(){}},
    toggleHd(){},
  }
  const scene=new FieldBattleScene(app)
  const press=(key)=>scene.update(0,{consume:()=>key})
  return {app,store,conflict,scene,press,saved,navigation}
}

test('field move command runs actor/destination flow and records intent only',()=>{
  const {scene,press,conflict,saved}=harness()
  const previousTroops=conflict.attackerTroops
  scene.window='command'
  scene.commandIndex=0
  scene.executeCommand()
  assert.equal(scene.window,'move-officer')
  assert.equal(scene.runtime.moveDraft.phase,'officer')
  press('ArrowDown')
  assert.equal(scene.runtime.moveDraft.officerIndex,1)
  press('c')
  assert.equal(scene.window,'move-destination')
  assert.equal(scene.runtime.moveDraft.officerName,'曹仁')
  press('ArrowRight')
  press('ArrowUp')
  press('c')
  assert.equal(scene.window,null)
  assert.deepEqual(conflict.runtime.order,{
    commandId:'move',
    move:{officerName:'曹仁',target:{x:64,y:96}},
  })
  assert.match(scene.message,/不會變更部隊位置/)
  assert.equal(conflict.attackerTroops,previousTroops)
  assert.equal(conflict.runtime.ordersClosed,false)
  assert.equal(conflict.runtime.moveDraft,null)
  assert.ok(saved.length>=5)
})

test('both B backs remain reversible and do not issue a movement order',()=>{
  const {scene,press,conflict}=harness()
  scene.window='command';scene.commandIndex=0;scene.executeCommand()
  press('c')
  assert.equal(scene.window,'move-destination')
  press('x')
  assert.equal(scene.window,'move-officer')
  press('Escape')
  assert.equal(scene.window,'command')
  assert.equal(conflict.runtime.order,null)
  assert.equal(conflict.runtime.moveDraft,null)
})

test('P save and title resume restores the exact unfinished destination selection',()=>{
  const {scene,press,app,conflict,navigation}=harness()
  scene.window='command';scene.commandIndex=0;scene.executeCommand()
  press('ArrowDown')
  press('c')
  press('ArrowRight')
  const before=structuredClone(conflict.runtime.moveDraft)
  press('p')
  assert.equal(scene.pauseConfirm,true)
  press('c')
  assert.deepEqual(navigation,[{name:'title',options:{force:true}}])
  const resumed=new FieldBattleScene(app)
  assert.equal(resumed.window,'move-destination')
  assert.deepEqual(resumed.runtime.moveDraft,before)
  resumed.update(0,{consume:()=>'c'})
  assert.equal(conflict.runtime.order.move.officerName,'曹仁')
  assert.deepEqual(conflict.runtime.order.move.target,before.target)
})

test('a missing source-backed participant does not turn into a fictional move unit',()=>{
  const {scene,conflict}=harness([])
  scene.window='command';scene.commandIndex=0;scene.executeCommand()
  assert.equal(scene.window,'command')
  assert.equal(conflict.runtime.moveDraft,null)
  assert.equal(conflict.runtime.order,null)
  assert.match(scene.message,/缺少可選/)
})

test('failed save while selecting an actor restores prior stage and order',()=>{
  const {scene,store,conflict}=harness()
  scene.window='command';scene.commandIndex=0
  store.save=()=>{throw new Error('disk full')}
  scene.executeCommand()
  assert.equal(scene.window,'command')
  assert.equal(conflict.runtime.moveDraft,null)
  assert.equal(conflict.runtime.order,null)
  assert.match(scene.message,/disk full/)
})
