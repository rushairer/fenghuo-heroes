# March Evidence Capture

The playable march runtime deliberately separates manual-confirmed behavior from
uncalibrated spatial/timing projections.

Current provisional runtime projection:

- route step: 8 world units;
- one route node: 1 calendar day;
- even-month execution window: 30 days;
- enemy-army command adjacency: 8 world units;
- enemy-city siege proximity: 24 world units.

These are engineering baselines, not 1:1 claims.

Runtime contract:

`src/game/march-runtime-projection.js`

Empty production observation ledger:

`src/game/canonical-march-evidence.js`

Validator / conservative inference:

`src/game/march-evidence.js`

Runtime-vs-observation diff:

`src/game/march-calibration.js`

## Browser workbench

Static tool:

`tools/march-evidence-capture.html`

It accepts a local image or video as visual evidence. Media bytes remain local and are
not embedded in capture JSON.

The workbench can record five observation domains:

1. route-step coordinates;
2. route steps moved vs calendar days elapsed;
3. unfinished-route even-month execution windows;
4. attack/siege command availability at measured grid distance;
5. starvation before/after observations.

The current video timestamp can be copied into `Frame Ref`.

Every record remains `verified:false` until human review.

## Route-step calibration

Capture at least:

- one horizontal one-cell movement;
- one vertical one-cell movement.

Both must resolve to the same world-space magnitude before the validator exposes
`routeStepWorld`.

Logical 320×224 evidence is converted into the runtime 640×448 world space only for
comparison.

Diagonal or multi-axis observations are rejected as one-cell evidence.

## Route-node days

Capture at least two independent windows with:

- number of route cells moved;
- calendar days elapsed.

The validator derives `routeNodeDays` only when:

- both values are positive integers;
- days divide evenly by moved cells;
- every verified window yields the same ratio.

It does not average disagreement.

## Even-month execution window

Use a route that is deliberately longer than one month's execution capacity.

For each observation record:

- calendar days advanced;
- cells actually moved;
- whether the route remained unfinished and continued next month.

At least two unfinished-route observations must report the same calendar-day window
before `executionDaysPerEvenMonth` becomes ready.

## Enemy army / city adjacency

For each target type, capture both sides of the boundary.

Example pattern:

- distance N: command visible;
- distance N+1: command absent.

The validator accepts an exact threshold only when a positive and negative observation
form a one-grid boundary pair.

The grid threshold is converted to world units only after route-step size is itself
calibrated.

## Starvation

Record:

- starvation days;
- troops before;
- troops after;
- officer HP before/after when visible.

The repository intentionally does **not** derive a loss formula yet. Starvation
observations are counted, but `starvationEffects` remains not ready until a separate
model-selection/calibration stage has enough evidence.

## Audit

```bash
npm run march:evidence:audit -- march.capture.json
npm run march:evidence:audit -- march.capture.json --require-route-step-ready
npm run march:evidence:audit -- march.capture.json --require-timing-ready
npm run march:evidence:audit -- march.capture.json --require-month-ready
npm run march:evidence:audit -- march.capture.json --require-adjacency-ready
```

The audit output includes both validated observation counts and a diff against the
current runtime projection.

## Evidence standards

Preferred:

- direct Traditional-Chinese Mega Drive recording;
- reproducible local emulator capture from a lawfully held copy.

Useful as a behavioral lead but not enough for exact numeric calibration:

- long-form play logs;
- recollection posts;
- Japanese-edition behavior without Chinese-edition corroboration.

Never derive movement timing from the current remake and then feed it back as original
evidence.
