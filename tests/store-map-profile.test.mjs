import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap } from '../src/game/canonical-map-profile.js'
import { GameStore } from '../src/game/store.js'
import { completeCanonicalMapEvidence } from './fixtures/canonical-map-evidence.mjs'

class MemoryStorage{
  constructor(){this.m=new Map()}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.m.delete(k)}
}

test('GameStore can initialize directly against an injected canonical profile',()=>{
  const profile=buildCanonicalRuntimeMap(completeCanonicalMapEvidence())
  const store=new GameStore(new MemoryStorage(),{mapProfile:profile})
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
  const original=new GameStore(storage,{mapProfile:profile})
  original.newGame({scenarioYear:189,humanFactions:['liu']})

  const sameProfile=new GameStore(storage,{mapProfile:profile})
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
