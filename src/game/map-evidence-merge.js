import { createCanonicalEvidenceTemplate } from './map-evidence-template.js'
import { normalizeZhRomCityName } from './original-data.js'

const blank=(value)=>value==null||value===''

function mergeRecord(left={},right={},label='record'){
  const keys=new Set([...Object.keys(left),...Object.keys(right)])
  const merged={}
  for(const key of keys){
    if(key==='verified'){
      merged.verified=left.verified===true||right.verified===true
      continue
    }
    const a=left[key],b=right[key]
    if(blank(a)){merged[key]=b;continue}
    if(blank(b)){merged[key]=a;continue}
    if(Object.is(a,b)){merged[key]=a;continue}
    throw new Error(`Evidence merge conflict for ${label} field ${key}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`)
  }
  if(!('verified' in merged))merged.verified=false
  return merged
}

function mergeSources(bundles){
  const byId=new Map()
  for(const bundle of bundles){
    for(const source of bundle?.sources??[]){
      if(!source?.id)continue
      const previous=byId.get(source.id)
      byId.set(source.id,previous?mergeRecord(previous,source,`source:${source.id}`):{...source})
    }
  }
  return [...byId.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id)))
}

function mergeNamedSlots(templateRows,bundles,field,arrayName){
  const byName=new Map(templateRows.map((row)=>[normalizeZhRomCityName(row[field]),{...row}]))
  for(const bundle of bundles){
    for(const record of bundle?.[arrayName]??[]){
      const identity=normalizeZhRomCityName(record?.[field])
      if(!identity)continue
      const previous=byName.get(identity)
      byName.set(identity,previous?mergeRecord(previous,record,`${arrayName}:${identity}`):{...record,[field]:identity})
    }
  }
  return [...byName.values()]
}

function routeKey(record){
  return [normalizeZhRomCityName(record?.from),normalizeZhRomCityName(record?.to)].sort().join('|')
}

function mergeRoutes(bundles){
  const byKey=new Map()
  for(const bundle of bundles){
    for(const record of bundle?.routes??[]){
      const key=routeKey(record)
      if(!key||key==='|')continue
      const normalized={...record}
      const endpoints=[normalizeZhRomCityName(record.from),normalizeZhRomCityName(record.to)].sort()
      normalized.from=endpoints[0]
      normalized.to=endpoints[1]
      const previous=byKey.get(key)
      byKey.set(key,previous?mergeRecord(previous,normalized,`route:${key}`):normalized)
    }
  }
  return [...byKey.values()]
}

function villageKey(record){
  if(record?.sourceId&&record?.frameRef)return `${record.sourceId}|${record.frameRef}`
  return `${record?.space??''}|${record?.x??''}|${record?.y??''}`
}

function mergeVillages(bundles){
  const byKey=new Map()
  for(const bundle of bundles){
    for(const record of bundle?.villages??[]){
      const key=villageKey(record)
      const previous=byKey.get(key)
      byKey.set(key,previous?mergeRecord(previous,record,`village:${key}`):{...record})
    }
  }
  return [...byKey.values()]
}

function resolutionKey(record){
  return `${record?.ram??''}|${record?.numberedGuide??''}`
}

function mergeResolutions(templateRows,bundles){
  const byKey=new Map(templateRows.map((row)=>[resolutionKey(row),{...row}]))
  for(const bundle of bundles){
    for(const record of bundle?.nameResolutions??[]){
      const key=resolutionKey(record)
      const previous=byKey.get(key)
      byKey.set(key,previous?mergeRecord(previous,record,`nameResolution:${key}`):{...record})
    }
  }
  return [...byKey.values()]
}

function mergeCoverage(field,bundles){
  let merged=null
  for(const bundle of bundles){
    const record=bundle?.[field]
    if(!record)continue
    merged=merged?mergeRecord(merged,record,field):{...record}
  }
  return merged
}

export function mergeCanonicalEvidenceBundles(...bundles){
  const template=createCanonicalEvidenceTemplate()
  const inputs=bundles.filter(Boolean)
  return {
    status:inputs.some((bundle)=>bundle.status==='ready-for-canonical-activation')
      ?'capture-in-progress'
      :(inputs.find((bundle)=>bundle.status)?.status??template.status),
    sources:mergeSources(inputs),
    cityCoordinates:mergeNamedSlots(template.cityCoordinates,inputs,'name','cityCoordinates'),
    villages:mergeVillages(inputs),
    villageCoverage:mergeCoverage('villageCoverage',inputs)??template.villageCoverage,
    ownership189:mergeNamedSlots(template.ownership189,inputs,'city','ownership189'),
    routes:mergeRoutes(inputs),
    routeNetworkCoverage:mergeCoverage('routeNetworkCoverage',inputs)??template.routeNetworkCoverage,
    nameResolutions:mergeResolutions(template.nameResolutions,inputs),
  }
}
