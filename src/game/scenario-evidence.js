import { mapEvidenceSourceValid } from './map-evidence.js'
import { CITY_ECONOMY_FIELDS, SCENARIO_OFFICER_ROLES } from './scenario-fields.js'
import { targetScenario } from './scenario-target.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

const canonicalCities=new Set(ZH_ROM_CANONICAL_CITY_SET)

function sourceIds(sources){
  return new Set(sources.filter(mapEvidenceSourceValid).map((source)=>source.id))
}

export function validateScenarioCityStateRecord(record,{sources=[]}={}){
  const errors=[]
  const city=normalizeZhRomCityName(record?.city)
  const validSources=sourceIds(sources)
  if(!canonicalCities.has(city))errors.push('unknown-city')
  for(const field of CITY_ECONOMY_FIELDS){
    if(!Number.isFinite(record?.[field]))errors.push(`invalid-${field}`)
  }
  if(typeof record?.sourceId!=='string'||!validSources.has(record.sourceId))errors.push('missing-source')
  if(typeof record?.frameRef!=='string'||!record.frameRef.trim())errors.push('missing-frame-ref')
  if(record?.verified!==true)errors.push('not-verified')
  return Object.freeze({
    ok:errors.length===0,
    normalizedCity:city,
    errors:Object.freeze(errors),
  })
}

export function validateScenarioOwnershipRecord(record,{sources=[]}={}){
  const errors=[]
  const city=normalizeZhRomCityName(record?.city)
  const validSources=sourceIds(sources)
  if(!canonicalCities.has(city))errors.push('unknown-city')
  if(typeof record?.factionId!=='string'||!record.factionId.trim())errors.push('missing-faction')
  if(typeof record?.sourceId!=='string'||!validSources.has(record.sourceId))errors.push('missing-source')
  if(typeof record?.frameRef!=='string'||!record.frameRef.trim())errors.push('missing-frame-ref')
  if(record?.verified!==true)errors.push('not-verified')
  return Object.freeze({
    ok:errors.length===0,
    normalizedCity:city,
    factionId:typeof record?.factionId==='string'?record.factionId.trim():'',
    errors:Object.freeze(errors),
  })
}

export function validateOfficerAssignmentRecord(record,{sources=[]}={}){
  const errors=[]
  const city=normalizeZhRomCityName(record?.city)
  const validSources=sourceIds(sources)
  if(typeof record?.officer!=='string'||!record.officer.trim())errors.push('missing-officer')
  if(!SCENARIO_OFFICER_ROLES.includes(record?.role))errors.push('invalid-role')
  if(!canonicalCities.has(city))errors.push('unknown-city')
  if(typeof record?.sourceId!=='string'||!validSources.has(record.sourceId))errors.push('missing-source')
  if(typeof record?.frameRef!=='string'||!record.frameRef.trim())errors.push('missing-frame-ref')
  if(record?.verified!==true)errors.push('not-verified')
  return Object.freeze({
    ok:errors.length===0,
    normalizedCity:city,
    officer:typeof record?.officer==='string'?record.officer.trim():'',
    role:SCENARIO_OFFICER_ROLES.includes(record?.role)?record.role:null,
    errors:Object.freeze(errors),
  })
}

function sourceBackedCoverage(record,sources){
  const validSources=sourceIds(sources)
  return Boolean(
    record?.verified===true&&
    typeof record?.sourceId==='string'&&validSources.has(record.sourceId)&&
    typeof record?.frameRef==='string'&&record.frameRef.trim()
  )
}

