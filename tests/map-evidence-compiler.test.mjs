import test from 'node:test'
import assert from 'node:assert/strict'
import { compileCanonicalEvidenceBundle } from '../src/game/map-evidence-compiler.js'
import { createCanonicalEvidenceTemplate } from '../src/game/map-evidence-template.js'
import { ZH_ROM_CANONICAL_CITY_SET } from '../src/game/original-data.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

test('compiler refuses incomplete capture bundles',()=>{
  assert.throws(
    ()=>compileCanonicalEvidenceBundle(createCanonicalEvidenceTemplate()),
    /not ready/,
  )
})

test('compiler emits stable 40-city canonical ordering and ready status',()=>{
  const bundle=completeCanonicalMapEvidence()
  bundle.cityCoordinates.reverse()
  bundle.ownership189.reverse()
  const compiled=compileCanonicalEvidenceBundle(bundle)
  assert.equal(compiled.status,'ready-for-map-compatibility-export')
  assert.equal(compiled.scope,'full')
  assert.equal(compiled.cityCoordinates.length,40)
  assert.equal(compiled.ownership189.length,40)
  assert.equal(compiled.cityCoordinates[0].name,ZH_ROM_CANONICAL_CITY_SET[0])
  assert.equal(compiled.ownership189[0].city,ZH_ROM_CANONICAL_CITY_SET[0])
})

test('compiler removes unused sources and recomputes coverage item counts',()=>{
  const bundle=completeCanonicalMapEvidence()
  bundle.sources.push({id:'unused',kind:'direct-capture',ref:'unused.png'})
  bundle.villageCoverage.itemCount=1
  bundle.routeNetworkCoverage.itemCount=1
  const compiled=compileCanonicalEvidenceBundle(bundle)
  assert.equal(compiled.sources.some((source)=>source.id==='unused'),false)
  assert.equal(compiled.villageCoverage.itemCount,compiled.villages.length)
  assert.equal(compiled.routeNetworkCoverage.itemCount,compiled.routes.length)
})

test('compiler output is deterministic for equivalent input ordering',()=>{
  const a=completeCanonicalMapEvidence()
  const b=completeCanonicalMapEvidence()
  b.cityCoordinates.reverse()
  b.ownership189.reverse()
  b.routes.reverse()
  assert.deepEqual(
    compileCanonicalEvidenceBundle(a),
    compileCanonicalEvidenceBundle(b),
  )
})


test('geometry-only compilation succeeds without 189 ownership evidence',()=>{
  const bundle=completeCanonicalMapEvidence()
  bundle.ownership189=[]
  const compiled=compileCanonicalEvidenceBundle(bundle,{scope:'geometry'})
  assert.equal(compiled.status,'ready-for-canonical-geometry')
  assert.equal(compiled.scope,'geometry')
  assert.equal(compiled.cityCoordinates.length,40)
  assert.equal(compiled.ownership189.length,0)
  assert.ok(compiled.routes.length>0)
  assert.ok(compiled.villages.length>0)
})

test('legacy full compatibility export still refuses geometry-only evidence',()=>{
  const bundle=completeCanonicalMapEvidence()
  bundle.ownership189=[]
  assert.throws(
    ()=>compileCanonicalEvidenceBundle(bundle,{scope:'full'}),
    /legacy-ownership-189-incomplete/,
  )
})

test('compiler rejects unknown readiness scopes',()=>{
  assert.throws(
    ()=>compileCanonicalEvidenceBundle(completeCanonicalMapEvidence(),{scope:'unknown'}),
    /Unknown canonical evidence compile scope/,
  )
})
