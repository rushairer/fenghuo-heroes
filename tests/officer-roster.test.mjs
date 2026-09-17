import test from 'node:test'
import assert from 'node:assert/strict'
import { openingOfficerRows } from '../src/game/officer-roster.js'
import { GameStore } from '../src/game/store.js'

class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}

test('189 officer status projection exposes ruler and documented opening officers',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  assert.deepEqual(openingOfficerRows(store),[
    {name:'劉備',role:'君主'},
    {name:'關羽',role:'武將'},
    {name:'張飛',role:'武將'},
  ])
})

test('officer projection follows active human faction',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu','cao']})
  assert.deepEqual(openingOfficerRows(store).map((row)=>row.name),['劉備','關羽','張飛'])
  store.finishCurrentTurn()
  assert.deepEqual(openingOfficerRows(store).map((row)=>row.name),['曹操','曹仁','曹洪','夏候惇','夏候淵'])
})

test('later scenarios do not fabricate an officer status list',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:200,humanFactions:['liu']})
  assert.deepEqual(openingOfficerRows(store),[])
})
