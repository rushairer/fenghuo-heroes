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
