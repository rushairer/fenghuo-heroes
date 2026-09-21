import { mapEvidenceSourceValid } from './map-evidence.js'

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
    throw new Error(
      'March evidence merge conflict for '+label+' field '+key+': '+JSON.stringify(a)+' != '+JSON.stringify(b),
    )
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
      byId.set(
        source.id,
        previous?mergeRecord(previous,source,'source:'+source.id):{...source},
      )
    }
  }
  return [...byId.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id)))
}

function recordKey(record,kind){
  const sourceId=String(record?.sourceId??'').trim()
  const frameRef=String(record?.frameRef??'').trim()
  if(kind==='adjacency')return sourceId+'|'+frameRef+'|'+String(record?.targetKind??'')
  return sourceId+'|'+frameRef
}

function mergeRecordArray(bundles,field,kind=field){
  const byKey=new Map()
  for(const bundle of bundles){
    for(const record of bundle?.[field]??[]){
      const key=recordKey(record,kind)
      if(key==='|')continue
      const previous=byKey.get(key)
      byKey.set(
        key,
        previous?mergeRecord(previous,record,kind+':'+key):{...record},
      )
    }
  }
  return [...byKey.entries()]
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([,record])=>record)
}

export function mergeMarchEvidenceBundles(...bundles){
  const inputs=bundles.filter(Boolean)
  if(inputs.length===0)throw new Error('March evidence merge requires at least one bundle.')
  const sources=mergeSources(inputs)
  const invalidSources=sources.filter((source)=>!mapEvidenceSourceValid(source))
  if(invalidSources.length){
    throw new Error('March evidence merge contains invalid source metadata.')
  }
  return {
    status:inputs.some((bundle)=>String(bundle?.status??'').startsWith('ready'))
      ?'capture-in-progress'
      :(inputs.find((bundle)=>bundle?.status)?.status??'capture-in-progress'),
    sources,
    routeSteps:mergeRecordArray(inputs,'routeSteps','route-step'),
    movementWindows:mergeRecordArray(inputs,'movementWindows','movement-window'),
    monthlyExecutionWindows:mergeRecordArray(inputs,'monthlyExecutionWindows','month-window'),
    adjacencyChecks:mergeRecordArray(inputs,'adjacencyChecks','adjacency'),
    starvationObservations:mergeRecordArray(inputs,'starvationObservations','starvation'),
  }
}
