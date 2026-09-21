import {
  ZH_ROM_CANONICAL_CITY_SET,
  ZH_ROM_CITY_NAME_VARIANTS,
} from './original-data.js'

export function createCanonicalEvidenceTemplate({
  status='capture-in-progress',
}={}){
  return {
    status,
    sources:[],
    cityCoordinates:ZH_ROM_CANONICAL_CITY_SET.map((name)=>({
      name,
      x:null,
      y:null,
      space:'logical-320x224',
      sourceId:'',
      frameRef:'',
      verified:false,
    })),
    villages:[],
    villageCoverage:{
      sourceId:'',
      frameRef:'',
      itemCount:null,
      verified:false,
    },
    ownership189:ZH_ROM_CANONICAL_CITY_SET.map((city)=>({
      city,
      factionId:'',
      sourceId:'',
      frameRef:'',
      verified:false,
    })),
    routes:[],
    routeNetworkCoverage:{
      sourceId:'',
      frameRef:'',
      itemCount:null,
      verified:false,
    },
    nameResolutions:ZH_ROM_CITY_NAME_VARIANTS
      .filter((item)=>item.status==='unresolved')
      .map((item)=>({
        ram:item.ram,
        numberedGuide:item.numberedGuide,
        chosen:'',
        sourceId:'',
        frameRef:'',
        verified:false,
      })),
  }
}

export function templateProgress(template=createCanonicalEvidenceTemplate()){
  const coordinates=template.cityCoordinates??[]
  const ownership=template.ownership189??[]
  const resolutions=template.nameResolutions??[]
  return Object.freeze({
    cityCoordinateSlots:coordinates.length,
    cityCoordinatesEntered:coordinates.filter((item)=>Number.isFinite(item.x)&&Number.isFinite(item.y)).length,
    ownershipSlots:ownership.length,
    ownershipEntered:ownership.filter((item)=>typeof item.factionId==='string'&&item.factionId.trim()).length,
    nameResolutionSlots:resolutions.length,
    nameResolutionsEntered:resolutions.filter((item)=>typeof item.chosen==='string'&&item.chosen.trim()).length,
    villageCount:(template.villages??[]).length,
    routeCount:(template.routes??[]).length,
  })
}
