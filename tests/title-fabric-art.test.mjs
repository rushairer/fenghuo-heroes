import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TITLE_FABRIC_REGIONS,
  TITLE_FABRIC_SEAMS,
} from '../src/game/title-fabric-art.js'

test('title fabric pass covers the main robe regions without touching the full canvas',()=>{
  assert.equal(TITLE_FABRIC_REGIONS.length,4)
  assert.ok(TITLE_FABRIC_SEAMS.length>=4)
  assert.ok(TITLE_FABRIC_REGIONS.every((region)=>region.w<320&&region.h<224))
})

test('title fabric regions and seams stay inside the 320x224 composition',()=>{
  for(const region of TITLE_FABRIC_REGIONS){
    assert.ok(region.x>=0&&region.y>=0)
    assert.ok(region.x+region.w<=320)
    assert.ok(region.y+region.h<=224)
    assert.ok(region.step>0)
    assert.ok(region.alpha>0&&region.alpha<.2)
  }
  for(const seam of TITLE_FABRIC_SEAMS){
    for(const [x,y] of seam){
      assert.ok(x>=0&&x<=320)
      assert.ok(y>=0&&y<=224)
    }
  }
})
