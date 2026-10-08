import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { StrategyScene } from '../src/scenes/strategy.js'

function scene(){
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  const value=Object.create(StrategyScene.prototype)
  Object.assign(value,{
    app:{store,audio:{confirm(){},move(){},cancel(){},alert(){}}},
    view:'commands',stage:'command',category:'domestic',
    menuIndex:1,commandSubmenu:[],targetCity:'xuchang',
    transferDraft:null,message:'',messageReturnView:'map',
  })
  return value
}

test('transfer command enters an actionable preview workflow without moving any officers',()=>{
  const s=scene()
  const before=JSON.stringify(s.app.store.state)
  s.updateCommands('C')
  assert.equal(s.view,'transfer-draft')
  assert.equal(s.transferDraft.phase,'officer')
  s.updateTransferDraft('C')
  assert.equal(s.transferDraft.phase,'destination')
  s.updateTransferDraft('C')
  assert.equal(s.transferDraft.phase,'review')
  s.updateTransferDraft('C')
  assert.equal(s.view,'message')
  assert.match(s.message,/只預覽/)
  assert.match(s.message,/不更動武將位置/)
  s.updateMessage('B')
  assert.equal(s.view,'commands')
  assert.equal(s.transferDraft,null)
  assert.equal(JSON.stringify(s.app.store.state),before)
})

test('transfer backs up through each step without executing',()=>{
  const s=scene()
  const before=structuredClone(s.app.store.state)
  s.beginInspectionTransferDraft()
  s.updateTransferDraft('C')
  s.updateTransferDraft('C')
  assert.equal(s.transferDraft.phase,'review')
  s.updateTransferDraft('B')
  assert.equal(s.transferDraft.phase,'destination')
  s.updateTransferDraft('B')
  assert.equal(s.transferDraft.phase,'officer')
  s.updateTransferDraft('B')
  assert.equal(s.view,'commands')
  assert.equal(s.transferDraft,null)
  assert.deepEqual(s.app.store.state,before)
})

test('transfer detects stale destination and preserves the draft for correction',()=>{
  const s=scene()
  s.beginInspectionTransferDraft()
  s.updateTransferDraft('C')
  s.updateTransferDraft('C')
  s.app.store.state.cities.chenliu.owner='liu'
  s.updateTransferDraft('C')
  assert.equal(s.view,'message')
  assert.match(s.message,/另一座本國/)
  s.updateMessage('C')
  assert.equal(s.view,'transfer-draft')
  assert.equal(s.transferDraft.phase,'review')
})

test('transfer startup failure returns to same command menu',()=>{
  const s=scene()
  s.app.store.state.cities.chenliu.owner='liu'
  s.beginInspectionTransferDraft()
  assert.equal(s.view,'message')
  s.updateMessage('B')
  assert.equal(s.view,'commands')
  assert.equal(s.transferDraft,null)
})
