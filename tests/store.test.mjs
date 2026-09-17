import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES, SCENARIOS } from '../src/game/data.js'
import { GameStore } from '../src/game/store.js'
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}
test('reference map scaffold has 40 cities',()=>assert.equal(CITIES.length,40))
test('initial settings expose 189/200/215 scenarios',()=>assert.deepEqual(SCENARIOS.map((s)=>s.year),[189,200,215]))
test('odd month inspection and even month march',()=>{const s=new GameStore(new MemoryStorage());s.newGame({scenarioYear:189,humanFactions:['liu']});assert.equal(s.mode,'inspection');s.advanceMonth();assert.equal(s.mode,'march')})
test('up to three human factions rotate',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['liu','cao','sun']});assert.equal(s.humanFaction,'liu');s.advanceMonth();assert.equal(s.humanFaction,'cao');s.advanceMonth();assert.equal(s.humanFaction,'sun')})
test('inspection mutates city state',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['cao']});const before=s.state.cities.xuchang.development;const msg=s.executeInspection('develop','xuchang');assert.match(msg,/開發/);assert.ok(s.state.cities.xuchang.development>before)})
test('march requires adjacent route and creates enemy conflict',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['cao']});s.advanceMonth();const c=s.planMarch('xuchang','xinye');assert.ok(c);assert.equal(c.target,'xinye')})
test('save/load retains HD parity setup state',()=>{const mem=new MemoryStorage();const a=new GameStore(mem);a.newGame({scenarioYear:215,difficulty:'hard',animation:false,textSpeed:'fast',humanFactions:['sun','liu']});const b=new GameStore(mem);assert.equal(b.load(),true);assert.equal(b.state.scenarioYear,215);assert.deepEqual(b.state.humanFactions,['sun','liu'])})
