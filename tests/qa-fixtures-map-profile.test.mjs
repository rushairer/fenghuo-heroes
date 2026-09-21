import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { GameStore } from '../src/game/store.js'
import { prepareVisualQaStore, qaEnemyCity, qaOwnedCity } from '../src/game/qa-fixtures.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'
import { canonical189TestScenarioFactory } from './fixtures/canonical-scenario-state.mjs'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

function canonicalQaStore(){
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  const store=new GameStore(new MemoryStorage(),{
    mapProfile:profile,
    scenarioStartStateFactory:canonical189TestScenarioFactory(),
  })
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  return {store,profile}
}

test('QA owned/enemy selection follows runtime scenario ownership over canonical geometry',()=>{
  const {store,profile}=canonicalQaStore()
  const owned=qaOwnedCity(store)
  const enemy=qaEnemyCity(store)
  assert.ok(owned)
  assert.ok(enemy)
  assert.equal('owner' in owned,false)
  assert.equal('owner' in enemy,false)
  assert.equal(store.state.cities[owned.id].owner,'liu')
  assert.notEqual(store.state.cities[enemy.id].owner,'liu')
  assert.ok(profile.cityById[owned.id])
  assert.ok(profile.cityById[enemy.id])
})

test('battle QA fixture uses canonical city IDs without scaffold assumptions',()=>{
  const {store,profile}=canonicalQaStore()
  assert.equal(prepareVisualQaStore(store,'duel-mode'),true)
  assert.equal(store.pendingConflict?.qaFixture,true)
  assert.ok(profile.cityById[store.pendingConflict.from])
  assert.ok(profile.cityById[store.pendingConflict.target])
  assert.notEqual(store.pendingConflict.attacker,store.pendingConflict.defender)
})
