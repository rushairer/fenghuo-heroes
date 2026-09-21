# Chinese-ROM map migration blocker

## Current state

The playable strategy map is **not** the original Chinese-ROM 40-city map.

`src/game/data.js` still contains a pre-parity engineering scaffold. It happens to have 40 nodes, but node count is the only meaningful similarity. Its city identities, coordinates, graph edges and 189 ownership must not be treated as original-game facts.

Examples of runtime-only scaffold names include:

- 北平
- 南皮
- 鄴
- 平原
- 北海
- 小沛

Examples of Chinese-ROM target cities currently absent from the runtime map include:

- 代縣
- 信都
- 濮陽
- 安城
- 番禺
- 龍編

The complete evidence-backed identity set lives in `src/game/original-data.js`.

## Why this is not being "fixed" by renaming nodes

A city identity cannot safely be mapped to an arbitrary existing coordinate.

The original game couples at least four properties:

1. city identity;
2. map coordinate;
3. route/spatial relationship;
4. scenario ownership.

Changing only the label would produce a visually plausible but false map. Therefore migration must replace these layers deliberately, with source evidence for the mapping.

## 189 evidence already strong enough to protect

A long-running original-game play record describes the 189 Liu Bei opening as starting from 代縣 before moving south toward 許昌. A separate recorded playthrough begins with a development year and attacks 晉陽 only in 190, consistent with that northern opening.

This fact is stored as sparse evidence in `ZH_189_START_CITY_EVIDENCE`:

- 劉備 → 代縣

It is intentionally **not** applied to the current scaffold because the scaffold has no 代縣 node.

References:

- https://www.ptt.cc/bbs/Old-Games/M.1299229026.A.78D.html
- https://www.bilibili.com/video/BV1i4421F7cq/

## Evidence required before runtime migration

The map may move from scaffold to canonical only when we can establish, with direct original-game/manual captures or equivalent repeatable evidence:

- all 40 displayed city identities, including 薊縣/蘇縣 and 姑藏/故藏 edition/spelling resolution;
- the coordinate of every city in the original logical map;
- village coordinates;
- enough terrain reference to preserve route/navigation semantics;
- 189 opening ownership for all relevant lords/neutral territories.

The road graph used by the scaffold is not a migration source. The original game supports free cursor route drawing, so modern/historical city adjacency must not be imported as a substitute.

## Automated guard

`src/game/map-parity.js` compares runtime city identities against the target set and exposes all missing/unexpected names.

`tests/map-parity.test.mjs` deliberately fails if somebody marks the current map parity-complete or silently turns the identity mismatch into a "canonical" claim without updating the migration contract.

`canonicalMapMigrationReadiness()` adds a second hard gate: matching the 40 names is not enough. Migration remains blocked until all 40 canonical city coordinates are evidence-backed, the unresolved 薊縣/蘇縣 and 姑藏/故藏 display-name variants are resolved, village coordinates are verified, and the 189 ownership layer is verified. This prevents a future refactor from turning a visually plausible rename into a false 1:1 claim.


## Evidence ledger contract

Canonical migration is now driven by `src/game/canonical-map-evidence.js`, validated by
`src/game/map-evidence.js` and enforced by `scripts/check-map-evidence.mjs`.

A city coordinate is counted only when all of the following are present:

- a canonical Chinese-ROM city identity;
- an explicit coordinate space (`logical-320x224` or `world-640x448`);
- finite in-range coordinates;
- a declared source ID;
- a source reference;
- a frame-level reference;
- `verified: true`.

The migration gate cannot be opened by setting booleans manually. It requires all of:

1. 40 source-backed canonical city coordinates with no duplicate identities;
2. source-backed resolution of the unresolved 薊縣/蘇縣 and 姑藏/故藏 display-name variants;
3. source-backed village coverage verification;
4. 40 source-backed 189 ownership records;
5. source-backed route-network coverage verification.

The ledger intentionally starts empty and blocked. A screenshot, memory, historical map,
another Three Kingdoms game, or the current runtime scaffold is not sufficient evidence.

`npm run check` now includes the map-evidence validator, so malformed or silently
self-certified evidence fails CI before a canonical migration can be claimed.


## Runtime activation gate

Evidence readiness and runtime activation are deliberately separate.

- `src/game/map-profile-selection.js` selects a canonical profile only when the
  evidence ledger is complete.
- `src/game/map-activation.js` adds a second explicit activation target.
- The current target remains `scaffold`.
- `src/game/data.js` exports `MAP_PROFILE`, `CITIES` and `CITY_BY_ID` from
  that activation gate.

This means completing the evidence ledger does **not** silently replace the live map.
After the ledger becomes ready, the remaining migration sequence is:

1. run canonical profile compatibility tests against Store, march, siege, QA and save/load;
2. inspect the 40-city / village / route output;
3. verify save migration behavior;
4. explicitly change the activation target to `canonical`;
5. run the complete test/build/visual-QA matrix before deployment.

Use `npm run map:report` to inspect current evidence readiness and the active map profile.


## Compatibility work completed before activation

The runtime is now being exercised against an injected canonical profile before the
global activation target changes:

- `GameStore` accepts an injected map profile and tags saves with `mapProfileId`;
- march and siege preparation resolve cities through `store.mapProfile`;
- transport destination discovery resolves through `store.mapProfile`;
- deep visual-QA fixtures resolve owned/enemy cities through `store.mapProfile`;
- strategy march composition, officer screens, duel and siege titles resolve current
  city identities through the Store profile;
- the HD strategy map and full-map view render profile villages when present;
- full-map roads and strategy roads derive from the current profile graph;
- runtime profile integrity validates city index identity, coordinate bounds,
  symmetric neighbors and village bounds at the activation boundary.

The evidence ledger also rejects ambiguous duplicate records: duplicate city
coordinates, multiple ownership records for the same city, reverse duplicate routes,
duplicate village coordinates and duplicate name-resolution records.

This makes the eventual canonical switch an explicit activation change rather than a
cross-cutting rewrite.
