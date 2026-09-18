# Transport parity

## Evidence-backed behavior

The original Japanese manual (command reference, page 21) describes transport as sending supplies to another territory owned by the player and exposes exactly three cargo choices:

- 金1萬
- 米1萬
- 金＋米

A long-form player report clarifies the combined option as 10,000 gold plus 10,000 food. Chinese community reports also describe transport as a map unit whose cargo can be taken when an enemy marching unit overlaps it.

References:

- https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf
- https://saitamat.blog.fc2.com/blog-entry-378.html
- https://zhidao.baidu.com/question/43571226.html

## Implemented now

- source must be a player-owned city;
- destination must be a different player-owned city;
- the cargo menu is fixed to the three original choices;
- availability is checked against the source city's current gold and food;
- B cancels back one workflow level and never exits the active game.

## Deliberately not implemented yet

The exact transport-unit route, movement rate, dispatch timing, interception timing and delivery timing still need direct gameplay calibration. Until those are verified, choosing a cargo option does **not** subtract resources or create a fake transport unit.

This boundary is intentional: transport may only mutate resources once the map-unit lifecycle is evidence-backed.
