import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES, SCENARIOS } from '../src/game/data.js'
import { GameStore } from '../src/game/store.js'
import { WORLD_H, WORLD_W, cameraFor, cityWorldPoint, toScreen } from '../src/game/world.js'
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}
test('reference map scaffold has 40 cities',()=>assert.equal(CITIES.length,40))
test('initial settings expose 189/200/215 scenarios',()=>assert.deepEqual(SCENARIOS.map((s)=>s.year),[189,200,215]))
test('single player alternates inspection and march months',()=>{const s=new GameStore(new MemoryStorage());s.newGame({scenarioYear:189,humanFactions:['liu']});assert.equal(s.mode,'inspection');s.finishCurrentTurn();assert.equal(s.state.month,2);assert.equal(s.mode,'march')})
test('three human players act in the same month before month advances',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['liu','cao','sun']});assert.equal(s.state.month,1);assert.equal(s.humanFaction,'liu');s.finishCurrentTurn();assert.equal(s.state.month,1);assert.equal(s.humanFaction,'cao');s.finishCurrentTurn();assert.equal(s.state.month,1);assert.equal(s.humanFaction,'sun');s.finishCurrentTurn();assert.equal(s.state.month,2);assert.equal(s.humanFaction,'liu')})
test('inspection category is locked per player for the month',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['liu','cao']});assert.equal(s.lockInspectionCategory('domestic'),true);assert.equal(s.lockInspectionCategory('military'),false);assert.equal(s.inspectionCategoryForActive(),'domestic');s.finishCurrentTurn();assert.equal(s.humanFaction,'cao');assert.equal(s.inspectionCategoryForActive(),null);assert.equal(s.lockInspectionCategory('military'),true)})
test('unverified inspection formulas never mutate city resources or combat values',()=>{
  const commands=['develop','welfare','educate','appoint-governor','appoint-strategist','appoint-office','borrow','repay','recruit','weapons','defense','train','talent-search','talent-persuade','talent-gift']
  for(const command of commands){
    const s=new GameStore(new MemoryStorage())
    s.newGame({humanFactions:['cao']})
    const before=structuredClone(s.state.cities.xuchang)
    const msg=s.executeInspection(command,'xuchang')
    assert.match(msg,/尚未校準/)
    assert.deepEqual(s.state.cities.xuchang,before,command)
  }
})
test('unverified diplomacy effects do not pretend success or mutate city state',()=>{
  for(const command of ['ally','alienate','assassinate','fire']){
    const s=new GameStore(new MemoryStorage())
    s.newGame({humanFactions:['cao']})
    const before=structuredClone(s.state.cities.xuchang)
    const msg=s.executeInspection(command,'xuchang')
    assert.match(msg,/尚未校準/)
    assert.deepEqual(s.state.cities.xuchang,before,command)
  }
})
test('legacy adjacent-city instant march API is retired without mutating city state',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({humanFactions:['cao']})
  s.finishCurrentTurn()
  const before=structuredClone(s.state.cities)
  assert.throws(()=>s.planMarch('xuchang','xinye'),/自由路線行軍/)
  assert.deepEqual(s.state.cities,before)
  assert.equal(s.pendingConflict,null)
})
test('legacy generic conflict resolver is retired without mutating strategic state',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({humanFactions:['cao','liu']})
  s.finishCurrentTurn();s.finishCurrentTurn()
  const before=structuredClone(s.state)
  s.pendingConflict={kind:'siege',from:'xuchang',target:'xinye',attacker:'cao',defender:'liu',attackerTroops:1200,defenderTroops:s.state.cities.xinye.troops}
  assert.throws(()=>s.resolveConflict(false),/戰鬥結算已退休/)
  assert.deepEqual(s.state,before)
  assert.equal(s.pendingConflict.target,'xinye')
})
test('save/load retains calibrated setup and command lock state',()=>{const mem=new MemoryStorage();const a=new GameStore(mem);a.newGame({scenarioYear:189,difficulty:'hard',animation:false,textSpeed:'fast',humanFactions:['sun','liu']});a.lockInspectionCategory('military');const b=new GameStore(mem);assert.equal(b.load(),true);assert.equal(b.state.scenarioYear,189);assert.deepEqual(b.state.humanFactions,['sun','liu']);assert.equal(b.inspectionCategoryForActive(),'military')})
test('strategy world is larger than the 320x176 viewport and camera follows cursor',()=>{assert.equal(WORLD_W,640);assert.equal(WORLD_H,448);const city=CITIES.find((c)=>c.id==='xiangping');const wp=cityWorldPoint(city);assert.deepEqual(wp,{x:568,y:86});const cam=cameraFor(wp);assert.equal(cam.x,320);const sp=toScreen(wp,cam);assert.ok(sp.x>=0&&sp.x<=320);assert.ok(sp.y>=0&&sp.y<=176)})
test('new games store cursor in world coordinates',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['yuan']});const first=CITIES.find((c)=>c.owner==='yuan');const wp=cityWorldPoint(first);assert.deepEqual(s.state.cursor,wp);assert.equal(s.cityAt(wp.x,wp.y,12)?.id,first.id)})


