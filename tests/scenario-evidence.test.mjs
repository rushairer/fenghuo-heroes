import test from 'node:test'
import assert from 'node:assert/strict'
import { validateScenarioStartEvidence } from '../src/game/scenario-evidence.js'
import { ZH_ROM_CANONICAL_CITY_SET } from '../src/game/original-data.js'

const source={id:'scenario-189',kind:'direct-capture',ref:'scenario-189.png'}
const cityState=(city,index)=>({
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
})

function completeEvidence(){
  const ownership=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    factionId:index===0?'liu':index===1?'cao':'neutral',
    sourceId:source.id,
    frameRef:`frame#owner-${index}`,
    verified:true,
  }))
  const cityStates=ZH_ROM_CANONICAL_CITY_SET.map(cityState)
  const officerAssignments=[
    {
      officer:'關羽',
      role:'officer',
      city:'代縣',
      sourceId:source.id,
      frameRef:'frame#officer-guan-yu',
      verified:true,
    },
    {
      officer:'張飛',
      role:'officer',
      city:'代縣',
      sourceId:source.id,
      frameRef:'frame#officer-zhang-fei',
      verified:true,
    },
  ]
  return {
    status:'test-complete',
    scenarioYear:189,
    sources:[source],
    ownership,
    ownershipCoverage:{
      sourceId:source.id,
      frameRef:'frame#ownership-coverage',
      itemCount:ownership.length,
      verified:true,
    },
    cityStates,
    cityStateCoverage:{
      sourceId:source.id,
      frameRef:'frame#city-state-coverage',
      itemCount:40,
      verified:true,
    },
    officerAssignments,
    officerCoverage:{
      sourceId:source.id,
      frameRef:'frame#officer-coverage',
      itemCount:officerAssignments.length,
      verified:true,
    },
  }
}

test('complete scenario evidence separates economy and officer placement readiness',()=>{
  const report=validateScenarioStartEvidence(completeEvidence())
  assert.equal(report.sourceLedgerValid,true)
  assert.equal(report.ownershipEvidenceCount,40)
  assert.equal(report.ownershipReady,true)
  assert.equal(report.cityStateEvidenceCount,40)
  assert.equal(report.officerAssignmentEvidenceCount,2)
  assert.equal(report.economyReady,true)
  assert.equal(report.officerPlacementReady,true)
  assert.equal(report.ready,true)
})

test('city economy evidence requires every calibrated numeric field',()=>{
  const evidence=completeEvidence()
  delete evidence.cityStates[0].training
  const report=validateScenarioStartEvidence(evidence)
  assert.equal(report.cityStateEvidenceCount,39)
  assert.equal(report.cityStateCoverageVerified,false)
  assert.equal(report.economyReady,false)
})

test('duplicate city-state and officer records invalidate coverage',()=>{
  const evidence=completeEvidence()
  evidence.cityStates.push({...evidence.cityStates[0],frameRef:'frame#city-duplicate'})
  evidence.cityStateCoverage.itemCount=41
  evidence.officerAssignments.push({...evidence.officerAssignments[0],frameRef:'frame#officer-duplicate'})
  evidence.officerCoverage.itemCount=3
  const report=validateScenarioStartEvidence(evidence)
  assert.deepEqual(report.duplicateCityStates,['襄平'])
  assert.deepEqual(report.duplicateOfficerAssignments,['關羽'])
  assert.equal(report.economyReady,false)
  assert.equal(report.officerPlacementReady,false)
})

test('unknown cities and unverified records never count as scenario evidence',()=>{
  const evidence=completeEvidence()
  evidence.cityStates[0]={...evidence.cityStates[0],city:'北平'}
  evidence.officerAssignments[0]={...evidence.officerAssignments[0],verified:false}
  const report=validateScenarioStartEvidence(evidence)
  assert.equal(report.cityStateEvidenceCount,39)
  assert.equal(report.officerAssignmentEvidenceCount,1)
  assert.equal(report.ready,false)
})

test('duplicate source IDs invalidate both scenario evidence gates',()=>{
  const evidence=completeEvidence()
  evidence.sources.push({...source,ref:'other.png'})
  const report=validateScenarioStartEvidence(evidence)
  assert.equal(report.sourceLedgerValid,false)
  assert.deepEqual(report.duplicateSourceIds,['scenario-189'])
  assert.equal(report.economyReady,false)
  assert.equal(report.officerPlacementReady,false)
})


test('scenario ownership evidence requires all forty source-backed city assignments',()=>{
  const evidence=completeEvidence()
  evidence.ownership.pop()
  evidence.ownershipCoverage.itemCount=39
  const report=validateScenarioStartEvidence(evidence)
  assert.equal(report.ownershipEvidenceCount,39)
  assert.equal(report.ownershipCoverageVerified,false)
  assert.equal(report.ownershipReady,false)
  assert.equal(report.ready,false)
})

test('duplicate scenario ownership for one city invalidates ownership coverage',()=>{
  const evidence=completeEvidence()
  evidence.ownership.push({...evidence.ownership[0],frameRef:'frame#owner-duplicate'})
  evidence.ownershipCoverage.itemCount=41
  const report=validateScenarioStartEvidence(evidence)
  assert.deepEqual(report.duplicateOwnershipCities,['襄平'])
  assert.equal(report.ownershipReady,false)
})


test('officer placement requires an explicit source-backed ruler or officer role',()=>{
  const evidence=completeEvidence()
  evidence.officerAssignments[0]={...evidence.officerAssignments[0],role:'unknown'}
  const report=validateScenarioStartEvidence(evidence)
  assert.equal(report.officerAssignmentEvidenceCount,1)
  assert.equal(report.officerPlacementReady,false)
  assert.ok(report.officerAssignmentReports[0].errors.includes('invalid-role'))
})
