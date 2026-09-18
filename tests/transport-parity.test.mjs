import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  TRANSPORT_EVIDENCE,
  TRANSPORT_LOAD_OPTIONS,
  capturedTransportCargo,
  transportEligibleDestinations,
  transportInterceptStatus,
  transportLoadStatus,
  transportTargetStatus,
} from '../src/game/transport-parity.js'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

test('transport evidence locks the original three fixed payload choices',()=>{
  assert.equal(TRANSPORT_EVIDENCE.reportedMaximum,20000)
  assert.equal(TRANSPORT_EVIDENCE.capacityInterpretation,'10000-each-when-both-selected')
  assert.equal(TRANSPORT_EVIDENCE.movementParity,'unverified')
  assert.deepEqual(
    TRANSPORT_LOAD_OPTIONS.map(({id,gold,food})=>({id,gold,food})),
    [
      {id:'gold',gold:10000,food:0},
      {id:'food',gold:0,food:10000},
      {id:'both',gold:10000,food:10000},
    ],
  )
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

test('transport payload availability follows source gold and food without mutating state',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({scenarioYear:189,humanFactions:['cao']})
  const source=Object.values(s.state.cities).find((city)=>city.owner==='cao').id
  s.state.cities[source].gold=20000
  s.state.cities[source].food=20000
  const before=structuredClone(s.state.cities)
  assert.equal(transportLoadStatus(s,source,'gold').ok,true)
  assert.equal(transportLoadStatus(s,source,'food').ok,true)
  assert.equal(transportLoadStatus(s,source,'both').ok,true)
  assert.deepEqual(s.state.cities,before)

  s.state.cities[source].gold=9999
  assert.equal(transportLoadStatus(s,source,'gold').ok,false)
  assert.match(transportLoadStatus(s,source,'gold').reason,/金不足/)
  s.state.cities[source].gold=20000
  s.state.cities[source].food=9999
  assert.equal(transportLoadStatus(s,source,'both').ok,false)
  assert.match(transportLoadStatus(s,source,'both').reason,/米不足/)
})

test('transport target discovery does not move gold food or other city state',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({scenarioYear:189,humanFactions:['cao']})
  const source=Object.values(s.state.cities).find((city)=>city.owner==='cao').id
  const before=structuredClone(s.state.cities)
  transportEligibleDestinations(s,source)
  assert.deepEqual(s.state.cities,before)
})


test('transport interception requires exact map-cell overlap rather than army adjacency',()=>{
  const army={id:'army-1',faction:'cao',x:100,y:120}
  const enemy={id:'transport-1',faction:'liu',x:108,y:120,gold:10000,food:0}
  assert.equal(transportInterceptStatus(army,enemy).ok,false)
  assert.match(transportInterceptStatus(army,enemy).reason,/重疊/)

  enemy.x=100
  assert.equal(transportInterceptStatus(army,enemy).ok,true)

  enemy.faction='cao'
  assert.equal(transportInterceptStatus(army,enemy).ok,false)
  assert.match(transportInterceptStatus(army,enemy).reason,/本國/)
})

test('captured transport payload is exposed without guessing where loot is deposited',()=>{
  const cargo=capturedTransportCargo({gold:10000,food:10000})
  assert.deepEqual(cargo,{gold:10000,food:10000})
  assert.equal(TRANSPORT_EVIDENCE.interceptionTrigger,'same-map-cell-overlap')
  assert.equal(TRANSPORT_EVIDENCE.capturedCargoDestination,'unverified')
  assert.equal(TRANSPORT_EVIDENCE.transportRelativeSpeed,'faster-than-marching-army-observed')
})
