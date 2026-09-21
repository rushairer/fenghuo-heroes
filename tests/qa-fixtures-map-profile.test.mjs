import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { GameStore } from '../src/game/store.js'
import { prepareVisualQaStore, qaEnemyCity, qaOwnedCity } from '../src/game/qa-fixtures.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

function canonicalQaStore(){
  const profile=buildCanonicalRuntimeMap(completeCanonicalMapEvidence())
  const store=new GameStore(new MemoryStorage(),{mapProfile:profile})
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  return {store,profile}
}

test('QA owned/enemy selection follows the injected canonical profile',()=>{
  const {store,profile}=canonicalQaStore()
  assert.equal(qaOwnedCity(store)?.owner,'liu')
  assert.ok(profile.cityById[qaOwnedCity(store).id])
  assert.notEqual(qaEnemyCity(store)?.owner,'liu')
})

test('battle QA fixture uses canonical city IDs without scaffold assumptions',()=>{
  const {store,profile}=canonicalQaStore()
  assert.equal(prepareVisualQaStore(store,'duel-mode'),true)
  assert.equal(store.pendingConflict?.qaFixture,true)
  assert.ok(profile.cityById[store.pendingConflict.from])
  assert.ok(profile.cityById[store.pendingConflict.target])
  assert.notEqual(store.pendingConflict.attacker,store.pendingConflict.defender)
})
