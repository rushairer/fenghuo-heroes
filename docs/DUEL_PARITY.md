# Duel parity

## Verified interaction structure

Public original-game material consistently supports the following structure:

- A duel can be played manually or automatically.
- `A` opens the duel command menu.
- The command menu contains persuasion, taunt, surrender and retreat semantics.
- `B + direction` performs high / middle / low attacks.
- `C` guards.
- The duel field scrolls horizontally rather than being a fixed tiny arena.

A later personal play diary guessed `C=attack / B=guard` while explicitly saying the author had not understood the controls. That observation is treated as low-confidence and is not used over the more explicit control description.

## Current implementation status

Implemented:

- manual / auto selection before the duel starts;
- manual A/B/C control structure;
- command menu structure;
- deterministic auto-control path so auto mode is functional and testable;
- duel QA is isolated from strategic state: local win/loss never changes city ownership, army strength or turn progression.

Still provisional:

- officer-specific weapon reach and animation;
- strength/stat influence;
- persuasion / taunt probability formulas;
- rage duration;
- damage, hit stun, death and capture thresholds;
- exact scrolling/background art and timing.

Those values must not be described as original-game values until measured from real gameplay or supported by the manual.

The previous generic `GameStore.resolveConflict()` path used arbitrary troop multipliers and is retired. A future duel may affect a larger field battle only after the original consequence rules are evidence-backed.

## Horizontal arena scrolling

The duel preview now uses persistent world-space fighter positions and a
bounded horizontal camera. Both fighters, the arena, spacing indicators,
weapon contact and hit sparks share the same screen projection; the HUD
remains fixed. Initial fighter screen positions are unchanged. Manual and
automatic movement use the extended world bounds. The 640-wide world and
midpoint camera are explicitly provisional engineering geometry, not
measured original values; no damage, reach, weapon or strategic outcome
formula has changed. The known horizontal-scrolling behavior is now
interactive rather than a fixed one-screen arena. QA: `?qa=duel-manual`.

## Weapon selection before control mode

The indexed text of the Japanese MD manual, printed page 35
(https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf),
describes selecting an owned weapon before choosing manual/automatic control.
It mentions sword, spear and long-blade families, three strength grades per
family, attack-power effects and weight-dependent movement. The scan itself
returned HTTP 403 during this review; the indexed text establishes a JP
interaction lead, not exact Chinese-edition labels, layout, inventory or stats.

The isolated duel QA now enters a weapon picker before mode selection. The
three category examples are explicitly synthetic QA options and are never
used as a real officer inventory. Selection persists locally through mode
selection, and B returns to the picker. With no calibrated inventory, a
non-QA duel cannot proceed. Existing damage, movement and strategic outcome
behavior remains unchanged; no weapon-specific combat parameters are inferred.
QA: `?qa=duel-weapon`, with existing `?qa=duel-mode` and `?qa=duel-manual`
still available as direct entrypoints.

## Chinese-edition confirmation: commands during automatic duels

The HK Traditional Chinese manual (printed pp. 34–36, indexed text,
https://segaretro.org/images/c/c3/Sangokushiretsuden_md_HK_manual.pdf.pdf)
confirms that automatic control leaves command selection to the player;
A opens the command window and C confirms the highlighted command.
Previously the automatic update path never consumed player input, making
the command menu inaccessible after choosing auto. Both control modes
now use the same command menu, and auto consumes non-command input
without applying manual movement or attacks. The existing QA simulation
pauses while this menu is open; exact original menu timing remains
unmeasured. The change does not calibrate the existing preview's combat
numbers or apply any strategic outcomes. Use ?qa=duel-mode, select
自動, and press Z (MD A) during the fight.
