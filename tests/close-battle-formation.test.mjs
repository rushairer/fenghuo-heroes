import test from 'node:test'
import assert from 'node:assert/strict'
import { CLOSE_FORMATION_COUNT,initialCloseFormationPreview,transitionCloseFormationPreview } from '../src/game/close-battle-formation.js'
import { CloseBattleQaScene } from '../src/scenes/close-battle-qa.js'
import { applyVisualQaState,storageForVisualQa } from '../src/game/qa-state.js'

test('normal speed exposes exactly five ordinal formation choices; C records only a preview',()=>{
  let state=transitionCloseFormationPreview(initialCloseFormationPreview(),'C')
  assert.equal(state.phase,'formation')
  assert.equal(CLOSE_FORMATION_COUNT,5)
  for(let i=0;i<5;i++){
    assert.equal(state.index,i)
    const confirmed=transitionCloseFormationPreview(state,'C')
    assert.equal(confirmed.selected,i+1)
    assert.equal(confirmed.applied,false)
    if(i<4)state=transitionCloseFormationPreview(state,'RIGHT')
  }
  assert.equal(transitionCloseFormationPreview(state,'RIGHT').index,4)
  assert.equal(transitionCloseFormationPreview(state,'UP'),state)
})

test('fast speed never offers or commits a formation',()=>{
  let state=transitionCloseFormationPreview(initialCloseFormationPreview(),'RIGHT')
  state=transitionCloseFormationPreview(state,'C')
  assert.equal(state.phase,'blocked')
  assert.equal(state.selected,null)
  for(const button of ['LEFT','RIGHT','C'])assert.equal(transitionCloseFormationPreview(state,button),state)
  state=transitionCloseFormationPreview(state,'B')
  assert.equal(state.phase,'speed')
  assert.equal(state.speed,'fast')
})

test('close battle QA accepts actual keyboard events without accessing campaign storage',()=>{
  const app={audio:{confirm(){},cancel(){},move(){}}}
  const scene=new CloseBattleQaScene(app)
  app.scene=scene
  Object.defineProperty(app,'store',{get(){throw Error('QA must not access campaign state')}})
  assert.equal(storageForVisualQa('close-battle-formation',{}),null)
  const press=(key)=>scene.update(0,{consume:()=>key})
  press('c')
  press('ArrowRight')
  press('c')
  assert.equal(scene.preview.selected,2)
  press('x')
  assert.equal(scene.preview.phase,'formation')
  assert.equal(scene.preview.selected,null)
  assert.equal(applyVisualQaState(app,'close-battle-formation'),true)
  assert.equal(scene.preview.phase,'speed')
})
