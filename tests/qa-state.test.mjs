import test from 'node:test'
import assert from 'node:assert/strict'
import { VISUAL_QA_STATES, applyVisualQaState } from '../src/game/qa-state.js'

test('visual QA state catalog remains explicit',()=>{
  assert.deepEqual(VISUAL_QA_STATES,[
    'title-menu',
    'country-overview',
    'full-map',
    'officer-status',
  ])
})

test('title-menu QA state opens the title menu deterministically',()=>{
  const app={scene:{phase:'splash',selection:1}}
  assert.equal(applyVisualQaState(app,'title-menu'),true)
  assert.equal(app.scene.phase,'menu')
  assert.equal(app.scene.selection,0)
})

test('strategy QA states select the expected info page',()=>{
  for(const [qaState,infoTab] of [['country-overview',0],['full-map',1],['officer-status',2]]){
    const app={
      store:{hasGame:()=>true},
      scene:{view:'map',infoTab:0,infoReturnView:'map',infoCommandBrowse:true},
    }
    assert.equal(applyVisualQaState(app,qaState),true)
    assert.equal(app.scene.view,'info')
    assert.equal(app.scene.infoTab,infoTab)
    assert.equal(app.scene.infoCommandBrowse,false)
  }
})

test('unknown QA states are inert',()=>{
  assert.equal(applyVisualQaState({scene:{}},'invented-screen'),false)
})
