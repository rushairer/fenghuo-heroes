# Canonical Scenario Evidence Capture

Map geometry and scenario start state are separate parity domains.

The map answers:

- where a city is;
- how cities connect;
- where villages are;
- which city spelling the target Chinese ROM displays.

A scenario start-state answers, independently for 189 / 200 / 215:

- who owns each of the 40 cities;
- city gold;
- city food;
- city troops;
- development;
- rule / governance;
- defense;
- training;
- officer-to-city placement.

None of the scenario fields may be inferred from map coordinates, historical geography
or another Three Kingdoms game.

## Repository ledgers

Production ledgers live in:

`src/game/canonical-scenario-evidence.js`

All three target years currently start blocked and empty.

The validator is:

`src/game/scenario-evidence.js`

The audit layer is:

`src/game/scenario-evidence-audit.js`

The deterministic compiler is:

`src/game/scenario-evidence-compiler.js`

## Create a capture template

```bash
npm run scenario:evidence:template -- 189 scenario-189.capture.json
npm run scenario:evidence:template -- 200 scenario-200.capture.json
npm run scenario:evidence:template -- 215 scenario-215.capture.json
```

Each template contains 40 canonical ownership slots and 40 canonical city-state slots.

Every numeric value is initially `null`.
Every ownership `factionId` is initially empty.
Every record is initially `verified:false`.

Do not prefill values from the current runtime scaffold.

## Ownership evidence

Each ownership record requires:

- canonical city identity;
- observed faction ID;
- source ID;
- frame reference;
- `verified:true`.

Ownership coverage is complete only when all 40 cities are source-backed exactly once
and a source-backed coverage record declares the 40-city sweep complete.

Audit just ownership:

```bash
npm run scenario:evidence:audit -- scenario-189.capture.json --require-ownership-ready
```

Compile just ownership:

```bash
npm run scenario:evidence:compile -- scenario-189.capture.json scenario-189.ownership.json --scope ownership
```

## City-state evidence

Each city-state record requires all seven numeric fields:

- `gold`
- `food`
- `troops`
- `development`
- `rule`
- `defense`
- `training`

A partially visible status screen must not be completed by guessing missing fields.

Audit city state:

```bash
npm run scenario:evidence:audit -- scenario-189.capture.json --require-economy-ready
```

Compile only city state:

```bash
npm run scenario:evidence:compile -- scenario-189.capture.json scenario-189.economy.json --scope economy
```

## Officer placement

Each assignment requires:

- officer name as displayed / resolved by the target data source;
- canonical city identity;
- source ID;
- frame reference;
- `verified:true`.

An officer may appear only once in the complete opening placement ledger.

Audit officer placement:

```bash
npm run scenario:evidence:audit -- scenario-189.capture.json --require-officer-ready
```

Compile only officer placement:

```bash
npm run scenario:evidence:compile -- scenario-189.capture.json scenario-189.officers.json --scope officers
```

## Full scenario start-state

A scenario is evidence-ready only when all three independent domains are ready:

1. 40-city ownership;
2. 40-city numeric state;
3. complete officer placement.

```bash
npm run scenario:evidence:audit -- scenario-189.capture.json --require-ready
npm run scenario:evidence:compile -- scenario-189.capture.json scenario-189.compiled.json --scope full
```

The compiled artifact is deterministic and canonical-city ordered.

## Production gate

`GameStore` does not derive canonical city state from geometry.

The current scaffold still uses quarantined coordinate-derived fake economy values so
the unfinished game remains playable. Those values are explicitly marked
`provisional-coordinate-derived` and may never be copied into canonical evidence.

Canonical scenario construction uses only validated scenario evidence for:

- ownership;
- numeric city state;
- officer placement.

Therefore completing the canonical map cannot silently make an uncalibrated scenario
startable.

## Year isolation

189, 200 and 215 are independent evidence ledgers.

- 200 never inherits 189 ownership.
- 215 never inherits 189 or 200 state.
- completing 189 does not raise 200/215 readiness.

This rule is enforced by the validator, readiness report and tests.


## Browser workbench

A local/static capture UI is published with the app:

`tools/scenario-evidence-capture.html`

It supports:

- 189 / 200 / 215 batch isolation;
- canonical 40-city selection;
- ownership capture;
- all seven city-state numeric fields;
- officer city placement with explicit `ruler` / `officer` role;
- local screenshot display for human transcription;
- overwrite-by-city / overwrite-by-officer instead of accidental duplicates;
- auto-next for city sweeps;
- undo;
- progress counters;
- importing a prior single-source batch and continuing it;
- merge-ready Capture Bundle JSON.

The local screenshot is only a visual reference. The workbench does not embed the
image into the JSON and does not mark any candidate verified.

Each editable batch is locked to one scenario year and one source ID. Start a new
batch when the source screenshot/frame family changes, then merge batches:

```bash
npm run scenario:evidence:merge -- \
  scenario-189-map.capture.json \
  scenario-189-status.capture.json \
  scenario-189-officers.capture.json \
  --out scenario-189.merged.json
```

Then audit the merged result before any verification or compilation.

## Officer role evidence

Officer placement records now include an explicit role:

- `ruler`
- `officer`

The runtime does not infer later-scenario ruler identity from the 189 opening roster.
A 200/215 officer placement record without a source-backed role is invalid.

This is required so completing later scenario placement does not silently borrow
ruler/officer classification from another scenario.
