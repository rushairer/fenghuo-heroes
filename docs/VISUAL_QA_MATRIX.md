# Visual QA Matrix

This matrix exists to make HD/parity review reproducible. Query-state fixtures are
inspection tools, not gameplay evidence.

| QA state | Initial scene | Purpose | Evidence boundary |
| --- | --- | --- | --- |
| title-splash | title | title composition and start prompt | observable title layout only |
| title-menu | title | Start/Continue overlay | interactive copy remains code-native |
| player-count | players | participant-count layout | UI geometry |
| setup | setup | scenario/difficulty/animation/display layout | Chinese-ROM target profile |
| strategy-map | strategy | world viewport, terrain, cities, flags | runtime map is still provisional |
| city-status | strategy | city status panel | runtime scaffold data is not canonical |
| country-overview | strategy | country overview table | layout/interaction only |
| full-map | strategy | whole-map presentation | canonical 40-city migration still blocked |
| officer-list | strategy | officer drill-down | opening faction roster only |
| officer-status | strategy | officer status schema | names/roles only; values uncalibrated |
| inspection-develop | strategy | executing officer and investment | preview only, no resource mutation |
| inspection-welfare | strategy | executing officer and investment | preview only, no resource mutation |
| inspection-educate | strategy | non-ruler education target and investment | preview only; loyalty/virtue uncalibrated |
| inspection-transfer | strategy | officer and friendly-city transfer draft | preview only; officer location and travel time unchanged |
| march-compose | strategy | march preparation | QA month is forced to an even month |
| march-officers | strategy | officer selection | opening faction roster only |
| march-route-prompt | strategy | route prompt | route geometry remains runtime scaffold |
| army-menu | strategy | army command menu | uses a local qaFixture army |
| field-battle-speed | field-battle | battle-speed selection | synthetic armies; no original damage formula |
| field-battle-formation | field-battle | editable officer / squad-type formation | capped engineering preview only; no troop changes |
| field-battle-formation-review | field-battle | review tentative squad allocations | preview is never applied as tactical units |
| field-battle-active | field-battle | battlefield controls | synthetic conflict; no AI or damage formula |
| field-battle-move | field-battle | select commanding officer and destination cursor | temporary logical target only; no simulated movement or damage |
| siege-speed | siege | battle-speed selection | uses a local qaFixture conflict |
| siege-formation | siege | editable officer / squad-type formation | no fabricated martial-rank limits or combat effects |
| siege-formation-review | siege | review tentative squad allocations and cycle named attacker commander | preview does not change city defense, troop count or headquarters position |
| close-battle-formation | close-battle-qa | normal-speed five-slot formation selection | standalone ordinal preview; no geometry or battle effects |
| duel-weapon | duel | weapon picker before control mode | synthetic categories only; no weapon effects |
| duel-mode | duel | manual/auto choice | uses a local qaFixture conflict |
| duel-manual | duel | duel arena and controls | combat outcome formulas remain uncalibrated |

## Rules

1. A QA fixture may create the minimum runtime state needed to expose a screen.
2. Every synthetic army/conflict must carry `qaFixture: true`.
3. QA fixtures must never be copied into canonical city, ownership, officer or battle data.
4. A screenshot looking plausible is not parity evidence by itself.
5. HD acceptance and parity acceptance remain separate:
   - HD asks whether the rendered asset/vector is sufficiently sharp.
   - parity asks whether geometry, content and behavior are supported by evidence.
6. The runtime 40-city engineering scaffold remains explicitly non-canonical until the
   map migration gate is satisfied.

## Current HD fallback strategy

- Ordinary raster assets: roughly 5× intrinsic pixels per logical display footprint.
- Reusable frames/panels: nine-slice source edges must satisfy the same effective density.
- Undersized raster: rejected at runtime.
- Terrain/city fallback: scalable Canvas vector artwork.
- Duel/siege fallback: scalable Canvas vector artwork.
- Backing store: adaptive 6× baseline, up to 10× on large/high-DPR displays.

Active siege inspection: open `?qa=siege-formation-review`, confirm with C, dismiss the preview message with C, then use A for strength comparison or START for the participant roster. C opens a named officer and B returns. Verify no attack count change while inspecting and no retreat confirmation when closing the window. This is a provisional roster, not original spatial targeting.

Active siege daily command preview: after confirming `?qa=siege-formation-review` and dismissing its message, press C to open the named-unit picker. C records an attack; dismiss the message and reopen C. The used unit is marked 已命令 and another confirmation is rejected without increasing the count. Select a different named unit where present. Select 結束本日・工程推進 to clear the daily usage and increment the preview day. B closes the picker without retreat; A/START on the root remain read-only. All of these are unapplied intents, not original day timing or physical unit deployment.


Headquarters ledger inspection: in `?qa=siege-formation-review`, verify the army funds/provisions line and the uncalibrated camp position notice. Confirm and dismiss the message, then A opens strength inspection with the same balances. B closes it without spending funds or recording an attack. The camp is not a placed tactical unit.

Siege monthly boundary: open `?qa=siege-month-boundary` (day 29). Press C, choose 結束本日・工程推進 and confirm; the preview stops on day 30. Dismiss the message, then C cannot open orders, while A toggles strength inspection and START still opens the roster. No actual month advancement or combat result is simulated.
