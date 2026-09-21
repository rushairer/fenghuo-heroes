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


test('base strategy scene no longer carries rectangle-only mountain forest or city fallbacks',()=>{
  const source=read('src/scenes/strategy.js')
  for(const symbol of ['drawVectorMountain','drawVectorForest','drawVectorFort']){
    assert.match(source,new RegExp(`\\b${symbol}\\b`))
  }
  assert.doesNotMatch(source,/drawForest\(x,y\)\{const r=this\.app\.r;r\.fillRect/)
  assert.doesNotMatch(source,/drawCity\(city,x,y\).*r\.fillRect\(x-4/)
})

test('duel backdrop uses the vector arena compositor rather than block spectator rows',()=>{
  const source=read('src/scenes/duel.js')
  assert.match(source,/drawDuelArena/)
  assert.doesNotMatch(source,/for\(let x=24;x<300;x\+=20\)/)
  assert.doesNotMatch(source,/r\.fillRect\(134,93,52,38/)
})


test('base strategy info view no longer contains the retired square-dot full-map renderer',()=>{
  const source=read('src/scenes/strategy.js')
  assert.doesNotMatch(source,/r\.fillRect\(46,55,228,105,'#9a7849'\)/)
  assert.doesNotMatch(source,/r\.fillRect\(x-1\.5,y-1\.5,3,3,f\.color\)/)
})

test('active strategy and overview maps share centralized world-art river rendering',()=>{
  const strategy=read('src/scenes/strategy-info.js')
  const overview=read('src/scenes/strategy-full-map.js')
  assert.match(strategy,/drawWorldRiver/)
  assert.match(strategy,/drawRoadNetwork/)
  assert.match(overview,/drawProjectedRiver/)
  assert.doesNotMatch(strategy,/bezierCurveTo\(229\*S,48\*S/)
})


test('full-map view projects the same provisional road graph as the strategy map',()=>{
  const source=read('src/scenes/strategy-full-map.js')
  assert.match(source,/uniqueRoadPairs\(this\.mapCities\(\)\)/)
  assert.match(source,/drawRoadNetwork\(r,roadSegments/)
  assert.match(source,/drawProjectedRiver/)
})


test('strategy and full-map terrain fallbacks share deterministic grain art',()=>{
  const strategy=read('src/scenes/strategy-info.js')
  const overview=read('src/scenes/strategy-full-map.js')
  assert.match(strategy,/createTerrainGrain/)
  assert.match(strategy,/drawTerrainGrain/)
  assert.match(overview,/createTerrainGrain/)
  assert.match(overview,/drawTerrainGrain/)
})


test('strategy and full-map views share one world-space relief source',()=>{
  const strategy=read('src/scenes/strategy-info.js')
  const overview=read('src/scenes/strategy-full-map.js')
  assert.match(strategy,/WORLD_TERRAIN_RELIEF/)
  assert.match(strategy,/drawWorldTerrainRelief/)
  assert.match(overview,/WORLD_TERRAIN_RELIEF/)
  assert.match(overview,/drawProjectedTerrainRelief/)
})
