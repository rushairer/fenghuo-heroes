import test from 'node:test'
import assert from 'node:assert/strict'
import { SCENARIOS } from '../src/game/data.js'
import { ORIGINAL_189_PLAYABLE_RULERS, ORIGINAL_189_RULERS, ORIGINAL_CITY_NAMES, ORIGINAL_SCENARIOS, originalScenario } from '../src/game/facts.js'
import { GameStore } from '../src/game/store.js'

class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}

test('original scenario years and selectable ruler counts are evidence-backed',()=>{
  assert.deepEqual(ORIGINAL_SCENARIOS.map((s)=>s.year),[189,200,215])
  assert.deepEqual(ORIGINAL_SCENARIOS.map((s)=>s.playableRulers.length),[7,7,3])
  assert.deepEqual(SCENARIOS.map((s)=>s.selectableRulerCount),[7,7,3])
})

test('189 selectable rulers match the documented seven',()=>{
  assert.deepEqual(ORIGINAL_189_PLAYABLE_RULERS,['劉備','袁紹','曹操','董卓','馬騰','劉表','孫堅'])
  assert.deepEqual(originalScenario(189).playableRulers,['劉備','曹操','孫堅','袁紹','董卓','劉表','馬騰'])
})

test('canonical original city roster contains exactly forty unique names',()=>{
  assert.equal(ORIGINAL_CITY_NAMES.length,40)
  assert.equal(new Set(ORIGINAL_CITY_NAMES).size,40)
  assert.deepEqual(ORIGINAL_CITY_NAMES.slice(0,5),['襄平','蘇縣','代縣','晉陽','平陽'])
  assert.deepEqual(ORIGINAL_CITY_NAMES.slice(-5),['且蘭','雲南','宛溫','不韋','龍編'])
})

test('189 ruler table keeps playable flag and initial officer rosters separate',()=>{
  assert.equal(ORIGINAL_189_RULERS.length,14)
  assert.equal(ORIGINAL_189_RULERS.filter((r)=>r.playable).length,7)
  assert.deepEqual(ORIGINAL_189_RULERS.find((r)=>r.ruler==='劉備').officers,['關羽','張飛'])
  assert.deepEqual(ORIGINAL_189_RULERS.find((r)=>r.ruler==='曹操').officers,['曹仁','曹洪','夏候惇','夏候淵'])
  assert.deepEqual(ORIGINAL_189_RULERS.find((r)=>r.ruler==='孫堅').officers,['程普','黃蓋','朱治','韓當'])
  assert.ok(ORIGINAL_189_RULERS.find((r)=>r.ruler==='董卓').lowLoyalty.includes('呂布'))
})

test('189 new game state carries the verified opening roster table',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  assert.deepEqual(store.state.openingRosters.liu.officers,['關羽','張飛'])
  assert.deepEqual(store.state.openingRosters.cao.officers,['曹仁','曹洪','夏候惇','夏候淵'])
  assert.equal(store.state.openingRosters.yuan_shu.playable,false)
  assert.ok(store.state.openingRosters.dong.lowLoyalty.includes('呂布'))
})

test('later scenarios do not invent opening rosters before evidence is loaded',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:200,humanFactions:['liu']})
  assert.deepEqual(store.state.openingRosters,{})
})
