import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeMarchEvidenceBundles } from '../src/game/march-evidence-merge.js'

const sourceA={id:'march-a',kind:'direct-capture',ref:'a.mp4'}
const sourceB={id:'march-b',kind:'direct-capture',ref:'b.mp4'}

const route=(source,frame,toX=14)=>({
  fromX:10,fromY:10,toX,toY:10,space:'logical-320x224',
  sourceId:source.id,frameRef:frame,verified:false,
})

test('merge combines observations from independent source batches',()=>{
  const merged=mergeMarchEvidenceBundles(
    {status:'capture-in-progress',sources:[sourceA],routeSteps:[route(sourceA,'a#route')]},
    {status:'capture-in-progress',sources:[sourceB],movementWindows:[{
      stepsMoved:5,calendarDaysElapsed:5,sourceId:sourceB.id,frameRef:'b#movement',verified:false,
    }]},
  )
  assert.deepEqual(merged.sources.map((source)=>source.id),['march-a','march-b'])
  assert.equal(merged.routeSteps.length,1)
  assert.equal(merged.movementWindows.length,1)
})

test('merge deduplicates identical observations for the same source and frame',()=>{
  const a={status:'capture-in-progress',sources:[sourceA],routeSteps:[route(sourceA,'a#route')]}
  const b={status:'capture-in-progress',sources:[sourceA],routeSteps:[route(sourceA,'a#route')]}
  const merged=mergeMarchEvidenceBundles(a,b)
  assert.equal(merged.sources.length,1)
  assert.equal(merged.routeSteps.length,1)
})

test('merge promotes verification only when substantive observation fields agree',()=>{
  const a={status:'capture-in-progress',sources:[sourceA],routeSteps:[route(sourceA,'a#route')]}
  const b={status:'capture-in-progress',sources:[sourceA],routeSteps:[{...route(sourceA,'a#route'),verified:true}]}
  const merged=mergeMarchEvidenceBundles(a,b)
  assert.equal(merged.routeSteps[0].verified,true)
})

test('merge rejects contradictory observations for one source frame and type',()=>{
  const a={status:'capture-in-progress',sources:[sourceA],routeSteps:[route(sourceA,'a#route',14)]}
  const b={status:'capture-in-progress',sources:[sourceA],routeSteps:[route(sourceA,'a#route',15)]}
  assert.throws(()=>mergeMarchEvidenceBundles(a,b),/merge conflict/)
})

test('adjacency observations may share a frame when target kinds differ',()=>{
  const base={sourceId:sourceA.id,frameRef:'a#adj',gridDistance:1,commandAvailable:true,verified:false}
  const merged=mergeMarchEvidenceBundles({
    status:'capture-in-progress',
    sources:[sourceA],
    adjacencyChecks:[
      {...base,targetKind:'army'},
      {...base,targetKind:'city'},
    ],
  })
  assert.equal(merged.adjacencyChecks.length,2)
})

test('adjacency conflict is detected within the same target kind and frame',()=>{
  const a={
    status:'capture-in-progress',sources:[sourceA],
    adjacencyChecks:[{targetKind:'army',gridDistance:1,commandAvailable:true,sourceId:sourceA.id,frameRef:'a#adj',verified:false}],
  }
  const b={
    status:'capture-in-progress',sources:[sourceA],
    adjacencyChecks:[{targetKind:'army',gridDistance:2,commandAvailable:true,sourceId:sourceA.id,frameRef:'a#adj',verified:false}],
  }
  assert.throws(()=>mergeMarchEvidenceBundles(a,b),/merge conflict/)
})

test('merge rejects conflicting metadata for one source ID',()=>{
  assert.throws(()=>mergeMarchEvidenceBundles(
    {sources:[sourceA]},
    {sources:[{...sourceA,ref:'other.mp4'}]},
  ),/source:march-a/)
})

test('compiled-like ready status is downgraded back to capture-in-progress',()=>{
  const merged=mergeMarchEvidenceBundles({status:'ready-for-runtime-calibration',sources:[sourceA]})
  assert.equal(merged.status,'capture-in-progress')
})
