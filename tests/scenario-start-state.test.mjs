import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { RUNTIME_SCAFFOLD_MAP_PROFILE } from '../src/game/runtime-map-scaffold.js'
import {
  buildCanonical189ScenarioStartState,
  buildScaffold189ScenarioStartState,
  canonicalScenarioOwnershipByCityId,
  canonicalOfficerAssignmentsByCityId,
  canonicalScenarioStateByCityId,
  defaultScenarioStartStateFactory,
} from '../src/game/scenario-start-state.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'
import { completeCanonicalScenarioEvidence } from './fixtures/canonical-scenario-state.mjs'

test('scaffold 189 state keeps provisional ownership and coordinate-derived economy quarantined',()=>{
  const state=buildScaffold189ScenarioStartState(RUNTIME_SCAFFOLD_MAP_PROFILE)
  assert.equal(state.mapProfileId,'runtime-scaffold')
  assert.equal(state.scenarioYear,189)
  assert.equal(state.ownershipStatus,'provisional-scaffold')
  assert.equal(state.economyStatus,'provisional-coordinate-derived')
  assert.equal(state.officerPlacementStatus,'provisional-roster-only')
  assert.equal(Object.keys(state.cities).length,40)
})

test('default production start-state factory refuses canonical geometry while repository evidence is still incomplete',()=>{
  const mapEvidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(mapEvidence)
  assert.throws(
    ()=>defaultScenarioStartStateFactory({mapProfile:profile,scenarioYear:189}),
    /evidence is incomplete/,
  )
})

test('canonical scenario ownership is resolved separately from map geometry',()=>{
  const mapEvidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(mapEvidence)
  const scenarioEvidence=completeCanonicalScenarioEvidence()
  const ownership=canonicalScenarioOwnershipByCityId(profile,scenarioEvidence)
  assert.equal(Object.keys(ownership).length,40)
  assert.equal(ownership['zh-01'],'liu')
  assert.equal(ownership['zh-02'],'cao')
  assert.equal('owner' in profile.cities[0],false)
})

test('canonical scenario numeric state and officer placement require their own source-backed evidence',()=>{
  const mapEvidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(mapEvidence)
  const scenarioEvidence=completeCanonicalScenarioEvidence()

  const cityState=canonicalScenarioStateByCityId(profile,scenarioEvidence)
  const officers=canonicalOfficerAssignmentsByCityId(profile,scenarioEvidence)
  assert.equal(Object.keys(cityState).length,40)
  assert.equal(cityState['zh-01'].gold,20000)
  assert.deepEqual(officers['zh-03'],['張飛','關羽'].sort((a,b)=>a.localeCompare(b)))

  const missingEconomy={...scenarioEvidence,cityStates:[]}
  assert.throws(
    ()=>canonicalScenarioStateByCityId(profile,missingEconomy),
    /city-state evidence is incomplete/,
  )

  const missingOfficers={...scenarioEvidence,officerAssignments:[]}
  assert.throws(
    ()=>canonicalOfficerAssignmentsByCityId(profile,missingOfficers),
    /officer-placement evidence is incomplete/,
  )
})

test('canonical 189 start state combines source-backed ownership economy and officer placement',()=>{
  const mapEvidence=completeCanonicalMapEvidence()
  const scenarioEvidence=completeCanonicalScenarioEvidence()
  const profile=buildCanonicalRuntimeMap(mapEvidence)
  const state=buildCanonical189ScenarioStartState({
    mapProfile:profile,
    scenarioEvidence,
  })
  assert.equal(state.id,'zh-rom-canonical:189')
  assert.equal(state.ownershipStatus,'source-backed-189')
  assert.equal(state.economyStatus,'source-backed-189')
  assert.equal(state.officerPlacementStatus,'source-backed-189')
  assert.equal(state.cities['zh-01'].owner,'liu')
  assert.equal(state.cities['zh-01'].gold,20000)
  assert.deepEqual(state.cities['zh-03'].officers,['張飛','關羽'].sort((a,b)=>a.localeCompare(b)))
  assert.equal(state.cities['zh-03'].officerCount,2)
  assert.equal(state.cities['zh-01'].officerCount,0)
})
