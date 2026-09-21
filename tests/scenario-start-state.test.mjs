import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { RUNTIME_SCAFFOLD_MAP_PROFILE } from '../src/game/runtime-map-scaffold.js'
import {
  buildCanonical189ScenarioStartState,
  buildScaffold189ScenarioStartState,
  canonical189OwnershipByCityId,
  defaultScenarioStartStateFactory,
} from '../src/game/scenario-start-state.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

const fixtureEconomy=()=>({
  gold:100,
  food:200,
  troops:3000,
  development:50,
  rule:80,
  defense:40,
  training:35,
})

test('scaffold 189 state keeps provisional ownership and coordinate-derived economy quarantined',()=>{
  const state=buildScaffold189ScenarioStartState(RUNTIME_SCAFFOLD_MAP_PROFILE)
  assert.equal(state.mapProfileId,'runtime-scaffold')
  assert.equal(state.scenarioYear,189)
  assert.equal(state.ownershipStatus,'provisional-scaffold')
  assert.equal(state.economyStatus,'provisional-coordinate-derived')
  assert.equal(Object.keys(state.cities).length,40)
})

test('default production start-state factory refuses canonical geometry without calibrated scenario economy',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  assert.throws(
    ()=>defaultScenarioStartStateFactory({mapProfile:profile,scenarioYear:189}),
    /No production scenario start state is calibrated/,
  )
})

test('canonical 189 ownership is resolved separately from map geometry',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  const ownership=canonical189OwnershipByCityId(profile,evidence)
  assert.equal(Object.keys(ownership).length,40)
  assert.equal(ownership['zh-01'],'liu')
  assert.equal(ownership['zh-02'],'cao')
  assert.equal('owner' in profile.cities[0],false)
})

test('canonical scenario start state requires an explicit economy source',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  assert.throws(
    ()=>buildCanonical189ScenarioStartState({mapProfile:profile,evidence}),
    /explicit economyForCity source/,
  )

  const state=buildCanonical189ScenarioStartState({
    mapProfile:profile,
    evidence,
    economyForCity:fixtureEconomy,
    economyStatus:'test-fixture',
  })
  assert.equal(state.id,'zh-rom-canonical:189')
  assert.equal(state.ownershipStatus,'source-backed-189')
  assert.equal(state.economyStatus,'test-fixture')
  assert.equal(state.cities['zh-01'].owner,'liu')
  assert.equal(state.cities['zh-01'].gold,100)
})

test('canonical scenario start state rejects incomplete economy records',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  assert.throws(
    ()=>buildCanonical189ScenarioStartState({
      mapProfile:profile,
      evidence,
      economyForCity:()=>({gold:1}),
    }),
    /Invalid scenario economy field/,
  )
})
