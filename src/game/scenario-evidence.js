import { mapEvidenceSourceValid } from './map-evidence.js'
import { CITY_ECONOMY_FIELDS } from './scenario-start-state.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

const canonicalCities=new Set(ZH_ROM_CANONICAL_CITY_SET)

function sourceBacked(record,sources){
  return Boolean(
    record?.verified===true&&
    typeof record?.sourceId==='string'&&
    typeof record?.frameRef==='string'&&record.frameRef.trim()&&
    sources.some((source)=>source.id===record.sourceId&&mapEvidenceSourceValid(source))
  )
}

function completeCityState(record){
  return CITY_ECONOMY_FIELDS.every((field)=>Number.isFinite(record?.[field]))
}

export function validateScenarioStartEvidence(evidence={}){
  const year=Number(evidence.scenarioYear)
  const sources=Array.isArray(evidence.sources)?evidence.sources:[]
  const cityStates=Array.isArray(evidence.cityStates)?evidence.cityStates:[]
  const officerAssignments=Array.isArray(evidence.officerAssignments)?evidence.officerAssignments:[]

  const validSourceIds=sources.filter(mapEvidenceSourceValid).map((source)=>source.id)
  const invalidSources=sources.filter((source)=>!mapEvidenceSourceValid(source))
  const duplicateSourceIds=[...new Set(validSourceIds)]
    .filter((id)=>validSourceIds.filter((candidate)=>candidate===id).length>1)

  const verifiedCityStates=cityStates.filter((record)=>
    sourceBacked(record,sources)&&
    canonicalCities.has(normalizeZhRomCityName(record?.city))&&
    completeCityState(record)
  )
  const cityNames=verifiedCityStates.map((record)=>normalizeZhRomCityName(record.city))
  const duplicateCityStates=[...new Set(cityNames)]
    .filter((name)=>cityNames.filter((candidate)=>candidate===name).length>1)

  const verifiedOfficerAssignments=officerAssignments.filter((record)=>
    sourceBacked(record,sources)&&
    typeof record?.officer==='string'&&record.officer.trim()&&
    canonicalCities.has(normalizeZhRomCityName(record?.city))
  )
  const officerNames=verifiedOfficerAssignments.map((record)=>record.officer.trim())
  const duplicateOfficerAssignments=[...new Set(officerNames)]
    .filter((name)=>officerNames.filter((candidate)=>candidate===name).length>1)

  const cityStateCoverageVerified=Boolean(
    sourceBacked(evidence.cityStateCoverage,sources)&&
    Number.isInteger(evidence.cityStateCoverage?.itemCount)&&
    evidence.cityStateCoverage.itemCount===ZH_ROM_CANONICAL_CITY_SET.length&&
    verifiedCityStates.length===ZH_ROM_CANONICAL_CITY_SET.length&&
    duplicateCityStates.length===0
  )

  const officerCoverageVerified=Boolean(
    sourceBacked(evidence.officerCoverage,sources)&&
    Number.isInteger(evidence.officerCoverage?.itemCount)&&
    evidence.officerCoverage.itemCount>0&&
    evidence.officerCoverage.itemCount===verifiedOfficerAssignments.length&&
    duplicateOfficerAssignments.length===0
  )

  const sourceLedgerValid=invalidSources.length===0&&duplicateSourceIds.length===0
  const economyReady=sourceLedgerValid&&cityStateCoverageVerified
  const officerPlacementReady=sourceLedgerValid&&officerCoverageVerified

  return Object.freeze({
    scenarioYear:year,
    sourceLedgerValid,
    invalidSourceCount:invalidSources.length,
    duplicateSourceIds:Object.freeze(duplicateSourceIds),
    verifiedCityStates:Object.freeze([...verifiedCityStates]),
    verifiedOfficerAssignments:Object.freeze([...verifiedOfficerAssignments]),
    cityStateEvidenceCount:verifiedCityStates.length,
    officerAssignmentEvidenceCount:verifiedOfficerAssignments.length,
    duplicateCityStates:Object.freeze(duplicateCityStates),
    duplicateOfficerAssignments:Object.freeze(duplicateOfficerAssignments),
    cityStateCoverageVerified,
    officerCoverageVerified,
    economyReady,
    officerPlacementReady,
    ready:economyReady&&officerPlacementReady,
  })
}
