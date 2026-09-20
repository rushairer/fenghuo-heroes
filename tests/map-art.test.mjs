import test from 'node:test'
import assert from 'node:assert/strict'
import { forestLayout, mountainVariant } from '../src/game/map-art.js'

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
