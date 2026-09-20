import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

test('strategy map fallbacks use the scalable map-art layer',()=>{
  const source=read('src/scenes/strategy-info.js')
  for(const symbol of ['drawVectorMountain','drawVectorForest','drawVectorFort']){
    assert.match(source,new RegExp(`\\b${symbol}\\b`))
  }
  assert.doesNotMatch(source,/const trees=\[\[-5,1,4\]/)
  assert.doesNotMatch(source,/c\.fillRect\(-8\*S,-2\*S,16\*S,7\*S\)/)
})

test('duel scene uses vector fighter artwork instead of the legacy rectangle fighter method',()=>{
  const source=read('src/scenes/duel.js')
  assert.match(source,/drawDuelFighter/)
  assert.doesNotMatch(source,/\bfighter\(x,y,color,flip\)/)
  assert.doesNotMatch(source,/c\.fillRect\(-8\*r\.S,-27\*r\.S,16\*r\.S,25\*r\.S\)/)
})

test('siege scene uses vector fortress artwork instead of repeated block towers',()=>{
  const source=read('src/scenes/siege.js')
  assert.match(source,/drawSiegeFortress/)
  assert.doesNotMatch(source,/for\(let x=40;x<290;x\+=36\)/)
  assert.doesNotMatch(source,/r\.fillRect\(115,91,90,62/)
})

test('deep visual QA synthetic state remains explicitly marked as fixture data',()=>{
  const source=read('src/game/qa-fixtures.js')
  assert.match(source,/qaFixture:true/)
  assert.match(source,/pendingConflict=/)
})
