# Battle-time parity

## Confidence level

The 30-day battle segment is currently classified as **observed gameplay evidence**, not as a manual-confirmed rule.

A detailed play record states that when the battle-day counter reaches 30, the battle is carried over: the game returns to each country's command phase and later resumes the same battle. A separate retrospective also reports that operations stop after 30 battle days.

References:

- https://saitamat.blog.fc2.com/blog-entry-379.html
- https://middle-edge-neo.jp/articles/4593/

## Implemented contract

`src/game/battle-time-parity.js` records:

- one observed battle segment ends at day 30;
- day 30 returns control to strategic phases;
- the battle must remain resumable rather than being assigned an arbitrary winner;
- the evidence classification remains visible in code and tests.

## Not yet implemented

This module does **not** currently advance the runtime siege/field-battle scene. Before wiring it into gameplay we still need to determine:

- exactly when a battle day increments;
- whether paused command-window time counts;
- food consumption timing during battle;
- which combat state survives the strategic intermission;
- the exact resume screen and transition timing.

The existing strategic month/turn logic must not infer these details from the number 30.
