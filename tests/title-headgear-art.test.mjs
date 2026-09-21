import test from 'node:test'
import assert from 'node:assert/strict'
import { TITLE_HEADGEAR_DETAILS } from '../src/game/title-headgear-art.js'

test('title headgear detail covers four distinct visible headgear groups',()=>{
  assert.equal(TITLE_HEADGEAR_DETAILS.length,4)
  assert.deepEqual(
    TITLE_HEADGEAR_DETAILS.map((item)=>item.id),
    ['rear-general','center-wrap','upper-right','front-right'],
  )
})

test('title headgear detail stays inside the 320x224 logical composition',()=>{
  for(const item of TITLE_HEADGEAR_DETAILS){
    for(const points of [item.trim,...item.ribbons]){
      for(const [x,y] of points){
        assert.ok(x>=0&&x<=320)
        assert.ok(y>=0&&y<=224)
      }
    }
    assert.ok(item.studs.length>=3)
    assert.ok(item.studs.every(([x,y])=>x>=0&&x<=320&&y>=0&&y<=224))
  }
})