export function validateScenarioStartEvidence(evidence={}){
  const year=Number(evidence.scenarioYear)
  const scenarioYearValid=Boolean(targetScenario(year))
  const sources=Array.isArray(evidence.sources)?evidence.sources:[]
  const ownership=Array.isArray(evidence.ownership)?evidence.ownership:[]
  const cityStates=Array.isArray(evidence.cityStates)?evidence.cityStates:[]
  const officerAssignments=Array.isArray(evidence.officerAssignments)?evidence.officerAssignments:[]

  const validSourceIds=sources.filter(mapEvidenceSourceValid).map((source)=>source.id)
  const invalidSources=sources.filter((source)=>!mapEvidenceSourceValid(source))
  const duplicateSourceIds=[...new Set(validSourceIds)]
    .filter((id)=>validSourceIds.filter((candidate)=>candidate===id).length>1)

  const ownershipReports=ownership.map((record)=>
    validateScenarioOwnershipRecord(record,{sources})
  )
  const verifiedOwnership=ownership.filter((_,index)=>ownershipReports[index].ok)
  const ownershipCities=verifiedOwnership.map((record)=>normalizeZhRomCityName(record.city))
  const duplicateOwnershipCities=[...new Set(ownershipCities)]
    .filter((name)=>ownershipCities.filter((candidate)=>candidate===name).length>1)

  const cityStateReports=cityStates.map((record)=>
    validateScenarioCityStateRecord(record,{sources})
  )
  const verifiedCityStates=cityStates.filter((_,index)=>cityStateReports[index].ok)
  const cityNames=verifiedCityStates.map((record)=>normalizeZhRomCityName(record.city))
  const duplicateCityStates=[...new Set(cityNames)]
    .filter((name)=>cityNames.filter((candidate)=>candidate===name).length>1)

  const officerAssignmentReports=officerAssignments.map((record)=>
    validateOfficerAssignmentRecord(record,{sources})
  )
  const verifiedOfficerAssignments=officerAssignments.filter((_,index)=>
    officerAssignmentReports[index].ok
  )
  const officerNames=verifiedOfficerAssignments.map((record)=>record.officer.trim())
  const duplicateOfficerAssignments=[...new Set(officerNames)]
    .filter((name)=>officerNames.filter((candidate)=>candidate===name).length>1)

  const ownershipCoverageVerified=Boolean(
    sourceBackedCoverage(evidence.ownershipCoverage,sources)&&
    Number.isInteger(evidence.ownershipCoverage?.itemCount)&&
    evidence.ownershipCoverage.itemCount===ZH_ROM_CANONICAL_CITY_SET.length&&
    verifiedOwnership.length===ZH_ROM_CANONICAL_CITY_SET.length&&
    duplicateOwnershipCities.length===0
  )

  const cityStateCoverageVerified=Boolean(
    sourceBackedCoverage(evidence.cityStateCoverage,sources)&&
    Number.isInteger(evidence.cityStateCoverage?.itemCount)&&
    evidence.cityStateCoverage.itemCount===ZH_ROM_CANONICAL_CITY_SET.length&&
    verifiedCityStates.length===ZH_ROM_CANONICAL_CITY_SET.length&&
    duplicateCityStates.length===0
  )

  const officerCoverageVerified=Boolean(
    sourceBackedCoverage(evidence.officerCoverage,sources)&&
    Number.isInteger(evidence.officerCoverage?.itemCount)&&
    evidence.officerCoverage.itemCount>0&&
    evidence.officerCoverage.itemCount===verifiedOfficerAssignments.length&&
    duplicateOfficerAssignments.length===0
  )

  const sourceLedgerValid=invalidSources.length===0&&duplicateSourceIds.length===0
  const ownershipReady=scenarioYearValid&&sourceLedgerValid&&ownershipCoverageVerified
  const economyReady=scenarioYearValid&&sourceLedgerValid&&cityStateCoverageVerified
  const officerPlacementReady=scenarioYearValid&&sourceLedgerValid&&officerCoverageVerified

  return Object.freeze({
    scenarioYear:year,
    scenarioYearValid,
    sourceLedgerValid,
    invalidSourceCount:invalidSources.length,
    duplicateSourceIds:Object.freeze(duplicateSourceIds),
    ownershipReports:Object.freeze(ownershipReports),
    cityStateReports:Object.freeze(cityStateReports),
    officerAssignmentReports:Object.freeze(officerAssignmentReports),
    verifiedOwnership:Object.freeze([...verifiedOwnership]),
    verifiedCityStates:Object.freeze([...verifiedCityStates]),
    verifiedOfficerAssignments:Object.freeze([...verifiedOfficerAssignments]),
    ownershipEvidenceCount:verifiedOwnership.length,
    cityStateEvidenceCount:verifiedCityStates.length,
    officerAssignmentEvidenceCount:verifiedOfficerAssignments.length,
    duplicateOwnershipCities:Object.freeze(duplicateOwnershipCities),
    duplicateCityStates:Object.freeze(duplicateCityStates),
    duplicateOfficerAssignments:Object.freeze(duplicateOfficerAssignments),
    ownershipCoverageVerified,
    cityStateCoverageVerified,
    officerCoverageVerified,
    ownershipReady,
    economyReady,
    officerPlacementReady,
    ready:ownershipReady&&economyReady&&officerPlacementReady,
  })
}
