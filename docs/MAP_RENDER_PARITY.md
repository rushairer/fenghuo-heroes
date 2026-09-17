# Strategy-map render parity

## Evidence used

A captured original Mega Drive strategy screen shows several composition facts that are independent from unknown city coordinates:

- The upper strategic viewport is terrain-first and fills the screen width.
- Ground is an earth/sand palette with dense natural texture; it is not a debug grid.
- Rivers are vivid blue, broad, irregular landscape features.
- Mountain ranges are repeated terrain clusters rather than isolated modern vector markers.
- Fort/city markers are architectural icons with faction flags.
- The lower portion is a light message/dialog area separated from the map by a decorative boundary.
- No evidence supports drawing the current runtime adjacency graph as visible city-to-city roads. The original game supports free route selection by cursor, so the adjacency graph is an implementation scaffold only.
- No evidence in the captured strategic viewport supports the custom persistent black date/ruler HUD that the web prototype previously overlaid at the top.

Visual reference:

- My Abandonware capture of the Japanese Mega Drive release: `sangokushi-retsuden-ransei-no-eiytachi_3.jpg`.
- Original Japanese/Hong Kong manual scans on Sega Retro for the strategy/march composition and input flow.

## Implemented in this pass

- Removed the visible debug grid.
- Stopped rendering the provisional adjacency graph as roads.
- Removed prototype top HUD overlays from the map viewport.
- Added deterministic world-space ground texture (no frame-to-frame random flicker).
- Reworked river rendering with bank/water layers.
- Reworked mountain/forest markers into denser terrain clusters.
- Reworked city markers into fort + flag silhouettes.
- Preserved world-space scrolling, free-route visualization and persistent army markers.

## Explicitly NOT claimed as 1:1 yet

- River path and mountain/forest locations are still clean-room approximations.
- The 40 runtime city coordinates are still provisional and do not yet represent the canonical original map.
- Village positions are not known.
- Exact terrain palette values, tile repetition, city sprite geometry and flag animation timing remain to be measured from emulator captures.
- The current renderer redraws original composition with new code and shapes; it does not copy ROM graphics.

Future changes must keep these unknowns explicit. A prettier approximation must never be relabeled as exact original coordinates or assets without evidence.
