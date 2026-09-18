# Battle tactical command parity

## Manual-confirmed command layer

The Japanese Mega Drive manual's battle command section establishes this top-level order:

1. 移動
2. 計略 — only selectable when an enemy is within the distance the acting unit can move in two battle days
3. 攻城 — only selectable when the unit is touching an enemy castle
4. 退卻
5. 待機
6. 結束

The repository models these semantics in `src/game/battle-tactical-parity.js`.

The exact conversion of "two battle days of movement" into world coordinates is deliberately unimplemented. It must be calibrated from the original battle map; it is not derived from the current strategic-map pixel step.

## 計略

The manual lists:

- 火計
- 落石
- 止足
- 挑發
- 說得
- 連環

Rules that survive indexed-text extraction clearly enough to encode:

- 落石: own unit is on a mountain and attacks an enemy on plain terrain.
- 止足: valid against an enemy on mountain or forest terrain; success lowers morale and temporarily prevents movement.
- 挑發: on success the enemy moves toward the acting unit; the manual explicitly mentions drawing defenders out of a castle.
- 說得: on success the enemy officer changes sides and that unit becomes friendly.
- 連環: selectable against an enemy in a river; success lowers morale and temporarily prevents movement.

The indexed PDF text around 火計 loses enough page-column/layout structure that its adjacent terrain sentence is not assigned programmatically yet. The tactic and its documented effect are retained, but `tacticAvailable('fire')` returns `null` rather than guessing the terrain gate.

## 待機 / 伏兵

The manual directly states that issuing 待機 while a unit with 5000 troops or fewer is in a forest turns that unit into a hidden ambush unit.

The contract exposes only this state transition. Surprise damage, discovery conditions and any bonuses remain unimplemented.

## 退卻

The manual says retreat removes the unit from the battle screen and it appears as a marching unit near the castle when the game returns to the main map.

No casualty formula is described in this command text, so this contract does not fabricate one.

## 結束

Ending a unit's command prevents another command from being shown until the next battle day.

## Source

- Japanese Mega Drive manual, battle command description around printed page 30:
  https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf

This file describes rules only; it does not redistribute manual artwork.
