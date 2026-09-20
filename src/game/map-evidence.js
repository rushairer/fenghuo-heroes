import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

export const MAP_COORDINATE_SPACES=Object.freeze({
  logical:Object.freeze({id:'logical-320x224',width:320,height:224}),
  world:Object.freeze({id:'world-640x448',width:640,height:448}),
})

export function mapEvidenceSourceValid(source){
  return Boolean(
    source&&
    typeof source.id==='string'&&source.id.trim()&&
    typeof source.kind==='string'&&source.kind.trim()&&
    typeof source.ref==='string'&&source.ref.trim()
  )
}

export function validateCityCoordinateRecord(record,{sources=[]}={}){
  const errors=[]
  const canonical=new Set(ZH_ROM_CANONICAL_CITY_SET)
  const normalized=normalizeZhRomCityName(record?.name)
  const sourceIds=new Set(sources.filter(mapEvidenceSourceValid).map((source)=>source.id))
  const space=Object.values(MAP_COORDINATE_SPACES).find((item)=>item.id===record?.space)

  if(!canonical.has(normalized))errors.push('unknown-city')
  if(!Number.isFinite(record?.x)||!Number.isFinite(record?.y))errors.push('invalid-coordinate')
  if(!space)errors.push('unknown-coordinate-space')
  if(space&&Number.isFinite(record?.x)&&Number.isFinite(record?.y)){
    if(record.x<0||record.x>space.width||record.y<0||record.y>space.height)errors.push('coordinate-out-of-range')
  }
  if(typeof record?.sourceId!=='string'||!sourceIds.has(record.sourceId))errors.push('missing-source')
  if(record?.verified!==true)errors.push('not-verified')
  if(typeof record?.frameRef!=='string'||!record.frameRef.trim())errors.push('missing-frame-ref')

  return Object.freeze({
    ok:errors.length===0,
    normalizedName:normalized,
    errors:Object.freeze(errors),
  })
}

function sourceBackedVerification(record,sources){
  return Boolean(
    record?.verified===true&&
    typeof record?.sourceId==='string'&&
    typeof record?.frameRef==='string'&&record.frameRef.trim()&&
    sources.some((source)=>source.id===record.sourceId&&mapEvidenceSourceValid(source))
  )
}

export function validateCanonicalMapEvidence(evidence={}){
  const sources=Array.isArray(evidence.sources)?evidence.sources:[]
  const cityCoordinates=Array.isArray(evidence.cityCoordinates)?evidence.cityCoordinates:[]
  const villages=Array.isArray(evidence.villages)?evidence.villages:[]
  const ownership189=Array.isArray(evidence.ownership189)?evidence.ownership189:[]
  const nameResolutions=Array.isArray(evidence.nameResolutions)?evidence.nameResolutions:[]
  const routes=Array.isArray(evidence.routes)?evidence.routes:[]

  const invalidSources=sources.filter((source)=>!mapEvidenceSourceValid(source))
  const coordinateReports=cityCoordinates.map((record)=>validateCityCoordinateRecord(record,{sources}))
  const validCoordinates=cityCoordinates.filter((_,index)=>coordinateReports[index].ok)
  const uniqueCoordinateNames=new Set(validCoordinates.map((record)=>normalizeZhRomCityName(record.name)))

  const duplicateCoordinateNames=[...uniqueCoordinateNames].filter((name)=>
    validCoordinates.filter((record)=>normalizeZhRomCityName(record.name)===name).length>1
  )

  const canonical=new Set(ZH_ROM_CANONICAL_CITY_SET)
  const verifiedVillages=villages.filter((record)=>
    sourceBackedVerification(record,sources)&&
    Number.isFinite(record?.x)&&
    Number.isFinite(record?.y)&&
    Object.values(MAP_COORDINATE_SPACES).some((space)=>space.id===record?.space)
  )

  const verifiedOwnership=ownership189.filter((record)=>
    sourceBackedVerification(record,sources)&&
    canonical.has(normalizeZhRomCityName(record?.city))&&
    typeof record?.factionId==='string'&&record.factionId.trim()
  )

  const verifiedRoutes=routes.filter((record)=>
    sourceBackedVerification(record,sources)&&
    canonical.has(normalizeZhRomCityName(record?.from))&&
    canonical.has(normalizeZhRomCityName(record?.to))&&
    normalizeZhRomCityName(record?.from)!==normalizeZhRomCityName(record?.to)
  )

  const verifiedNameResolutions=nameResolutions.filter((record)=>
    sourceBackedVerification(record,sources)&&
    typeof record?.ram==='string'&&
    typeof record?.numberedGuide==='string'&&
    typeof record?.chosen==='string'&&record.chosen.trim()
  )

  const villageCoverageVerified=sourceBackedVerification(evidence.villageCoverage,sources)
  const routeNetworkVerified=sourceBackedVerification(evidence.routeNetworkCoverage,sources)

  return Object.freeze({
    sourceCount:sources.length,
    invalidSourceCount:invalidSources.length,
    coordinateReports:Object.freeze(coordinateReports),
    validCityCoordinateCount:uniqueCoordinateNames.size,
    duplicateCoordinateNames:Object.freeze(duplicateCoordinateNames),
    villageEvidenceCount:verifiedVillages.length,
    ownership189EvidenceCount:new Set(verifiedOwnership.map((record)=>normalizeZhRomCityName(record.city))).size,
    routeEvidenceCount:verifiedRoutes.length,
    nameResolutionCount:verifiedNameResolutions.length,
    villageCoverageVerified,
    routeNetworkVerified,
  })
}
