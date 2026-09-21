import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeCanonicalEvidenceBundles } from '../src/game/map-evidence-merge.js'
import { createCanonicalEvidenceTemplate } from '../src/game/map-evidence-template.js'

test('merge combines partial city and ownership batches without losing canonical slots',()=>{
  const a=createCanonicalEvidenceTemplate()
  const b=createCanonicalEvidenceTemplate()
  a.cityCoordinates[0]={
    ...a.cityCoordinates[0],
    x:10,y:20,sourceId:'cap-a',frameRef:'cap-a#1',verified:true,
  }
  b.ownership189[0]={
    ...b.ownership189[0],
    factionId:'liu',sourceId:'cap-b',frameRef:'cap-b#1',verified:true,
  }
  a.sources=[{id:'cap-a',kind:'direct-capture',ref:'a.png'}]
  b.sources=[{id:'cap-b',kind:'direct-capture',ref:'b.png'}]

  const merged=mergeCanonicalEvidenceBundles(a,b)
  assert.equal(merged.cityCoordinates.length,40)
  assert.equal(merged.ownership189.length,40)
  assert.equal(merged.cityCoordinates[0].x,10)
  assert.equal(merged.ownership189[0].factionId,'liu')
  assert.equal(merged.sources.length,2)
})

test('merge promotes verified when substantive evidence fields agree',()=>{
  const a=createCanonicalEvidenceTemplate()
  const b=createCanonicalEvidenceTemplate()
  a.cityCoordinates[0]={
    ...a.cityCoordinates[0],
    x:10,y:20,sourceId:'cap',frameRef:'cap#1',verified:false,
  }
  b.cityCoordinates[0]={
    ...b.cityCoordinates[0],
    x:10,y:20,sourceId:'cap',frameRef:'cap#1',verified:true,
  }
  const merged=mergeCanonicalEvidenceBundles(a,b)
  assert.equal(merged.cityCoordinates[0].verified,true)
})

test('merge rejects contradictory coordinates for the same canonical city',()=>{
  const a=createCanonicalEvidenceTemplate()
  const b=createCanonicalEvidenceTemplate()
  a.cityCoordinates[0]={...a.cityCoordinates[0],x:10,y:20}
  b.cityCoordinates[0]={...b.cityCoordinates[0],x:11,y:20}
  assert.throws(
    ()=>mergeCanonicalEvidenceBundles(a,b),
    /Evidence merge conflict/,
  )
})

test('route merge normalizes reverse endpoint order and rejects conflicting metadata',()=>{
  const a={routes:[{from:'代縣',to:'鄴',sourceId:'cap',frameRef:'cap#1',verified:true}]}
  const b={routes:[{from:'鄴',to:'代縣',sourceId:'cap',frameRef:'cap#1',verified:true}]}
  const merged=mergeCanonicalEvidenceBundles(a,b)
  assert.equal(merged.routes.length,1)
  assert.equal(merged.routes[0].from,'代縣')
  assert.equal(merged.routes[0].to,'鄴')

  const c={routes:[{from:'代縣',to:'鄴',sourceId:'other',frameRef:'other#1',verified:true}]}
  assert.throws(()=>mergeCanonicalEvidenceBundles(a,c),/Evidence merge conflict/)
})

test('merge never keeps ready status merely because one input was compiled',()=>{
  const merged=mergeCanonicalEvidenceBundles({
    status:'ready-for-canonical-activation',
  })
  assert.equal(merged.status,'capture-in-progress')
})


test('first real coordinate may replace the template coordinate-space hint',()=>{
  const bundle=createCanonicalEvidenceTemplate()
  bundle.cityCoordinates[0]={
    ...bundle.cityCoordinates[0],
    x:200,
    y:120,
    space:'world-640x448',
    sourceId:'cap-world',
    frameRef:'cap-world#city-1',
    verified:true,
  }
  const merged=mergeCanonicalEvidenceBundles(bundle)
  assert.equal(merged.cityCoordinates[0].space,'world-640x448')
  assert.equal(merged.cityCoordinates[0].x,200)
})


test('merge normalizes known Chinese-ROM city-name variants before comparing identity',()=>{
  const bundle=createCanonicalEvidenceTemplate()
  const index=bundle.cityCoordinates.findIndex((item)=>item.name==='薊縣')
  bundle.cityCoordinates[index]={
    name:'蘇縣',
    x:120,
    y:80,
    space:'logical-320x224',
    sourceId:'cap-variant',
    frameRef:'cap-variant#city',
    verified:true,
  }
  const merged=mergeCanonicalEvidenceBundles(bundle)
  const record=merged.cityCoordinates.find((item)=>item.name==='薊縣')
  assert.equal(record.x,120)
  assert.equal(record.sourceId,'cap-variant')
})
