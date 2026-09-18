import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { TRANSPORT_EVIDENCE, transportEligibleDestinations, transportTargetStatus } from '../src/game/transport-parity.js'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

test('transport evidence records the reported 20000 value without pretending its capacity semantics are settled',()=>{
  assert.equal(TRANSPORT_EVIDENCE.reportedMaximum,20000)
  assert.equal(TRANSPORT_EVIDENCE.capacityInterpretation,'ambiguous-total-vs-per-resource')
  assert.deepEqual(TRANSPORT_EVIDENCE.resources,['gold','food'])
  assert.equal(TRANSPORT_EVIDENCE.interception,true)
})

test('transport destination must be another city owned by the active faction',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({scenarioYear:189,humanFactions:['cao']})
  const owned=Object.values(s.state.cities).filter((city)=>city.owner==='cao').map((city)=>city.id)
  assert.ok(owned.length>=2)
  const source=owned[0]
  const destinations=transportEligibleDestinations(s,source)
  assert.ok(destinations.length>=1)
  assert.equal(destinations.includes(source),false)
  for(const id of destinations)assert.equal(s.state.cities[id].owner,'cao')
  assert.equal(transportTargetStatus(s,source,destinations[0]).ok,true)
  assert.equal(transportTargetStatus(s,source,source).ok,false)
  const enemy=Object.values(s.state.cities).find((city)=>city.owner!=='cao')?.id
  assert.equal(transportTargetStatus(s,source,enemy).ok,false)
})

test('transport target discovery does not move gold food or other city state',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({scenarioYear:189,humanFactions:['cao']})
  const source=Object.values(s.state.cities).find((city)=>city.owner==='cao').id
  const before=structuredClone(s.state.cities)
  transportEligibleDestinations(s,source)
  assert.deepEqual(s.state.cities,before)
})
