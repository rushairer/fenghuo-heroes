import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import { validateSavedGameState } from '../src/game/save-validation.js'

const SAVE_KEY='fenghuo-heroes.cleanroom.v4'

class Storage{
  constructor(){this.m=new Map();this.removals=0}
  getItem(k){return this.m.get(k)??null}
  setItem(k,v){this.m.set(k,v)}
  removeItem(k){this.removals++;this.m.delete(k)}
}
function baseline(){
  const storage=new Storage()
  const store=new GameStore(storage)
  store.newGame({humanFactions:['cao']})
  return {storage,store,raw:JSON.parse(storage.getItem(SAVE_KEY))}
}
function corrupt(mutator){
  const {storage,store,raw}=baseline()
  mutator(raw)
  const value=JSON.stringify(raw)
  storage.setItem(SAVE_KEY,value)
  return {storage,store,value}
}

test('save validator accepts the 189 scaffold while requiring complete city records',()=>{
  const {raw,store}=baseline()
  const result=validateSavedGameState(raw,store.mapProfile)
  assert.equal(result.ok,true,result.errors.join(','))
  assert.equal(result.errors.length,0)
  delete raw.cities.xuchang
  assert.equal(validateSavedGameState(raw,store.mapProfile).ok,false)
})

test('malformed saves fail closed without erasing recoverable browser bytes',()=>{
  const bad=[
    (s)=>{s.humanFactions=[]},
    (s)=>{s.humanFactions=['cao','cao']},
    (s)=>{s.activeHumanIndex=99},
    (s)=>{s.scenarioYear='189'},
    (s)=>{s.month=13},
    (s)=>{s.cursor={x:Infinity,y:10}},
    (s)=>{s.activeCity='missing-city'},
    (s)=>{delete s.cities.xuchang},
    (s)=>{s.cities.xuchang.owner=null},
    (s)=>{s.cities.xuchang.gold=-100},
    (s)=>{s.cities.xuchang.troops=NaN},
    (s)=>{s.cities.xuchang.taxRate=999},
    (s)=>{s.armies='not-an-array'},
    (s)=>{s.inspectionCategories=[]},
  ]
  for(const mutate of bad){
    const {storage,value}=corrupt(mutate)
    const restored=new GameStore(storage)
    assert.equal(restored.load(),false,mutate.toString())
    assert.equal(restored.hasGame(),false)
    assert.equal(restored.pendingConflict,null)
    assert.equal(storage.getItem(SAVE_KEY),value)
    assert.equal(storage.removals,0)
  }
})

test('unparseable saves are preserved instead of being silently removed',()=>{
  const {storage}=baseline()
  storage.setItem(SAVE_KEY,'{not-valid-json')
  const s=new GameStore(storage)
  assert.equal(s.load(),false)
  assert.equal(storage.getItem(SAVE_KEY),'{not-valid-json')
  assert.equal(storage.removals,0)
})

test('a failed reload leaves the current in-memory game untouched',()=>{
  const {storage,store}=baseline()
  const before=JSON.stringify(store.state)
  storage.setItem(SAVE_KEY,'{"cities":false}')
  assert.equal(store.load(),false)
  assert.equal(JSON.stringify(store.state),before)
})

test('new game rejects duplicate/empty human controllers before touching an existing save',()=>{
  const {storage,store}=baseline()
  const before=storage.getItem(SAVE_KEY)
  for(const humanFactions of [[],['cao','cao'],['neutral'],['cao','liu','sun','yuan']]){
    assert.throws(()=>store.newGame({humanFactions}),/Human factions/)
    assert.equal(storage.getItem(SAVE_KEY),before)
  }
})

test('inconsistent cross-faction battle references recover orphaned engaged states',()=>{
  const {storage,store}=baseline()
  store.state.armies=[
    {id:'a1',faction:'cao',status:'engaged',troops:500,food:100,gold:0},
    {id:'a2',faction:'liu',status:'engaged',troops:500,food:100,gold:0},
  ]
  store.pendingConflict={
    kind:'field',attackerArmyId:'a1',defenderArmyId:'a2',
    attacker:'liu',defender:'cao',
  }
  store.save()
  const restored=new GameStore(storage)
  assert.equal(restored.load(),true)
  assert.equal(restored.pendingConflict,null)
  assert.equal(restored.state.armies[0].status,'waiting')
  assert.equal(restored.state.armies[1].status,'waiting')
})

test('a siege conflict targeting a friendly city is not resumed as an enemy battle',()=>{
  const {storage,store}=baseline()
  store.state.armies=[{id:'army-a',faction:'cao',status:'besieging',troops:500}]
  store.pendingConflict={kind:'siege',armyId:'army-a',target:'xuchang',attacker:'cao',defender:'liu'}
  store.save()
  const restored=new GameStore(storage)
  assert.equal(restored.load(),true)
  assert.equal(restored.pendingConflict,null)
  assert.equal(restored.state.armies[0].status,'waiting')
})
