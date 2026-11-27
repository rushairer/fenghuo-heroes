
## Strategy-map visual parity reset — direct reference priority

The user-supplied target screenshot shows that the current strategy inspection surface
has a structural visual mismatch, not merely missing HD detail. See
`docs/STRATEGY_MAP_VISUAL_PARITY.md`.

Before more map micro-detail work:

- [x] Rebuild inspection composition as map-first with compact upper-left status plaque.
- [x] Remove the large bottom instruction panel from the target-parity inspection state.
- [x] Disable visible provisional node-link road rendering unless direct evidence proves it.
- [~] Calibrate camera scale and landmark bounding-box ratios from direct target frames.
- [ ] Replace mixed blue/purple mountain assets with a coherent target-derived terrain language.
- [ ] Eliminate visible terrain tiling seams.
- [~] Calibrate deep-blue river width and irregular bank silhouette from reference frames.
- [~] Rebuild fort/flag/cursor silhouettes from direct target screenshots before further micro-detail.

### Fort and cursor silhouette pass — 2026-09-23

The target fort no longer delegates to the generic rectangular fort renderer. It now has
a compact wall, central keep, two side towers, three roof silhouettes and a dedicated
hot-pink/gold banner, with faction color reduced to a small gate identity mark. The
target cursor drops its faint inner rectangle and is now a high-contrast four-corner
white bracket with a dark under-stroke.

### River silhouette pass — 2026-09-23

River presentation now samples each canonical Bézier segment at five positions instead of
three for shoreline modulation. Alternating water-edge scallops create shallow inlets on
both banks while the canonical center path remains untouched. This specifically targets
the prior smooth-pipe appearance; canonical river geometry is still not claimed.

### Calibration contract pass — 2026-09-23

The current visual hypothesis is now centralized in
`src/game/strategy-map-calibration.js` instead of scattered scene magic numbers.
Inspection density moved from 1.18× to 1.24×, the inspection cursor is now square
(18×18 logical), and the upper-left plaque is reduced to 72×22 logical. Fort scale
is intentionally held near the previous effective footprint while mountains/hills and
villages gain slightly more presence. These values remain calibration hypotheses until
additional direct target frames can be measured.

### Structural reset implementation note — 2026-09-22

The first code pass now makes the root inspection state map-first at 320×224 logical
coverage, suppresses the legacy bottom instruction panel there, and removes the
provisional adjacency graph from both local and full-map presentation. A presentation-only
1.18× inspection camera calibration now increases target-frame information density
without mutating world coordinates. Target inspection rendering also uses one earth/green
vector language for mountains, hills, forts, villages, army flags and cursor rather than
mixing unrelated raster families. The river keeps the same provisional center path but
now has a broader, lightly irregular bank silhouette. Exact camera ratios, landmark
bounding boxes and canonical river/world geometry remain open until more target frames
are measured.

### Map runtime asset convergence — 2026-09-24

The strategic map runtime is vector/procedural-only across inspection, command, march
and full-map presentation. Historical map WebP files, generated base64 sources,
manifest entries, production specs and the retired terrain-style selector have been
physically removed from the production tree.

The asset checker now rejects any reintroduction of `map.*` raster manifest/spec/
generated entries or a recreated `public/assets/map` directory while
`policy.mapRuntime` is `vector`. UI frames/icons remain independent raster assets.

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
- [~] Village supply command flow now uses verified map-profile village coordinates and the documented weapon/rice/heal menu; prices/effects and occupation remain uncalibrated.
- [ ] Supply interception and village occupation.
- [x] Battle speed choices and the documented 15-squad-per-unit ceiling are modeled.
- [x] Field-battle A/B/C window semantics and command families are modeled as an evidence-backed contract.
- [x] Adjacent enemy-army attack now immediately enters a persistent field-battle runtime scene and survives save/load.
- [x] Observed 30-day battle carryover boundary is modeled separately from manual-confirmed rules.
- [~] Field-battle command runtime now matches the documented command/tactic hierarchy and persists across reload; exact squad formation, movement speed, tactic success and damage remain uncalibrated.
- [ ] Exact formation allocation screen and real-time battle movement/combat rules.
- [~] Siege now has persistent speed / formation / attack-intent phases and preserves a defense snapshot; exact defense reduction and entry-battle probability remain uncalibrated.
- [ ] Siege and duel frame-level parity.

## Copyright / clean-room line

The repository does not distribute ROM dumps or extracted Sega artwork/audio. When exact copyrighted raster/audio is required for visual comparison, it is treated as a reference only; production assets must be redrawn, generated as original replacements, or supplied by the user with appropriate rights.


### 2026-10-09 — integrity and scenario readiness

