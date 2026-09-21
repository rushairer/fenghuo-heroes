import test from 'node:test'
import assert from 'node:assert/strict'
import {
  captureEvidenceBundle,
  normalizeCaptureBundleForEditing,
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

test('capture rejects points outside or exactly on the exclusive source-frame edge',()=>{
  for(const [imageX,imageY] of [[1281,10],[1280,10],[10,896]]){
    assert.throws(()=>capturePoint({
      imageX,imageY,imageWidth:1280,imageHeight:896,
    }),/outside the source image/)
  }
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


test('capture workbench candidates can be wrapped directly as a merge-ready evidence bundle',()=>{
  const city=cityEvidenceCandidate({
    name:'代縣',imageX:400,imageY:200,imageWidth:1280,imageHeight:896,
    sourceId:'capture-001',frameRef:'capture-001#frame-10',
  })
  const village=villageEvidenceCandidate({
    imageX:300,imageY:300,imageWidth:1280,imageHeight:896,
    sourceId:'capture-001',frameRef:'capture-001#frame-10',
  })
  const bundle=captureEvidenceBundle({
    source:{id:'capture-001',kind:'direct-capture',ref:'frame-10.png'},
    cityCoordinates:[city],
    villages:[village],
  })
  assert.equal(bundle.status,'capture-in-progress')
  assert.equal(bundle.sources.length,1)
  assert.equal(bundle.cityCoordinates.length,1)
  assert.equal(bundle.villages.length,1)
  assert.equal(bundle.cityCoordinates[0].verified,false)
  assert.equal(bundle.villageCoverage,null)
  assert.deepEqual(bundle.ownership189,[])
  assert.deepEqual(bundle.routes,[])
})


test('capture bundles can be normalized back into an editable single-source session',()=>{
  const bundle=captureEvidenceBundle({
    source:{id:'capture-001',kind:'direct-capture',ref:'frame.png'},
    cityCoordinates:[{
      name:'代縣',x:10,y:20,space:'logical-320x224',
      sourceId:'capture-001',frameRef:'frame#city',verified:true,
    }],
    villages:[{
      x:12,y:22,space:'logical-320x224',
      sourceId:'capture-001',frameRef:'frame#village',verified:true,
    }],
  })
  const editable=normalizeCaptureBundleForEditing(bundle)
  assert.equal(editable.source.id,'capture-001')
  assert.equal(editable.cityCoordinates.length,1)
  assert.equal(editable.villages.length,1)
  assert.equal(editable.cityCoordinates[0].verified,false)
  assert.equal(editable.villages[0].verified,false)
})

test('capture workbench import refuses multi-source or cross-source candidate bundles',()=>{
  assert.throws(
    ()=>normalizeCaptureBundleForEditing({
      sources:[
        {id:'a',kind:'direct-capture',ref:'a.png'},
        {id:'b',kind:'direct-capture',ref:'b.png'},
      ],
    }),
    /exactly one source/,
  )
  assert.throws(
    ()=>normalizeCaptureBundleForEditing({
      sources:[{id:'a',kind:'direct-capture',ref:'a.png'}],
      cityCoordinates:[{
        name:'代縣',x:1,y:2,space:'logical-320x224',
        sourceId:'b',frameRef:'b#city',verified:false,
      }],
    }),
    /another source/,
  )
})
