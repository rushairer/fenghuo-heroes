import { auditScenarioEvidenceBundle } from './scenario-evidence-audit.js'
import { validateScenarioStartEvidence } from './scenario-evidence.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

const canonicalOrder=new Map(ZH_ROM_CANONICAL_CITY_SET.map((name,index)=>[name,index]))

function byCity(a,b){
  return (canonicalOrder.get(normalizeZhRomCityName(a.city))??999)
    -(canonicalOrder.get(normalizeZhRomCityName(b.city))??999)
}

export function compileScenarioEvidenceBundle(bundle={}, {scope='full'}={}){
  if(!['economy','officers','full'].includes(scope)){
    throw new Error(`Unknown scenario evidence compile scope: ${scope}`)
  }
  const audit=auditScenarioEvidenceBundle(bundle)
  const ready=scope==='economy'
    ?audit.economyReady
    :scope==='officers'
      ?audit.officerPlacementReady
      :audit.ready
  if(!ready){
    throw new Error(`Scenario ${scope} evidence bundle is not ready: ${audit.blockers.join(', ')}`)
  }

  const report=validateScenarioStartEvidence(bundle)
  const cityStates=scope==='officers'
    ?[]
    :[...report.verifiedCityStates]
      .sort(byCity)
      .map((record)=>({
        ...record,
        city:normalizeZhRomCityName(record.city),
        verified:true,
      }))
  const officerAssignments=scope==='economy'
    ?[]
    :[...report.verifiedOfficerAssignments]
      .map((record)=>({
        ...record,
        officer:record.officer.trim(),
        city:normalizeZhRomCityName(record.city),
        verified:true,
      }))
      .sort((a,b)=>byCity(a,b)||a.officer.localeCompare(b.officer))

  const sourceIds=new Set([
    ...cityStates.map((record)=>record.sourceId),
    ...officerAssignments.map((record)=>record.sourceId),
    scope!=='officers'?bundle.cityStateCoverage?.sourceId:null,
    scope!=='economy'?bundle.officerCoverage?.sourceId:null,
  ].filter(Boolean))

  const sources=(bundle.sources??[])
    .filter((source)=>sourceIds.has(source.id))
    .map((source)=>({...source}))
    .sort((a,b)=>a.id.localeCompare(b.id))

  const status=scope==='economy'
    ?'ready-for-scenario-economy'
    :scope==='officers'
      ?'ready-for-officer-placement'
      :'ready-for-scenario-start'

  return Object.freeze({
    status,
    scope,
    scenarioYear:Number(bundle.scenarioYear),
    sources:Object.freeze(sources),
    cityStates:Object.freeze(cityStates),
    cityStateCoverage:scope==='officers'
      ?null
      :Object.freeze({
        ...bundle.cityStateCoverage,
        itemCount:cityStates.length,
        verified:true,
      }),
    officerAssignments:Object.freeze(officerAssignments),
    officerCoverage:scope==='economy'
      ?null
      :Object.freeze({
        ...bundle.officerCoverage,
        itemCount:officerAssignments.length,
        verified:true,
      }),
  })
}