test('setting tax rate persists the configured percentage without immediate settlement effects',()=>{
  const mem=new MemoryStorage()
  const s=new GameStore(mem)
  s.newGame({humanFactions:['cao']})
  const city=s.state.cities.xuchang
  const before={gold:city.gold,food:city.food,rule:city.rule}
  assert.equal(city.taxRate,undefined)
  assert.equal(s.setTaxRate('xuchang',44),44)
  assert.equal(city.taxRate,44)
  assert.equal(city.gold,before.gold)
  assert.equal(city.food,before.food)
  assert.equal(city.rule,before.rule)

  const loaded=new GameStore(mem)
  assert.equal(loaded.load(),true)
  assert.equal(loaded.state.cities.xuchang.taxRate,44)
})

test('tax rate rejects unverified out-of-range or non-integer values',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({humanFactions:['cao']})
  for(const value of [-1,100,44.5,NaN])assert.throws(()=>s.setTaxRate('xuchang',value),/0 到 99/)
})

test('tax rate can only be configured for the active player territory',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({humanFactions:['cao']})
  assert.throws(()=>s.setTaxRate('xinye',30),/本國城池/)
})


test('legacy generic tax command no longer performs the removed instant money and rule mutation',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({humanFactions:['cao']})
  const city=s.state.cities.xuchang
  const before={gold:city.gold,food:city.food,rule:city.rule,taxRate:city.taxRate}
  assert.match(s.executeInspection('tax','xuchang'),/設定畫面/)
  assert.deepEqual(
    {gold:city.gold,food:city.food,rule:city.rule,taxRate:city.taxRate},
    before,
  )
})


test('new saves are tagged with the active runtime map profile',()=>{
  const s=new GameStore(new MemoryStorage())
  s.newGame({humanFactions:['liu']})
  assert.equal(s.state.mapProfileId,'runtime-scaffold')
})

test('legacy untagged saves remain readable only while scaffold is active',()=>{
  const mem=new MemoryStorage()
  const original=new GameStore(mem)
  original.newGame({humanFactions:['liu']})
  const raw=JSON.parse(mem.getItem('fenghuo-heroes.cleanroom.v4'))
  delete raw.mapProfileId
  mem.setItem('fenghuo-heroes.cleanroom.v4',JSON.stringify(raw))

  const loaded=new GameStore(mem)
  assert.equal(loaded.load(),true)
  assert.equal(loaded.state.mapProfileId,'runtime-scaffold')
})

test('save data from a different map profile is never reinterpreted as the active map',()=>{
  const mem=new MemoryStorage()
  const original=new GameStore(mem)
  original.newGame({humanFactions:['liu']})
  const raw=JSON.parse(mem.getItem('fenghuo-heroes.cleanroom.v4'))
  raw.mapProfileId='zh-rom-canonical'
  mem.setItem('fenghuo-heroes.cleanroom.v4',JSON.stringify(raw))

  const loaded=new GameStore(mem)
  assert.equal(loaded.load(),false)
  assert.equal(loaded.state,null)
})
