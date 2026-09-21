import { CANONICAL_MAP_EVIDENCE } from './canonical-map-evidence.js'
import { canonicalMapMigrationReadiness } from './map-parity.js'
import { targetScenario } from './scenario-target.js'

export function canonicalScenarioStartReadiness(
  year,
  evidence=CANONICAL_MAP_EVIDENCE,
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

  const map=canonicalMapMigrationReadiness(evidence)
  const is189=scenario.year===189
  const ownershipReady=is189?map.scenario189Ready:false

  // The current repository protects the 189 ruler/officer transcription, but
  // exact city assignment and starting numeric state are not calibrated. Do not
  // convert those community records into a production start-state implicitly.
  const officerPlacementReady=false
  const economyReady=false
  const ownershipEvidenceStatus=is189
    ?(ownershipReady?'source-backed-189':'incomplete')
    :'unverified'

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
    officerPlacementReady,
    economyReady,
    ready:blockers.length===0,
    blockers:Object.freeze(blockers),
  })
}

export function canonicalScenarioReadinessReport(
  evidence=CANONICAL_MAP_EVIDENCE,
){
  return Object.freeze([189,200,215].map((year)=>
    canonicalScenarioStartReadiness(year,evidence)
  ))
}
