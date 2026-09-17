import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(key) { return this.map.get(key) ?? null }
  setItem(key, value) { this.map.set(key, value) }
  removeItem(key) { this.map.delete(key) }
}

test('odd months inspect and even months march', () => {
  const store = new GameStore(new MemoryStorage()); store.newGame('cao'); assert.equal(store.mode, 'inspection'); assert.equal(store.state.month, 1); store.advanceMonth(); assert.equal(store.mode, 'march'); assert.equal(store.state.month, 2)
})

test('inspection command mutates owned city resources', () => {
  const store = new GameStore(new MemoryStorage()); store.newGame('cao'); const before = store.state.cities.xuchang.development; const result = store.executeInspection('develop', 'xuchang'); assert.match(result, /开发/); assert.ok(store.state.cities.xuchang.development > before)
})

test('march to enemy city creates conflict and resolving it advances month', () => {
  const store = new GameStore(new MemoryStorage()); store.newGame('cao'); store.advanceMonth(); assert.equal(store.mode, 'march'); const conflict = store.planMarch('xuchang', 'luoyang'); assert.ok(conflict); assert.equal(conflict.target, 'luoyang'); store.resolveConflict(true); assert.equal(store.state.cities.luoyang.owner, 'cao'); assert.equal(store.state.month, 3); assert.equal(store.mode, 'inspection')
})

test('save can be loaded into a fresh store', () => {
  const storage = new MemoryStorage(); const first = new GameStore(storage); first.newGame('sun', 'hard'); first.advanceMonth(); const second = new GameStore(storage); assert.equal(second.load(), true); assert.equal(second.state.humanFaction, 'sun'); assert.equal(second.state.month, 2)
})
