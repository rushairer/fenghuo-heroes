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

- [x] 40-city map scaffold.
- [x] Free map cursor.
- [x] Blank-map C opens domestic / diplomacy / military command.
- [x] Category selection returns to map to choose an owned city.
- [x] Original command vocabulary restored.
- [x] Odd-month inspection / even-month march state machine.
- [ ] Exact 40-city coordinates and route network from the Chinese manual map.
- [x] Transport destination targeting and original three fixed payload choices.
- [ ] Transport-unit movement, interception, villages and supply routes.
- [ ] Exact status panels and page-switch timing.

### Gate C — March / battle

- [x] March starts from an owned city.
- [x] Route is visible before confirmation.
- [x] Enemy city enters siege decision before duel.
- [x] Playable duel movement / attack / guard vertical slice.
- [ ] Free marching movement parity.
- [ ] Supply interception and village occupation.
- [ ] Formation screen and real-time battle rules.
- [ ] Siege and duel frame-level parity.

## Copyright / clean-room line

The repository does not distribute ROM dumps or extracted Sega artwork/audio. When exact copyrighted raster/audio is required for visual comparison, it is treated as a reference only; production assets must be redrawn, generated as original replacements, or supplied by the user with appropriate rights.
