import { CANONICAL_MAP_EVIDENCE } from '../src/game/canonical-map-evidence.js'
import { validateCanonicalMapEvidence } from '../src/game/map-evidence.js'
import { canonicalMapMigrationReadiness } from '../src/game/map-parity.js'

const report=validateCanonicalMapEvidence(CANONICAL_MAP_EVIDENCE)
const readiness=canonicalMapMigrationReadiness(CANONICAL_MAP_EVIDENCE)
const failures=[]

if(report.invalidSourceCount)failures.push(`invalid map evidence sources: ${report.invalidSourceCount}`)
if(report.duplicateSourceIds.length){
  failures.push(`duplicate map evidence source IDs: ${report.duplicateSourceIds.join(', ')}`)
}
if(report.duplicateCoordinateNames.length){
  failures.push(`duplicate canonical city coordinates: ${report.duplicateCoordinateNames.join(', ')}`)
}
if(report.duplicateRouteKeys.length){
  failures.push(`duplicate canonical routes: ${report.duplicateRouteKeys.join(', ')}`)
}
if(report.duplicateVillageKeys.length){
  failures.push(`duplicate canonical villages: ${report.duplicateVillageKeys.join(', ')}`)
}
if(report.duplicateNameResolutionKeys.length){
  failures.push(`duplicate name resolutions: ${report.duplicateNameResolutionKeys.join(', ')}`)
}
for(const [index,item] of report.coordinateReports.entries()){
  if(!item.ok)failures.push(`cityCoordinates[${index}]: ${item.errors.join(', ')}`)
}
if(report.validCityCoordinateCount>readiness.requiredCityCoordinateCount){
  failures.push('verified city coordinate count exceeds canonical 40-city target')
}
if(CANONICAL_MAP_EVIDENCE.status?.startsWith('blocked')&&readiness.ready){
  failures.push('blocked evidence ledger unexpectedly opens canonical migration gate')
}

if(failures.length){
  console.error('canonical map evidence check failed')
  failures.forEach((failure)=>console.error(`- ${failure}`))
  process.exitCode=1
}else{
  console.log(
    `canonical map evidence check passed: ${report.validCityCoordinateCount}/${readiness.requiredCityCoordinateCount} city coordinates, `+
    `geometry=${readiness.geometryReady?'ready':'blocked'}, `+
    `migration=${readiness.ready?'ready':'blocked'}; scenario ownership is checked by scenario evidence`,
  )
}
