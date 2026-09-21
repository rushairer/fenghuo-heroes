import test from 'node:test'
import assert from 'node:assert/strict'
import {
  canonicalScenarioReadinessReport,
  canonicalScenarioStartReadiness,
} from '../src/game/scenario-parity.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

test('189 remains blocked by economy and officer placement even when map and ownership evidence are complete',()=>{
  const evidence=completeCanonicalMapEvidence()
  const report=canonicalScenarioStartReadiness(189,evidence)
  assert.equal(report.mapGeometryReady,true)
  assert.equal(report.ownershipReady,true)
  assert.equal(report.economyReady,false)
  assert.equal(report.officerPlacementReady,false)
  assert.equal(report.ready,false)
  assert.ok(report.blockers.includes('city-economy-189-unverified'))
  assert.ok(report.blockers.includes('officer-placement-189-unverified'))
})

test('200 and 215 cannot inherit 189 ownership',()=>{
  const evidence=completeCanonicalMapEvidence()
  for(const year of [200,215]){
    const report=canonicalScenarioStartReadiness(year,evidence)
    assert.equal(report.ownershipReady,false)
    assert.equal(report.ownershipEvidenceStatus,'unverified')
    assert.ok(report.blockers.includes(`ownership-${year}-unverified`))
  }
})

test('scenario readiness report covers all three Chinese-ROM target scenarios',()=>{
  const report=canonicalScenarioReadinessReport(completeCanonicalMapEvidence())
  assert.deepEqual(report.map((item)=>item.year),[189,200,215])
  assert.ok(report.every((item)=>item.ready===false))
})
