import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  inspectionTransferDraftStatus,
  inspectionTransferDraftSummary,
  newInspectionTransferDraft,
  transitionInspectionTransferDraft,
} from '../src/game/inspection-transfer-draft.js'

function store(){
  const s=new GameStore(null)
  s.newGame({scenarioYear:189,humanFactions:['cao']})
  return s
}
const step=(s,d,button)=>transitionInspectionTransferDraft(s,d,button)

test('transfer captures an existing officer and another owned city without writing state',()=>{
  const s=store()
  const before=structuredClone(s.state)
  let draft=newInspectionTransferDraft(s,'xuchang')
  assert.equal(draft.phase,'officer')
  assert.equal(draft.cityAssignmentVerified,false)
  assert.ok(draft.candidates.some((row)=>row.name==='曹操'))
  assert.deepEqual(draft.destinations.map((city)=>city.id),['chenliu'])
  draft=step(s,draft,'C').draft
  assert.equal(draft.phase,'destination')
  draft=step(s,draft,'C').draft
  assert.equal(draft.phase,'review')
  assert.equal(step(s,draft,'C').status,'preview-only')
  assert.deepEqual(inspectionTransferDraftSummary(draft),{
    commandId:'transfer',sourceId:'xuchang',destinationId:'chenliu',
    destinationName:'陳留',officerName:'曹操',
    evidence:'provisional-faction-roster',effectApplied:false,
  })
  assert.deepEqual(s.state,before)
})

test('transfer can back out of destination and actor selection without taking a turn',()=>{
  const s=store()
  const before=JSON.stringify(s.state)
  let draft=newInspectionTransferDraft(s,'xuchang')
  assert.equal(step(s,draft,'B').status,'cancelled')
  draft=step(s,draft,'DOWN').draft
  assert.equal(draft.officerIndex,1)
  draft=step(s,draft,'C').draft
  assert.equal(step(s,draft,'B').draft.phase,'officer')
  draft=step(s,draft,'C').draft
  draft=step(s,draft,'C').draft
  assert.equal(step(s,draft,'B').draft.phase,'destination')
  assert.equal(JSON.stringify(s.state),before)
})

test('a transfer cannot start from enemy cities or without a second friendly city',()=>{
  const s=store()
  assert.throws(()=>newInspectionTransferDraft(s,'xinye'),/本國/)
  s.state.cities.chenliu.owner='liu'
  assert.throws(()=>newInspectionTransferDraft(s,'xuchang'),/另一座本國/)
  s.finishCurrentTurn()
  assert.throws(()=>newInspectionTransferDraft(s,'xuchang'),/視察月/)
})

test('a deployed officer is not an eligible transfer candidate',()=>{
  const s=store()
  s.state.armies=[{id:'a1',faction:'cao',officerNames:['曹操']}]
  const draft=newInspectionTransferDraft(s,'xuchang')
  assert.equal(draft.candidates.some((row)=>row.name==='曹操'),false)
})

test('a captured transfer cannot execute when officer/city assignment becomes stale',()=>{
  const s=store()
  let draft=newInspectionTransferDraft(s,'xuchang')
  draft=step(s,draft,'C').draft
  draft=step(s,draft,'C').draft
  s.state.cities.chenliu.owner='liu'
  assert.equal(step(s,draft,'C').status,'invalid')
  assert.match(inspectionTransferDraftStatus(s,draft).reason,/目的地/)

  s.state.cities.chenliu.owner='cao'
  s.state.armies=[{id:'march-1',faction:'cao',officerNames:[draft.candidates[0].name]}]
  assert.equal(step(s,draft,'C').status,'invalid')
  assert.match(inspectionTransferDraftStatus(s,draft).reason,/武將/)
})

test('source-backed transfer candidates come only from the documented city placement',()=>{
  const s=store()
  s.state.scenarioOfficerPlacementStatus='source-backed-test'
  s.state.cities.xuchang.officers=[{name:'曹仁',role:'officer'}]
  const draft=newInspectionTransferDraft(s,'xuchang')
  assert.equal(draft.cityAssignmentVerified,true)
  assert.deepEqual(draft.candidates.map((row)=>row.name),['曹仁'])
  assert.equal(inspectionTransferDraftSummary(draft).evidence,'source-backed-city-officers')
})
