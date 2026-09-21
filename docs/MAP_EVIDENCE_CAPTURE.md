# Chinese-ROM Canonical Map Evidence Capture

This workflow converts direct game captures into auditable map evidence without
promoting guesses into runtime data.

## 1. Create a capture template

```bash
npm run map:evidence:template
```

This writes `map-evidence.capture.json` with:

- all 40 canonical city identities;
- unresolved display-name variants;
- a legacy 189 ownership compatibility section (not part of map readiness);
- empty villages and routes;
- empty coverage records.

Coordinates are intentionally blank. Legacy ownership slots remain only so older capture bundles can be migrated without data loss.

## 2. Register capture sources

Each source needs a stable ID, kind and reference.

```json
{
  "id": "capture-189-map-001",
  "kind": "direct-capture",
  "ref": "evidence/map/189/frame-001.png",
  "note": "Chinese-ROM 189 full-map capture"
}
```

Do not use another Three Kingdoms game, a historical atlas or the provisional runtime
map as a direct-capture source.

## 3. Convert screenshot points deterministically

Use `map-evidence-capture.js` when coordinates are measured from a scaled screenshot.
For example, a point measured on a 1280×896 screenshot can be converted into the
logical 320×224 evidence space without manual arithmetic.

New candidates always start with:

```json
"verified": false
```

A coordinate is not evidence merely because it was clicked.

## 4. Human verification

Before setting `verified:true`, confirm:

- the city/village marker is visually identifiable;
- the screenshot belongs to the declared Chinese-ROM target;
- the correct frame is referenced;
- the measured point corresponds to the marker center used consistently across the batch;
- no interpolation from the current runtime scaffold was used.

Do not use map evidence to establish production scenario ownership. Record 189 / 200 / 215 ownership in the scenario-evidence workflow. Legacy map `ownership189` fields are compatibility-only.

## 5. Coverage declarations

Village and route coverage are separate evidence records. They must contain a positive
`itemCount` exactly equal to the verified record count.

A coverage declaration means "this capture set is believed to contain the complete
set", not merely "we found some examples".

## 6. Audit continuously

```bash
npm run map:evidence:audit -- map-evidence.capture.json
```

For a release-gating check:

```bash
npm run map:evidence:audit -- map-evidence.capture.json --require-ready
```

The audit reports:

- missing city coordinates;
- legacy 189 ownership diagnostics (compatibility-only);
- unresolved name variants;
- malformed coordinates;
- duplicate ownership;
- reverse duplicate routes;
- duplicate village coordinates;
- duplicate name resolutions;
- village/route coverage state.

## 7. Compile only after ready

```bash
npm run map:evidence:compile -- map-evidence.capture.json map-geometry.compiled.json --scope geometry
npm run map:evidence:compile -- map-evidence.capture.json map-evidence.compiled.json --scope full
```

Compilation supports two scopes. `geometry` is the canonical map artifact and requires only map geometry readiness. `full` is a legacy compatibility export that additionally requires the old 189 ownership slots to be complete; it is not an activation gate.

- keeps only verified records;
- sorts cities in canonical 40-city order;
- normalizes route direction and ordering;
- sorts village records deterministically;
- removes unused sources;
- recomputes coverage counts.

A geometry artifact intentionally emits no `ownership189` records and is the artifact used for canonical map review. The `full` artifact exists only to preserve/migrate older map-evidence files that still carry 189 ownership; production ownership comes from scenario evidence.

## Non-negotiable boundary

A plausible map is not canonical evidence. HD artwork, historical geography and the
current runtime scaffold may help humans navigate the project, but none of them can
supply missing Chinese-ROM coordinates, ownership, village positions or routes.


## Browser workbench

The static build publishes `tools/map-evidence-capture.html`.

Use it to:

- load a local screenshot without uploading it;
- click the intrinsic marker center;
- convert the click into logical/world evidence coordinates;
- generate city or village candidate JSON;
- keep every generated candidate at `verified:false`.

The browser workbench is a measurement helper, not a verification authority.

## Multi-batch merge

When capture work is split across several frames or operators:

```bash
npm run map:evidence:merge -- batch-a.json batch-b.json --out map-evidence.merged.json
```

Merge is conflict-aware. Two non-empty contradictory values for the same canonical
record fail instead of applying last-write-wins semantics.

## Candidate-vs-ledger diff

Before replacing the repository ledger:

```bash
npm run map:evidence:diff -- map-evidence.compiled.json
```

The semantic diff keys records by canonical identity, so array ordering does not create
noise. It reports added, removed and changed city coordinates, ownership, routes,
villages, sources, name resolutions and coverage declarations separately.


## Geometry-first calibration

Map geometry and scenario state are separate evidence domains.

A geometry capture can become reviewable when all of the following are complete:

- 40 city coordinates;
- unresolved display-name variants;
- village coverage;
- route-network coverage.

Legacy 189 ownership may be absent and does not block geometry readiness. Use:

```bash
npm run map:evidence:audit -- map-evidence.capture.json --require-geometry-ready
npm run map:evidence:compile -- map-evidence.capture.json map-geometry.compiled.json --scope geometry
```

The live game still remains on the scaffold until the explicit activation target changes. Once geometry evidence is complete, the selector can build the canonical geometry profile for QA without consulting scenario ownership.

For legacy bundle migration only:

```bash
npm run map:evidence:compile -- map-evidence.capture.json map-evidence.compat.json --scope full
```

This compatibility export still does **not** imply a production-ready 189 start state.
Starting gold/food/troops/development/rule/defense/training and officer-to-city
placement are independent calibration work.
