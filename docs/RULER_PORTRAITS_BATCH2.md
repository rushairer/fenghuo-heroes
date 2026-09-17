# 189 Ruler Portrait Production Notes — Batch 2

This batch completes local Image 2.5 production for the remaining four selectable rulers in the 189 target profile. The runtime crops are normalized to `128x192` (2:3), matching the first batch's target for a `32x48` logical portrait at 4x HD rendering.

The four files have been generated and verified locally, but are **not marked ready** and are **not yet referenced by the runtime**. GitHub binary-blob transfer for this batch was not reliable in the current connector session, so this document records the exact integrity targets instead of pretending the binaries were safely committed.

| Ruler | Intended runtime file | Size | SHA-256 | Status |
| --- | --- | ---: | --- | --- |
| Yuan Shao | `public/assets/portraits/rulers/portrait-ruler-yuanshao-v1.webp` | 10,870 bytes | `d001cf0876c0df5a99dd14584876199447322296e8af36c3c2066fb9f1d09cb` | locally verified; binary transfer pending |
| Dong Zhuo | `public/assets/portraits/rulers/portrait-ruler-dongzhuo-v1.webp` | 10,914 bytes | `a94e2e5a74dd22a9bf3de452092644167355487406272800974f2ff4c09e8141` | locally verified; binary transfer pending |
| Liu Biao | `public/assets/portraits/rulers/portrait-ruler-liubiao-v1.webp` | 9,104 bytes | `ee90ffb2647158851714b4fd58c2bc27635c8c2d08b743db1e13f91bfc4ed059` | locally verified; binary transfer pending |
| Ma Teng | `public/assets/portraits/rulers/portrait-ruler-mateng-v1.webp` | 10,534 bytes | `aa9419673e285fc53f2157f699fa75b09cac9f325ddbf393851f4463ac1e6b9e` | locally verified; binary transfer pending |

## Activation rule

The same rule as batch 1 applies: do not switch ruler portrait entries to `ready` until original-game footage/screenshots establish a valid portrait placement without changing the original UI hierarchy. Asset availability alone is not a reason to redesign Setup.

## Next action

When a reliable binary transport path is available, commit these exact WebP bytes and verify the recorded byte length/SHA-256 before changing any manifest status.
