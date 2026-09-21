import { validateCanonicalMapEvidence } from './map-evidence.js'
import { canonicalMapMigrationReadiness } from './map-parity.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'

function unique(values){
  return [...new Set(values)]
}

export function auditCanonicalEvidenceBundle(bundle={}){
  const report=validateCanonicalMapEvidence(bundle)
  const readiness=canonicalMapMigrationReadiness(bundle)

  const validCoordinateNames=new Set(
    report.verifiedCityCoordinates.map((record)=>normalizeZhRomCityName(record.name)),
  )
  const verifiedOwnershipNames=new Set(
    report.verifiedOwnership.map((record)=>normalizeZhRomCityName(record.city)),
  )

  const invalidCityCoordinates=(bundle.cityCoordinates??[])
    .map((record,index)=>({index,record,result:report.coordinateReports[index]}))
    .filter((item)=>{
      const record=item.record??{}
      const entered=
        record.x!==null||record.y!==null||
        Boolean(record.sourceId)||Boolean(record.frameRef)||
        record.verified===true
      return entered&&item.result&&!item.result.ok
    })
    .map((item)=>Object.freeze({
      index:item.index,
      name:item.record?.name??'',
      errors:item.result.errors,
    }))

  const blockers=[]
  if(report.invalidSourceCount)blockers.push('invalid-sources')
  if(report.duplicateSourceIds.length)blockers.push('duplicate-source-ids')
  if(report.duplicateCoordinateNames.length)blockers.push('duplicate-city-coordinates')
  if(report.duplicateRouteKeys.length)blockers.push('duplicate-routes')
  if(report.duplicateVillageKeys.length)blockers.push('duplicate-villages')
  if(report.duplicateNameResolutionKeys.length)blockers.push('duplicate-name-resolutions')
  if(!readiness.cityCoordinatesComplete)blockers.push('city-coordinates-incomplete')
  if(!readiness.cityNamesResolved)blockers.push('city-name-variants-unresolved')
  if(!readiness.villageCoordinatesVerified)blockers.push('village-coverage-unverified')
  if(!readiness.routeNetworkVerified)blockers.push('route-network-unverified')

  return Object.freeze({
    ready:readiness.geometryReady,
    geometryReady:readiness.geometryReady,
    sourceLedgerValid:readiness.sourceLedgerValid,
    status:bundle.status??'unknown',
    blockers:Object.freeze(unique(blockers)),
    missingCityCoordinates:Object.freeze(
      ZH_ROM_CANONICAL_CITY_SET.filter((name)=>!validCoordinateNames.has(name)),
    ),
    unresolvedNameVariants:readiness.unresolvedNameVariants,
    invalidCityCoordinates:Object.freeze(invalidCityCoordinates),
    duplicateSourceIds:report.duplicateSourceIds,
    duplicateCoordinateNames:report.duplicateCoordinateNames,
    duplicateRouteKeys:report.duplicateRouteKeys,
    duplicateVillageKeys:report.duplicateVillageKeys,
    duplicateNameResolutionKeys:report.duplicateNameResolutionKeys,
    verified:Object.freeze({
      cityCoordinates:report.validCityCoordinateCount,
      villages:report.villageEvidenceCount,
      routes:report.routeEvidenceCount,
      nameResolutions:report.nameResolutionCount,
    }),
    coverage:Object.freeze({
      villages:report.villageCoverageVerified,
      routes:report.routeNetworkVerified,
    }),
    legacyOwnership189:Object.freeze({
      evidenceCount:report.ownership189EvidenceCount,
      duplicateCities:report.duplicateOwnershipCities,
      missingCities:Object.freeze(
        ZH_ROM_CANONICAL_CITY_SET.filter((name)=>!verifiedOwnershipNames.has(name)),
      ),
      note:'Compatibility-only; production scenario ownership comes from scenario evidence.',
    }),
  })
}
