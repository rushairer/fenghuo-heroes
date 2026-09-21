import test from 'node:test'
import assert from 'node:assert/strict'
import { flagFoldGuides, flagGeometry, forestDetailGeometry, forestLayout, fortBannerDetailGeometry, fortDetailGeometry, fullMapCitySymbolGeometry, fullMapVillageSymbolGeometry, mapCursorDetailGeometry, mountainDetailGeometry, mountainVariant, villageDetailGeometry } from '../src/game/map-art.js'

test('mountain vector variants are deterministic and bounded',()=>{
  assert.deepEqual(mountainVariant(0),mountainVariant(0))
  for(let index=0;index<24;index++){
    const value=mountainVariant(index)
    assert.ok(value.mainHeight>=15&&value.mainHeight<=18)
    assert.ok(value.leftHeight>=10&&value.leftHeight<=14)
    assert.ok(value.rightHeight>=9&&value.rightHeight<=12)
    assert.ok(value.lean>=-1&&value.lean<=1)
  }
})

test('forest vector fallback keeps six trees with stable finite geometry',()=>{
  for(let index=0;index<10;index++){
    const layout=forestLayout(index)
    assert.equal(layout.length,6)
    for(const tree of layout){
      assert.ok(Number.isFinite(tree.x))
      assert.ok(Number.isFinite(tree.y))
      assert.ok(Number.isFinite(tree.size))
      assert.ok(tree.size>0)
    }
  }
})


test('vector flag geometry stays bounded and exposes alert border state',()=>{
  const normal=flagGeometry()
  const selected=flagGeometry({selected:true})
  const starving=flagGeometry({starving:true,width:20,height:20})
  assert.equal(normal.border,false)
  assert.equal(selected.border,true)
  assert.equal(starving.border,true)
  assert.ok(normal.finialRadius>0)
  assert.ok(normal.cordLength>0)
  assert.ok(normal.knotY<0)
  assert.ok(starving.flagRight>normal.flagRight)
  assert.ok(starving.poleTop<normal.poleTop)
})

test('full-map city symbol geometry scales proportionally',()=>{
  const small=fullMapCitySymbolGeometry(4)
  const large=fullMapCitySymbolGeometry(8)
  assert.equal(large.outer,small.outer*2)
  assert.equal(large.inner,small.inner*2)
  assert.equal(large.flagHeight,small.flagHeight*2)
  assert.equal(large.mastX,small.mastX*2)
  assert.equal(large.pennantWidth,small.pennantWidth*2)
  assert.equal(large.ring,small.ring*2)
  assert.equal(large.shadowRx,small.shadowRx*2)
  assert.equal(large.shadowRy,small.shadowRy*2)
  assert.equal(large.shadowY,small.shadowY*2)
})


test('full-map village symbol geometry stays compact and proportional',()=>{
  const small=fullMapVillageSymbolGeometry(3.6)
  const large=fullMapVillageSymbolGeometry(7.2)
  assert.equal(large.roof,small.roof*2)
  assert.equal(large.body,small.body*2)
  assert.equal(large.door,small.door*2)
  assert.equal(large.window,small.window*2)
  assert.equal(large.chimneyW,small.chimneyW*2)
  assert.equal(large.chimneyH,small.chimneyH*2)
  assert.equal(large.eave,small.eave*2)
  assert.equal(large.shadowRx,small.shadowRx*2)
  assert.equal(large.shadowRy,small.shadowRy*2)
  assert.equal(large.shadowY,small.shadowY*2)
  assert.ok(small.door<small.body)
})


test('fort HD detail geometry provides masonry joints and roof ridges',()=>{
  const detail=fortDetailGeometry()
  assert.ok(detail.stoneRows.length>=4)
  assert.ok(detail.verticalJoints.length>=6)
  assert.ok(detail.roofRidges.length>=3)
  assert.ok(detail.roofTiles.length>=5)
  assert.equal(detail.gateStuds.length,4)
  assert.ok(detail.gateStuds.every((stud)=>Math.abs(stud.x)<2&&stud.y>0&&stud.y<6))
  assert.ok(detail.ground.rx>detail.ground.ry)
  assert.ok(detail.ground.y>0)
  assert.ok(detail.stoneRows.every(Number.isFinite))
})

test('flag fold guides stay compact inside the logical army flag cloth',()=>{
  const folds=flagFoldGuides()
  assert.ok(folds.length>=2)
  for(const fold of folds){
    assert.ok(fold.x1>=2&&fold.x2<=12)
    assert.ok(fold.y1<0&&fold.y2<0)
  }
})


test('village HD detail exposes three distinct houses and a compact ground shadow',()=>{
  const detail=villageDetailGeometry()
  assert.equal(detail.houses.length,3)
  assert.ok(detail.ground.rx>detail.ground.ry)
  assert.ok(detail.houses.every((house)=>Number.isFinite(house.doorX)&&Number.isFinite(house.windowX)))
})

test('village house detail stays inside a compact map-symbol footprint',()=>{
  const detail=villageDetailGeometry()
  for(const house of detail.houses){
    assert.ok(house.dx-house.w*.7>=-12)
    assert.ok(house.dx+house.w*.7<=12)
    assert.ok(house.dy>=-4&&house.dy+house.h<=10)
  }
})


test('mountain HD detail adds deterministic ridges and scree',()=>{
  const detail=mountainDetailGeometry(3)
  assert.deepEqual(detail,mountainDetailGeometry(3))
  assert.equal(detail.ridgeOffsets.length,3)
  assert.equal(detail.scree.length,4)
  assert.ok(detail.ridgeOffsets.every((ridge)=>ridge.len>0))
  assert.ok(detail.scree.every((stone)=>stone.r>0))
})


test('forest HD detail adds ground depth branches and undergrowth',()=>{
  const detail=forestDetailGeometry(4)
  assert.equal(detail.branchGuides.length,4)
  assert.equal(detail.canopyHighlights.length,3)
  assert.equal(detail.undergrowth.length,4)
  assert.ok(detail.ground.rx>detail.ground.ry)
  assert.ok(detail.canopyHighlights.every((item)=>item.r>0&&Number.isFinite(item.x)&&Number.isFinite(item.y)))
  assert.ok(detail.branchGuides.every((branch)=>Number.isFinite(branch.dx)&&Number.isFinite(branch.dy)))
})


test('map cursor HD detail scales from requested cursor size',()=>{
  const small=mapCursorDetailGeometry(16,12)
  const large=mapCursorDetailGeometry(32,24)
  assert.equal(large.tick,small.tick*2)
  assert.equal(large.centerRadius,small.centerRadius*2)
  assert.equal(large.cornerGlow,small.cornerGlow*2)
  assert.equal(small.inset,2)
})


test('strategy fort banner detail keeps finial folds and knot compact',()=>{
  const detail=fortBannerDetailGeometry()
  assert.ok(detail.finialRadius>0)
  assert.equal(detail.folds.length,2)
  assert.ok(detail.poleTop<0)
  assert.ok(detail.knot.r>0)
  assert.ok(detail.folds.every((fold)=>fold.x2>fold.x1&&fold.y1<0&&fold.y2<0))
})
