import test from 'node:test'
import assert from 'node:assert/strict'
import { battlementColumns, duelArenaDetailGeometry, duelArenaPosts, duelArmorDetailGeometry, duelFighterPose, siegeDetailGeometry, siegeTowerDetailGeometry } from '../src/game/battle-art.js'

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


test('siege HD detail geometry adds embrasures brick joints beams and dust',()=>{
  const detail=siegeDetailGeometry(290,105)
  assert.ok(detail.embrasures.length>=6)
  assert.ok(detail.brickJoints.length>=20)
  assert.equal(detail.gateBeams.length,4)
  assert.equal(detail.gateStudYs.length,3)
  assert.equal(detail.dust.length,2)
  assert.ok(detail.brickJoints.every((joint)=>joint.y2>joint.y1))
})

test('siege detail geometry scales its layout to narrower valid fortress widths',()=>{
  const wide=siegeDetailGeometry(290,105)
  const narrow=siegeDetailGeometry(180,90)
  assert.ok(narrow.embrasures.length<wide.embrasures.length)
  assert.ok(narrow.brickJoints.every((joint)=>joint.x<180))
  assert.ok(narrow.dust.every((item)=>item.x>0&&item.x<180))
  assert.ok(narrow.gateStudYs.every((value)=>value>0&&value<90))
})


test('duel arena HD detail provides beams crowd rows rope and dust depth',()=>{
  const detail=duelArenaDetailGeometry(320,152)
  assert.equal(detail.upperBeams.length,3)
  assert.equal(detail.crowdRows.length,3)
  assert.ok(detail.crowdRows.every((row)=>row.count>=10))
  assert.ok(detail.ropeY>0&&detail.ropeY<152)
  assert.equal(detail.dust.length,2)
})

test('duel arena HD detail scales horizontal placement with width',()=>{
  const wide=duelArenaDetailGeometry(320,152)
  const narrow=duelArenaDetailGeometry(240,132)
  assert.ok(narrow.upperBeams.every((beam)=>beam.x1>=0&&beam.x1<=240&&beam.x2>=0&&beam.x2<=240))
  assert.ok(narrow.dust.every((item)=>item.x>0&&item.x<240))
  assert.ok(narrow.crowdRows.every((row)=>row.y<132))
  assert.notDeepEqual(narrow.dust,wide.dust)
})


test('siege corner tower geometry stays symmetric and inside fortress width',()=>{
  const detail=siegeTowerDetailGeometry(290)
  assert.equal(detail.towers.length,2)
  assert.equal(detail.eaves.length,2)
  assert.equal(detail.towers[0].x,290-detail.towers[1].x)
  assert.ok(detail.towers.every((tower)=>tower.x>0&&tower.x<290))
})

test('siege tower geometry adapts to narrower layouts without clipping',()=>{
  const detail=siegeTowerDetailGeometry(180)
  assert.ok(detail.towers.every((tower)=>tower.x-tower.bodyW*.68>=0))
  assert.ok(detail.towers.every((tower)=>tower.x+tower.bodyW*.68<=180))
  assert.ok(detail.eaves.every((eave)=>eave.x1>=0&&eave.x2<=180))
})
