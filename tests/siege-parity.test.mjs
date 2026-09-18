import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source=readFileSync(new URL('../src/scenes/siege.js',import.meta.url),'utf8')

test('siege scene does not use the retired arbitrary instant-win formula',()=>{
  assert.doesNotMatch(source,/1\.12/)
  assert.doesNotMatch(source,/resolveConflict\(/)
})

test('siege scene does not offer a direct pre-battle duel shortcut',()=>{
  assert.doesNotMatch(source,/go\(['"]duel['"]\)/)
})
