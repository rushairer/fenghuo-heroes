import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { GameStore } from '../src/game/store.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'
import { canonical189TestScenarioFactory } from './fixtures/canonical-scenario-state.mjs'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

test('GameStore can initialize directly against an injected canonical profile',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  const store=new GameStore(new MemoryStorage(),{mapProfile:profile,scenarioStartStateFactory:canonical189TestScenarioFactory()})
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  assert.equal(store.state.mapProfileId,'zh-rom-canonical')
  assert.equal(Object.keys(store.state.cities).length,40)
  assert.ok(profile.cityById[store.state.activeCity])
  assert.equal(store.state.cities[store.state.activeCity].owner,'liu')
  assert.equal(store.cityAt(store.state.cursor.x,store.state.cursor.y)?.id,store.state.activeCity)
})

test('canonical-profile saves reload only through a store using the same profile',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  const storage=new MemoryStorage()
  const original=new GameStore(storage,{mapProfile:profile,scenarioStartStateFactory:canonical189TestScenarioFactory()})
  original.newGame({scenarioYear:189,humanFactions:['liu']})

  const sameProfile=new GameStore(storage,{mapProfile:profile,scenarioStartStateFactory:canonical189TestScenarioFactory()})
  assert.equal(sameProfile.load(),true)
  assert.equal(sameProfile.state.mapProfileId,'zh-rom-canonical')

  const scaffoldStore=new GameStore(storage)
  assert.equal(scaffoldStore.load(),false)
})


test('GameStore rejects structurally invalid injected map profiles at construction time',()=>{
  assert.throws(
    ()=>new GameStore(new MemoryStorage(),{
      mapProfile:{id:'broken',canonical:false,cities:[],cityById:{},villages:[]},
    }),
    /Invalid runtime map profile/,
  )
})


test('GameStore refuses to start canonical geometry with the default provisional scenario factory',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  const store=new GameStore(new MemoryStorage(),{mapProfile:profile})
  assert.throws(
    ()=>store.newGame({scenarioYear:189,humanFactions:['liu']}),
    /evidence is incomplete/,
  )
})

test('new games record scenario-state provenance separately from map profile provenance',()=>{
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  const store=new GameStore(new MemoryStorage(),{
    mapProfile:profile,
    scenarioStartStateFactory:canonical189TestScenarioFactory(),
  })
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  assert.equal(store.state.mapProfileId,'zh-rom-canonical')
  assert.equal(store.state.scenarioStateId,'zh-rom-canonical:189')
  assert.equal(store.state.scenarioOwnershipStatus,'source-backed-189')
  assert.equal(store.state.scenarioEconomyStatus,'source-backed-189')
  assert.equal(store.state.scenarioOfficerPlacementStatus,'source-backed-189')
})
