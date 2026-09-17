# Canonical original-data layer

This file records facts that are sufficiently supported to protect in code before the runtime map is migrated.

## Why this is separate from `data.js`

The current playable map still has provisional coordinates, adjacency and ownership. Replacing those with guessed original geometry would trade one kind of drift for another. `src/game/original-data.js` therefore holds evidence-backed original facts independently. Runtime data should move across only when its geometry/state is also verified.

## Target edition rule

The project target is the Chinese Mega Drive ROM experience usually referred to as 《三國志列傳：亂世群英》. The Japanese retail manual remains a primary source for mechanics and layout, but edition-specific data must not be silently copied into the Chinese target when Chinese-ROM evidence disagrees.

A real discrepancy has now been found:

| Scenario | Japanese retail manual | Repeated Chinese-ROM player reports |
| --- | ---: | ---: |
| 189 桃園結義 / 群雄爭霸 | 8 selectable rulers | 7 selectable rulers |
| 200 群星亂舞 / 風雲再起 | 9 selectable rulers | 7 selectable rulers |
| 215 三國鼎立 | 10 selectable rulers | 3 selectable rulers |

The Japanese counts are directly indexed from the original Japanese manual scan. The Chinese counts/ruler lists are repeated in long-running Chinese-language gameplay guides. The available Hong Kong Chinese manual scan confirms the three-year setup structure and Chinese controls, but its indexed text does not expose the scenario ruler-count paragraphs clearly enough to settle the discrepancy.

Therefore code now keeps `JP_MANUAL_SCENARIOS` and `ZH_ROM_SCENARIOS` separately. The runtime target must use the Chinese profile only where its downstream ownership/roster data is also known; otherwise the UI must remain explicitly provisional rather than inventing missing state.

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

## Chinese-ROM 189 selectable rulers

Repeated Chinese-ROM gameplay references identify these seven as player-selectable:

- 劉備
- 曹操
- 孫堅
- 袁紹
- 董卓
- 劉表
- 馬騰

They identify 公孫瓚、孔融、陶謙、袁術、王朗、張魯、劉焉 as AI-only for this version/start. Because the Japanese manual says eight rulers for its 189 scenario, the code labels these flags `zhCommunitySelectable` instead of pretending they apply to every edition.

## 189 starting retinues

The same original-game research lineage gives initial subordinate lists for fourteen 189 lords. Those lists are preserved in `ORIGINAL_189_RULERS`. They may be carried into runtime state because the roster transcription is independently useful, but city ownership, officer attributes and later-scenario placement remain unverified.

## Evidence used

- SEGA Mega Drive Japanese manual scan: mechanics, scenario names and Japanese-edition selectable-ruler counts (189=8, 200=9, 215=10).
- SEGA Hong Kong Chinese manual scan: Chinese setup/control flow and three-scenario structure; scenario-count OCR remains insufficient.
- RAM-address city table published by 立言/ah5488: city slots/order.
- ss701110 / Bahamut and repeated Chinese-ROM guides: 189 opening lord/subordinate list and Chinese-ROM selectable-ruler reports (189=7, 200=7, 215=3).

No ROM assets or extracted game data files are included in the repository.
