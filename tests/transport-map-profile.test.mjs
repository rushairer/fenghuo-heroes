import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { GameStore } from '../src/game/store.js'
import {
  transportEligibleDestinations,
  transportLoadStatus,
  transportTargetStatus,
} from '../src/game/transport-parity.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'
import { canonical189TestScenarioFactory, completeCanonicalScenarioEvidence } from './fixtures/canonical-scenario-state.mjs'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

function canonicalTransportStore(){
  const evidence=completeCanonicalMapEvidence()
  const scenarioEvidence=completeCanonicalScenarioEvidence()
  scenarioEvidence.ownership=scenarioEvidence.ownership.map((record,index)=>({
    ...record,
    factionId:index<2?'cao':'neutral',
  }))
  const profile=buildCanonicalRuntimeMap(evidence)
  const store=new GameStore(new MemoryStorage(),{
    mapProfile:profile,
    scenarioStartStateFactory:canonical189TestScenarioFactory({scenarioEvidence}),
  })
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  return {store,profile}
}

test('transport discovers same-faction destinations from injected canonical profile',()=>{
  const {store,profile}=canonicalTransportStore()
  const owned=profile.cities.filter((city)=>store.state.cities[city.id]?.owner==='cao')
  assert.equal(owned.length,2)
  const destinations=transportEligibleDestinations(store,owned[0].id)
  assert.deepEqual(destinations,[owned[1].id])
  assert.equal(transportTargetStatus(store,owned[0].id,owned[1].id).ok,true)
})

test('transport source validation uses canonical profile identities',()=>{
  const {store,profile}=canonicalTransportStore()
  const source=profile.cities.find((city)=>store.state.cities[city.id]?.owner==='cao')
  store.state.cities[source.id].gold=20000
  store.state.cities[source.id].food=20000
  assert.equal(transportLoadStatus(store,source.id,'both').ok,true)
  assert.equal(transportLoadStatus(store,'not-a-city','both').ok,false)
})
