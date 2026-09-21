import test from 'node:test'
import assert from 'node:assert/strict'
import { compileScenarioEvidenceBundle } from '../src/game/scenario-evidence-compiler.js'
import { createScenarioEvidenceTemplate } from '../src/game/scenario-evidence-template.js'
import { ZH_ROM_CANONICAL_CITY_SET } from '../src/game/original-data.js'

function completeEvidence(){
  const source={id:'scenario-189',kind:'direct-capture',ref:'scenario-189.png'}
  const ownership=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    factionId:index===0?'liu':index===1?'cao':'neutral',
    sourceId:source.id,
    frameRef:`frame#owner-${index}`,
    verified:true,
  }))
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
    {officer:'張飛',role:'officer',city:'代縣',sourceId:source.id,frameRef:'frame#officer-2',verified:true},
    {officer:'關羽',role:'officer',city:'代縣',sourceId:source.id,frameRef:'frame#officer-1',verified:true},
  ]
  return {
    status:'test-complete',
    scenarioYear:189,
    sources:[source,{id:'unused',kind:'direct-capture',ref:'unused.png'}],
    ownership,
    ownershipCoverage:{sourceId:source.id,frameRef:'frame#ownership',itemCount:40,verified:true},
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
  assert.equal(compiled.ownership.length,40)
  assert.equal(compiled.ownership[0].city,ZH_ROM_CANONICAL_CITY_SET[0])
  assert.equal(compiled.cityStates.length,40)
  assert.equal(compiled.cityStates[0].city,ZH_ROM_CANONICAL_CITY_SET[0])
  assert.deepEqual(compiled.officerAssignments.map((item)=>item.officer),['張飛','關羽'].sort((a,b)=>a.localeCompare(b)))
  assert.equal(compiled.sources.some((source)=>source.id==='unused'),false)
})

test('economy-only compilation excludes officer data',()=>{
  const compiled=compileScenarioEvidenceBundle(completeEvidence(),{scope:'economy'})
  assert.equal(compiled.status,'ready-for-scenario-economy')
  assert.deepEqual(compiled.ownership,[])
  assert.equal(compiled.ownershipCoverage,null)
  assert.equal(compiled.cityStates.length,40)
  assert.deepEqual(compiled.officerAssignments,[])
  assert.equal(compiled.officerCoverage,null)
})

test('officer-only compilation excludes city economy data',()=>{
  const compiled=compileScenarioEvidenceBundle(completeEvidence(),{scope:'officers'})
  assert.equal(compiled.status,'ready-for-officer-placement')
  assert.deepEqual(compiled.ownership,[])
  assert.equal(compiled.ownershipCoverage,null)
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


test('ownership-only compilation excludes economy and officer data',()=>{
  const compiled=compileScenarioEvidenceBundle(completeEvidence(),{scope:'ownership'})
  assert.equal(compiled.status,'ready-for-scenario-ownership')
  assert.equal(compiled.ownership.length,40)
  assert.equal(compiled.ownershipCoverage.itemCount,40)
  assert.deepEqual(compiled.cityStates,[])
  assert.equal(compiled.cityStateCoverage,null)
  assert.deepEqual(compiled.officerAssignments,[])
  assert.equal(compiled.officerCoverage,null)
})
