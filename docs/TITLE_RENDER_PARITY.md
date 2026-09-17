# Title render parity

## Observed composition

A publicly archived Mega Drive title-screen capture shows a poster-like composition rather than the old web prototype's generic bust row:

- five overlapping male warlord portraits dominate the screen;
- a very large foreground profile occupies the left side;
- a long-bearded general sits near the center;
- another bearded general appears above/right in profile;
- a large court-capped face dominates the lower-right foreground;
- a fifth capped/armored figure is partly hidden in the rear layer;
- the background is a pink/red field;
- a narrow blue/gold brocade border runs vertically at the right edge.

Reference: My Abandonware's archived Mega Drive screenshot of `Sangokushi Retsuden: Ransei no Eiyuutachi`.

## Implemented in this pass

- Removed five calls to the generic `portraitBust` placeholder helper.
- Added a dedicated clean-room Canvas title composition in `src/game/title-art.js`.
- Each of the five figures now has distinct silhouette, face proportions, headgear, beard style, clothing and overlap depth.
- Added a right-side brocade strip and subtle horizontal background texture.
- Removed the web prototype's large invented two-line title logo from the portrait composition.
- Kept the blinking start prompt and Start/Continue flow as interaction overlays.

## Clean-room boundary

The new artwork is not copied or traced from ROM pixels. It recreates only high-level observable composition with newly authored vector geometry.

## Still not claimed as 1:1

- exact facial identities and portrait brushwork;
- exact palette values;
- exact overlap pixels and clipping;
- the precise frame at which the start prompt appears/disappears;
- whether the Chinese release changes any title artwork/text from the Japanese capture.

Those need repeatable Chinese-ROM captures before they can be marked exact.
