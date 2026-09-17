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


test('country overview uses manual-backed industry officer rule and tax fields',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  const rows=countryOverviewRows(store)
  const own=rows.find((row)=>row.owner==='liu')
  assert.ok(own)
  assert.equal(own.visible,true)
  assert.equal(typeof own.industry,'number')
  assert.equal(typeof own.rule,'number')
  assert.equal(own.officerCount,null)
  assert.equal(own.taxRate,null)
  assert.equal('ruler' in own,false)
  assert.equal('troops' in own,false)
})

test('ordinary overview hides enemy governance fields while 情報 can reveal them',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  const normal=countryOverviewRows(store)
  const enemy=normal.find((row)=>row.owner!=='liu'&&row.owner!=='neutral')
  assert.ok(enemy)
  assert.equal(enemy.visible,false)
  assert.equal(enemy.industry,null)
  assert.equal(enemy.rule,null)

  const intel=countryOverviewRows(store,{revealAll:true})
  const revealed=intel.find((row)=>row.cityId===enemy.cityId)
  assert.equal(revealed.visible,true)
  assert.equal(typeof revealed.industry,'number')
  assert.equal(typeof revealed.rule,'number')
})

test('verified officer-count and tax-rate slots remain available without fabricating defaults',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  const city=Object.values(store.state.cities).find((runtime)=>runtime.owner==='liu')
  city.officerCount=3
  city.taxRate=44
  const row=countryOverviewRows(store).find((candidate)=>candidate.cityId===city.id)
  assert.equal(row.officerCount,3)
  assert.equal(row.taxRate,44)
})
