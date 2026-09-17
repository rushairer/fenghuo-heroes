import test from 'node:test'
import assert from 'node:assert/strict'
import { mountainStampStyle } from '../src/game/terrain-style.js'

test('mountain stamp styles are deterministic and varied',()=>{
  const first=Array.from({length:5},(_,index)=>mountainStampStyle(index,false))
  const second=Array.from({length:5},(_,index)=>mountainStampStyle(index,false))
  assert.deepEqual(first,second)
  assert.ok(new Set(first.map((item)=>`${item.width}x${item.height}:${item.mirror}`)).size>=4)
})

test('mountain B is selected for alternate stamps only when available',()=>{
  assert.equal(mountainStampStyle(1,false).assetKey,'map.terrain.mountainA')
  assert.equal(mountainStampStyle(1,true).assetKey,'map.terrain.mountainB')
  assert.equal(mountainStampStyle(2,true).assetKey,'map.terrain.mountainA')
})

test('mountain A fallback mirrors alternate stamps when B is unavailable',()=>{
  assert.equal(mountainStampStyle(1,false).mirror,true)
  assert.equal(mountainStampStyle(3,false).mirror,true)
})
