import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  INSPECTION_DRAFT_COMMANDS,
  inspectionActionDraftSummary,
  newInspectionActionDraft,
  transitionInspectionActionDraft,
} from '../src/game/inspection-action-draft.js'

function setup(){
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  return store
}
const step=(draft,key,gold)=>transitionInspectionActionDraft(draft,key,gold)

test('only documented action workflows can enter a preparation screen',()=>{
  const store=setup()
  assert.deepEqual(Object.keys(INSPECTION_DRAFT_COMMANDS),['develop','welfare','educate'])
  assert.throws(()=>newInspectionActionDraft(store,'xuchang','recruit'),/未知/)
  assert.throws(()=>newInspectionActionDraft(store,'xinye','develop'),/本國/)
  store.finishCurrentTurn()
  assert.throws(()=>newInspectionActionDraft(store,'xuchang','develop'),/視察月/)
})

test('development selects a roster candidate, adjusts bounded investment, reviews without resource mutations',()=>{
  const store=setup()
  const snapshot=structuredClone(store.state)
  let draft=newInspectionActionDraft(store,'xuchang','develop')
  assert.equal(draft.phase,'officer')
  assert.equal(draft.cityAssignmentVerified,false)
  assert.ok(draft.candidates.length>=2)
  draft=step(draft,'DOWN',store.state.cities.xuchang.gold).draft
  assert.equal(draft.officerIndex,1)
  draft=step(draft,'C',store.state.cities.xuchang.gold).draft
  assert.equal(draft.phase,'gold')
  draft=step(draft,'UP',store.state.cities.xuchang.gold).draft
  assert.equal(draft.gold,101)
  draft=step(draft,'DOWN',store.state.cities.xuchang.gold).draft
  assert.equal(draft.gold,1)
  draft=step(draft,'LEFT',store.state.cities.xuchang.gold).draft
  assert.equal(draft.gold,1)
  draft=step(draft,'C',store.state.cities.xuchang.gold).draft
  assert.equal(draft.phase,'review')
  assert.equal(step(draft,'C',store.state.cities.xuchang.gold).status,'preview-only')
  const summary=inspectionActionDraftSummary(draft)
  assert.equal(summary.effectApplied,false)
  assert.equal(summary.officerName,draft.candidates[1].name)
  assert.equal(summary.evidence,'provisional-faction-roster')
  assert.deepEqual(store.state,snapshot)
})

test('education cannot target the ruler, and B moves back without executing',()=>{
  const store=setup()
  let draft=newInspectionActionDraft(store,'xuchang','educate')
  assert.ok(draft.candidates.every((row)=>row.role!=='君主'))
  assert.ok(draft.candidates.length>0)
  assert.equal(step(draft,'B',10).status,'cancelled')
  draft=step(draft,'C',10).draft
  assert.equal(step(draft,'B',10).draft.phase,'officer')
  draft=step(draft,'C',10).draft
  draft=step(draft,'C',10).draft
  assert.equal(step(draft,'B',10).draft.phase,'gold')
  assert.equal(store.state.cities.xuchang.gold>0,true)
})

test('no-money and stale-money state fail closed before review or completion',()=>{
  const store=setup()
  const initial=store.state.cities.xuchang.gold
  store.state.cities.xuchang.gold=0
  assert.throws(()=>newInspectionActionDraft(store,'xuchang','welfare'),/無可投入/)
  store.state.cities.xuchang.gold=initial
  let draft=newInspectionActionDraft(store,'xuchang','welfare')
  draft=step(draft,'C',initial).draft
  draft=step(draft,'UP',initial).draft
  if(draft.gold>1){
    const result=step(draft,'C',1)
    assert.equal(result.status,'invalid')
  }
  const safe=step(draft,'DOWN',initial).draft
  draft=step(safe,'C',initial).draft
  store.state.cities.xuchang.gold=0
  assert.equal(step(draft,'C',0).status,'invalid')
})

test('read-only preparation cannot be used to mutate a saved game',()=>{
  const store=setup()
  const before=JSON.stringify(store.state)
  for(const command of ['develop','welfare','educate']){
    const draft=newInspectionActionDraft(store,'xuchang',command)
    const b=step(draft,'C',store.state.cities.xuchang.gold).draft
    const c=step(b,'C',store.state.cities.xuchang.gold).draft
    assert.equal(step(c,'C',store.state.cities.xuchang.gold).status,'preview-only')
  }
  assert.equal(JSON.stringify(store.state),before)
})
