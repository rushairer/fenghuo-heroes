import test from 'node:test'
import assert from 'node:assert/strict'
import { flagFoldGuides, flagGeometry, forestLayout, fortDetailGeometry, fullMapCitySymbolGeometry, fullMapVillageSymbolGeometry, mountainVariant } from '../src/game/map-art.js'

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
  assert.ok(starving.flagRight>normal.flagRight)
  assert.ok(starving.poleTop<normal.poleTop)
})

test('full-map city symbol geometry scales proportionally',()=>{
  const small=fullMapCitySymbolGeometry(4)
  const large=fullMapCitySymbolGeometry(8)
  assert.equal(large.outer,small.outer*2)
  assert.equal(large.inner,small.inner*2)
  assert.equal(large.flagHeight,small.flagHeight*2)
})


test('full-map village symbol geometry stays compact and proportional',()=>{
  const small=fullMapVillageSymbolGeometry(3.6)
  const large=fullMapVillageSymbolGeometry(7.2)
  assert.equal(large.roof,small.roof*2)
  assert.equal(large.body,small.body*2)
  assert.equal(large.door,small.door*2)
  assert.ok(small.door<small.body)
})


test('fort HD detail geometry provides masonry joints and roof ridges',()=>{
  const detail=fortDetailGeometry()
  assert.ok(detail.stoneRows.length>=4)
  assert.ok(detail.verticalJoints.length>=6)
  assert.ok(detail.roofRidges.length>=3)
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
