import test from 'node:test'
import assert from 'node:assert/strict'
import {
  capturePoint,
  captureScale,
  cityEvidenceCandidate,
  sourceEvidenceCandidate,
  villageEvidenceCandidate,
} from '../src/game/map-evidence-capture.js'

test('capture scaling maps arbitrary screenshot dimensions into logical map space',()=>{
  const scale=captureScale({imageWidth:1280,imageHeight:896,targetSpace:'logical-320x224'})
  assert.equal(scale.scaleX,.25)
  assert.equal(scale.scaleY,.25)
})

test('capture points are deterministic and preserve hundredth-pixel evidence precision',()=>{
  const point=capturePoint({
    imageX:401,
    imageY:203,
    imageWidth:1280,
    imageHeight:896,
    targetSpace:'logical-320x224',
  })
  assert.deepEqual(point,{x:100.25,y:50.75,space:'logical-320x224'})
})

test('capture rejects points outside the source frame',()=>{
  assert.throws(()=>capturePoint({
    imageX:1281,imageY:10,imageWidth:1280,imageHeight:896,
  }),/outside the source image/)
})

test('new coordinate candidates remain unverified until human review',()=>{
  const city=cityEvidenceCandidate({
    name:'代縣',imageX:400,imageY:200,imageWidth:1280,imageHeight:896,
    sourceId:'capture-001',frameRef:'capture-001#frame-10',
  })
  const village=villageEvidenceCandidate({
    imageX:300,imageY:300,imageWidth:1280,imageHeight:896,
    sourceId:'capture-001',frameRef:'capture-001#frame-10',
  })
  assert.equal(city.verified,false)
  assert.equal(village.verified,false)
  assert.equal(city.name,'代縣')
})

test('source candidates normalize capture metadata without inventing verification',()=>{
  assert.deepEqual(sourceEvidenceCandidate({
    id:' cap-1 ',ref:' frame.png ',note:' 189 map ',
  }),{
    id:'cap-1',kind:'direct-capture',ref:'frame.png',note:'189 map',
  })
})
