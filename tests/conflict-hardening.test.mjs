import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const storeSource=readFileSync(new URL('../src/game/store.js',import.meta.url),'utf8')
const duelSource=readFileSync(new URL('../src/scenes/duel.js',import.meta.url),'utf8')

test('retired arbitrary strategic battle multipliers cannot return',()=>{
  for(const token of ['*.68','*.3','*.84']){
    assert.equal(storeSource.includes(token),false,token)
  }
})

test('provisional duel cannot settle strategic state',()=>{
  assert.doesNotMatch(duelSource,/\.resolveConflict\(/)
  assert.match(duelSource,/app\.go\(['"]siege['"]\)/)
})
