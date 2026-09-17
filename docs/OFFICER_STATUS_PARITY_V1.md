# Officer Status Parity v1

## Scope

This document defines the evidence boundary for the single-officer status screen in the
Chinese-ROM-targeted HD clean-room remaster.

## Confirmed interaction

The Japanese retail manual documents this drilldown:

1. Country status.
2. Press C to open that country's officer list.
3. Select an officer.
4. Press C to open the officer status screen.
5. B cancels/backtracks.

The runtime already follows this hierarchy. A is intentionally not treated as a second
confirm button on these screens.

## Confirmed status vocabulary

The Japanese retail manual explicitly documents these officer-status fields, in this
order:

1. 等級
2. 官位
3. 文官值
4. 武官值
5. 體力
6. 武力
7. 知力
8. 德
9. 忠誠度
10. 統率力
11. 機動力
12. 兵力
13. 士氣
14. 攻擊力
15. 武器

`src/game/officer-roster.js` exposes this as `OFFICER_STATUS_FIELDS`, and the screen
renders the full set instead of the previous five-field placeholder.

## Values remain unverified for the Chinese ROM

The field names and semantics are documented, but the current Chinese-ROM character
table has not yet been transcribed field by field.

Therefore:

- known officer names/roles may be shown from the verified 189 opening rosters;
- all status values remain null / `—` until Chinese-ROM evidence is captured;
- values must not be borrowed from history books, Koei titles, fan databases, or the
  Japanese manual's example-character tables and silently presented as Chinese-ROM
  runtime facts.

## Portrait boundary

Seven 189 selectable-ruler HD portrait candidates already exist in the repository.
They remain `planned`.

The manual confirms the officer-status screen exists, but the project does not yet have
sufficient visual evidence for the exact portrait placement, crop, and dimensions on
the Chinese ROM status screen. Do not enable the portraits merely because assets are
available.

## Non-goals of this slice

This slice does not claim:

- per-city officer assignment is verified;
- officer status values are verified;
- portrait geometry is verified;
- current map geometry is original-game-accurate.

It only restores the evidence-backed field vocabulary and interaction structure.
