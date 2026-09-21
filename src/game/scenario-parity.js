import { CANONICAL_MAP_EVIDENCE } from './canonical-map-evidence.js'
import {
  CANONICAL_SCENARIO_EVIDENCE,
  canonicalScenarioEvidence,
} from './canonical-scenario-evidence.js'
import { canonicalMapMigrationReadiness } from './map-parity.js'
import { validateScenarioStartEvidence } from './scenario-evidence.js'
import { targetScenario } from './scenario-target.js'

export function canonicalScenarioStartReadiness(
  year,
  mapEvidence=CANONICAL_MAP_EVIDENCE,
  scenarioEvidence=canonicalScenarioEvidence(year),
){
  const scenario=targetScenario(year)
  if(!scenario){
    return Object.freeze({
      year:Number(year),
      knownScenario:false,
      ready:false,
      blockers:Object.freeze(['unknown-scenario']),
    })
  }

  const map=canonicalMapMigrationReadiness(mapEvidence)
  const scenarioReport=validateScenarioStartEvidence(
    scenarioEvidence??{scenarioYear:scenario.year},
  )
  const ownershipReady=scenarioReport.ownershipReady
  const officerPlacementReady=scenarioReport.officerPlacementReady
  const economyReady=scenarioReport.economyReady
  const ownershipEvidenceStatus=ownershipReady
    ?`source-backed-${scenario.year}`
    :'incomplete'

  const blockers=[]
  if(!map.geometryReady)blockers.push('canonical-map-geometry-incomplete')
  if(!ownershipReady)blockers.push(`ownership-${scenario.year}-unverified`)
  if(!officerPlacementReady)blockers.push(`officer-placement-${scenario.year}-unverified`)
  if(!economyReady)blockers.push(`city-economy-${scenario.year}-unverified`)

  return Object.freeze({
    year:scenario.year,
    knownScenario:true,
    mapGeometryReady:map.geometryReady,
    ownershipReady,
    ownershipEvidenceStatus,
    scenarioEvidenceStatus:scenarioEvidence?.status??'missing',
    scenarioSourceLedgerValid:scenarioReport.sourceLedgerValid,
    ownershipEvidenceCount:scenarioReport.ownershipEvidenceCount,
    officerPlacementReady,
    officerAssignmentEvidenceCount:scenarioReport.officerAssignmentEvidenceCount,
    economyReady,
    cityStateEvidenceCount:scenarioReport.cityStateEvidenceCount,
    ready:blockers.length===0,
    blockers:Object.freeze(blockers),
  })
}

export function canonicalScenarioReadinessReport(
  mapEvidence=CANONICAL_MAP_EVIDENCE,
  scenarioEvidenceByYear=CANONICAL_SCENARIO_EVIDENCE,
){
  return Object.freeze([189,200,215].map((year)=>
    canonicalScenarioStartReadiness(
      year,
      mapEvidence,
      scenarioEvidenceByYear?.[year]??null,
    )
  ))
}
