import test from 'node:test'
import assert from 'node:assert/strict'
import { COUNTRY_OVERVIEW_PAGE_SIZE, countryOverviewRows, countryOverviewWindow, moveCountryOverviewCursor } from '../src/game/country-overview.js'
import { GameStore } from '../src/game/store.js'

class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}

test('country overview projects all forty runtime countries rather than truncating owned cities',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  const rows=countryOverviewRows(store)
  assert.equal(rows.length,40)
  assert.equal(rows[0].number,1)
  assert.equal(rows[39].number,40)
  assert.ok(rows.every((row)=>row.cityId&&row.name))
})

test('country overview cursor wraps through the forty-country list',()=>{
  assert.equal(moveCountryOverviewCursor(0,-1,40),39)
  assert.equal(moveCountryOverviewCursor(39,1,40),0)
  assert.equal(moveCountryOverviewCursor(8,1,40),9)
})

test('country overview window follows cursor without exceeding page size',()=>{
  const rows=Array.from({length:40},(_,index)=>({number:index+1}))
  const first=countryOverviewWindow(rows,0)
  assert.equal(first.start,0)
  assert.equal(first.rows.length,COUNTRY_OVERVIEW_PAGE_SIZE)
  const middle=countryOverviewWindow(rows,20)
  assert.ok(middle.start>0)
  assert.ok(middle.rows.some((row)=>row.number===21))
  const last=countryOverviewWindow(rows,39)
  assert.equal(last.end,40)
  assert.ok(last.rows.some((row)=>row.number===40))
})
