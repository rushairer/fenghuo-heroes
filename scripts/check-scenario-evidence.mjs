import { CANONICAL_SCENARIO_EVIDENCE } from '../src/game/canonical-scenario-evidence.js'
import { auditScenarioEvidenceBundle } from '../src/game/scenario-evidence-audit.js'

const failures=[]

for(const year of [189,200,215]){
  const evidence=CANONICAL_SCENARIO_EVIDENCE[year]
  const audit=auditScenarioEvidenceBundle(evidence)

  if(!audit.scenarioYearValid)failures.push(year+': invalid target scenario year')
  if(!audit.sourceLedgerValid)failures.push(year+': invalid or duplicate source ledger')
  if(audit.duplicateOwnershipCities.length){
    failures.push(year+': duplicate ownership cities: '+audit.duplicateOwnershipCities.join(', '))
  }
  if(audit.duplicateCityStates.length){
    failures.push(year+': duplicate city states: '+audit.duplicateCityStates.join(', '))
  }
  if(audit.duplicateOfficerAssignments.length){
    failures.push(year+': duplicate officer assignments: '+audit.duplicateOfficerAssignments.join(', '))
  }
  if(evidence.status?.startsWith('blocked')&&audit.ready){
    failures.push(year+': blocked evidence ledger unexpectedly reports ready')
  }

  console.log(
    'scenario '+year+': ownership='+audit.verified.ownership+'/40, '+
    'cityStates='+audit.verified.cityStates+'/40, officers='+audit.verified.officerAssignments+', '+
    'ready='+(audit.ready?'yes':'no'),
  )
}

if(failures.length){
  console.error('canonical scenario evidence check failed')
  failures.forEach((failure)=>console.error('- '+failure))
  process.exitCode=1
}else{
  console.log('canonical scenario evidence integrity check passed')
}
