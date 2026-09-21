import { normalizeZhRomCityName } from './original-data.js'

const stable=(value)=>JSON.stringify(value,Object.keys(value??{}).sort())

function indexBy(records,keyOf){
  return new Map((records??[]).map((record)=>[keyOf(record),record]))
}

function diffCollection(current,candidate,keyOf){
  const a=indexBy(current,keyOf)
  const b=indexBy(candidate,keyOf)
  const added=[]
  const removed=[]
  const changed=[]

  for(const [key,record] of b){
    if(!a.has(key)){added.push({key,record});continue}
    const before=a.get(key)
    if(stable(before)!==stable(record))changed.push({key,before,after:record})
  }
  for(const [key,record] of a){
    if(!b.has(key))removed.push({key,record})
  }
  return Object.freeze({
    added:Object.freeze(added),
    removed:Object.freeze(removed),
    changed:Object.freeze(changed),
  })
}

const coordinateKey=(record)=>normalizeZhRomCityName(record?.name)
const ownershipKey=(record)=>normalizeZhRomCityName(record?.city)
const routeKey=(record)=>[
  normalizeZhRomCityName(record?.from),
  normalizeZhRomCityName(record?.to),
].sort().join('|')
const villageKey=(record)=>`${record?.space??''}:${record?.x??''}:${record?.y??''}`
const resolutionKey=(record)=>`${record?.ram??''}|${record?.numberedGuide??''}`
const sourceKey=(record)=>String(record?.id??'')

export function diffCanonicalEvidence(current={},candidate={}){
  const sources=diffCollection(current.sources,candidate.sources,sourceKey)
  const cityCoordinates=diffCollection(current.cityCoordinates,candidate.cityCoordinates,coordinateKey)
  const ownership189=diffCollection(current.ownership189,candidate.ownership189,ownershipKey)
  const routes=diffCollection(current.routes,candidate.routes,routeKey)
  const villages=diffCollection(current.villages,candidate.villages,villageKey)
  const nameResolutions=diffCollection(current.nameResolutions,candidate.nameResolutions,resolutionKey)

  const coverageChanges=[]
  for(const field of ['villageCoverage','routeNetworkCoverage']){
    const before=current?.[field]??null
    const after=candidate?.[field]??null
    if(stable(before)!==stable(after))coverageChanges.push({field,before,after})
  }

  const collections={sources,cityCoordinates,ownership189,routes,villages,nameResolutions}
  const totals=Object.values(collections).reduce((sum,item)=>({
    added:sum.added+item.added.length,
    removed:sum.removed+item.removed.length,
    changed:sum.changed+item.changed.length,
  }),{added:0,removed:0,changed:0})

  return Object.freeze({
    statusChanged:(current.status??null)!==(candidate.status??null),
    status:Object.freeze({before:current.status??null,after:candidate.status??null}),
    collections:Object.freeze(collections),
    coverageChanges:Object.freeze(coverageChanges),
    totals:Object.freeze({
      ...totals,
      coverageChanged:coverageChanges.length,
    }),
  })
}
