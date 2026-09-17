# Chinese-ROM city evidence v1

This file records why the project keeps more than one 40-city ordering instead of presenting one list as universally canonical.

## Stream A — RAM / cheat-table order

Source family: long-running Chinese-ROM memory-address / cheat-code tables.

Representative source:
- https://www.ng173.com/thread-152866-1-1.html

This source is useful because city resources are listed against repeatable RAM addresses. Its sequence is therefore stored as `ZH_ROM_RAM_CITY_ORDER`.

**Do not infer that RAM address order equals the visible in-game country-number order.**

The source prints one slot as `臨溜`; independent officer-location tables identify the corresponding city as `臨淄`. Both spellings remain recorded in the evidence layer.

## Stream B — numbered 189 exploration/officer guide

Representative sources:
- https://home.gamer.com.tw/artwork.php?sn=337133
- https://www.ng173.com/thread-356640-1-1.html

These guides explicitly number the 189 exploration locations `01` through `40`, so their sequence is stored separately as `ZH_ROM_NUMBERED_GUIDE_CITY_ORDER`.

The numbered guide uses `蘇縣` where the RAM stream uses `薊縣`, and `故藏` where the RAM stream uses `姑藏`. These disagreements remain unresolved until a direct Chinese-ROM capture or readable Chinese manual settles the exact display text.

## Safe conclusions

- Both streams contain 40 city slots.
- After accounting for the two unresolved name variants above, both streams describe the same city-name set.
- The two streams use very different ordering.

## Not yet safe to infer

Neither source by itself proves:

- exact world-map coordinates;
- road/route geometry;
- village coordinates;
- scenario-specific city ownership;
- that RAM order is visible country numbering;
- that the numbered guide order is internal RAM order.

Runtime `CITIES` therefore remains a separate scaffold until spatial/scenario evidence is strong enough to migrate it deliberately.
