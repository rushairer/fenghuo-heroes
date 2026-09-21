import {
  ZH_ROM_CANONICAL_CITY_SET,
  ZH_ROM_CITY_NAME_VARIANTS,
} from '../../src/game/original-data.js'

export function completeCanonicalMapEvidence(){
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
    villageCoverage:{
      sourceId:source.id,
      frameRef:'frame#villages',
      itemCount:1,
      verified:true,
    },
    ownership189:ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
      city,
      factionId:index===0?'liu':index===1?'cao':'neutral',
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
    routeNetworkCoverage:{
      sourceId:source.id,
      frameRef:'frame#routes',
      itemCount:1,
      verified:true,
    },
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
