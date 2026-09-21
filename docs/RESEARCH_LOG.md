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

See `docs/PARITY_EVIDENCE_CATALOG.md` for source tiers and promotion rules.

## Evidence queue

1. Official Hong Kong / Traditional Chinese manual scan: use for exact terminology and page anatomy.
2. Japanese initial-settings screenshot: use for measurable screen geometry where HK screenshot is unavailable.
3. Chinese-ROM 189 full-map captures: establish 40 city coordinates and visible opening ownership.
4. Chinese-ROM field-map captures at known cursor locations: measure the actual logical movement grid.
5. Village-complete sweep: establish every village coordinate plus complete coverage evidence.
6. Long-form emulator recordings: measure route-step timing, monthly movement boundary, siege and duel transitions.
7. 189 city-status sweep: capture starting gold/food/troops/development/rule/defense/training.
8. Officer-status/city-assignment sweep: establish exact opening placement.
9. Independent 200 and 215 opening captures; never inherit 189 state.
10. Community recollections: use as leads only until corroborated by manual or reproducible footage.

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


## Current observation leads that are not coordinate evidence

The detailed Mega Drive play log at
https://saitamat.blog.fc2.com/blog-entry-378.html describes the field as a free map
made of fine square cells, with armies moving cell-by-cell, and observes START opening
the full map. This is useful for movement/grid calibration.

It also reports that officers act once per month and that selecting one of
domestic/diplomacy/military constrains the turn to that command category. These remain
behavior-calibration leads until the corresponding manual page or repeatable capture is
recorded.

The Chinese-ROM long-form playthrough at
https://www.bilibili.com/video/BV1i4421F7cq/ is the current highest-priority frame
source for 189 map/ownership/timing capture. Record frame references and measurements;
do not copy the video asset into the repository.
