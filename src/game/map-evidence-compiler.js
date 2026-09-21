import { auditCanonicalEvidenceBundle } from './map-evidence-audit.js'
import { validateCanonicalMapEvidence } from './map-evidence.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

const canonicalOrder=new Map(ZH_ROM_CANONICAL_CITY_SET.map((name,index)=>[name,index]))

function byCanonicalName(a,b,key){
  return (canonicalOrder.get(normalizeZhRomCityName(a[key]))??999)
    -(canonicalOrder.get(normalizeZhRomCityName(b[key]))??999)
}

export function compileCanonicalEvidenceBundle(bundle={}){
  const audit=auditCanonicalEvidenceBundle(bundle)
  if(!audit.ready){
    throw new Error(`Canonical evidence bundle is not ready: ${audit.blockers.join(', ')}`)
  }

  const report=validateCanonicalMapEvidence(bundle)
  const cityCoordinates=[...report.verifiedCityCoordinates]
    .sort((a,b)=>byCanonicalName(a,b,'name'))
    .map((record)=>({
      ...record,
      name:normalizeZhRomCityName(record.name),
      verified:true,
    }))
  const ownership189=[...report.verifiedOwnership]
    .sort((a,b)=>byCanonicalName(a,b,'city'))
    .map((record)=>({
      ...record,
      city:normalizeZhRomCityName(record.city),
      verified:true,
    }))
  const routes=[...report.verifiedRoutes]
    .map((record)=>{
      const endpoints=[
        normalizeZhRomCityName(record.from),
        normalizeZhRomCityName(record.to),
      ].sort((a,b)=>(canonicalOrder.get(a)??999)-(canonicalOrder.get(b)??999))
      return {...record,from:endpoints[0],to:endpoints[1],verified:true}
    })
    .sort((a,b)=>{
      const byFrom=byCanonicalName(a,b,'from')
      return byFrom||byCanonicalName(a,b,'to')
    })
  const villages=[...report.verifiedVillages]
    .sort((a,b)=>a.y-b.y||a.x-b.x||String(a.frameRef).localeCompare(String(b.frameRef)))
    .map((record)=>({...record,verified:true}))
  const nameResolutions=[...report.verifiedNameResolutions]
    .sort((a,b)=>String(a.ram).localeCompare(String(b.ram)))
    .map((record)=>({...record,verified:true}))

  const referencedSourceIds=new Set([
    ...cityCoordinates.map((record)=>record.sourceId),
    ...ownership189.map((record)=>record.sourceId),
    ...routes.map((record)=>record.sourceId),
    ...villages.map((record)=>record.sourceId),
    ...nameResolutions.map((record)=>record.sourceId),
    bundle.villageCoverage?.sourceId,
    bundle.routeNetworkCoverage?.sourceId,
  ].filter(Boolean))
  const sources=(bundle.sources??[])
    .filter((source)=>referencedSourceIds.has(source.id))
    .map((source)=>({...source}))
    .sort((a,b)=>a.id.localeCompare(b.id))

  return Object.freeze({
    status:'ready-for-canonical-activation',
    sources:Object.freeze(sources),
    cityCoordinates:Object.freeze(cityCoordinates),
    villages:Object.freeze(villages),
    villageCoverage:Object.freeze({
      ...bundle.villageCoverage,
      itemCount:villages.length,
      verified:true,
    }),
    ownership189:Object.freeze(ownership189),
    routes:Object.freeze(routes),
    routeNetworkCoverage:Object.freeze({
      ...bundle.routeNetworkCoverage,
      itemCount:routes.length,
      verified:true,
    }),
    nameResolutions:Object.freeze(nameResolutions),
  })
}
