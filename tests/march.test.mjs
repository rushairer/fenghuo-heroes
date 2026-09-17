import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES } from '../src/game/data.js'
import { GameStore } from '../src/game/store.js'
import { advanceMarchArmies,dailyFoodFor,ensureMarchState,queueMarch,rerouteArmy } from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'
class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}
test('manual daily grain formula is soldiers / 100 + officers',()=>{assert.equal(dailyFoodFor(3000,2),32);assert.equal(dailyFoodFor(999,1),10)})
test('free cursor route creates persistent march army',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['cao']});s.finishCurrentTurn();const start=cityWorldPoint(CITIES.find((c)=>c.id==='xuchang'));const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y+8}],troops:1000,food:400,gold:50,officerCount:1});assert.equal(ensureMarchState(s).length,1);assert.equal(army.dailyFood,11);assert.equal(army.route.length,3)})
test('march execution consumes grain per route day and leaves army on map',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['cao']});s.finishCurrentTurn();const start=cityWorldPoint(CITIES.find((c)=>c.id==='xuchang'));const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y},{x:start.x+24,y:start.y}],troops:1000,food:400,gold:0,officerCount:1});advanceMarchArmies(s,30);assert.equal(army.x,start.x+24);assert.equal(army.food,367);assert.equal(army.status,'waiting')})
test('an existing army can receive a new free route',()=>{const s=new GameStore(new MemoryStorage());s.newGame({humanFactions:['cao']});s.finishCurrentTurn();const start=cityWorldPoint(CITIES.find((c)=>c.id==='xuchang'));const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:1000,food:400,gold:0});advanceMarchArmies(s,1);rerouteArmy(s,army.id,[{x:army.x,y:army.y},{x:army.x,y:army.y+8}]);assert.equal(army.routeIndex,0);assert.equal(army.status,'marching');assert.equal(army.route.at(-1).y,start.y+8)})