- [x] Block march/supply operations at the domain layer while pending combat exists.
- [x] Distinguish stored-save presence from loadability before overwriting data.
- [x] Reject mismatched map/scenario/year save provenance while migrating legacy 189 scaffold tags.
- [x] Recover active field/siege army statuses from validated conflict references.
- [x] Bound new march drafts by the city's remaining garrison.
- [x] Generalize canonical 189/200/215 start-state construction with STRICT per-year evidence gates.
- [x] Make Setup readiness for canonical geometry depend on independent scenario evidence.
- [x] Roll back in-memory newGame on failed localStorage persistence.
- [ ] Acquire direct Chinese-ROM 189 map/start-state captures and original rules.
- [ ] Acquire independent 200/215 opening snapshots before enabling either production scenario.
- [ ] Calibrate battle effects, victory/consequences, field-battle timing and strategic AI.


### 2026-10-09 — Formation and battle command safety

- [x] Shared interactive field/siege formation drafts with named officers,
  infantry/cavalry/archer inputs, and a strict 15-squad upper bound
  on the engineering preview.
- [x] Confirmed draft and partially edited draft survive P/Continue saves;
  source-backed officer roster and numeric bounds are enforced on restore.
- [x] Deterministic editable and review QA entrypoints for both battle types.
- [x] Atomic battle command/ambush/day increments and siege-attack intents,
  with rollback on browser storage errors.
- [ ] Exact original-game squad allocation numbers, martial-rank constraints
  and troop/squad conversion per officer.
- [ ] Source-confirmed squad position, actual movement, contact,
  damage, battle winner and post-battle transfer.

### Information browser command-context integrity

- [x] Preserve the source city when opening the repeatable 情報 command from domestic, diplomacy or military menus; inspecting another city's status/officer list must not replace the command target on exit.
- [x] Return to owned-city targeting if the original source is no longer owned. This is an interaction integrity fix, not a new original-game rule or economy effect.


### March and battle entry integrity

- [x] Atomic standalone march stepping, including storage-failure rollback of all army movement and ration fields.
- [x] Reject new field/siege encounters outside the march phase and preserve uninitialized army state on rejected entry.
- [ ] Calibrate actual battle effects and original movement timing from direct target-edition evidence.

### Duel horizontal movement

- [x] Implement a scrolling duel arena with world-space fighters and fixed HUD.
- [ ] Measure original arena width, camera behavior and weapon-dependent movement.
- [ ] Integrate duels into the field battle lifecycle only with source-backed consequences.

### Duel weapon-selection flow

- [x] Add a weapon-selection stage before control-mode choice in the isolated
  duel QA; no synthetic equipment enters production campaigns.
- [ ] Verify Chinese-edition weapon names, officer inventories, weapon
  selection controls/layout, and strength/weight effects from direct captures.
- [ ] Connect calibrated inventories and duel results to the strategic battle.


### Field battle destination continuity

- [x] Retain last recorded destinations for each named participant across
  subsequent orders, day boundaries and save/load; expose in the move picker.
- [ ] Calibrate actual persistent movement, arrival, cancellation by other
  orders, and interactions with terrain/combat from Chinese-edition evidence.

### Automatic duel player command control

- [x] HK manual pp. 34–36 confirms that automatic duels still accept player
  commands. A opens the shared command menu; C confirms. Automatic
  simulation no longer starves the input queue.
- [ ] Calibrate actual weapon effects, manual directional defence, command
  timing and consequences before connecting the duel to the strategic battle.

### Close unit-combat formation selection
- [x] Isolated normal-speed five-slot selection preview; left/right and C follow HK manual pp. 32–33. Fast speed cannot select formations.
- [ ] Measure the five original formations and their order, integrate the close unit-combat contact transition and individual squad commands, and apply verified battle effects.

### Siege commander preparation
- [x] Production siege allocation review can select and persist a named attacker commander as an unapplied preview; legacy saves remain compatible.
- [ ] Capture original headquarters placement and map-specific deployment points; implement commander movement, defeat and prisoner consequences only after calibration.

### Siege read-only battle inspection
- [x] Active siege A compares known army strength; START opens a participant roster and C displays unknown-safe officer status. B closes inspection without aborting or issuing an attack.
- [ ] Replace provisional roster selection with original spatial cursor targeting on either side; calibrate defender roster, officer values and battle geometry.
- [ ] Enforce documented one-order-per-unit-per-day in a named unit/day runtime, not a global attack limit.

### Siege unit/day command limit

- [x] Production siege C opens a named-unit command picker, preserving A/START inspection and B cancellation.
- [x] Enforce one recorded attack intent per named attacker per preview day, persist the usage ledger, and permit different units to receive orders on the same day.
- [x] Explicit engineering day advance and rollback on failed storage; legacy anonymous attack counts are not retroactively assigned.
- [ ] Calibrate physical unit identity/selection, other order types, day timing, movement and combat effects. No actual siege resolution or original clock is claimed.


### Siege headquarters logistics projection

- [x] Read actual attacking army funds and provisions in preparation/strength inspection, with separate commander role and no invented camp position or duplicate resource ownership.
- [ ] Capture map-specific deployment triangles, headquarters placement, commander movement and combat-driven resource consumption; implement physical deployment and defeat only when verified.

### Siege monthly boundary

