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
  if(!['ownership','economy','officers','full'].includes(scope)){
    throw new Error(`Unknown scenario evidence compile scope: ${scope}`)
  }
  const audit=auditScenarioEvidenceBundle(bundle)
  const ready=scope==='ownership'
    ?audit.ownershipReady
    :scope==='economy'
      ?audit.economyReady
      :scope==='officers'
        ?audit.officerPlacementReady
        :audit.ready
  if(!ready){
    throw new Error(`Scenario ${scope} evidence bundle is not ready: ${audit.blockers.join(', ')}`)
  }

  const report=validateScenarioStartEvidence(bundle)
  const ownership=(scope==='ownership'||scope==='full')
    ?[...report.verifiedOwnership]
      .sort(byCity)
      .map((record)=>({
        ...record,
        city:normalizeZhRomCityName(record.city),
        factionId:record.factionId.trim(),
        verified:true,
      }))
    :[]
  const cityStates=(scope==='economy'||scope==='full')
    ?[...report.verifiedCityStates]
      .sort(byCity)
      .map((record)=>({
        ...record,
        city:normalizeZhRomCityName(record.city),
        verified:true,
      }))
    :[]
  const officerAssignments=(scope==='officers'||scope==='full')
    ?[...report.verifiedOfficerAssignments]
      .map((record)=>({
        ...record,
        officer:record.officer.trim(),
        city:normalizeZhRomCityName(record.city),
        verified:true,
      }))
      .sort((a,b)=>byCity(a,b)||a.officer.localeCompare(b.officer))
    :[]

  const sourceIds=new Set([
    ...ownership.map((record)=>record.sourceId),
    ...cityStates.map((record)=>record.sourceId),
    ...officerAssignments.map((record)=>record.sourceId),
    (scope==='ownership'||scope==='full')?bundle.ownershipCoverage?.sourceId:null,
    (scope==='economy'||scope==='full')?bundle.cityStateCoverage?.sourceId:null,
    (scope==='officers'||scope==='full')?bundle.officerCoverage?.sourceId:null,
  ].filter(Boolean))

  const sources=(bundle.sources??[])
    .filter((source)=>sourceIds.has(source.id))
    .map((source)=>({...source}))
    .sort((a,b)=>a.id.localeCompare(b.id))

  const status=scope==='ownership'
    ?'ready-for-scenario-ownership'
    :scope==='economy'
      ?'ready-for-scenario-economy'
      :scope==='officers'
        ?'ready-for-officer-placement'
        :'ready-for-scenario-start'

  return Object.freeze({
    status,
    scope,
    scenarioYear:Number(bundle.scenarioYear),
    sources:Object.freeze(sources),
    ownership:Object.freeze(ownership),
    ownershipCoverage:(scope==='ownership'||scope==='full')
      ?Object.freeze({
        ...bundle.ownershipCoverage,
        itemCount:ownership.length,
        verified:true,
      })
      :null,
    cityStates:Object.freeze(cityStates),
    cityStateCoverage:(scope==='economy'||scope==='full')
      ?Object.freeze({
        ...bundle.cityStateCoverage,
        itemCount:cityStates.length,
        verified:true,
      })
      :null,
    officerAssignments:Object.freeze(officerAssignments),
    officerCoverage:(scope==='officers'||scope==='full')
      ?Object.freeze({
        ...bundle.officerCoverage,
        itemCount:officerAssignments.length,
        verified:true,
      })
      :null,
  })
}
