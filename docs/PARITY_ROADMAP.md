
## Strategy-map visual parity reset — direct reference priority

The user-supplied target screenshot shows that the current strategy inspection surface
has a structural visual mismatch, not merely missing HD detail. See
`docs/STRATEGY_MAP_VISUAL_PARITY.md`.

Before more map micro-detail work:

- [ ] Rebuild inspection composition as map-first with compact upper-left status plaque.
- [ ] Remove the large bottom instruction panel from the target-parity inspection state.
- [ ] Disable visible provisional node-link road rendering unless direct evidence proves it.
- [ ] Calibrate camera scale and landmark bounding-box ratios from direct target frames.
- [ ] Replace mixed blue/purple mountain assets with a coherent target-derived terrain language.
- [ ] Eliminate visible terrain tiling seams.
- [ ] Calibrate deep-blue river width and irregular bank silhouette from reference frames.
- [ ] Rebuild fort/flag/cursor silhouettes from direct target screenshots before further micro-detail.

# Parity Roadmap v0.2

## Definition of "1:1 HD"

This project separates three things that were previously mixed together:

1. **Reference geometry** — original MD screen space (`320×224`).
2. **Rendered resolution** — adaptive HD backing canvas: 6× baseline, display-size/DPR aware, capped at 10×.
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
- remaining intentional deviations;
- raster assets must meet the effective on-screen pixel-density requirement for the current HD scale; a `ready` manifest flag alone is not sufficient.

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
- [x] Separate canonical map geometry from scenario ownership/economy so 189 state cannot leak into 200/215.
- [ ] Replace runtime scaffold identities / coordinates with verified Chinese-ROM map geometry.
- [ ] Replace 189 ownership with a source-backed scenario start-state.
- [x] Free map cursor.
- [x] Blank-map C opens domestic / diplomacy / military command.
- [x] Category selection returns to map to choose an owned city.
- [x] Original command vocabulary restored.
- [x] Odd-month inspection / even-month march state machine.
- [ ] Exact 40-city coordinates, villages and spatial layout from original Chinese-ROM/manual evidence.
- [ ] Calibrate 189 starting gold / food / troops / development / rule / defense / training independently from map coordinates.
- [ ] Verify exact officer-to-city placement for the 189 opening state.
- [ ] Capture independent 200 and 215 ownership/start-state evidence; never inherit 189.
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
