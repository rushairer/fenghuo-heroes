import test from 'node:test'
import assert from 'node:assert/strict'
import { compileScenarioEvidenceBundle } from '../src/game/scenario-evidence-compiler.js'
import { createScenarioEvidenceTemplate } from '../src/game/scenario-evidence-template.js'
import { ZH_ROM_CANONICAL_CITY_SET } from '../src/game/original-data.js'

function completeEvidence(){
  const source={id:'scenario-189',kind:'direct-capture',ref:'scenario-189.png'}
  const cityStates=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    gold:100+index,
    food:200+index,
    troops:3000+index,
    development:40+index,
    rule:70,
    defense:30,
    training:35,
    sourceId:source.id,
    frameRef:`frame#city-${index}`,
    verified:true,
  }))
  const officerAssignments=[
    {officer:'張飛',city:'代縣',sourceId:source.id,frameRef:'frame#officer-2',verified:true},
    {officer:'關羽',city:'代縣',sourceId:source.id,frameRef:'frame#officer-1',verified:true},
  ]
  return {
    status:'test-complete',
    scenarioYear:189,
    sources:[source,{id:'unused',kind:'direct-capture',ref:'unused.png'}],
    cityStates,
    cityStateCoverage:{sourceId:source.id,frameRef:'frame#cities',itemCount:40,verified:true},
    officerAssignments,
    officerCoverage:{sourceId:source.id,frameRef:'frame#officers',itemCount:2,verified:true},
  }
}

test('full scenario compiler emits stable canonical city order and officer order',()=>{
  const bundle=completeEvidence()
  bundle.cityStates.reverse()
  const compiled=compileScenarioEvidenceBundle(bundle)
  assert.equal(compiled.status,'ready-for-scenario-start')
  assert.equal(compiled.scope,'full')
  assert.equal(compiled.cityStates.length,40)
  assert.equal(compiled.cityStates[0].city,ZH_ROM_CANONICAL_CITY_SET[0])
  assert.deepEqual(compiled.officerAssignments.map((item)=>item.officer),['張飛','關羽'].sort((a,b)=>a.localeCompare(b)))
  assert.equal(compiled.sources.some((source)=>source.id==='unused'),false)
})

test('economy-only compilation excludes officer data',()=>{
  const compiled=compileScenarioEvidenceBundle(completeEvidence(),{scope:'economy'})
  assert.equal(compiled.status,'ready-for-scenario-economy')
  assert.equal(compiled.cityStates.length,40)
  assert.deepEqual(compiled.officerAssignments,[])
  assert.equal(compiled.officerCoverage,null)
})

test('officer-only compilation excludes city economy data',()=>{
  const compiled=compileScenarioEvidenceBundle(completeEvidence(),{scope:'officers'})
  assert.equal(compiled.status,'ready-for-officer-placement')
  assert.deepEqual(compiled.cityStates,[])
  assert.equal(compiled.cityStateCoverage,null)
  assert.equal(compiled.officerAssignments.length,2)
})

test('scenario compiler refuses incomplete bundles and unknown scopes',()=>{
  assert.throws(
    ()=>compileScenarioEvidenceBundle(createScenarioEvidenceTemplate(189)),
    /not ready/,
  )
  assert.throws(
    ()=>compileScenarioEvidenceBundle(completeEvidence(),{scope:'bad'}),
    /Unknown scenario evidence compile scope/,
  )
})

test('scenario compiler output is deterministic across input ordering',()=>{
  const a=completeEvidence()
  const b=completeEvidence()
  b.cityStates.reverse()
  b.officerAssignments.reverse()
  assert.deepEqual(
    compileScenarioEvidenceBundle(a),
    compileScenarioEvidenceBundle(b),
  )
})
