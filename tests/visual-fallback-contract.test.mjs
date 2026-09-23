import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

test('active strategy map uses target-specific scalable natural and fort layers',()=>{
  const source=read('src/scenes/strategy-info.js')
  for(const symbol of ['drawTargetMountainMass','drawTargetHillCluster','drawTargetInspectionFort']){
    assert.match(source,new RegExp(`\\b${symbol}\\b`))
  }
  assert.doesNotMatch(source,/drawVectorForest/)
  assert.doesNotMatch(source,/drawVectorFort/)
  assert.doesNotMatch(source,/const trees=\[\[-5,1,4\]/)
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
  assert.doesNotMatch(strategy,/drawRoadNetwork/)
  assert.doesNotMatch(strategy,/uniqueRoadPairs/)
  assert.match(overview,/drawProjectedRiver/)
  assert.doesNotMatch(strategy,/bezierCurveTo\(229\*S,48\*S/)
})


test('full-map view keeps provisional adjacency graph invisible',()=>{
  const source=read('src/scenes/strategy-full-map.js')
  assert.doesNotMatch(source,/uniqueRoadPairs/)
  assert.doesNotMatch(source,/drawRoadNetwork/)
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


test('terrain relief is always part of the vector strategy surface',()=>{
  const strategy=read('src/scenes/strategy-info.js')
  const overview=read('src/scenes/strategy-full-map.js')
  assert.match(strategy,/drawTerrainGrain[\s\S]*drawWorldTerrainRelief[\s\S]*drawTerrainEtching/)
  assert.match(overview,/drawTerrainGrain[\s\S]*drawTerrainEtching[\s\S]*drawProjectedTerrainRelief/)
  assert.doesNotMatch(strategy,/drawImageTiled/)
  assert.doesNotMatch(overview,/drawImageTiled/)
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
  const cursor=source.indexOf('drawTargetMapCursor(r,cursor.x,cursor.y')
  const restore=source.indexOf('c.restore()',cursor)
  assert.ok(clip>=0&&city>clip&&village>city&&cursor>village&&restore>cursor)
})


test('duel scene renders motion cues from existing attack and guard state',()=>{
  const source=read('src/scenes/duel.js')
  assert.match(source,/drawDuelMotionCue/)
  assert.match(source,/attacking:this\.attackCd>160/)
  assert.match(source,/guard:this\.guard/)
  assert.match(source,/attacking:this\.enemyCd>500/)
})


test('siege foreground depth stays between fortress and confrontation standards',()=>{
  const source=read('src/scenes/siege.js')
  const fortress=source.indexOf('drawSiegeFortress(r')
  const ground=source.indexOf('drawSiegeForegroundDepth(r')
  const standards=source.indexOf('drawSiegeStandards(r')
  assert.ok(fortress>=0&&ground>fortress&&standards>ground)
})


test('strategy and full-map rivers share the layered river stroke helper',()=>{
  const world=read('src/game/world-art.js')
  assert.match(world,/riverStrokeStyle/)
  assert.match(world,/bankOuterWidth/)
  assert.match(world,/bankInnerWidth/)
  assert.match(world,/waterWidth/)
  assert.match(world,/highlightWidth/)
  assert.match(world,/drawWorldRiver/)
  assert.match(world,/drawProjectedRiver/)
})


test('full-map compact symbols retain proportional ground-shadow geometry',()=>{
  const source=read('src/game/map-art.js')
  assert.match(source,/fullMapCitySymbolGeometry[\s\S]*shadowRx:s\*\.72/)
  assert.match(source,/fullMapVillageSymbolGeometry[\s\S]*shadowRx:s\*\.7/)
  assert.match(source,/c\.ellipse\(0,g\.shadowY\*S,g\.shadowRx\*S,g\.shadowRy\*S/)
})


test('duel hit feedback is localized to the struck fighter without changing combat formulas',()=>{
  const source=read('src/scenes/duel.js')
  assert.match(source,/drawDuelHitSpark/)
  assert.match(source,/this\.hitSide='player'/)
  assert.match(source,/this\.hitSide='enemy'/)
  assert.match(source,/x:this\.hitSide==='player'\?this\.px:this\.ex/)
})


test('siege fortress retains inner gate-depth geometry',()=>{
  const source=read('src/game/battle-art.js')
  assert.ok(source.includes('siegeGateDepthGeometry'))
  assert.match(source,/innerHalf/)
  assert.match(source,/plankXs/)
  assert.match(source,/thresholdY/)
})


test('strategy map presentation keeps fort grounding flag finials and forest canopy highlights',()=>{
  const source=read('src/game/map-art.js')
  assert.match(source,/fortDetailGeometry[\s\S]*ground:Object\.freeze/)
  assert.match(source,/flagGeometry[\s\S]*finialRadius/)
  assert.match(source,/flagGeometry[\s\S]*cordLength/)
  assert.match(source,/forestDetailGeometry[\s\S]*canopyHighlights/)
})


test('localized duel hit spark is drawn above the screen flash and stale hit side is cleared',()=>{
  const source=read('src/scenes/duel.js')
  const flash=source.indexOf("if(this.hitFlash>0){c.save();c.globalAlpha")
  const spark=source.indexOf("if(this.hitFlash>0&&this.hitSide)")
  assert.ok(flash>=0&&spark>flash)
  assert.match(source,/if\(this\.hitFlash===0\)this\.hitSide=null/)
})


test('duel proximity cue is presentation-only and derives from existing fighter positions',()=>{
  const source=read('src/scenes/duel.js')
  assert.match(source,/drawDuelSpacingCue/)
  assert.match(source,/leftX:this\.px,rightX:this\.ex/)
  assert.doesNotMatch(source,/duelSpacingCueGeometry.*damage/)
})


test('siege wall weathering remains a deterministic presentation layer',()=>{
  const source=read('src/game/battle-art.js')
  assert.ok(source.includes('siegeWeatheringGeometry'))
  assert.match(source,/weather\.stains/)
  assert.match(source,/weather\.cracks/)
})


test('river shoreline accent is layered as a visible ring between outer and inner banks',()=>{
  const source=read('src/game/world-art.js')
  const worldStart=source.indexOf('export function drawWorldRiver')
  const worldEnd=source.indexOf('export function drawProjectedRiver')
  const block=source.slice(worldStart,worldEnd)
  const outer=block.indexOf("c.strokeStyle='#6f5837'")
  const shore=block.indexOf("c.strokeStyle='#d0a66b'")
  const inner=block.indexOf("c.strokeStyle='#183d79'")
  const scallops=block.indexOf('drawRiverEdgeScallops')
  const water=block.indexOf('c.strokeStyle=waterColor')
  assert.ok(outer>=0&&shore>outer&&inner>shore&&scallops>inner&&water>scallops)
})


test('duel weapon contact cue reads only existing spacing and attack presentation state',()=>{
  const source=read('src/scenes/duel.js')
  assert.match(source,/drawDuelWeaponContact/)
  assert.match(source,/leftX:this\.px/)
  assert.match(source,/rightX:this\.ex/)
  assert.match(source,/playerAttacking:this\.attackCd>160/)
  assert.match(source,/enemyAttacking:this\.enemyCd>500/)
})


test('siege corner towers retain window beam and brace material detail',()=>{
  const source=read('src/game/battle-art.js')
  assert.ok(source.includes('siegeTowerMaterialGeometry'))
  assert.match(source,/towerMaterial\.towers/)
  assert.match(source,/towerMaterial\.braces/)
})


test('strategy and full-map rivers share deterministic surface micro-reflections',()=>{
  const source=read('src/game/world-art.js')
  assert.match(source,/riverSurfaceMarks/)
  const world=source.slice(source.indexOf('export function drawWorldRiver'),source.indexOf('export function drawProjectedRiver'))
  const projected=source.slice(source.indexOf('export function drawProjectedRiver'),source.indexOf('export function roadSegmentStyle'))
  assert.match(world,/drawRiverSurfaceMarks/)
  assert.match(projected,/drawRiverSurfaceMarks/)
})


test('strategy fort banner retains finial fold and knot micro-detail',()=>{
  const source=read('src/game/map-art.js')
  assert.ok(source.includes('fortBannerDetailGeometry'))
  assert.match(source,/banner\.finialRadius/)
  assert.match(source,/banner\.folds/)
  assert.match(source,/banner\.knot/)
})


test('inspection root uses the target-parity map-first composition',()=>{
  const source=read('src/scenes/strategy-info.js')
  assert.match(source,/TARGET_STRATEGY_CALIBRATION/)
  assert.match(source,/calibration\.view\.height/)
  assert.match(source,/calibration\.view\.scale/)
  assert.ok(source.includes("return this.stage==='survey'&&this.view==='map'"))
  assert.ok(source.includes("r.text('視察情況'"))
  assert.ok(source.includes('if(this.isTargetParityInspection())return'))
  assert.match(source,/drawTargetMapCursor\(r,cursor\.x,cursor\.y\)/)
  assert.doesNotMatch(source,/drawRoadNetwork/)
  assert.doesNotMatch(source,/uniqueRoadPairs/)
})

test('inspection parity view uses continuous procedural ground and a dominant local river',()=>{
  const source=read('src/scenes/strategy-info.js')
  assert.doesNotMatch(source,/drawImageTiled/)
  assert.match(source,/calibration\.river\.inspectionWidth/)
  assert.match(source,/calibration\.river\.standardWidth/)
  assert.match(source,/drawTargetMountainMass\(this\.app\.r,x,y,index,scale\)/)
})


test('target inspection map uses dedicated earth-language vector symbols instead of mixed raster families',()=>{
  const source=read('src/scenes/strategy-info.js')
  assert.match(source,/drawTargetHillCluster/)
  assert.match(source,/drawTargetInspectionFort/)
  assert.match(source,/drawTargetMapCursor/)
  assert.match(source,/drawTargetMountainMass/)
})


test('target inspection zoom is presentation-only and projects every local landmark through one helper',()=>{
  const source=read('src/scenes/strategy-info.js')
  assert.match(source,/function projectToView\(point,camera,viewScale=1\)/)
  assert.match(source,/cameraForView\(state\.cursor,viewHeight,viewScale\)/)
  assert.match(source,/drawWorldTerrainRelief\(r,this\.mapRelief,\{camera,viewWidth:MAP_VIEW_W,viewHeight,viewScale\}\)/)
  assert.match(source,/drawWorldRiver\(this\.app\.r,\{camera,widthScale,viewScale\}\)/)
  assert.doesNotMatch(source,/setCursor\([^\n]*TARGET_STRATEGY_CALIBRATION/)
})


test('all strategy states share target villages flags terrain and cursor language',()=>{
  const source=read('src/scenes/strategy-info.js')
  assert.match(source,/drawTargetArmyFlag/)
  assert.match(source,/drawTerrainEtching/)
  assert.match(source,/calibration\.village\.inspectionScale/)
  assert.match(source,/calibration\.village\.standardScale/)
  assert.match(source,/drawTargetMapCursor/)
  assert.doesNotMatch(source,/drawMapCursor/)
  assert.doesNotMatch(source,/drawVectorFlag/)
  assert.doesNotMatch(source,/drawVectorForest/)
  assert.doesNotMatch(source,/drawVectorFort/)
  assert.doesNotMatch(source,/drawInspectionPlaque[\s\S]*getNineSlice/)
  assert.match(source,/r\.text\('視察情況'/)
})


test('full-map presentation shares the target earth-language vector palette',()=>{
  const source=read('src/scenes/strategy-full-map.js')
  assert.match(source,/TARGET_INSPECTION_PALETTE/)
  assert.match(source,/drawTerrainEtching/)
  assert.match(source,/drawTargetMapCursor/)
  assert.match(source,/drawFullMapVillageSymbol\(r,point\.x,point\.y,3\.6,TARGET_INSPECTION_PALETTE\)/)
  assert.match(source,/drawTargetMountainMass\(r,244,137,0,\.62\)/)
  assert.doesNotMatch(source,/drawMapCursor\(/)
  assert.doesNotMatch(source,/getForDisplay\(['`"]map\./)
})


test('river edge irregularity is shared by local and overview rendering',()=>{
  const source=read('src/game/world-art.js')
  assert.match(source,/riverEdgeScallops/)
  const world=source.slice(source.indexOf('export function drawWorldRiver'),source.indexOf('export function drawProjectedRiver'))
  const projected=source.slice(source.indexOf('export function drawProjectedRiver'),source.indexOf('export function roadSegmentStyle'))
  assert.match(world,/drawRiverEdgeScallops/)
  assert.match(projected,/drawRiverEdgeScallops/)
})


test('target fort no longer delegates to generic rectangular fort art',()=>{
  const source=read('src/game/map-art.js')
  const start=source.indexOf('export function drawTargetInspectionFort')
  const end=source.indexOf('export function drawTargetMapCursor',start)
  const block=source.slice(start,end)
  assert.match(source,/targetFortGeometry/)
  assert.doesNotMatch(block,/drawVectorFort/)
  assert.match(block,/p\.flag/)
  assert.match(block,/p\.flagHighlight/)
  assert.match(block,/factionColor/)
})

test('target map cursor is a pure four-corner bracket silhouette',()=>{
  const source=read('src/game/map-art.js')
  const start=source.indexOf('export function drawTargetMapCursor')
  const end=source.indexOf('export function drawTargetArmyFlag',start)
  const block=source.slice(start,end)
  assert.match(block,/corners=\[\[-1,-1\],\[1,-1\],\[-1,1\],\[1,1\]\]/)
  assert.doesNotMatch(block,/strokeRect/)
})
