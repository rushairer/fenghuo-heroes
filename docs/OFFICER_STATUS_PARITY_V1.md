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

The Japanese retail manual establishes the field semantics. Chinese-release screenshots of 劉備 and 關羽 establish the displayed labels below (not a single linear reading order):

1. 水平
2. 官職
3. 文官級
4. 武官級
5. 體力
6. 武力
7. 知力
8. 德育
9. 忠誠度
10. 率兵力
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

Direct Chinese-release screenshots now establish the upper-left portrait slot and the light three-column status layout. The scene reserves that slot without enabling unreviewed portrait art; exact native-frame crop and HD portrait matching remain open. The visible second stamina and attack numeric slots and multiple weapon lines are reserved without inventing their values or semantics.

## Non-goals of this slice

This slice does not claim:

- per-city officer assignment is verified;
- officer status values are verified;
- exact native-frame portrait geometry is verified;
- current map geometry is original-game-accurate.

It only restores the evidence-backed field vocabulary and interaction structure.

## Direct Chinese-release screenshot references (2010-08-01)

- Article: https://fung2008.pixnet.net/blog/posts/3031736574
- 劉備 frame (`三國誌列博_002.JPG`): https://pimg.1px.tw/fung2008/48e8bf3fa604ec35ae90be5aea02f039.jpg
- 關羽 frame (`三國誌列博_003.JPG`): https://pimg.1px.tw/fung2008/dbf73972b31d017d3c3b8582f7598f98.jpg

These are direct displayed Chinese-language UI references, not opening-state captures. The level-18 characters are progressed campaign examples; their stats MUST NOT be used as 189 starting values. Frame geometry is projected approximately from the published 640px-wide images. The repository retains only URLs, independently implemented geometry and visible field labels, not the images.
