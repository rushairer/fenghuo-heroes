import { CANONICAL_MAP_EVIDENCE } from './canonical-map-evidence.js'
import { selectRuntimeMapProfile } from './map-profile-selection.js'
import { assertRuntimeMapProfile } from './map-profile-validation.js'
import { RUNTIME_SCAFFOLD_MAP_PROFILE } from './runtime-map-scaffold.js'

// Deliberate second gate. Evidence readiness proves the canonical profile can be
// built; it does not prove every consumer has been migrated away from scaffold
// IDs. Flip this only after compatibility tests are green against the canonical
// profile.
export const MAP_ACTIVATION_TARGET='scaffold'

export function activeMapProfile({
  target=MAP_ACTIVATION_TARGET,
  evidence=CANONICAL_MAP_EVIDENCE,
}={}){
  const selected=selectRuntimeMapProfile(evidence)
  if(target==='canonical'){
    if(!selected.readiness.ready){
      throw new Error('Canonical map activation requested before evidence readiness.')
    }
    return assertRuntimeMapProfile(selected.profile)
  }
  if(target!=='scaffold')throw new Error(`Unknown map activation target: ${target}`)
  return assertRuntimeMapProfile(RUNTIME_SCAFFOLD_MAP_PROFILE)
}

export function mapActivationReport(options={}){
  const profile=activeMapProfile(options)
  const selected=selectRuntimeMapProfile(options.evidence??CANONICAL_MAP_EVIDENCE)
  return Object.freeze({
    activationTarget:options.target??MAP_ACTIVATION_TARGET,
    activeProfileId:profile.id,
    activeCanonical:profile.canonical,
    evidenceReady:selected.readiness.ready,
    evidenceProfileId:selected.profile.id,
  })
}
