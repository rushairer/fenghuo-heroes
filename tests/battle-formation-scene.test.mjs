import test from 'node:test'
import assert from 'node:assert/strict'
import { FieldBattleScene } from '../src/scenes/field-battle.js'
import { SiegeScene } from '../src/scenes/siege.js'
import { formationRowSquads } from '../src/game/battle-formation.js'

function harness(Scene){
  const kind=Scene===FieldBattleScene?'field':'siege'
  const conflict={
    kind,
    attacker:'cao',defender:'liu',
    attackerTroops:1500,defenderTroops:1000,
    attackerOfficers:['曹操','曹仁'],
    runtime:{phase:'speed',speed:null},
  }
  const stored=[]
  const navigation=[]
  let fail=false
  const store={
    pendingConflict:conflict,
    save(){
      if(fail)throw new Error('QuotaExceededError')
      stored.push(structuredClone(conflict))
    },
  }
  const app={
    store,
    audio:{confirm(){},cancel(){},move(){},alert(){}},
    go:(name,options)=>navigation.push({name,options}),
    toggleHd(){},
  }
  const scene=new Scene(app)
  const press=(key)=>scene.update(0,{consume:()=>key})
  return {app,store,conflict,stored,navigation,scene,press,setFailure(v){fail=v}}
}

for(const [Scene,label,active] of [
  [FieldBattleScene,'field','battle'],
  [SiegeScene,'siege','siege'],
]){
  test(label+': edit and review officer troop categories before the battle becomes active',()=>{
    const {scene,conflict,press,stored}=harness(Scene)
    const before=structuredClone({own:conflict.attackerTroops,enemy:conflict.defenderTroops})
    press('c')
    assert.equal(scene.phase,'formation')
    assert.equal(scene.runtime.formationDraft.phase,'edit')
    press('ArrowRight')
    press('ArrowDown')
    press('ArrowRight')
    press('z')
    assert.equal(scene.runtime.formationDraft.officerIndex,1)
    press('ArrowRight')
    const draft=structuredClone(scene.runtime.formationDraft)
    assert.equal(draft.rows[0].infantry,1)
    assert.equal(draft.rows[0].cavalry,1)
    assert.equal(draft.rows[1].cavalry,1)
    press('c')
    assert.equal(scene.runtime.formationDraft.phase,'review')
    press('x')
    assert.equal(scene.runtime.formationDraft.phase,'edit')
    press('c')
    press('c')
    assert.equal(scene.phase,active)
    assert.equal(scene.runtime.formationDraft,null)
    assert.equal(scene.runtime.formationPlan.applied,false)
    assert.equal(scene.runtime.formationPlan.status,'uncalibrated-preview')
    assert.equal(formationRowSquads(scene.runtime.formationPlan.rows[0]),2)
    assert.equal(formationRowSquads(scene.runtime.formationPlan.rows[1]),1)
    assert.deepEqual({own:conflict.attackerTroops,enemy:conflict.defenderTroops},before)
    assert.equal('winner' in conflict,false)
    assert.ok(stored.length>=7)
  })

  test(label+': failed storage write preserves editable squad draft and game phase',()=>{
    const {scene,conflict,press,setFailure}=harness(Scene)
    press('c')
    const before=structuredClone(scene.runtime)
    setFailure(true)
    press('ArrowRight')
    assert.equal(scene.phase,'formation')
    assert.deepEqual(scene.runtime.formationDraft,before.formationDraft)
    assert.equal(conflict.runtime.formationPlan,null)
    assert.match(scene.message,/編成未保存/)
    assert.match(scene.message,/QuotaExceededError/)
    press('c')
    setFailure(false)
    press('ArrowRight')
    assert.equal(scene.runtime.formationDraft.rows[0].infantry,1)
  })

  test(label+': P save and Continue restore the exact unfinished officer allocation',()=>{
    const {app,scene,conflict,press,navigation,stored}=harness(Scene)
    press('c')
    press('ArrowRight')
    press('z')
    press('ArrowDown')
    press('ArrowRight')
    const savedDraft=structuredClone(scene.runtime.formationDraft)
    press('p')
    press('c')
    assert.deepEqual(navigation,[{name:'title',options:{force:true}}])
    assert.ok(stored.length>=4)
    const restored=new Scene(app)
    assert.equal(restored.phase,'formation')
    assert.deepEqual(restored.runtime.formationDraft,savedDraft)
    const resumed=(key)=>restored.update(0,{consume:()=>key})
    resumed('c')
    resumed('c')
    assert.equal(restored.runtime.formationPlan.rows[1].cavalry,1)
    assert.equal(restored.runtime.formationPlan.rows[0].infantry,1)
  })

  test(label+': B from the edit form returns to speed but does not destroy the draft',()=>{
    const {scene,press,conflict}=harness(Scene)
    press('c')
    press('ArrowRight')
    press('x')
    assert.equal(scene.phase,'speed')
    assert.equal(conflict.runtime.formationDraft.rows[0].infantry,1)
    press('c')
    assert.equal(scene.phase,'formation')
    assert.equal(scene.runtime.formationDraft.rows[0].infantry,1)
  })

  test(label+': already prepared empty roster never turns into invented squads',()=>{
    const {scene,press,conflict}=harness(Scene)
    conflict.attackerOfficers=[]
    press('c')
    assert.deepEqual(scene.runtime.formationDraft.rows,[])
    press('c')
    press('c')
    assert.equal(scene.phase,active)
    assert.deepEqual(scene.runtime.formationPlan.rows,[])
    assert.equal(conflict.attackerTroops,1500)
  })
}
