import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { StrategyScene } from '../src/scenes/strategy.js'

function makeScene(){
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  const scene=Object.create(StrategyScene.prototype)
  scene.app={store,audio:{confirm(){},move(){},cancel(){},alert(){}}}
  Object.assign(scene,{
    view:'commands',stage:'command',category:'domestic',
    commandSubmenu:[],menuIndex:0,targetCity:'xuchang',
    actionDraft:null,message:'',messageReturnView:'map',
  })
  return scene
}

test('development goes through actor, amount, review and read-only result',()=>{
  const scene=makeScene()
  const before=structuredClone(scene.app.store.state)
  scene.updateCommands('C')
  assert.equal(scene.view,'action-draft')
  assert.equal(scene.actionDraft.commandId,'develop')
  scene.updateActionDraft('C')
  assert.equal(scene.actionDraft.phase,'gold')
  scene.updateActionDraft('RIGHT')
  assert.equal(scene.actionDraft.gold,2)
  scene.updateActionDraft('C')
  assert.equal(scene.actionDraft.phase,'review')
  scene.updateActionDraft('C')
  assert.equal(scene.view,'message')
  assert.match(scene.message,/不扣金、不執行/)
  scene.updateMessage('B')
  assert.equal(scene.view,'commands')
  assert.deepEqual(scene.app.store.state,before)
})

test('education refuses ruler targets and cancellation never changes a city',()=>{
  const scene=makeScene()
  const before=JSON.stringify(scene.app.store.state)
  scene.beginInspectionActionDraft('educate')
  assert.equal(scene.view,'action-draft')
  assert.ok(scene.actionDraft.candidates.every((x)=>x.role!=='君主'))
  scene.updateActionDraft('C')
  scene.updateActionDraft('B')
  assert.equal(scene.actionDraft.phase,'officer')
  scene.updateActionDraft('B')
  assert.equal(scene.view,'commands')
  assert.equal(scene.actionDraft,null)
  assert.equal(JSON.stringify(scene.app.store.state),before)
})

test('an unaffordable draft returns a visible message to the menu',()=>{
  const scene=makeScene()
  scene.app.store.state.cities.xuchang.gold=0
  scene.beginInspectionActionDraft('welfare')
  assert.equal(scene.view,'message')
  assert.match(scene.message,/無可投入/)
  scene.updateMessage('C')
  assert.equal(scene.view,'commands')
})
