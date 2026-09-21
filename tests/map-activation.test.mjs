import test from 'node:test'
import assert from 'node:assert/strict'
import { activeMapProfile, mapActivationReport } from '../src/game/map-activation.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

test('runtime map stays on scaffold until explicit activation changes',()=>{
  const profile=activeMapProfile()
  assert.equal(profile.id,'runtime-scaffold')
  assert.equal(profile.canonical,false)
})

test('canonical activation cannot bypass geometry evidence readiness',()=>{
  assert.throws(()=>activeMapProfile({target:'canonical'}),/before geometry evidence readiness/)
})

test('activation report separates evidence readiness from active profile',()=>{
  const report=mapActivationReport()
  assert.equal(report.activationTarget,'scaffold')
  assert.equal(report.activeProfileId,'runtime-scaffold')
  assert.equal(report.activeCanonical,false)
  assert.equal(report.evidenceReady,false)
  assert.equal(report.activationReady,false)
})


test('explicit canonical activation succeeds only with complete evidence and valid profile integrity',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=activeMapProfile({target:'canonical',evidence})
  assert.equal(profile.id,'zh-rom-canonical')
  assert.equal(profile.canonical,true)
  assert.equal(profile.cities.length,40)

  const report=mapActivationReport({target:'canonical',evidence})
  assert.equal(report.activeCanonical,true)
  assert.equal(report.activationReady,true)
  assert.equal(report.evidenceReady,true)
  assert.equal(report.activeProfileId,'zh-rom-canonical')
})


test('canonical geometry activation ignores legacy 189 ownership evidence',()=>{
  const evidence=completeCanonicalMapEvidence()
  evidence.ownership189=[]
  const profile=activeMapProfile({target:'canonical',evidence})
  assert.equal(profile.id,'zh-rom-canonical')
  assert.equal(profile.canonical,true)
  assert.equal(profile.geometryOnly,true)

  const report=mapActivationReport({target:'canonical',evidence})
  assert.equal(report.activationReady,true)
  assert.equal(report.geometryReady,true)
})
