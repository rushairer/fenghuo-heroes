import test from 'node:test'
import assert from 'node:assert/strict'
import { FACTIONS } from '../src/game/data.js'
import {
  JP_MANUAL_SCENARIOS,
  ORIGINAL_189_RULERS,
  ORIGINAL_189_SELECTABLE_IDS,
  ORIGINAL_189_SELECTABLE_RULERS,
  ORIGINAL_CITY_NAMES,
  ORIGINAL_SCENARIOS,
  ZH_189_SELECTABLE_IDS,
  ZH_189_SELECTABLE_RULERS,
  ZH_ROM_CITY_NAME_VARIANTS,
  ZH_ROM_NUMBERED_GUIDE_CITY_ORDER,
  ZH_ROM_RAM_CITY_ORDER,
  ZH_ROM_SCENARIOS,
  scenarioEvidence,
} from '../src/game/original-data.js'
import { GameStore } from '../src/game/store.js'

class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}

test('Chinese-ROM RAM city roster contains forty slots and legacy alias stays explicit',()=>{
  assert.equal(ZH_ROM_RAM_CITY_ORDER.length,40)
  assert.equal(ORIGINAL_CITY_NAMES,ZH_ROM_RAM_CITY_ORDER)
  assert.deepEqual(ZH_ROM_RAM_CITY_ORDER.slice(0,10),['襄平','薊縣','代縣','信都','臨淄','下邳','濮陽','會稽','壽春','建安'])
  assert.deepEqual(ZH_ROM_RAM_CITY_ORDER.slice(-10),['漢中','江州','宛溫','姑藏','西都','襄武','成都','武陽','雲南','不韋'])
})

test('numbered 189 guide city order remains separate from RAM-address order',()=>{
  assert.equal(ZH_ROM_NUMBERED_GUIDE_CITY_ORDER.length,40)
  assert.deepEqual(ZH_ROM_NUMBERED_GUIDE_CITY_ORDER.slice(0,10),['襄平','蘇縣','代縣','晉陽','平陽','臨晉','信都','濮陽','臨淄','洛陽'])
  assert.deepEqual(ZH_ROM_NUMBERED_GUIDE_CITY_ORDER.slice(-10),['臨涇','襄武','西都','故藏','合浦','且蘭','雲南','宛溫','不韋','龍編'])
  assert.notDeepEqual(ZH_ROM_NUMBERED_GUIDE_CITY_ORDER,ZH_ROM_RAM_CITY_ORDER)
})

test('independent Chinese-ROM city sources agree on the city set modulo unresolved spellings',()=>{
  const normalize=(name)=>name==='蘇縣'?'薊縣':name==='故藏'?'姑藏':name
  const ram=[...ZH_ROM_RAM_CITY_ORDER].sort()
  const numbered=ZH_ROM_NUMBERED_GUIDE_CITY_ORDER.map(normalize).sort()
  assert.deepEqual(numbered,ram)
  assert.deepEqual(ZH_ROM_CITY_NAME_VARIANTS.slice(0,2).map(({ram,numberedGuide})=>[ram,numberedGuide]),[
    ['薊縣','蘇縣'],['姑藏','故藏'],
  ])
})

test('Japanese manual scenario counts remain separate from Chinese-ROM reports',()=>{
  assert.deepEqual(JP_MANUAL_SCENARIOS.map(({year,selectableRulerCount})=>[year,selectableRulerCount]),[
    [189,8],[200,9],[215,10],
  ])
  assert.deepEqual(ZH_ROM_SCENARIOS.map(({year,selectableRulerCount})=>[year,selectableRulerCount]),[
    [189,7],[200,7],[215,3],
  ])
  assert.equal(ORIGINAL_SCENARIOS,JP_MANUAL_SCENARIOS)
  assert.equal(scenarioEvidence(215,'jp').selectableRulerCount,10)
  assert.equal(scenarioEvidence(215,'zh-rom').selectableRulerCount,3)
})

test('Chinese-ROM scenario ruler lists are explicit instead of inferred from history',()=>{
  assert.deepEqual(scenarioEvidence(189).playableRulers,['劉備','曹操','孫堅','袁紹','董卓','劉表','馬騰'])
  assert.deepEqual(scenarioEvidence(200).playableRulers,['劉備','曹操','孫權','袁紹','劉表','馬騰','劉璋'])
  assert.deepEqual(scenarioEvidence(215).playableRulers,['劉備','曹操','孫權'])
})

test('189 setup order follows the Chinese-ROM target profile',()=>{
  assert.deepEqual(FACTIONS.slice(0,7).map((f)=>f.ruler),scenarioEvidence(189).playableRulers)
})

test('189 Chinese-ROM selectable aliases remain stable and Yuan Shu is not in that list',()=>{
  assert.deepEqual(ZH_189_SELECTABLE_RULERS,['劉備','袁紹','曹操','董卓','馬騰','劉表','孫堅'])
  assert.equal(ZH_189_SELECTABLE_IDS.length,7)
  assert.equal(ORIGINAL_189_SELECTABLE_RULERS,ZH_189_SELECTABLE_RULERS)
  assert.equal(ORIGINAL_189_SELECTABLE_IDS,ZH_189_SELECTABLE_IDS)
  assert.equal(ORIGINAL_189_RULERS.find((entry)=>entry.ruler==='袁術')?.zhCommunitySelectable,false)
})

test('189 Liu Bei and Sun Jian initial subordinate rosters are protected facts',()=>{
  assert.deepEqual(ORIGINAL_189_RULERS.find((entry)=>entry.ruler==='劉備')?.officers,['關羽','張飛'])
  assert.deepEqual(ORIGINAL_189_RULERS.find((entry)=>entry.ruler==='孫堅')?.officers,['程普','黃蓋','朱治','韓當'])
})

test('189 opening rosters are carried into runtime state',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  assert.deepEqual(store.state.openingRosters.liu.officers,['關羽','張飛'])
  assert.deepEqual(store.state.openingRosters.cao.officers,['曹仁','曹洪','夏候惇','夏候淵'])
  assert.equal(store.state.openingRosters.yuan_shu.zhCommunitySelectable,false)
})

test('later-scenario runtime refuses to invent opening rosters before scenario evidence is calibrated',()=>{
  const store=new GameStore(new MemoryStorage())
  assert.throws(
    ()=>store.newGame({scenarioYear:200,humanFactions:['liu']}),
    /No production scenario start state is calibrated/,
  )
  assert.equal(store.hasGame(),false)
})
