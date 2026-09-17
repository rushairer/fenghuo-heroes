import test from 'node:test'
import assert from 'node:assert/strict'
import { SCENARIOS } from '../src/game/data.js'
import {
  ORIGINAL_189_RULERS,
  ORIGINAL_189_SELECTABLE_IDS,
  ORIGINAL_189_SELECTABLE_RULERS,
  ORIGINAL_CITY_NAMES,
  ORIGINAL_SCENARIOS,
} from '../src/game/original-data.js'

test('canonical original city roster contains the 40 MD city slots',()=>{
  assert.equal(ORIGINAL_CITY_NAMES.length,40)
  assert.deepEqual(ORIGINAL_CITY_NAMES.slice(0,10),['襄平','薊縣','代縣','信都','臨淄','下邳','濮陽','會稽','壽春','建安'])
  assert.deepEqual(ORIGINAL_CITY_NAMES.slice(-10),['漢中','江州','宛溫','姑藏','西都','襄武','成都','武陽','雲南','不韋'])
})

test('scenario metadata matches 189 / 200 / 215 and verified ruler counts',()=>{
  assert.deepEqual(ORIGINAL_SCENARIOS.map(({year,name,selectableRulerCount})=>[year,name,selectableRulerCount]),[
    [189,'桃園結義',7],[200,'群星亂舞',9],[215,'三國鼎立',10],
  ])
  assert.deepEqual(SCENARIOS.map(({year,name,selectableRulerCount})=>[year,name,selectableRulerCount]),[
    [189,'桃園結義',7],[200,'群星亂舞',9],[215,'三國鼎立',10],
  ])
})

test('189 selectable rulers are the original seven and Yuan Shu remains AI-only',()=>{
  assert.deepEqual(ORIGINAL_189_SELECTABLE_RULERS,['劉備','袁紹','曹操','董卓','馬騰','劉表','孫堅'])
  assert.equal(ORIGINAL_189_SELECTABLE_IDS.length,7)
  assert.equal(ORIGINAL_189_RULERS.find((entry)=>entry.ruler==='袁術')?.selectable,false)
})

test('189 Liu Bei and Sun Jian initial subordinate rosters are protected facts',()=>{
  assert.deepEqual(ORIGINAL_189_RULERS.find((entry)=>entry.ruler==='劉備')?.officers,['關羽','張飛'])
  assert.deepEqual(ORIGINAL_189_RULERS.find((entry)=>entry.ruler==='孫堅')?.officers,['程普','黃蓋','朱治','韓當'])
})
