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
import { MARCH_RUNTIME_PROJECTION } from '../src/game/march-runtime-projection.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'
import { canonical189TestScenarioFactory } from './fixtures/canonical-scenario-state.mjs'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

function routeToward(start,target){
  const step=MARCH_RUNTIME_PROJECTION.routeStepWorld
  const points=[{...start}]
  let x=start.x,y=start.y
  while(x!==target.x||y!==target.y){
    x+=Math.sign(target.x-x)*Math.min(step,Math.abs(target.x-x))
    y+=Math.sign(target.y-y)*Math.min(step,Math.abs(target.y-y))
    points.push({x,y})
    if(points.length>256)throw new Error('fixture route exceeded world bounds')
  }
  return points
}

function canonicalMarchStore(){
  const evidence=completeCanonicalMapEvidence()
  const profile=buildCanonicalRuntimeMap(evidence)
  const store=new GameStore(new MemoryStorage(),{
    mapProfile:profile,
    scenarioStartStateFactory:canonical189TestScenarioFactory(),
  })
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  return {store,profile}
}

test('march queue resolves source city through injected canonical profile',()=>{
  const {store,profile}=canonicalMarchStore()
  const source=profile.cities.find((city)=>store.state.cities[city.id]?.owner==='cao')
  const start=cityWorldPoint(source)
  const army=queueMarch(store,{
    from:source.id,
    route:[start,{x:start.x+8,y:start.y}],
    troops:1000,
    food:400,
    gold:0,
    officerNames:['曹操'],
  })
  assert.equal(army.from,source.id)
  assert.equal(army.x,start.x)
  assert.equal(army.y,start.y)
})

test('enemy-city proximity and siege use canonical profile identities',()=>{
  const {store,profile}=canonicalMarchStore()
  const source=profile.cities.find((city)=>store.state.cities[city.id]?.owner==='cao')
  const target=profile.cities.find((city)=>store.state.cities[city.id]?.owner==='liu')
  const start=cityWorldPoint(source)
  const end=cityWorldPoint(target)
  const army=queueMarch(store,{
    from:source.id,
    route:routeToward(start,end),
    troops:1200,
    food:400,
    gold:0,
    officerNames:['曹操'],
  })
  advanceMarchArmies(store,200)
  assert.equal(enemyCityNearArmy(store,army.id)?.id,target.id)
  const conflict=beginSiegeFromArmy(store,army.id,target.id)
  assert.equal(conflict.target,target.id)
  assert.equal(conflict.attacker,'cao')
  assert.equal(conflict.defender,'liu')
  assert.equal(cancelSiegeFromArmy(store),true)
})

test('source-backed city placement is enforced before soldiers or money are consumed',()=>{
  const {store,profile}=canonicalMarchStore()
  const source=profile.cities.find((city)=>store.state.cities[city.id]?.owner==='cao')
  const start=cityWorldPoint(source)
  const before=structuredClone(store.state.cities[source.id])
  const valid={
    from:source.id,route:[start,{x:start.x+8,y:start.y}],
    troops:1000,food:400,gold:0,
  }
  assert.throws(()=>queueMarch(store,valid),/必須選擇實際駐城武將/)
  assert.throws(()=>queueMarch(store,{...valid,officerNames:['關羽']}),/不在目前的出發城/)
  assert.deepEqual(store.state.cities[source.id],before)
  assert.equal(store.state.armies?.length??0,0)
  assert.equal(store.state.nextArmyId??1,1)

  const own=queueMarch(store,{...valid,officerNames:['曹操']})
  assert.deepEqual(own.officerNames,['曹操'])
  assert.equal(own.officerCount,1)
  assert.throws(()=>queueMarch(store,{...valid,officerNames:['曹操']}),/已隨其他部隊出陣/)
})
