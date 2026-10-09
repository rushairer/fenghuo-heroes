# AGENTS.md — fenghuo-heroes

## Mission

Clean-room, evidence-driven recreation of the Chinese Mega Drive game
《三國志列傳：亂世群英》 with high-resolution rendering. This is not an
original Three Kingdoms strategy game. 1:1 means observable inputs,
geometry, state transitions, rules and timing match target-edition evidence.

## Before changes

Read README.md, docs/PARITY_ROADMAP.md, docs/MAP_MIGRATION_BLOCKER.md,
docs/PARITY_EVIDENCE_CATALOG.md and the domain-specific parity spec.
Follow the actual main branch and preserve this repository's active
clean-room implementation rather than restoring archived prototypes.

## Hard evidence boundaries

- The playable 40-node strategy map is an engineering scaffold, NOT the
  original Chinese-ROM 40-city map. The canonical map ledger is intentionally
  blocked until source/frame-backed coordinates, villages and route evidence exist.
- Canonical 189/200/215 start states each require independent ownership,
  city resource fields and officer-to-city assignments. Do not promote
  scaffold coordinates or historical guesses into original-game evidence.
- Do not invent city economy, tax settlement, diplomacy, combat casualties,
  battle winners, AI behavior, officer statistics or action-success formulas.
- Clearly distinguish screen/control structure, observed behavior, and
  exact numeric effects. See docs/INSPECTION_COMMAND_PARITY_V1.md and
  docs/FIELD_BATTLE_PARITY.md. Currently development/welfare/education
  support actor and investment PREVIEW only; they do not execute effects.
- Officer transfer is another PREVIEW-only command: never change the stored
  city assignments until relocation timing/requirements have original evidence.
- Respect edition differences between JP manual and HK/Chinese target.
- Do not distribute ROMs, extracted copyrighted artwork/audio, or ROM dumps.

## Runtime and input invariants

- B/Escape cannot restart or abandon the root strategic game.
- Unresolved field battles must not disappear via a cancel shortcut.
  P is an engineering-only explicit save-and-return confirmation.
- Field-battle START after 結束 is an EXPLICIT engineering-only day advance,
  not a faithful real-time clock. Day 30 remains a blocked carryover boundary.
- QA query states must use ephemeral GameStore storage and must never
  replace or corrupt a normal player's save.
- Before a stored game is replaced, TitleScene requires an explicit new-game
  confirmation. Save validation fails closed and preserves damaged browser bytes.
- Only named officers currently assigned to a city may be dispatched once
  source-backed city placement exists; disallow phantom/nonnative officers.
- Tax rate can be changed only in an odd-month domestic command phase.
- Input allocations must be validated BEFORE subtracting city gold, food
  or troops. Keep army IDs, officer assignments and battle conflicts coherent.
- March nodes follow the explicit provisional world-step bound from
  MARCH_RUNTIME_PROJECTION until direct Chinese-ROM measurements replace it.
- Do not restore deprecated adjacent-city instant battles or raster
  strategy-map asset families forbidden by manifest policy.

## Work and verification

- Update or add deterministic node:test cases for every behavior change.
- Run npm run check (syntax / evidence / assets / tests / build).
- When authorized to write main, use small stage commits; verify GitHub
  Actions CI and GitHub Pages deployment for the final head.
- A successful commit is not proof of green CI or deployed Pages.
- Use docs/VISUAL_QA_MATRIX.md for deterministic ?qa= screens.
- Leave unverified mechanics explicitly blocked instead of faking parity.
- Report limitations and the exact tested/deployed commit in handoffs.

## Current next blockers

1. Direct Chinese-ROM map geometry and 189 scenario evidence.
2. Source-backed command formulas and officer/city action eligibility.
3. Unit formation, battle-day timing, combat effects and battle conclusion.
4. Independently calibrated 200 and 215 scenarios, AI turn behavior.
5. Screenshot-by-screenshot HD artwork, Chinese text and input QA.


## 2026-10-09 follow-up engineering invariants

- Reject queue/reroute/movement/supply commands during any unresolved
  pendingConflict, at the domain layer (not only through scene navigation).
- Browser saves must match their map profile, supported scenario year,
  and scenarioStateId provenance. Missing legacy 189 scaffold IDs are
  backfilled; an unreadable stored save still requires overwrite confirmation.
- A valid persisted pending conflict restores participant army statuses as
  engaged (field) or besieging (siege), with no fabricated battle result.
- The canonical start-state builder is reusable for 189/200/215 but each
  year must satisfy its OWN independently verified evidence ledger.
  Production 200/215 are still BLOCKED; synthetic test ledgers are never
  production data or grounds to enable a scenario.
- Treat localStorage persistence failures as errors; newGame rolls back
  the in-memory campaign when the new save cannot be written.
- For cities with only 200 troops, preselect 100 for marching to retain
  the provisional 100-soldier garrison; never show an over-budget draft.


## 2026-10-09 battle-day and persistence closure

- The battle end order closes the current day. Day advancement is strictly
  one day at a time, only after a closed order, and never beyond observed day 30.
  The legacy battle-order reopen helper is not a same-day bypass.
- Invalid saved tactic associations, battle-day counters and carryover flags
  are normalized without adding combat outcomes.
- Named marching officers must belong to the live city roster when verified,
  or to the explicitly provisional opening faction roster on scaffold.
  Do not create phantom officer names or claim scaffold city assignments.
- Rejected queries must not initialize army state as a side effect.
- Persisting a new march, a reroute, tax-rate configuration or village-supply
  intent must roll back in-memory changes if storage reports a failure.
- Disabled raster artifacts must have no retained generated source parts.
  The retired 640x448 title parts were physically deleted; true-HD title
  production remains future work.

## 2026-10-09 battle move and siege-retreat safeguards

- Field move input follows officer selection -> destination cursor ->
  committed semantic order. Only an actual participating officer may be
  chosen; temporary cursor bounds are NOT measured original tactical cells.
- Move drafts and intents may be stored with the pending conflict, but must
  NEVER mutate army location, food, morale, casualties, combat outcome or
  tactical map occupancy until the original game's rules are verified.
- Siege B asks for an explicit confirmed engineering abort; do not restore
  single-press battle deletion.
- Both battlefield entry and intentional cancellation must be atomic across
  army statuses, pendingConflict, logs and browser persistence.

## Formation input and transactional battle persistence — 2026-10-09

- Field and siege formation screens share the same named-officer draft.
  A cycles existing army officers; UP/DOWN selects infantry/cavalry/archers;
  LEFT/RIGHT changes only a provisional squad count; C previews and confirms,
  B returns a step or backs out. The total may not exceed 15 per selected
  command unit; officer-grade restrictions are NOT yet verified.
- A confirmed formation is persisted as `formationPlan` with
  `status:'uncalibrated-preview'` and `applied:false`. NEVER translate
  it into physical tactical squads, troop consumption, speed, damage,
  or victory until Chinese-ROM source evidence is recorded.
- `formationDraft` is saved during editing and restored after P/Continue.
  The formation reader rejects unknown officers, missing categories,
  fractional/negative counts and over-15 totals on each officer row.
- In field and siege scenes, order acceptance, day increments, ambush state
  and siege attack sequence must be atomic with persistence. On write
  failure, restore the last good runtime and retain the battle scene.
- Keep deterministic QA at `field-battle-formation`,
  `field-battle-formation-review`, `siege-formation`,
  `siege-formation-review`. All use ephemeral QA storage.
