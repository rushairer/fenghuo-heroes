import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCanonicalRuntimeMap, canonicalCityId } from '../src/game/canonical-map-profile.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  ZH_ROM_CITY_NAME_VARIANTS,
} from '../src/game/original-data.js'

function completeEvidence(){
  const source={id:'capture-full',kind:'direct-capture',ref:'capture-full.png'}
  return {
    status:'test-fixture-complete',
    sources:[source],
    cityCoordinates:ZH_ROM_CANONICAL_CITY_SET.map((name,index)=>({
      name,
      x:(index*7)%320,
      y:(index*11)%224,
      space:'logical-320x224',
      sourceId:source.id,
      frameRef:`frame#city-${index}`,
      verified:true,
    })),
    villages:[
      {
        x:12,y:14,space:'logical-320x224',
        sourceId:source.id,frameRef:'frame#village-1',verified:true,
      },
    ],
    villageCoverage:{sourceId:source.id,frameRef:'frame#villages',verified:true},
    ownership189:ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
      city,
      factionId:index===0?'liu':'neutral',
      sourceId:source.id,
      frameRef:`frame#owner-${index}`,
      verified:true,
    })),
    routes:[
      {
        from:ZH_ROM_CANONICAL_CITY_SET[0],
        to:ZH_ROM_CANONICAL_CITY_SET[1],
        sourceId:source.id,
        frameRef:'frame#route-1',
        verified:true,
      },
    ],
    routeNetworkCoverage:{sourceId:source.id,frameRef:'frame#routes',verified:true},
    nameResolutions:ZH_ROM_CITY_NAME_VARIANTS
      .filter((item)=>item.status==='unresolved')
      .map((item,index)=>({
        ram:item.ram,
        numberedGuide:item.numberedGuide,
        chosen:item.ram,
        sourceId:source.id,
        frameRef:`frame#name-${index}`,
        verified:true,
      })),
  }
}

test('canonical runtime builder refuses an incomplete evidence ledger',()=>{
  assert.throws(()=>buildCanonicalRuntimeMap({
    status:'blocked',
    sources:[],
    cityCoordinates:[],
    villages:[],
    ownership189:[],
    routes:[],
    nameResolutions:[],
  }),/migration remains blocked/)
})

test('canonical runtime builder creates stable 40-city IDs only after every gate opens',()=>{
  const profile=buildCanonicalRuntimeMap(completeEvidence())
  assert.equal(profile.canonical,true)
  assert.equal(profile.cities.length,40)
  assert.equal(profile.cities[0].id,'zh-01')
  assert.equal(profile.cities[39].id,'zh-40')
  assert.equal(canonicalCityId(ZH_ROM_CANONICAL_CITY_SET[0]),'zh-01')
  assert.equal(profile.cities[0].owner,'liu')
  assert.equal(profile.villages.length,1)
})

test('logical evidence coordinates are converted into 640x448 world coordinates',()=>{
  const evidence=completeEvidence()
  evidence.cityCoordinates[1]={...evidence.cityCoordinates[1],x:25,y:40}
  const profile=buildCanonicalRuntimeMap(evidence)
  assert.equal(profile.cities[1].x,50)
  assert.equal(profile.cities[1].y,80)
})

test('canonical routes generate a symmetric runtime neighbor graph',()=>{
  const profile=buildCanonicalRuntimeMap(completeEvidence())
  assert.deepEqual(profile.cities[0].neighbors,['zh-02'])
  assert.deepEqual(profile.cities[1].neighbors,['zh-01'])
})


test('evidence-resolved display names are preserved without changing canonical identity',()=>{
  const evidence=completeEvidence()
  const variant=ZH_ROM_CITY_NAME_VARIANTS.find((item)=>item.status==='unresolved')
  evidence.nameResolutions=evidence.nameResolutions.map((item)=>
    item.ram===variant.ram?{...item,chosen:variant.numberedGuide}:item
  )
  const profile=buildCanonicalRuntimeMap(evidence)
  const city=profile.cities.find((item)=>item.canonicalName===variant.ram)
  assert.equal(city.name,variant.numberedGuide)
  assert.equal(city.canonicalName,variant.ram)
})