- [x] Manual-confirmed monthly carryover rule is represented by a bounded engineering preview sharing the field-battle day-30 stop. No unlimited attack-day loop, no fabricated result; save/Continue retains the unresolved siege. A toggles strength inspection.
- [ ] Implement actual strategic intermission/resumption and original clock only after controlled Chinese-edition observations. The exact siege day cutoff is not established by the manual.

### Siege movement intent
- [x] Reuse the field move cursor for named siege units; move and attack share the one-order-per-unit/day budget. Drafts and last destinations persist without moving troops.
- [ ] Calibrate actual unit selection, map cells, deployment, movement/contact and cross-month resumption; the provisional cursor is not original geometry.

### Battle-map visual reference acquisition
- [x] Inspect Chinese-language battle frame from the 2010 PIXNET article and corroborating Japanese-language battle frame. Use compact flag silhouette and upper-right day plaque in the active field-battle scaffold; retain explicit side-proxy labels, not invented unit IDs.
- [ ] Measure map-specific terrain, deployment markers, unit identity, camera travel and successive movement/contact frames; one still does not establish any simulation rule.

### Tactical movement observation acquisition
- [x] Local two-frame capture and camera-translation rejection using two stationary landmarks; export unverified native-pixel observations only.
- [ ] Collect repeatable Chinese-edition movement and contact pairs and measure the original clock before enabling real tactical simulation.

### Field command admission integrity
- [x] Enforce existing phase, contact, retreat and tactic conditions at command commit, not only at the UI; reject incomplete saved orders and keep saved end barriers. Unknown troop counts do not activate ambush.
- [ ] Replace provisional condition flags with calibrated tactical entity/terrain/range inputs and actual battle effects.

### Resumed march execution integrity
- [x] Validate active routes and ration inputs before any army moves; zero elapsed movement preserves previous starvation state.
- [ ] Calibrate return-to-city, stationary army provisions, actual movement timing and starvation consequences from direct target-edition observations.

### Overlapping army selection and split execution
- [x] Cycle individual same-position friendly armies in the command menu; split reroutes only the selected existing army and rechecks stack eligibility at commit.
- [ ] Measure original grouping/split controls and actual movement timing; no new troop division or original geometry is inferred.

### March read-only lookup integrity
- [x] Keep army selection and map rendering independent of mutable march initialization; preserve absent ledgers and existing army ID sequences.

### Army identity and legacy dispatch integrity
- [x] Reject ambiguous army IDs on save load and before dispatch; preserve raw saves and existing references.
- [x] Derive the next generated ID from both the stored sequence and issued IDs, without reusing an active ID or debiting resources on failure. Legacy missing/stale counters remain loadable.

### City dispatch beneath army markers
- [x] Preserve access to the existing named-officer dispatch workflow when a friendly army obscures an owned city; the previous army and its resources remain independent.
- [ ] Verify original city/army overlap selection controls from target-edition frames; the additional navigation row is an engineering convention.

### Encounter and completed-route integrity
- [x] Share field encounter position validation between discovery and commit; reject malformed army coordinates in siege entry, preserve ration history at a restored final route node, and keep battle cancellation independent of ID initialization.
- [ ] Calibrate original encounter timing, stationary rations and battle consequences from target-edition evidence.

### Stationed officer read model
- [x] Keep the verified city roster and visible country officer count consistent with named officers deployed on the strategy map; preserve opening assignments and unverified scaffold behavior.
- [ ] Calibrate original驻城／出陣 display, return-to-city and officer reassignment effects from Chinese-edition frames.

### Transport source and resource integrity
- [x] Revalidate source city membership and ownership throughout transport targeting and load selection; discard stale drafts, reject malformed balances, and preserve campaign resources.
- [ ] Capture allied vs. hostile overlap and the destination of seized cargo; do not treat the preview as a dispatched transport unit.

### Manual-backed information navigation
- [x] Restore directional full-map cursor browsing (HK manual p.15), reusing the current map cursor and provisional navigation step; START/B return without issuing a command or changing resources.
- [x] Restore UP/DOWN officer-status browsing (HK manual pp.18–19) against the same roster as the list; returning preserves the selected officer and unknown values remain unknown.
- [ ] Measure the original full-map cursor step, inset geometry, camera on return, officer list boundary behavior, and exact status-screen copy from direct Chinese-edition frames. The manual's indexed text confirms navigation but its scan was not accessible for frame measurement.

### Country overview field ordering and map navigation
- [x] HK manual p.14 documents horizontal/vertical list selection, A/C field ordering and A/C on a country name returning to its map location. Restore these on the survey overview, retaining the separate 情報 command's existing drilldown and source-city restoration.
- [x] Sort only the visible projection, keep unknown values last, and retain the selected city across reordering without modifying campaign data.
- [ ] Measure original column layout, sort direction/toggle/ties, cursor behavior after sorting and map return camera from direct HK/Chinese-edition frames. The deterministic descending-first sort and one-column-per-step interaction are provisional; indexed manual text confirms the actions but the page scan request returned HTTP 403.
