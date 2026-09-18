# Parity Roadmap v0.2

## Definition of "1:1 HD"

This project separates three things that were previously mixed together:

1. **Reference geometry** — original MD screen space (`320×224`).
2. **Rendered resolution** — default HD backing canvas (`1280×896`, 4×).
3. **Assets** — clean-room high-resolution redraws or user-supplied licensed assets.

Therefore "1:1" means the flow, geometry, input semantics, timing and rules are measured against the original, while the browser output is allowed to be substantially sharper than an emulator screenshot.

## Visual gates

Before a screen is marked parity-complete it needs:

- reference screenshot / manual page identifier;
- measured logical bounding boxes in 320×224 coordinates;
- text inventory and language variant;
- D-pad / A / B / C / START input mapping;
- deterministic browser QA URL;
- screenshot diff notes;
- remaining intentional deviations.

## Current sequence

### Gate A — Initial setup

- [x] Single-screen structure instead of modern wizard pages.
- [x] Scenario years 189 / 200 / 215.
- [x] Beginner / intermediate / advanced difficulty.
- [x] Animation display toggle.
- [x] Text speed selector.
- [x] Seven selectable rulers.
- [x] Up to three human rulers.
- [ ] Exact Traditional Chinese strings from a clean official HK screenshot.
- [ ] Exact column widths, font metrics and cursor animation by screenshot measurement.

### Gate B — Main screen / inspection

- [x] 40-node runtime map scaffold, explicitly quarantined as non-canonical.
- [x] Chinese-ROM canonical 40-city identity set is protected separately with an automated mismatch guard.
- [ ] Replace runtime scaffold identities / coordinates / 189 ownership with verified Chinese-ROM map data.
- [x] Free map cursor.
- [x] Blank-map C opens domestic / diplomacy / military command.
- [x] Category selection returns to map to choose an owned city.
- [x] Original command vocabulary restored.
- [x] Odd-month inspection / even-month march state machine.
- [ ] Exact 40-city coordinates, villages and spatial layout from original Chinese-ROM/manual evidence.
- [x] Transport destination targeting and original three fixed payload choices.
- [x] Transport interception trigger is modeled as same-cell overlap, distinct from enemy-army adjacency.
- [ ] Transport-unit route/speed/delivery lifecycle, villages and supply routes.
- [ ] Exact status panels and page-switch timing.

### Gate C — March / battle

- [x] March starts from an owned city.
- [x] Route is visible before confirmation.
- [x] Enemy city enters evidence-backed siege battle preparation; direct pre-battle duel shortcut is retired.
- [x] Playable duel movement / attack / guard QA slice, isolated from strategic outcomes until consequence rules are calibrated.
- [ ] Free marching movement parity.
- [ ] Supply interception and village occupation.
- [x] Battle speed choices and the documented 15-squad-per-unit ceiling are modeled.
- [x] Field-battle A/B/C window semantics and command families are modeled as an evidence-backed contract.
- [x] Observed 30-day battle carryover boundary is modeled separately from manual-confirmed rules.
- [ ] Exact formation allocation screen and real-time battle movement/combat rules.
- [ ] Siege and duel frame-level parity.

## Copyright / clean-room line

The repository does not distribute ROM dumps or extracted Sega artwork/audio. When exact copyrighted raster/audio is required for visual comparison, it is treated as a reference only; production assets must be redrawn, generated as original replacements, or supplied by the user with appropriate rights.
