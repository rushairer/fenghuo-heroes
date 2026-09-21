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


test('full-map frame is drawn after relief so terrain shading cannot wash out the border',()=>{
  const source=read('src/scenes/strategy-full-map.js')
  const relief=source.indexOf('drawProjectedTerrainRelief(r,WORLD_TERRAIN_RELIEF')
  const frame=source.indexOf("r.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h,'#2d1b0e',1)")
  const river=source.indexOf('this.drawFullMapRiver(bounds)')
  assert.ok(relief>=0&&frame>relief&&river>frame)
})


test('presentation-only terrain relief is confined to raster fallback branches',()=>{
  const strategy=read('src/scenes/strategy-info.js')
  const overview=read('src/scenes/strategy-full-map.js')
  assert.match(strategy,/if\(!sand\|\|!r\.drawImageTiled[\s\S]*drawTerrainGrain[\s\S]*drawWorldTerrainRelief[\s\S]*\}\n\n    this\.drawRiver/)
  assert.match(overview,/if\(!sand\|\|!r\.drawImageTiled[\s\S]*drawTerrainGrain[\s\S]*drawProjectedTerrainRelief[\s\S]*\}\n    r\.strokeRect/)
})


test('HD map fallback keeps natural-feature and symbol micro-detail layers',()=>{
  const source=read('src/game/map-art.js')
  for(const symbol of [
    'mountainDetailGeometry',
    'forestDetailGeometry',
    'fortDetailGeometry',
    'villageDetailGeometry',
    'mapCursorDetailGeometry',
  ]){
    assert.ok(source.includes(symbol),symbol)
  }
  assert.match(source,/pennantWidth/)
  assert.match(source,/chimneyH/)
})

test('HD battle fallback keeps arena and fortress structural detail layers',()=>{
  const source=read('src/game/battle-art.js')
  for(const symbol of [
    'duelArmorDetailGeometry',
    'duelArenaDetailGeometry',
    'siegeDetailGeometry',
    'siegeTowerDetailGeometry',
  ]){
    assert.ok(source.includes(symbol),symbol)
  }
})


test('full-map legend uses the same compact city and village symbol renderers as the map',()=>{
  const source=read('src/scenes/strategy-full-map.js')
  assert.match(source,/drawFullMapCitySymbol\(r,244,89/)
  assert.match(source,/drawFullMapVillageSymbol\(r,244,111/)
  assert.doesNotMatch(source,/drawVectorFort\(r,244/)
  assert.doesNotMatch(source,/drawVectorVillage\(r,244/)
})


test('siege scene renders faction-colored confrontation standards after fortress art',()=>{
  const source=read('src/scenes/siege.js')
  assert.match(source,/drawSiegeStandards/)
  const fortress=source.indexOf('drawSiegeFortress(r')
  const standards=source.indexOf('drawSiegeStandards(r')
  assert.ok(fortress>=0&&standards>fortress)
})

test('duel and siege art retain their second-pass ornament helpers',()=>{
  const source=read('src/game/battle-art.js')
  assert.ok(source.includes('duelFighterOrnamentGeometry'))
  assert.ok(source.includes('duelArenaOrnamentGeometry'))
  assert.ok(source.includes('siegeStandardGeometry'))
})


test('full-map city village and cursor symbols are clipped to map bounds',()=>{
  const source=read('src/scenes/strategy-full-map.js')
  const clip=source.indexOf('c.rect(bounds.x*S,bounds.y*S,bounds.w*S,bounds.h*S)')
  const city=source.indexOf('drawFullMapCitySymbol(r,point.x,point.y')
  const village=source.indexOf('drawFullMapVillageSymbol(r,point.x,point.y')
  const cursor=source.indexOf('drawMapCursor(r,cursor.x,cursor.y')
  const restore=source.indexOf('c.restore()',cursor)
  assert.ok(clip>=0&&city>clip&&village>city&&cursor>village&&restore>cursor)
})
