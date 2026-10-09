# Parity implementation checkpoint — 2026-10-09

Current work advances runtime correctness but does NOT claim that
the target game has been reproduced 1:1.

## Implemented in this checkpoint

- Developed an evidence-bounded preparation flow for development, welfare
  and education: candidate officer/target, investment, review and cancel.
  The result is PREVIEW ONLY: no money deduction, attribute change or turn cost.
- Validated march troops, gold, food, officer count, route endpoints and
  movement-step bounds before changing persistent state.
- Removed possibility of a distant route consuming just one node/day.
- Blocked turn completion before march mutation when battle is unresolved.
- Explicit save-and-return confirmation from field and siege battle.
- Isolated all visual QA sessions from real browser save storage.
- Added deterministic QA pages for inspection drafts and field battle.
- Added field and siege battle save/load/resume regression coverage.

## Still blocking 1:1 parity

- Production runtime uses provisional map geometry, not the original map;
  canonical map ledger is still awaiting verified source/frame evidence.
- All three canonical scenario ledgers still await production-ready data.
- Core internal-action effects and exact money investment rules remain
  unverified; entering their preparation flow does not execute the command.
- Field battle and siege persist without guessing combat damage, winners,
  tactics success, siege defense loss or battle-day timing.
- The strategic AI and victory/succession outcomes are not complete.
- HD rendering is separate from original layout and art parity.

## Acceptance constraints

- Each numeric effect must cite the exact target-edition observation,
  frame/manual reference or repeatable source before activation.
- Preserve all prior user saves in non-QA mode; do not persist QA fixtures.
- Keep npm run check plus both GitHub Actions workflows green.
- Never mark a screen or action parity-complete solely because it renders.

## Useful scripts and references

- npm run check
- npm run map:report
- npm run parity:evidence-report
- docs/PARITY_EVIDENCE_CATALOG.md
- docs/MARCH_EVIDENCE_CAPTURE.md
- docs/SCENARIO_EVIDENCE_CAPTURE.md
- docs/VISUAL_QA_MATRIX.md

## Follow-up implementation pass — 2026-10-09

- Saved games now pass structural city/faction/calendar/cursor validation before
  replacing active memory. Invalid browser JSON is retained for possible
  recovery rather than deleted; unsupported campaign creation fails safely.
- A source-backed city permits only its actual resident, named officers to
  join a new marching army. Provisional roster fallback is isolated to
  scaffold states and not promoted into Chinese-ROM evidence.
- Officer transfer now has a non-destructive actor/destination/review flow
  with stale ownership/officer checks and a deterministic QA entrypoint.
- Existing-save START at the title requires explicit confirmation, default No.
- Tax writes require the locked domestic command category in odd months.
- Field and siege scene runtime references remain synchronized after each
  command; an explicit START bridge reopens the next battle day's orders
  without inventing real-time timing, damage or victory.
- Additional tests cover corrupt saves, invalid rulers, transfer plans,
  title confirmation, battle-day transitions, and unsupported setup.

## Calendar income evidence still required

Community records separately suggest April gold and October rice income,
but these are Tier C leads. See docs/PARITY_EVIDENCE_CATALOG.md. Do not
apply calendar income or tax settlement until source-backed amounts and
event timing have been captured.


## Follow-up implementation checkpoint — 2026-10-09

- March and village-supply commands now reject unresolved combat at the engine layer.
- Invalid march-day inputs fail closed; no army/food resources mutate on rejection.
- A corrupt, retained, incompatible save is still treated as user data before new-game overwrite.
- Loaded save provenance is checked against actual active map and scenario year.
- Valid active field/siege conflicts repair inconsistent saved army statuses.
- The 200 and 215 canonical builders have their own ledger gates and tests;
  no 189 ledger can ever silently serve a later scenario. Production data remains blocked.
- Small-city march composition respects the minimum provisional garrison.
- An unsuccessful browser-storage write while starting a new game rolls back
  in-memory state instead of replacing the existing campaign.
- All additions have deterministic regression tests and an existing direct-reference
  evidence boundary. This checkpoint is infrastructure/correctness work, NOT
  proof that the original game's battle/economy formulas have been reproduced.


## Further implementation and source acquisition — 2026-10-09

- Field-battle `end` is a hard day-closure gate: no same-day rewrite, no
  advance without closure, and no day-30 bypass. Scene now displays the
  incremented day rather than stale runtime references.
- Asset cleanup physically removed seven outdated 640x448 title Base64
  fragments and the disabled generator entry. Runtime remains Canvas/vector
  until an approved 1600x1120+ title source exists.
- March domain rejects foreign/phantom officer names; previously rejected
  validation no longer initializes the empty army ledger.
- Queue/reroute now roll back resources, army IDs, routes and logs when
  browser storage fails. Tax and village-supply state also roll back.
- Independent community player sources suggest city production and governance
  caps, a tax threshold, and April/October income cadence. These remain
  low-tier observational leads, NOT permission to hard-code rules.
- Full 1:1 gameplay remains blocked on direct Chinese-ROM geometry,
  scenario start state, battle effects and victory rules.

## Follow-up battle formation pass — 2026-10-09

- Introduced shared per-officer squad formation editing, limited by the
  documented maximum of 15 without inventing military-rank limits.
- Field and siege screens now support reversible category counts and an
  explicit review before accepting an `applied:false` formation plan.
- Both mid-edit and completed plans persist through actual GameStore
  save/load and continue into the same pending battle.
- Invalid injected officers/counts fail closed; no city resources, army
  troops, or combat outcomes are modified by the formation screen.
- Battle-day changes and ordinary field/siege command intents now
  roll back on storage failures; no phantom attack sequence or skipped
  day is accepted when a save did not succeed.
- High-fidelity movement, rank restrictions, damage, capture and winner
  remain BLOCKED until direct Chinese-ROM evidence exists.
