// Canonical Chinese-ROM map evidence ledger.
//
// This file is deliberately empty until direct, auditable evidence is captured.
// Do not fill city coordinates, villages, ownership or name resolutions from
// historical intuition, another Three Kingdoms title, or the provisional runtime
// scaffold. Every accepted coordinate must reference a declared source and frame.
//
// Coordinate records use one of the spaces defined in map-evidence.js:
// - logical-320x224
// - world-640x448
//
// Example shape only (do not uncomment without evidence):
// {
//   name:'代縣',
//   x:123,
//   y:77,
//   space:'logical-320x224',
//   sourceId:'capture-001',
//   frameRef:'capture-001#frame-123',
//   verified:true,
// }

export const CANONICAL_MAP_EVIDENCE=Object.freeze({
  status:'blocked-awaiting-direct-capture',
  sources:Object.freeze([]),
  cityCoordinates:Object.freeze([]),
  villages:Object.freeze([]),
  ownership189:Object.freeze([]),
  nameResolutions:Object.freeze([]),
})
