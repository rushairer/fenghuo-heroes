# 20-Round Strategy Map Parity Sweep — 2026-09-24

Status: completed presentation pass; canonical geography remains blocked by direct evidence.

Reference boundary:

- public original Mega Drive strategy screenshot used only for composition, terrain density, river prominence and relative visual language;
- original manual used for free-map/full-map interaction context;
- no public screenshot or historical map is promoted into Chinese-ROM city/village coordinates.

## Rounds

1. Centralized clean-room presentation geography.
2. Replaced scattered mountain markers with deterministic mountain belts.
3. Kept hill/vegetation belts intentionally sparse.
4. Added overlapping three-mass mountain-range rendering.
5. Increased earth grain and mottle density.
6. Broadened the local river.
7. Flattened river highlights and bank sheen.
8. Increased shoreline irregularity sampling.
9. Added alternating dark/light short water texture marks.
10. Unified local and full-map river language.
11. Rebalanced camera/natural-feature scale to 1.20× inspection density.
12. Made target forts smaller and flags more dominant.
13. Simplified cursor silhouette to pure corner brackets.
14. Replaced broad relief gradients with smaller subtler patches.
15. Clipped full-map natural terrain correctly.
16. Deleted retired visible-road helpers.
17. Added presentation-density audit helpers and tests.
18. Removed base strategy debug grid/top HUD/generic map-art fallback.
19. Added anti-regression source contracts around road/map/presentation boundaries.
20. Updated parity ledger and remaining-blocker list.

## Result

The runtime should now read substantially closer to the original strategy-screen language:
dense ochre terrain, repeated brown mountain ranges, sparse green vegetation, a broad flat
deep-blue river, compact flagged forts, and a simple white bracket cursor. The same
presentation geography is used by local and overview views.

## Still not 1:1

The canonical evidence ledger remains intentionally empty. The next accuracy jump cannot
come from more clean-room drawing; it requires direct Chinese-ROM capture/stitching of city,
village, river and mountain geometry plus camera-scroll behavior.
