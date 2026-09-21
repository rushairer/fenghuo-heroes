import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { GameStore } from '../src/game/store.js'
import {
  advanceMarchArmies,
  beginSiegeFromArmy,
  cancelSiegeFromArmy,
  enemyCityNearArmy,
  queueMarch,
} from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

function canonicalMarchStore(){
  const profile=buildCanonicalRuntimeMap(completeCanonicalMapEvidence())
  const store=new GameStore(new MemoryStorage(),{mapProfile:profile})
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  return {store,profile}
}

test('march queue resolves source city through injected canonical profile',()=>{
  const {store,profile}=canonicalMarchStore()
  const source=profile.cities.find((city)=>city.owner==='cao')
  const start=cityWorldPoint(source)
  const army=queueMarch(store,{
    from:source.id,
    route:[start,{x:start.x+8,y:start.y}],
    troops:1000,
    food:400,
    gold:0,
  })
  assert.equal(army.from,source.id)
  assert.equal(army.x,start.x)
  assert.equal(army.y,start.y)
})

test('enemy-city proximity and siege use canonical profile identities',()=>{
  const {store,profile}=canonicalMarchStore()
  const source=profile.cities.find((city)=>city.owner==='cao')
  const target=profile.cities.find((city)=>city.owner==='liu')
  const start=cityWorldPoint(source)
  const end=cityWorldPoint(target)
  const army=queueMarch(store,{
    from:source.id,
    route:[start,end],
    troops:1200,
    food:400,
    gold:0,
  })
  advanceMarchArmies(store,1)
  assert.equal(enemyCityNearArmy(store,army.id)?.id,target.id)
  const conflict=beginSiegeFromArmy(store,army.id,target.id)
  assert.equal(conflict.target,target.id)
  assert.equal(conflict.attacker,'cao')
  assert.equal(conflict.defender,'liu')
  assert.equal(cancelSiegeFromArmy(store),true)
})
