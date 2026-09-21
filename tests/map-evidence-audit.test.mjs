import test from 'node:test'
import assert from 'node:assert/strict'
import { auditCanonicalEvidenceBundle } from '../src/game/map-evidence-audit.js'
import { createCanonicalEvidenceTemplate } from '../src/game/map-evidence-template.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

test('empty capture template reports all canonical map blockers without inventing data',()=>{
  const audit=auditCanonicalEvidenceBundle(createCanonicalEvidenceTemplate())
  assert.equal(audit.ready,false)
  assert.equal(audit.geometryReady,false)
  assert.equal(audit.sourceLedgerValid,true)
  assert.equal(audit.missingCityCoordinates.length,40)
  assert.equal(audit.invalidCityCoordinates.length,0)
  assert.ok(audit.blockers.includes('city-coordinates-incomplete'))
  assert.ok(audit.blockers.includes('route-network-unverified'))
  assert.ok(audit.blockers.includes('village-coverage-unverified'))
})

test('complete source-backed fixture produces an empty blocker list',()=>{
  const audit=auditCanonicalEvidenceBundle(completeCanonicalMapEvidence())
  assert.equal(audit.ready,true)
  assert.equal(audit.geometryReady,true)
  assert.equal(audit.sourceLedgerValid,true)
  assert.deepEqual(audit.blockers,[])
  assert.equal(audit.missingCityCoordinates.length,0)
  assert.equal(audit.verified.cityCoordinates,40)
})

test('invalid entered coordinate is reported with its original slot index',()=>{
  const bundle=createCanonicalEvidenceTemplate()
  bundle.sources=[{id:'capture-1',kind:'direct-capture',ref:'frame.png'}]
  bundle.cityCoordinates[0]={
    ...bundle.cityCoordinates[0],
    x:999,y:20,
    sourceId:'capture-1',
    frameRef:'capture-1#city-1',
    verified:true,
  }
  const audit=auditCanonicalEvidenceBundle(bundle)
  assert.equal(audit.invalidCityCoordinates.length,1)
  const entered=audit.invalidCityCoordinates.find((item)=>item.index===0)
  assert.ok(entered.errors.includes('coordinate-out-of-range'))
})


test('duplicate source IDs block canonical map geometry readiness',()=>{
  const bundle=completeCanonicalMapEvidence()
  bundle.sources.push({...bundle.sources[0],ref:'duplicate-source.png'})
  const audit=auditCanonicalEvidenceBundle(bundle)
  assert.equal(audit.sourceLedgerValid,false)
  assert.equal(audit.geometryReady,false)
  assert.equal(audit.ready,false)
  assert.deepEqual(audit.duplicateSourceIds,['capture-full'])
  assert.ok(audit.blockers.includes('duplicate-source-ids'))
})


test('legacy ownership records remain visible as compatibility diagnostics but never block geometry readiness',()=>{
  const bundle=completeCanonicalMapEvidence()
  bundle.ownership189=[]
  const audit=auditCanonicalEvidenceBundle(bundle)
  assert.equal(audit.geometryReady,true)
  assert.equal(audit.ready,true)
  assert.equal(audit.legacyOwnership189.evidenceCount,0)
  assert.equal(audit.legacyOwnership189.missingCities.length,40)
  assert.match(audit.legacyOwnership189.note,/scenario ownership comes from scenario evidence/)
})
