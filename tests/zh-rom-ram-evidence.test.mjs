import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ZH_ROM_CITY_RESOURCE_RAM,
  ZH_ROM_RAM_EVIDENCE_SOURCE,
  ZH_ROM_RULER_SELECTOR_RAM,
  cityResourceRamAddress,
  cityResourceRamPlan,
} from '../src/game/zh-rom-ram-evidence.js'
import { ZH_ROM_RAM_CITY_ORDER } from '../src/game/original-data.js'

test('Chinese ROM resource tables preserve the observed four-byte city stride',()=>{
  assert.equal(ZH_ROM_CITY_RESOURCE_RAM.stride,4)
  assert.equal(ZH_ROM_CITY_RESOURCE_RAM.cityCount,40)
  assert.equal(cityResourceRamAddress('襄平','gold'),0xE000)
  assert.equal(cityResourceRamAddress('薊縣','gold'),0xE004)
  assert.equal(cityResourceRamAddress('代縣','food'),0xE0A8)
  assert.equal(cityResourceRamAddress('不韋','troops'),0xE59C)
})

test('RAM capture plan follows RAM-address order without claiming visible country order',()=>{
  const plan=cityResourceRamPlan()
  assert.equal(plan.length,40)
  assert.deepEqual(plan.map((item)=>item.city),ZH_ROM_RAM_CITY_ORDER)
  assert.equal(plan[0].gold,0xE000)
  assert.equal(plan[39].gold,0xE09C)
  assert.equal(plan[39].food,0xE13C)
  assert.equal(plan[39].troops,0xE59C)
})

test('ruler selector mapping stays separate from scenario ownership evidence',()=>{
  assert.equal(ZH_ROM_RULER_SELECTOR_RAM.address,0xF67A)
  assert.equal(ZH_ROM_RULER_SELECTOR_RAM.values[0x1],'劉備')
  assert.equal(ZH_ROM_RULER_SELECTOR_RAM.values[0x5],'曹操')
  assert.equal(ZH_ROM_RULER_SELECTOR_RAM.values[0xD],'馬騰')
  assert.equal(ZH_ROM_RULER_SELECTOR_RAM.values[0xE],'觀看模式')
})

test('RAM source is explicitly classified as layout lead rather than opening-state proof',()=>{
  assert.equal(ZH_ROM_RAM_EVIDENCE_SOURCE.edition,'traditional-chinese-md')
  assert.equal(
    ZH_ROM_RAM_EVIDENCE_SOURCE.confidence,
    'layout-lead-not-start-value-evidence',
  )
})

test('RAM address helper rejects unsupported city identities and fields',()=>{
  assert.throws(()=>cityResourceRamAddress('北平','gold'),/Unknown Chinese-ROM RAM city identity/)
  assert.throws(()=>cityResourceRamAddress('襄平','development'),/Unknown Chinese-ROM city resource field/)
})
