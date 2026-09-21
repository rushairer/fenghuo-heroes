import { normalizeZhRomCityName } from './original-data.js'
import { createScenarioEvidenceTemplate } from './scenario-evidence-template.js'

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
      `Scenario evidence merge conflict for ${label} field ${key}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`,
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
        previous?mergeRecord(previous,source,`source:${source.id}`):{...source},
      )
    }
  }
  return [...byId.values()].sort((a,b)=>String(a.id).localeCompare(String(b.id)))
}

function mergeCitySlots(templateRows,bundles,arrayName){
  const byCity=new Map(templateRows.map((row)=>[
    normalizeZhRomCityName(row.city),
    {...row},
  ]))
  const touched=new Set()

  for(const bundle of bundles){
    for(const record of bundle?.[arrayName]??[]){
      const city=normalizeZhRomCityName(record?.city)
      if(!city)continue
      const normalized={...record,city}
      const previous=byCity.get(city)
      let base=previous
      if(previous&&!touched.has(city)){
        base={...previous}
        for(const [key,value] of Object.entries(normalized)){
          if(key==='city'||key==='verified'||blank(value))continue
          base[key]=null
        }
      }
      byCity.set(
        city,
        base?mergeRecord(base,normalized,`${arrayName}:${city}`):normalized,
      )
      touched.add(city)
    }
  }
  return [...byCity.values()]
}

function mergeOfficers(bundles){
  const byOfficer=new Map()
  for(const bundle of bundles){
    for(const record of bundle?.officerAssignments??[]){
      const officer=String(record?.officer??'').trim()
      if(!officer)continue
      const normalized={
        ...record,
        officer,
        city:normalizeZhRomCityName(record?.city),
      }
      const previous=byOfficer.get(officer)
      byOfficer.set(
        officer,
        previous?mergeRecord(previous,normalized,`officer:${officer}`):normalized,
      )
    }
  }
  return [...byOfficer.values()].sort((a,b)=>a.officer.localeCompare(b.officer))
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

function scenarioYearFor(bundles){
  const years=[...new Set(
    bundles
      .map((bundle)=>Number(bundle?.scenarioYear))
      .filter((year)=>Number.isFinite(year)),
  )]
  if(years.length!==1){
    throw new Error('Scenario evidence merge requires exactly one scenario year.')
  }
  return years[0]
}

export function mergeScenarioEvidenceBundles(...bundles){
  const inputs=bundles.filter(Boolean)
  const year=scenarioYearFor(inputs)
  const template=createScenarioEvidenceTemplate(year)
  return {
    status:inputs.some((bundle)=>String(bundle?.status??'').startsWith('ready-for-'))
      ?'capture-in-progress'
      :(inputs.find((bundle)=>bundle.status)?.status??template.status),
    scenarioYear:year,
    sources:mergeSources(inputs),
    ownership:mergeCitySlots(template.ownership,inputs,'ownership'),
    ownershipCoverage:mergeCoverage('ownershipCoverage',inputs)??template.ownershipCoverage,
    cityStates:mergeCitySlots(template.cityStates,inputs,'cityStates'),
    cityStateCoverage:mergeCoverage('cityStateCoverage',inputs)??template.cityStateCoverage,
    officerAssignments:mergeOfficers(inputs),
    officerCoverage:mergeCoverage('officerCoverage',inputs)??template.officerCoverage,
  }
}
