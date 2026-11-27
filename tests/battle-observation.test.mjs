import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { battleMovementCandidate } from '../src/game/battle-observation.js'
const sample=()=>({
  sourceId:'hk-1',sourceRef:'local recording',battleRef:'battle-1',unitRef:'officer-1',kind:'field',speed:'normal',
  before:{frameRef:'t=1',width:640,height:448,mediaSeconds:1,battleDay:4,anchors:[{x:100,y:100},{x:400,y:200}],marker:{x:160,y:170}},
  after:{frameRef:'t=2',width:640,height:448,mediaSeconds:2,battleDay:4,anchors:[{x:80,y:90},{x:380,y:190}],marker:{x:156,y:168}},
})
test('relative source-pixel displacement removes stationary-landmark camera shift',()=>{
  const input=sample(),record=battleMovementCandidate({...input,verified:true})
  assert.deepEqual(record.screenDelta,{x:-4,y:-2})
  assert.deepEqual(record.landmarkShift,{x:-20,y:-10})
  assert.deepEqual(record.relativeDelta,{x:16,y:8})
  assert.equal(record.verified,false)
  assert.equal(record.coordinateSpace,'native-source-pixels')
  assert.equal(record.observedDayDelta,0)
  assert.equal(record.mediaElapsedSeconds,1)
  assert.equal('speedPerDay' in record,false)
  assert.equal(input.before.marker.x,160)
})
test('stationary marker does not appear to move when only the camera pans',()=>{
  const input=sample()
  input.after.marker={x:140,y:160}
  assert.deepEqual(battleMovementCandidate(input).relativeDelta,{x:0,y:0})
})
test('inconsistent landmarks and resolutions reject rather than invent a camera correction',()=>{
  const input=sample()
  input.after.anchors[1].x++
  assert.throws(()=>battleMovementCandidate(input),/Landmarks disagree/)
  const scaled=sample();scaled.after.width=320
  scaled.after.anchors[1].x=280
  assert.throws(()=>battleMovementCandidate(scaled),/dimensions differ/)
})
test('invalid source points, provenance, order and frame references reject',()=>{
  for(const alter of [
    x=>x.before.marker.x=-1,x=>x.before.marker.x=1.1,x=>x.before.anchors[1]=x.before.anchors[0],
    x=>x.after.mediaSeconds=1,x=>x.after.frameRef=x.before.frameRef,x=>x.after.battleDay=3,x=>x.sourceRef=' ',
  ]){
    const input=sample();alter(input);assert.throws(()=>battleMovementCandidate(input))
  }
})
test('stills preserve unknown time and day without inventing a speed',()=>{
  const input=sample()
  for(const f of [input.before,input.after]){delete f.mediaSeconds;delete f.battleDay}
  const record=battleMovementCandidate(input)
  assert.equal(record.mediaElapsedSeconds,null)
  assert.equal(record.observedDayDelta,null)
  assert.deepEqual(record.relativeDelta,{x:16,y:8})
})
test('static workbench exposes native screenshots and local video with non-verifying export',()=>{
  const html=readFileSync('public/tools/battle-movement-capture.html','utf8')
  const js=readFileSync('public/tools/battle-movement-capture.js','utf8')
  const index=readFileSync('public/tools/index.html','utf8')
  assert.match(html,/accept="video\/\*"/)
  assert.match(html,/accept="image\/\*"/)
  assert.match(js,/battleMovementCandidate/)
  assert.match(js,/video\.currentTime/)
  assert.match(index,/href="\.\/battle-movement-capture\.html"/)
  assert.doesNotMatch(js,/verified\s*:\s*true/)
})
