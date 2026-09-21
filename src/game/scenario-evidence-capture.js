import { sourceEvidenceCandidate } from './map-evidence-capture.js'
import { normalizeZhRomCityName } from './original-data.js'
import { CITY_ECONOMY_FIELDS, SCENARIO_OFFICER_ROLES } from './scenario-fields.js'
import { targetScenario } from './scenario-target.js'

const normalizedText=(value)=>String(value??'').trim()

function candidateBase({sourceId,frameRef}={}){
  return {
    sourceId:normalizedText(sourceId),
    frameRef:normalizedText(frameRef),
    verified:false,
  }
}

function numericCandidate(value){
  if(value===''||value==null)return null
  const number=Number(value)
  return Number.isFinite(number)?number:null
}

export function scenarioOwnershipCandidate({
  city,
  factionId,
  sourceId,
  frameRef,
}={}){
  return Object.freeze({
    city:normalizeZhRomCityName(city),
    factionId:normalizedText(factionId),
    ...candidateBase({sourceId,frameRef}),
  })
}

export function scenarioCityStateCandidate({
  city,
  sourceId,
  frameRef,
  ...values
}={}){
  const record={
    city:normalizeZhRomCityName(city),
  }
  for(const field of CITY_ECONOMY_FIELDS){
    record[field]=numericCandidate(values[field])
  }
  return Object.freeze({
    ...record,
    ...candidateBase({sourceId,frameRef}),
  })
}

export function scenarioOfficerCandidate({
  officer,
  role,
  city,
  sourceId,
  frameRef,
}={}){
  return Object.freeze({
    officer:normalizedText(officer),
    role:SCENARIO_OFFICER_ROLES.includes(role)?role:normalizedText(role),
    city:normalizeZhRomCityName(city),
    ...candidateBase({sourceId,frameRef}),
  })
}

export function scenarioCaptureBundle({
  scenarioYear,
  source,
  ownership=[],
  cityStates=[],
  officerAssignments=[],
}={}){
  const scenario=targetScenario(scenarioYear)
  if(!scenario)throw new Error(`Unknown target scenario: ${scenarioYear}`)
  const normalizedSource=sourceEvidenceCandidate(source)
  return Object.freeze({
    status:'capture-in-progress',
    scenarioYear:scenario.year,
    sources:Object.freeze([normalizedSource]),
    ownership:Object.freeze(ownership.map((record)=>Object.freeze({...record,verified:false}))),
    ownershipCoverage:null,
    cityStates:Object.freeze(cityStates.map((record)=>Object.freeze({...record,verified:false}))),
    cityStateCoverage:null,
    officerAssignments:Object.freeze(officerAssignments.map((record)=>Object.freeze({...record,verified:false}))),
    officerCoverage:null,
  })
}

export function normalizeScenarioCaptureBundleForEditing(bundle={}){
  const scenario=targetScenario(bundle.scenarioYear)
  if(!scenario)throw new Error(`Unknown target scenario: ${bundle.scenarioYear}`)
  const sources=Array.isArray(bundle.sources)?bundle.sources:[]
  if(sources.length!==1){
    throw new Error('Scenario capture workbench import requires exactly one source.')
  }
  const source=sourceEvidenceCandidate(sources[0])
  if(!source.id||!source.ref){
    throw new Error('Scenario capture workbench import requires a source ID and source ref.')
  }

  const normalizeRecords=(records,label)=>Object.freeze((records??[]).map((record)=>{
    if(record?.sourceId!==source.id){
      throw new Error(`Imported ${label} candidate uses another source: ${record?.sourceId??'missing'}`)
    }
    return Object.freeze({...record,verified:false})
  }))

  return Object.freeze({
    scenarioYear:scenario.year,
    source,
    ownership:normalizeRecords(bundle.ownership,'ownership'),
    cityStates:normalizeRecords(bundle.cityStates,'city-state'),
    officerAssignments:normalizeRecords(bundle.officerAssignments,'officer'),
  })
}
