export const RAM_EVIDENCE_CAPABILITIES=Object.freeze({
  cityIdentityOrder:Object.freeze({
    allowed:true,
    requires:'source-backed-address-sequence',
    mayEstablish:Object.freeze([
      'canonical-city-identity-order',
      'per-city-record-stride-leads',
    ]),
    mayNotEstablish:Object.freeze([
      'map-coordinate',
      'route',
      'village-coordinate',
      'scenario-start-value-without-observed-value',
    ]),
  }),
  rulerSelection:Object.freeze({
    allowed:true,
    requires:'source-backed-selector-address-and-values',
    mayEstablish:Object.freeze([
      'selector-value-to-ruler-identity',
    ]),
    mayNotEstablish:Object.freeze([
      'scenario-city-ownership',
      'officer-city-placement',
    ]),
  }),
  cityNumericState:Object.freeze({
    allowed:true,
    requires:'direct-observed-runtime-value-with-field-identification',
    mayEstablish:Object.freeze([
      'city-state-value-at-observed-frame',
    ]),
    mayNotEstablish:Object.freeze([
      'starting-value-without-opening-frame',
      'field-meaning-from-address-pattern-alone',
    ]),
  }),
})

export function ramEvidenceCapability(id){
  return RAM_EVIDENCE_CAPABILITIES[id]??null
}
