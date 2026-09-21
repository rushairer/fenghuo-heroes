import test from 'node:test'
import assert from 'node:assert/strict'
import { diffCanonicalEvidence } from '../src/game/map-evidence-diff.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

test('semantic diff reports no collection changes for equivalent bundles',()=>{
  const a=completeCanonicalMapEvidence()
  const b=completeCanonicalMapEvidence()
  const diff=diffCanonicalEvidence(a,b)
  assert.deepEqual(diff.totals,{added:0,removed:0,changed:0,coverageChanged:0})
  assert.equal(diff.statusChanged,false)
})

test('semantic diff keys city records by canonical identity rather than array order',()=>{
  const a=completeCanonicalMapEvidence()
  const b=completeCanonicalMapEvidence()
  b.cityCoordinates.reverse()
  b.ownership189.reverse()
  const diff=diffCanonicalEvidence(a,b)
  assert.equal(diff.collections.cityCoordinates.changed.length,0)
  assert.equal(diff.collections.ownership189.changed.length,0)
  assert.equal(diff.collections.cityCoordinates.added.length,0)
})

test('semantic diff exposes coordinate changes without hiding the previous evidence',()=>{
  const a=completeCanonicalMapEvidence()
  const b=completeCanonicalMapEvidence()
  b.cityCoordinates[0]={...b.cityCoordinates[0],x:b.cityCoordinates[0].x+1}
  const diff=diffCanonicalEvidence(a,b)
  assert.equal(diff.collections.cityCoordinates.changed.length,1)
  const change=diff.collections.cityCoordinates.changed[0]
  assert.equal(change.before.x+1,change.after.x)
})

test('semantic diff normalizes reverse route endpoint ordering',()=>{
  const a=completeCanonicalMapEvidence()
  const b=completeCanonicalMapEvidence()
  b.routes=b.routes.map((route)=>({...route,from:route.to,to:route.from}))
  const diff=diffCanonicalEvidence(a,b)
  assert.equal(diff.collections.routes.added.length,0)
  assert.equal(diff.collections.routes.removed.length,0)
})

test('semantic diff reports coverage and status changes separately',()=>{
  const a=completeCanonicalMapEvidence()
  const b=completeCanonicalMapEvidence()
  b.status='reviewed'
  b.villageCoverage={...b.villageCoverage,frameRef:'frame#villages-2'}
  const diff=diffCanonicalEvidence(a,b)
  assert.equal(diff.statusChanged,true)
  assert.equal(diff.coverageChanges.length,1)
  assert.equal(diff.coverageChanges[0].field,'villageCoverage')
})
