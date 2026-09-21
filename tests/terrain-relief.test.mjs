import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TERRAIN_RELIEF_TONES,
  createTerrainRelief,
} from '../src/game/terrain-relief.js'

test('terrain relief is deterministic for the same seed',()=>{
  const a=createTerrainRelief({width:640,height:448,count:12,seed:12345})
  const b=createTerrainRelief({width:640,height:448,count:12,seed:12345})
  assert.deepEqual(a,b)
  assert.equal(a.length,12)
})

test('terrain relief patches stay finite and use declared tone indexes',()=>{
  const items=createTerrainRelief({width:640,height:448,count:64,seed:7})
  for(const item of items){
    assert.ok(Number.isFinite(item.x)&&Number.isFinite(item.y))
    assert.ok(Number.isFinite(item.rx)&&item.rx>0)
    assert.ok(Number.isFinite(item.ry)&&item.ry>0)
    assert.ok(item.tone>=0&&item.tone<TERRAIN_RELIEF_TONES.length)
    assert.ok(item.contourCount>=2)
  }
})
