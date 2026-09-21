const emptyScenarioEvidence=(year)=>Object.freeze({
  status:'blocked-awaiting-direct-capture',
  scenarioYear:year,
  sources:Object.freeze([]),
  ownership:Object.freeze([]),
  ownershipCoverage:null,
  cityStates:Object.freeze([]),
  cityStateCoverage:null,
  officerAssignments:Object.freeze([]),
  officerCoverage:null,
})

export const CANONICAL_SCENARIO_EVIDENCE=Object.freeze({
  189:emptyScenarioEvidence(189),
  200:emptyScenarioEvidence(200),
  215:emptyScenarioEvidence(215),
})

export function canonicalScenarioEvidence(year){
  return CANONICAL_SCENARIO_EVIDENCE[Number(year)]??null
}
