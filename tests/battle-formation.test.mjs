import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BATTLE_SQUAD_TYPES,
  formationOfficerNames,
  formationPlanFromDraft,
  formationRowSquads,
  initialFormationDraft,
  normalizeFormationDraft,
  normalizeFormationPlan,
  transitionFormationDraft,
} from '../src/game/battle-formation.js'
import { MAX_SQUADS_PER_UNIT } from '../src/game/battle-prep.js'
import { ensureFieldBattleRuntime } from '../src/game/field-battle-runtime.js'
import { ensureSiegeRuntime } from '../src/game/siege-runtime.js'

const conflict=(kind='field')=>({
  kind,attackerOfficers:['曹操','曹仁','曹操'],
  attackerTroops:3000,defenderTroops:2200,
  runtime:{phase:'formation',speed:'normal'},
})
const press=(battle,draft,key)=>transitionFormationDraft(battle,draft,key).draft

test('formation offers only observed troop categories and never creates unnamed commanders',()=>{
  assert.deepEqual(BATTLE_SQUAD_TYPES.map((x)=>x.id),['infantry','cavalry','archers'])
  const value=conflict()
  assert.deepEqual(formationOfficerNames(value),['曹操','曹仁'])
  const draft=initialFormationDraft(value)
  assert.equal(draft.phase,'edit')
  assert.deepEqual(draft.rows,[
    {officerName:'曹操',infantry:0,cavalry:0,archers:0},
    {officerName:'曹仁',infantry:0,cavalry:0,archers:0},
  ])
  assert.equal(MAX_SQUADS_PER_UNIT,15)
})

test('D-pad edits squad allocation per named officer and A selects next officer',()=>{
  const value=conflict()
  let draft=initialFormationDraft(value)
  draft=press(value,draft,'RIGHT')
  draft=press(value,draft,'DOWN')
  draft=press(value,draft,'RIGHT')
  draft=press(value,draft,'A')
  draft=press(value,draft,'RIGHT')
  assert.equal(draft.officerIndex,1)
  assert.equal(draft.typeIndex,1)
  assert.deepEqual(draft.rows,[
    {officerName:'曹操',infantry:1,cavalry:1,archers:0},
    {officerName:'曹仁',infantry:0,cavalry:1,archers:0},
  ])
  assert.equal(formationRowSquads(draft.rows[0]),2)
  assert.equal(formationRowSquads(draft.rows[1]),1)
})

test('each commander is limited to fifteen squad slots without invented martial ranks',()=>{
  const value=conflict()
  let draft=initialFormationDraft(value)
  for(let i=0;i<15;i++)draft=press(value,draft,'RIGHT')
  assert.equal(draft.rows[0].infantry,15)
  assert.equal(transitionFormationDraft(value,draft,'RIGHT').status,'limit')
  draft=press(value,draft,'DOWN')
  assert.equal(transitionFormationDraft(value,draft,'RIGHT').status,'limit')
  draft=press(value,draft,'LEFT')
  draft=press(value,draft,'RIGHT')
  assert.equal(formationRowSquads(draft.rows[0]),15)
  draft=press(value,draft,'A')
  assert.equal(transitionFormationDraft(value,draft,'RIGHT').status,'updated')
  assert.equal(formationRowSquads(press(value,draft,'RIGHT').rows[1]),1)
})

test('C reviews before committing and B returns to editing or the speed selection',()=>{
  const value=conflict()
  let draft=initialFormationDraft(value)
  assert.equal(transitionFormationDraft(value,draft,'B').status,'back')
  draft=press(value,draft,'RIGHT')
  draft=press(value,draft,'C')
  assert.equal(draft.phase,'review')
  assert.equal(transitionFormationDraft(value,draft,'LEFT').status,'ignored')
  draft=press(value,draft,'B')
  assert.equal(draft.phase,'edit')
  draft=press(value,draft,'C')
  const done=transitionFormationDraft(value,draft,'C')
  assert.equal(done.status,'committed')
  assert.deepEqual(done.plan,{
    status:'uncalibrated-preview',applied:false,
    rows:[
      {officerName:'曹操',infantry:1,cavalry:0,archers:0},
      {officerName:'曹仁',infantry:0,cavalry:0,archers:0},
    ],
  })
  assert.equal(value.attackerTroops,3000)
  assert.equal(value.defenderTroops,2200)
})

test('forged commander, negative count, oversized count and noninteger counts fail closed',()=>{
  const value=conflict()
  const draft=initialFormationDraft(value)
  const corrupted=[
    {...draft,rows:[{...draft.rows[0],officerName:'孫權'},draft.rows[1]]},
    {...draft,rows:[{...draft.rows[0],infantry:16},draft.rows[1]]},
    {...draft,rows:[{...draft.rows[0],archers:-1},draft.rows[1]]},
    {...draft,rows:[{...draft.rows[0],infantry:1.4},draft.rows[1]]},
    {...draft,rows:[{...draft.rows[0],infantry:10,cavalry:8},draft.rows[1]]},
    {...draft,rows:[draft.rows[0]]},
    {...draft,officerIndex:99},
    {...draft,typeIndex:9},
  ]
  for(const entry of corrupted){
    assert.equal(normalizeFormationDraft(value,entry),null)
    assert.throws(()=>transitionFormationDraft(value,entry,'C'),/已失效/)
  }
})

test('saved formation plans never claim application or create battle units',()=>{
  const value=conflict()
  let draft=initialFormationDraft(value)
  draft=press(value,draft,'RIGHT')
  draft=press(value,draft,'C')
  const plan=formationPlanFromDraft(value,draft)
  const serialized=structuredClone({...plan,applied:true,status:'verified',damage:999})
  const restored=normalizeFormationPlan(value,serialized)
  assert.deepEqual(restored,plan)
  assert.equal('damage' in restored,false)
  assert.equal(value.attackerTroops,3000)
})

test('field and siege resume validated unfinished formation drafts',()=>{
  for(const kind of ['field','siege']){
    const value=conflict(kind)
    let draft=initialFormationDraft(value)
    draft=press(value,draft,'A')
    draft=press(value,draft,'RIGHT')
    value.runtime.formationDraft=draft
    const reopened=structuredClone(value)
    const runtime=kind==='field'
      ?ensureFieldBattleRuntime(reopened):ensureSiegeRuntime(reopened)
    assert.deepEqual(runtime.formationDraft,draft)
    assert.equal(runtime.formationPlan,null)
    assert.equal(runtime.formationDraft.rows[1].infantry,1)
    reopened.runtime.phase=kind==='field'?'battle':'siege'
    const active=kind==='field'
      ?ensureFieldBattleRuntime(reopened):ensureSiegeRuntime(reopened)
    assert.equal(active.formationDraft,null)
  }
})

test('formations with no named participant remain an empty preview and never invent a commander',()=>{
  const value={kind:'siege',attackerOfficers:[],runtime:{phase:'formation'}}
  let draft=initialFormationDraft(value)
  assert.deepEqual(draft.rows,[])
  assert.equal(transitionFormationDraft(value,draft,'RIGHT').status,'ignored')
  draft=press(value,draft,'C')
  const plan=formationPlanFromDraft(value,draft)
  assert.deepEqual(plan.rows,[])
  assert.equal(plan.applied,false)
})
