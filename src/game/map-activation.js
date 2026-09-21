import { CANONICAL_MAP_EVIDENCE } from './canonical-map-evidence.js'
import { selectRuntimeMapProfile } from './map-profile-selection.js'
import { assertRuntimeMapProfile } from './map-profile-validation.js'
import { RUNTIME_SCAFFOLD_MAP_PROFILE } from './runtime-map-scaffold.js'

// Deliberate second gate. Geometry readiness proves the canonical map profile can
// be built; scenario ownership/economy/officer readiness is enforced separately
// when GameStore constructs a start state. Flip the live target only after map
// compatibility tests are green against the canonical geometry profile.
export const MAP_ACTIVATION_TARGET='scaffold'

export function activeMapProfile({
  target=MAP_ACTIVATION_TARGET,
  evidence=CANONICAL_MAP_EVIDENCE,
}={}){
  const selected=selectRuntimeMapProfile(evidence)
  if(target==='canonical'){
    if(!selected.readiness.geometryReady){
      throw new Error('Canonical map activation requested before geometry evidence readiness.')
    }
    const canonicalProfile=selected.geometryPreview??selected.profile
    return assertRuntimeMapProfile(canonicalProfile)
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
    evidenceReady:selected.readiness.geometryReady,
    activationReady:selected.readiness.geometryReady,
    geometryReady:selected.readiness.geometryReady,
    sourceLedgerValid:selected.readiness.sourceLedgerValid,
    evidenceProfileId:selected.profile.id,
  })
}
