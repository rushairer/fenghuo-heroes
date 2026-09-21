import test from 'node:test'
import assert from 'node:assert/strict'
import { activeMapProfile, mapActivationReport } from '../src/game/map-activation.js'

test('runtime map stays on scaffold until explicit activation changes',()=>{
  const profile=activeMapProfile()
  assert.equal(profile.id,'runtime-scaffold')
  assert.equal(profile.canonical,false)
})

test('canonical activation cannot bypass evidence readiness',()=>{
  assert.throws(()=>activeMapProfile({target:'canonical'}),/before evidence readiness/)
})

test('activation report separates evidence readiness from active profile',()=>{
  const report=mapActivationReport()
  assert.equal(report.activationTarget,'scaffold')
  assert.equal(report.activeProfileId,'runtime-scaffold')
  assert.equal(report.activeCanonical,false)
  assert.equal(report.evidenceReady,false)
})
