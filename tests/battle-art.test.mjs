import test from 'node:test'
import assert from 'node:assert/strict'
import { battlementColumns, duelArenaPosts, duelArmorDetailGeometry, duelFighterPose } from '../src/game/battle-art.js'

test('siege battlements are deterministic, ordered and stay inside the wall width',()=>{
  const values=battlementColumns(274,28)
  assert.ok(values.length>=8)
  assert.deepEqual(values,battlementColumns(274,28))
  for(let index=1;index<values.length;index++)assert.ok(values[index]>values[index-1])
  assert.ok(values.every((value)=>value>0&&value<274))
})

test('duel pose changes only presentation geometry and preserves explicit facing',()=>{
  const idle=duelFighterPose()
  const guard=duelFighterPose({guard:true,flip:true})
  const attack=duelFighterPose({attacking:true})
  assert.equal(idle.bodyLean,0)
  assert.equal(guard.flip,true)
  assert.notEqual(guard.spearAngle,idle.spearAngle)
  assert.notEqual(attack.frontArm,idle.frontArm)
})


test('duel arena post layout is deterministic and stays inside the backdrop width',()=>{
  const posts=duelArenaPosts(280,20)
  assert.ok(posts.length>=10)
  assert.deepEqual(posts,duelArenaPosts(280,20))
  assert.ok(posts.every((value)=>value>0&&value<280))
})


test('duel HD armor detail geometry stays compact and deterministic',()=>{
  const detail=duelArmorDetailGeometry()
  assert.deepEqual(detail,duelArmorDetailGeometry())
  assert.equal(detail.verticalSeams.length,3)
  assert.equal(detail.helmetRivets.length,3)
  assert.ok(detail.spearBindings.length>=3)
  assert.ok(detail.face.eyeOffset>0)
  assert.ok(detail.face.eyeY<detail.face.mouthY)
})
