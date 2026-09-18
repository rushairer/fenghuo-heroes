# Chinese-ROM map migration blocker

## Current state

The playable strategy map is **not** the original Chinese-ROM 40-city map.

`src/game/data.js` still contains a pre-parity engineering scaffold. It happens to have 40 nodes, but node count is the only meaningful similarity. Its city identities, coordinates, graph edges and 189 ownership must not be treated as original-game facts.

Examples of runtime-only scaffold names include:

- 北平
- 南皮
- 鄴
- 平原
- 北海
- 小沛

Examples of Chinese-ROM target cities currently absent from the runtime map include:

- 代縣
- 信都
- 濮陽
- 安城
- 番禺
- 龍編

The complete evidence-backed identity set lives in `src/game/original-data.js`.

## Why this is not being "fixed" by renaming nodes

A city identity cannot safely be mapped to an arbitrary existing coordinate.

The original game couples at least four properties:

1. city identity;
2. map coordinate;
3. route/spatial relationship;
4. scenario ownership.

Changing only the label would produce a visually plausible but false map. Therefore migration must replace these layers deliberately, with source evidence for the mapping.

## 189 evidence already strong enough to protect

A long-running original-game play record describes the 189 Liu Bei opening as starting from 代縣 before moving south toward 許昌. A separate recorded playthrough begins with a development year and attacks 晉陽 only in 190, consistent with that northern opening.

This fact is stored as sparse evidence in `ZH_189_START_CITY_EVIDENCE`:

- 劉備 → 代縣

It is intentionally **not** applied to the current scaffold because the scaffold has no 代縣 node.

References:

- https://www.ptt.cc/bbs/Old-Games/M.1299229026.A.78D.html
- https://www.bilibili.com/video/BV1i4421F7cq/

## Evidence required before runtime migration

The map may move from scaffold to canonical only when we can establish, with direct original-game/manual captures or equivalent repeatable evidence:

- all 40 displayed city identities, including 薊縣/蘇縣 and 姑藏/故藏 edition/spelling resolution;
- the coordinate of every city in the original logical map;
- village coordinates;
- enough terrain reference to preserve route/navigation semantics;
- 189 opening ownership for all relevant lords/neutral territories.

The road graph used by the scaffold is not a migration source. The original game supports free cursor route drawing, so modern/historical city adjacency must not be imported as a substitute.

## Automated guard

`src/game/map-parity.js` compares runtime city identities against the target set and exposes all missing/unexpected names.

`tests/map-parity.test.mjs` deliberately fails if somebody marks the current map parity-complete or silently turns the identity mismatch into a "canonical" claim without updating the migration contract.
