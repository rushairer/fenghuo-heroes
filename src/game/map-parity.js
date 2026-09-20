import { CITIES } from './data.js'
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

export function canonicalMapMigrationReadiness({
  cityCoordinates=[],
  villageCoordinatesVerified=false,
  ownership189Verified=false,
}={}) {
  const canonicalSet=new Set(ZH_ROM_CANONICAL_CITY_SET)
  const coordinateNames=sortedUnique(
    cityCoordinates
      .filter((item)=>Number.isFinite(item?.x)&&Number.isFinite(item?.y))
      .map((item)=>normalizeZhRomCityName(item.name))
      .filter((name)=>canonicalSet.has(name)),
  )
  const unresolvedNameVariants=ZH_ROM_CITY_NAME_VARIANTS.filter((item)=>item.status==='unresolved')
  const cityCoordinatesComplete=coordinateNames.length===ZH_ROM_CANONICAL_CITY_SET.length
  const cityNamesResolved=unresolvedNameVariants.length===0
  const ready=cityCoordinatesComplete&&cityNamesResolved&&villageCoordinatesVerified&&ownership189Verified
  return Object.freeze({
    ready,
    cityCoordinatesComplete,
    verifiedCityCoordinateCount:coordinateNames.length,
    requiredCityCoordinateCount:ZH_ROM_CANONICAL_CITY_SET.length,
    cityNamesResolved,
    unresolvedNameVariants:Object.freeze(unresolvedNameVariants),
    villageCoordinatesVerified:Boolean(villageCoordinatesVerified),
    ownership189Verified:Boolean(ownership189Verified),
  })
}

export function runtimeMapParityReport() {
  const runtimeNames=sortedUnique(CITIES.map((city)=>normalizeZhRomCityName(city.name)))
  const targetNames=sortedUnique(ZH_ROM_CANONICAL_CITY_SET)
  const targetSet=new Set(targetNames)
  const runtimeSet=new Set(runtimeNames)
  const unexpectedRuntime=runtimeNames.filter((name)=>!targetSet.has(name))
  const missingTarget=targetNames.filter((name)=>!runtimeSet.has(name))

  return Object.freeze({
    runtimeCityCount:CITIES.length,
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
