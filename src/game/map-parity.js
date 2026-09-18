import { CITIES } from './data.js'
import {
  ZH_189_START_CITY_EVIDENCE,
  ZH_ROM_CANONICAL_CITY_SET,
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
    ...RUNTIME_MAP_PARITY,
  })
}

export function assertRuntimeMapNotClaimedCanonical() {
  const report=runtimeMapParityReport()
  if(report.parityComplete)throw new Error('Map parity cannot be marked complete while the runtime scaffold is still provisional.')
  if(report.cityIdentityMatchesTarget)throw new Error('Runtime city identity now matches the target; update the migration guard deliberately.')
  return report
}
