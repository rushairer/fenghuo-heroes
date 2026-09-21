import { CITY_ECONOMY_FIELDS } from './scenario-fields.js'
import { validateScenarioStartEvidence } from './scenario-evidence.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

const unique=(values)=>[...new Set(values)]

export function auditScenarioEvidenceBundle(bundle={}){
  const report=validateScenarioStartEvidence(bundle)
  const verifiedOwnershipCities=new Set(
    report.verifiedOwnership.map((record)=>normalizeZhRomCityName(record.city)),
  )
  const verifiedCities=new Set(
    report.verifiedCityStates.map((record)=>normalizeZhRomCityName(record.city)),
  )

  const invalidOwnership=(bundle.ownership??[])
    .map((record,index)=>({record,index,result:report.ownershipReports[index]}))
    .filter(({record,result})=>{
      const entered=
        Boolean(record?.factionId)||Boolean(record?.sourceId)||
        Boolean(record?.frameRef)||record?.verified===true
      return entered&&result&&!result.ok
    })
    .map(({record,index,result})=>Object.freeze({
      index,
      city:record?.city??'',
      factionId:record?.factionId??'',
      errors:result.errors,
    }))

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
  if(!report.scenarioYearValid)blockers.push('unknown-scenario')
  if(report.invalidSourceCount)blockers.push('invalid-sources')
  if(report.duplicateSourceIds.length)blockers.push('duplicate-source-ids')
  if(report.duplicateOwnershipCities.length)blockers.push('duplicate-ownership')
  if(report.duplicateCityStates.length)blockers.push('duplicate-city-states')
  if(report.duplicateOfficerAssignments.length)blockers.push('duplicate-officer-assignments')
  if(!report.ownershipCoverageVerified)blockers.push('ownership-coverage-unverified')
  if(!report.cityStateCoverageVerified)blockers.push('city-state-coverage-unverified')
  if(!report.officerCoverageVerified)blockers.push('officer-placement-coverage-unverified')

  return Object.freeze({
    ready:report.ready,
    scenarioYear:report.scenarioYear,
    scenarioYearValid:report.scenarioYearValid,
    status:bundle.status??'unknown',
    sourceLedgerValid:report.sourceLedgerValid,
    ownershipReady:report.ownershipReady,
    economyReady:report.economyReady,
    officerPlacementReady:report.officerPlacementReady,
    blockers:Object.freeze(unique(blockers)),
    missingOwnership:Object.freeze(
      ZH_ROM_CANONICAL_CITY_SET.filter((city)=>!verifiedOwnershipCities.has(city)),
    ),
    missingCityStates:Object.freeze(
      ZH_ROM_CANONICAL_CITY_SET.filter((city)=>!verifiedCities.has(city)),
    ),
    invalidOwnership:Object.freeze(invalidOwnership),
    invalidCityStates:Object.freeze(invalidCityStates),
    invalidOfficerAssignments:Object.freeze(invalidOfficerAssignments),
    duplicateSourceIds:report.duplicateSourceIds,
    duplicateOwnershipCities:report.duplicateOwnershipCities,
    duplicateCityStates:report.duplicateCityStates,
    duplicateOfficerAssignments:report.duplicateOfficerAssignments,
    verified:Object.freeze({
      ownership:report.ownershipEvidenceCount,
      cityStates:report.cityStateEvidenceCount,
      officerAssignments:report.officerAssignmentEvidenceCount,
    }),
    coverage:Object.freeze({
      ownership:report.ownershipCoverageVerified,
      cityStates:report.cityStateCoverageVerified,
      officerAssignments:report.officerCoverageVerified,
    }),
  })
}
