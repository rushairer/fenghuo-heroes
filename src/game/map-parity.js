import { CANONICAL_MAP_EVIDENCE } from './canonical-map-evidence.js'
import { mapEvidenceSourceValid, validateCanonicalMapEvidence } from './map-evidence.js'
import { RUNTIME_SCAFFOLD_CITIES } from './runtime-map-scaffold.js'
import {
  ZH_189_START_CITY_EVIDENCE,
  ZH_ROM_CANONICAL_CITY_SET,
  ZH_ROM_CITY_NAME_VARIANTS,
  normalizeZhRomCityName,
} from './original-data.js'

export const RUNTIME_MAP_PARITY = Object.freeze({
  cityIdentity:'provisional-scaffold',
  geometry:'provisional-scaffold',
  routeNetwork:'provisional-scaffold',
  ownership189:'provisional-scaffold',
  parityComplete:false,
})

const sortedUnique=(values)=>[...new Set(values)].sort()

export function canonicalMapMigrationReadiness(evidence=CANONICAL_MAP_EVIDENCE) {
  const report=validateCanonicalMapEvidence(evidence)
  const validSources=new Set(
    (evidence.sources??[]).filter(mapEvidenceSourceValid).map((source)=>source.id),
  )
  const coordinateNames=new Set(
    (evidence.cityCoordinates??[])
      .filter((record,index)=>report.coordinateReports[index]?.ok)
      .map((record)=>normalizeZhRomCityName(record.name)),
  )
  const unresolvedNameVariants=ZH_ROM_CITY_NAME_VARIANTS.filter((item)=>item.status==='unresolved')
  const resolvedVariantKeys=new Set(
    (evidence.nameResolutions??[])
      .filter((record)=>
        record?.verified===true&&
        validSources.has(record?.sourceId)&&
        typeof record?.frameRef==='string'&&record.frameRef.trim()&&
        typeof record?.chosen==='string'&&
        (record.chosen===record.ram||record.chosen===record.numberedGuide)
      )
      .map((record)=>`${record.ram}|${record.numberedGuide}`),
  )
  const unresolvedAfterEvidence=unresolvedNameVariants.filter(
    (item)=>!resolvedVariantKeys.has(`${item.ram}|${item.numberedGuide}`),
  )

  const cityCoordinatesComplete=
    coordinateNames.size===ZH_ROM_CANONICAL_CITY_SET.length&&
    report.duplicateCoordinateNames.length===0
  const cityNamesResolved=unresolvedAfterEvidence.length===0&&report.duplicateNameResolutionKeys.length===0
  const ownership189Verified=report.ownership189EvidenceCount===ZH_ROM_CANONICAL_CITY_SET.length&&report.duplicateOwnershipCities.length===0
  const villageCoordinatesVerified=report.villageCoverageVerified
  const routeNetworkVerified=report.routeNetworkVerified
  const sourceLedgerValid=
    report.invalidSourceCount===0&&
    report.duplicateSourceIds.length===0
  const geometryReady=
    sourceLedgerValid&&
    cityCoordinatesComplete&&
    cityNamesResolved&&
    villageCoordinatesVerified&&
    routeNetworkVerified
  const scenario189Ready=sourceLedgerValid&&ownership189Verified
  const ready=geometryReady&&scenario189Ready

  return Object.freeze({
    ready,
    geometryReady,
    scenario189Ready,
    sourceLedgerValid,
    ledgerStatus:evidence.status??'unknown',
    cityCoordinatesComplete,
    verifiedCityCoordinateCount:coordinateNames.size,
    requiredCityCoordinateCount:ZH_ROM_CANONICAL_CITY_SET.length,
    cityNamesResolved,
    unresolvedNameVariants:Object.freeze(unresolvedAfterEvidence),
    villageCoordinatesVerified,
    ownership189Verified,
    verifiedOwnershipCityCount:report.ownership189EvidenceCount,
    duplicateOwnershipCities:report.duplicateOwnershipCities,
    duplicateNameResolutionKeys:report.duplicateNameResolutionKeys,
    routeNetworkVerified,
    routeEvidenceCount:report.routeEvidenceCount,
    evidenceReport:report,
  })
}

export function runtimeMapParityReport() {
  const runtimeNames=sortedUnique(RUNTIME_SCAFFOLD_CITIES.map((city)=>normalizeZhRomCityName(city.name)))
  const targetNames=sortedUnique(ZH_ROM_CANONICAL_CITY_SET)
  const targetSet=new Set(targetNames)
  const runtimeSet=new Set(runtimeNames)
  const unexpectedRuntime=runtimeNames.filter((name)=>!targetSet.has(name))
  const missingTarget=targetNames.filter((name)=>!runtimeSet.has(name))

  return Object.freeze({
    runtimeCityCount:RUNTIME_SCAFFOLD_CITIES.length,
    targetCityCount:ZH_ROM_CANONICAL_CITY_SET.length,
    cityIdentityMatchesTarget:
      runtimeNames.length===targetNames.length&&unexpectedRuntime.length===0&&missingTarget.length===0,
    unexpectedRuntime:Object.freeze(unexpectedRuntime),
    missingTarget:Object.freeze(missingTarget),
    confirmed189Starts:ZH_189_START_CITY_EVIDENCE,
    canonicalMigration:canonicalMapMigrationReadiness(),
    ...RUNTIME_MAP_PARITY,
  })
}

export function assertRuntimeMapNotClaimedCanonical() {
  const report=runtimeMapParityReport()
  if(report.parityComplete)throw new Error('Map parity cannot be marked complete while the runtime scaffold is still provisional.')
  if(report.cityIdentityMatchesTarget)throw new Error('Runtime city identity now matches the target; update the migration guard deliberately.')
  return report
}
