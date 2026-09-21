import test from 'node:test'
import assert from 'node:assert/strict'
import { createTerrainGrain } from '../src/game/terrain-art.js'

test('terrain grain is deterministic for the same seed and bounds',()=>{
  const a=createTerrainGrain({width:640,height:448,count:32,seed:123})
  const b=createTerrainGrain({width:640,height:448,count:32,seed:123})
  assert.deepEqual(a,b)
  assert.equal(a.length,32)
})

test('terrain grain stays inside declared bounds',()=>{
  const items=createTerrainGrain({width:194,height:112,count:128,seed:456})
  for(const item of items){
    assert.ok(item.x>=0&&item.x<194)
    assert.ok(item.y>=0&&item.y<112)
    assert.ok(item.size>0)
  }
})
