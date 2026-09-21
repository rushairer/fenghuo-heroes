import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { validateRuntimeMapProfile } from '../src/game/map-profile-validation.js'
import { RUNTIME_SCAFFOLD_MAP_PROFILE } from '../src/game/runtime-map-scaffold.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

test('current scaffold profile satisfies structural integrity',()=>{
  const report=validateRuntimeMapProfile(RUNTIME_SCAFFOLD_MAP_PROFILE)
  assert.equal(report.ok,true)
  assert.equal(report.cityCount,40)
  assert.equal(report.villageCount,0)
})

test('generated canonical profile satisfies structural integrity',()=>{
  const profile=buildCanonicalRuntimeMap(completeCanonicalMapEvidence())
  const report=validateRuntimeMapProfile(profile)
  assert.equal(report.ok,true)
  assert.equal(report.cityCount,40)
  assert.equal(report.villageCount,1)
})

test('profile validation rejects asymmetric and out-of-range geometry',()=>{
  const a={id:'a',name:'A',x:10,y:10,owner:'liu',neighbors:['b']}
  const b={id:'b',name:'B',x:999,y:10,owner:'cao',neighbors:[]}
  const profile={
    id:'broken',
    canonical:false,
    cities:[a,b],
    cityById:{a,b},
    villages:[{id:'v1',x:-1,y:2}],
  }
  const report=validateRuntimeMapProfile(profile)
  assert.equal(report.ok,false)
  assert.ok(report.errors.includes('asymmetric-neighbor:a:b'))
  assert.ok(report.errors.includes('city-out-of-range:b'))
  assert.ok(report.errors.includes('village-out-of-range:v1'))
})
