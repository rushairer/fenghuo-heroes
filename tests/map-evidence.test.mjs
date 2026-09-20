import test from 'node:test'
import assert from 'node:assert/strict'
import {
  MAP_COORDINATE_SPACES,
  validateCanonicalMapEvidence,
  validateCityCoordinateRecord,
} from '../src/game/map-evidence.js'

const sources=[
  {id:'capture-001',kind:'direct-capture',ref:'frame-001.png'},
]

test('coordinate evidence requires canonical identity, explicit space and source',()=>{
  const report=validateCityCoordinateRecord({
    name:'代縣',
    x:120,
    y:80,
    space:MAP_COORDINATE_SPACES.logical.id,
    sourceId:'capture-001',
    frameRef:'frame-001#city-dai',
    verified:true,
  },{sources})
  assert.equal(report.ok,true)
  assert.equal(report.normalizedName,'代縣')
})

test('coordinate evidence rejects guessed or source-less values',()=>{
  const report=validateCityCoordinateRecord({
    name:'北平',
    x:120,
    y:80,
    space:'logical-320x224',
    verified:true,
  },{sources})
  assert.equal(report.ok,false)
  assert.ok(report.errors.includes('unknown-city'))
  assert.ok(report.errors.includes('missing-source'))
  assert.ok(report.errors.includes('missing-frame-ref'))
})

test('coordinate evidence rejects out-of-range coordinates',()=>{
  const report=validateCityCoordinateRecord({
    name:'成都',
    x:900,
    y:900,
    space:MAP_COORDINATE_SPACES.logical.id,
    sourceId:'capture-001',
    frameRef:'frame-001#chengdu',
    verified:true,
  },{sources})
  assert.equal(report.ok,false)
  assert.ok(report.errors.includes('coordinate-out-of-range'))
})

test('evidence summary counts only source-backed verified records',()=>{
  const report=validateCanonicalMapEvidence({
    sources,
    cityCoordinates:[
      {
        name:'代縣',x:120,y:80,space:'logical-320x224',
        sourceId:'capture-001',frameRef:'frame-001#dai',verified:true,
      },
      {
        name:'成都',x:80,y:160,space:'logical-320x224',
        sourceId:'missing',frameRef:'frame-001#chengdu',verified:true,
      },
    ],
    villages:[
      {x:1,y:2,space:'logical-320x224',sourceId:'capture-001',frameRef:'frame-001#village-1',verified:true},
      {x:3,y:4,space:'logical-320x224',sourceId:'missing',frameRef:'frame-001#village-2',verified:true},
    ],
    ownership189:[
      {city:'代縣',factionId:'liu',sourceId:'capture-001',frameRef:'frame-001#owner-dai',verified:true},
      {city:'成都',factionId:'liu',sourceId:'missing',frameRef:'frame-001#owner-chengdu',verified:true},
    ],
  })
  assert.equal(report.validCityCoordinateCount,1)
  assert.equal(report.villageEvidenceCount,1)
  assert.equal(report.ownership189EvidenceCount,1)
})
