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


test('village evidence must stay inside its declared coordinate space',()=>{
  const report=validateCanonicalMapEvidence({
    sources,
    villages:[
      {
        x:999,y:999,space:'logical-320x224',
        sourceId:'capture-001',frameRef:'frame-001#village-outside',verified:true,
      },
    ],
  })
  assert.equal(report.villageEvidenceCount,0)
})

test('name resolutions cannot choose an arbitrary third spelling',()=>{
  const report=validateCanonicalMapEvidence({
    sources,
    nameResolutions:[
      {
        ram:'薊縣',
        numberedGuide:'蘇縣',
        chosen:'薊州',
        sourceId:'capture-001',
        frameRef:'frame-001#name',
        verified:true,
      },
    ],
  })
  assert.equal(report.nameResolutionCount,0)
})


test('coverage records cannot certify an empty village or route set',()=>{
  const report=validateCanonicalMapEvidence({
    sources,
    villages:[],
    villageCoverage:{
      sourceId:'capture-001',
      frameRef:'frame-001#villages',
      itemCount:0,
      verified:true,
    },
    routes:[],
    routeNetworkCoverage:{
      sourceId:'capture-001',
      frameRef:'frame-001#routes',
      itemCount:0,
      verified:true,
    },
  })
  assert.equal(report.villageCoverageVerified,false)
  assert.equal(report.routeNetworkVerified,false)
})


test('duplicate ownership records are surfaced as canonical evidence conflicts',()=>{
  const report=validateCanonicalMapEvidence({
    sources,
    ownership189:[
      {city:'代縣',factionId:'liu',sourceId:'capture-001',frameRef:'frame#owner-1',verified:true},
      {city:'代縣',factionId:'cao',sourceId:'capture-001',frameRef:'frame#owner-2',verified:true},
    ],
  })
  assert.deepEqual(report.duplicateOwnershipCities,['代縣'])
})

test('reverse duplicate routes invalidate route-network coverage',()=>{
  const report=validateCanonicalMapEvidence({
    sources,
    routes:[
      {from:'代縣',to:'鄴',sourceId:'capture-001',frameRef:'frame#route-1',verified:true},
      {from:'鄴',to:'代縣',sourceId:'capture-001',frameRef:'frame#route-2',verified:true},
    ],
    routeNetworkCoverage:{
      sourceId:'capture-001',
      frameRef:'frame#routes',
      itemCount:2,
      verified:true,
    },
  })
  assert.deepEqual(report.duplicateRouteKeys,['代縣|鄴'])
  assert.equal(report.routeNetworkVerified,false)
})

test('duplicate village coordinates invalidate village coverage',()=>{
  const village={
    x:10,y:20,space:'logical-320x224',
    sourceId:'capture-001',frameRef:'frame#village',verified:true,
  }
  const report=validateCanonicalMapEvidence({
    sources,
    villages:[village,{...village,frameRef:'frame#village-duplicate'}],
    villageCoverage:{
      sourceId:'capture-001',
      frameRef:'frame#villages',
      itemCount:2,
      verified:true,
    },
  })
  assert.equal(report.duplicateVillageKeys.length,1)
  assert.equal(report.villageCoverageVerified,false)
})
