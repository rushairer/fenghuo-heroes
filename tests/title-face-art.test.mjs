import test from 'node:test'
import assert from 'node:assert/strict'
import { TITLE_FACE_FEATURES } from '../src/game/title-face-art.js'

test('title face structure covers all visible foreground and midground faces',()=>{
  assert.ok(TITLE_FACE_FEATURES.length>=4)
  assert.deepEqual(
    TITLE_FACE_FEATURES.map((item)=>item.id),
    ['left-profile','center','upper-right','front-right'],
  )
})

test('title facial detail stays inside the logical 320x224 composition',()=>{
  for(const face of TITLE_FACE_FEATURES){
    for(const points of [face.brow,face.nose,face.highlight]){
      for(const [x,y] of points){
        assert.ok(x>=0&&x<=320)
        assert.ok(y>=0&&y<=224)
      }
    }
    assert.ok(face.cheek.x-face.cheek.rx>=0)
    assert.ok(face.cheek.x+face.cheek.rx<=320)
    assert.ok(face.cheek.y-face.cheek.ry>=0)
    assert.ok(face.cheek.y+face.cheek.ry<=224)
  }
})
