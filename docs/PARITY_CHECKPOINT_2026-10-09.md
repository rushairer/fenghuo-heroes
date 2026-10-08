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
