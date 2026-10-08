import { canonicalScenarioEvidence } from './canonical-scenario-evidence.js'
import { validateScenarioStartEvidence } from './scenario-evidence.js'
import { runtimeScenarioSupported, targetScenario } from './scenario-target.js'

// The canonical map and each scenario are independent activation gates.
// Synthetic test ledgers can exercise the future 200/215 path without enabling
// either incomplete production ledger. This never borrows ownership from 189.
export function scenarioRuntimeStartable(mapProfile,year,{
  evidence=canonicalScenarioEvidence(year),
}={}){
  const numericYear=Number(year)
  if(!targetScenario(numericYear))return false
  if(!mapProfile)return runtimeScenarioSupported(numericYear)
  if(mapProfile.id==='runtime-scaffold')return runtimeScenarioSupported(numericYear)
  if(!mapProfile.canonical)return false
  if(evidence?.scenarioYear!==numericYear)return false
  return validateScenarioStartEvidence(evidence).ready
}
