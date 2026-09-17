# Original-game research log

## High-confidence facts already driving code

- Mega Drive title released by Sega in 1991.
- Strategy/simulation game with 1–3 human-controlled rulers.
- Initial setup exposes three scenarios: 189, 200 and 215.
- Difficulty has three levels.
- Setup also exposes animation display and text-speed options.
- The campaign alternates odd-month "inspection" and even-month "march" play.
- Inspection commands are grouped into domestic, diplomacy and military.
- Public manual material describes a main screen with access to owned-territory status and an overall map.
- Battle flow includes marching armies, attacking cities and transport units, siege/battle screens and a manually controlled duel.
- Public catalog material states that the goal spans 40 castles/cities.

## Evidence queue

1. Official Hong Kong / Traditional Chinese manual scan: use for exact terminology and page anatomy.
2. Japanese initial-settings screenshot: use for measurable screen geometry where HK screenshot is unavailable.
3. Manual map page: use to replace current 40-city scaffold coordinates/topology.
4. Long-form emulator recordings: use only for timing and observable state transitions, not for copying assets.
5. Community recollections: use as leads only until corroborated by manual or reproducible footage.

## Known facts requiring stronger calibration

- Exact Chinese title-screen text and title-art timing.
- Initial ownership for all three scenarios.
- City labels and road topology in the official Chinese version.
- Exact resource labels/ranges and command cost formulas.
- Free-march speed, route editing, supply consumption and interception.
- Siege formation behavior.
- Duel hit boxes, weapon reach, damage and AI.
- Succession / ruler-death rules.

## Rule for future implementation

No mechanic moves from "plausible" to "parity fact" because it appeared in the previous repository. It must have a manual/screenshot/recording evidence reference.
