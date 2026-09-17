# Original-game parity facts

This file records facts that are allowed to drive parity work. It deliberately separates original-game evidence from the current browser runtime scaffold.

## Evidence policy

Use three levels:

- `manual`: directly visible in an original manual scan or repeatable emulator capture.
- `cross-source`: independently repeated by multiple long-running player/reference sources.
- `provisional`: useful lead only; do not wire into parity data without more evidence.

Do not infer coordinates, numeric formulas, road topology, city ownership or officer statistics from historical Three Kingdoms knowledge. This project replicates the game, not history in general.

## Scenario facts

Cross-source evidence currently supports three starts: 189, 200 and 215. Community references consistently report selectable-ruler counts of 7 / 7 / 3 respectively.

The community labels `群雄爭霸 / 風雲再起 / 三國鼎立` are retained as community labels, not yet claimed as a verbatim original title-screen transcription.

## Canonical 40-city roster

The original-game guide roster is tracked in `src/game/facts.js` as `ORIGINAL_CITY_NAMES`. It is intentionally name-only.

Important: the existing `CITIES` table in `src/game/data.js` is still a temporary runtime map scaffold. Its names, coordinates, ownership and roads are **not** original-game facts and must not be cited or reused as the final parity map.

## 189 opening rulers and officers

`ORIGINAL_189_RULERS` records the commonly reproduced opening roster table. The table distinguishes player-selectable rulers from AI-only rulers and preserves the guide transcription of officer names instead of silently correcting them from historical sources.

Confirmed selectable rulers for the 189 start:

- 劉備
- 曹操
- 孫堅
- 袁紹
- 董卓
- 劉表
- 馬騰

The same source marks 公孫瓚、孔融、陶謙、袁術、王朗、張魯、劉焉 as non-selectable in this start.

## What remains unverified

Do not promote the following to facts yet:

- Exact world-map coordinates for the 40 cities.
- Villages and transport-team spawn points.
- Road/terrain collision topology.
- Full 200/215 initial ownership and officer placement.
- Exact original scenario captions beyond the three years.
- Numeric city resources and officer attributes.

These require original manual pages or repeatable emulator screenshots/recordings.
