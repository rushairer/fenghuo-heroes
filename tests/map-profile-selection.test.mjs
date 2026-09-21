import test from 'node:test'
import assert from 'node:assert/strict'
import { selectRuntimeMapProfile, runtimeMapSelectionReport } from '../src/game/map-profile-selection.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  ZH_ROM_CITY_NAME_VARIANTS,
} from '../src/game/original-data.js'

function completeEvidence(){
  const source={id:'capture-full',kind:'direct-capture',ref:'capture-full.png'}
  return {
    status:'test-complete',
    sources:[source],
    cityCoordinates:ZH_ROM_CANONICAL_CITY_SET.map((name,index)=>({
      name,x:(index*5)%320,y:(index*9)%224,space:'logical-320x224',
      sourceId:source.id,frameRef:`frame#city-${index}`,verified:true,
    })),
    villages:[{x:12,y:14,space:'logical-320x224',sourceId:source.id,frameRef:'frame#village-1',verified:true}],
    villageCoverage:{sourceId:source.id,frameRef:'frame#villages',itemCount:1,verified:true},
    ownership189:ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
      city,factionId:index===0?'liu':'neutral',
      sourceId:source.id,frameRef:`frame#owner-${index}`,verified:true,
    })),
    routes:[{from:ZH_ROM_CANONICAL_CITY_SET[0],to:ZH_ROM_CANONICAL_CITY_SET[1],sourceId:source.id,frameRef:'frame#route-1',verified:true}],
    routeNetworkCoverage:{sourceId:source.id,frameRef:'frame#routes',itemCount:1,verified:true},
    nameResolutions:ZH_ROM_CITY_NAME_VARIANTS
      .filter((item)=>item.status==='unresolved')
      .map((item,index)=>({
        ram:item.ram,numberedGuide:item.numberedGuide,chosen:item.ram,
        sourceId:source.id,frameRef:`frame#name-${index}`,verified:true,
      })),
  }
}

test('runtime selector keeps the engineering scaffold while evidence is blocked',()=>{
  const selected=selectRuntimeMapProfile()
  assert.equal(selected.profile.id,'runtime-scaffold')
  assert.equal(selected.profile.canonical,false)
  assert.equal(selected.reason,'canonical-evidence-incomplete')
})

test('runtime selector switches only when every canonical gate is open',()=>{
  const selected=selectRuntimeMapProfile(completeEvidence())
  assert.equal(selected.profile.id,'zh-rom-canonical')
  assert.equal(selected.profile.canonical,true)
  assert.equal(selected.profile.cities.length,40)
  assert.equal(selected.reason,'canonical-evidence-complete')
})

test('selection report exposes profile state without mutating the active game',()=>{
  const report=runtimeMapSelectionReport()
  assert.equal(report.canonical,false)
  assert.equal(report.cityCount,40)
  assert.equal(report.reason,'canonical-evidence-incomplete')
})
