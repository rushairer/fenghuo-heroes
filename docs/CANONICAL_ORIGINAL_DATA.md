# Canonical original-data layer

This file records facts that are sufficiently supported to protect in code before the runtime map is migrated.

## Why this is separate from `data.js`

The current playable map still has provisional coordinates, adjacency and ownership. Replacing those with guessed original geometry would trade one kind of drift for another. `src/game/original-data.js` therefore holds evidence-backed original facts independently. Runtime data should move across only when its geometry/state is also verified.

## Original 40-city roster

The RAM-address table published by a long-term player/researcher exposes 40 fixed city slots. In slot order:

1. 襄平
2. 薊縣
3. 代縣
4. 信都
5. 臨淄
6. 下邳
7. 濮陽
8. 會稽
9. 壽春
10. 建安
11. 南昌
12. 番禺
13. 晉陽
14. 洛陽
15. 安城
16. 新野
17. 江夏
18. 江陵
19. 臨湘
20. 合浦
21. 平陽
22. 臨晉
23. 長安
24. 許昌
25. 西城
26. 襄陽
27. 永安
28. 且蘭
29. 龍編
30. 臨涇
31. 漢中
32. 江州
33. 宛溫
34. 姑藏
35. 西都
36. 襄武
37. 成都
38. 武陽
39. 雲南
40. 不韋

The RAM table renders #5 as `臨溜`; independent original-game officer tables use `臨淄` for that slot, so code normalizes the display name to `臨淄` and retains the source variant in metadata.

## Scenario facts

- 189: 桃園結義 — 7 selectable rulers
- 200: 群星亂舞 — 9 selectable rulers
- 215: 三國鼎立 — 10 selectable rulers

The previous runtime label `三國鼎立前夜` was an invention and is removed.

## 189 selectable rulers

The original 189 scenario marks these seven as player-selectable:

- 劉備
- 袁紹
- 曹操
- 董卓
- 馬騰
- 劉表
- 孫堅

袁術 is present as an AI lord but is not selectable in this scenario. This corrects a tempting but incorrect assumption that all prominent lords are playable.

## 189 starting retinues

The same original-game research source gives initial subordinate lists for the fourteen lords in 189. Those lists are now preserved in `ORIGINAL_189_RULERS`; they are not yet wired into runtime combat because city ownership, officer stats and roster UI still need calibration.

## Evidence used

- SEGA Mega Drive Japanese manual scan (scenario descriptions and selectable-ruler counts).
- RAM-address city table published by 立言/ah5488 (city slots/order).
- ss701110 / Bahamut original-game research reposts (wild-officer city tables and 189 initial lord/subordinate list).

No ROM assets or extracted game data files are included in the repository.
