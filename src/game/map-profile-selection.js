import { CANONICAL_MAP_EVIDENCE } from './canonical-map-evidence.js'
import { buildCanonicalRuntimeMap } from './canonical-map-profile.js'
import { canonicalMapMigrationReadiness } from './map-parity.js'
import { RUNTIME_SCAFFOLD_MAP_PROFILE } from './runtime-map-scaffold.js'

export function selectRuntimeMapProfile(evidence=CANONICAL_MAP_EVIDENCE){
  const readiness=canonicalMapMigrationReadiness(evidence)
  const geometryPreview=readiness.geometryReady
    ?buildCanonicalRuntimeMap(evidence)
    :null

  if(!readiness.geometryReady){
    return Object.freeze({
      profile:RUNTIME_SCAFFOLD_MAP_PROFILE,
      geometryPreview:null,
      readiness,
      reason:'canonical-geometry-incomplete',
    })
  }
  return Object.freeze({
    profile:geometryPreview,
    geometryPreview,
    readiness,
    reason:'canonical-geometry-complete',
  })
}

export function runtimeMapSelectionReport(evidence=CANONICAL_MAP_EVIDENCE){
  const selected=selectRuntimeMapProfile(evidence)
  return Object.freeze({
    profileId:selected.profile.id,
    canonical:selected.profile.canonical,
    cityCount:selected.profile.cities.length,
    villageCount:selected.profile.villages.length,
    reason:selected.reason,
    geometryPreviewAvailable:Boolean(selected.geometryPreview),
    geometryPreviewProfileId:selected.geometryPreview?.id??null,
    readiness:selected.readiness,
  })
}
