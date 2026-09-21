import { CITY_ECONOMY_FIELDS } from './scenario-start-state.js'
import { validateScenarioStartEvidence } from './scenario-evidence.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

const unique=(values)=>[...new Set(values)]

export function auditScenarioEvidenceBundle(bundle={}){
  const report=validateScenarioStartEvidence(bundle)
  const verifiedCities=new Set(
    report.verifiedCityStates.map((record)=>normalizeZhRomCityName(record.city)),
  )

  const invalidCityStates=(bundle.cityStates??[])
    .map((record,index)=>({record,index,result:report.cityStateReports[index]}))
    .filter(({record,result})=>{
      const entered=
        CITY_ECONOMY_FIELDS.some((field)=>record?.[field]!==null&&record?.[field]!==undefined)||
        Boolean(record?.sourceId)||Boolean(record?.frameRef)||record?.verified===true
      return entered&&result&&!result.ok
    })
    .map(({record,index,result})=>Object.freeze({
      index,
      city:record?.city??'',
      errors:result.errors,
    }))

  const invalidOfficerAssignments=(bundle.officerAssignments??[])
    .map((record,index)=>({record,index,result:report.officerAssignmentReports[index]}))
    .filter(({result})=>result&&!result.ok)
    .map(({record,index,result})=>Object.freeze({
      index,
      officer:record?.officer??'',
      city:record?.city??'',
      errors:result.errors,
    }))

  const blockers=[]
  if(report.invalidSourceCount)blockers.push('invalid-sources')
  if(report.duplicateSourceIds.length)blockers.push('duplicate-source-ids')
  if(report.duplicateCityStates.length)blockers.push('duplicate-city-states')
  if(report.duplicateOfficerAssignments.length)blockers.push('duplicate-officer-assignments')
  if(!report.cityStateCoverageVerified)blockers.push('city-state-coverage-unverified')
  if(!report.officerCoverageVerified)blockers.push('officer-placement-coverage-unverified')

  return Object.freeze({
    ready:report.ready,
    scenarioYear:report.scenarioYear,
    status:bundle.status??'unknown',
    sourceLedgerValid:report.sourceLedgerValid,
    economyReady:report.economyReady,
    officerPlacementReady:report.officerPlacementReady,
    blockers:Object.freeze(unique(blockers)),
    missingCityStates:Object.freeze(
      ZH_ROM_CANONICAL_CITY_SET.filter((city)=>!verifiedCities.has(city)),
    ),
    invalidCityStates:Object.freeze(invalidCityStates),
    invalidOfficerAssignments:Object.freeze(invalidOfficerAssignments),
    duplicateSourceIds:report.duplicateSourceIds,
    duplicateCityStates:report.duplicateCityStates,
    duplicateOfficerAssignments:report.duplicateOfficerAssignments,
    verified:Object.freeze({
      cityStates:report.cityStateEvidenceCount,
      officerAssignments:report.officerAssignmentEvidenceCount,
    }),
    coverage:Object.freeze({
      cityStates:report.cityStateCoverageVerified,
      officerAssignments:report.officerCoverageVerified,
    }),
  })
}
