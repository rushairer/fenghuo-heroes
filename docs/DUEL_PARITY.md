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
