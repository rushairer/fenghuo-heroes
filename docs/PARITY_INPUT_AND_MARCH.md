# Input & March parity notes — 2026-09-17

## Safe B-button contract

`B` is a cancel/back button inside menus. On the root strategy map it no longer exits to the title screen. This is enforced twice:

1. `StrategyScene.updateMap()` consumes root-map B without navigation.
2. `App.go('title')` blocks accidental title navigation while an active strategy scene owns a live game, unless a future explicit quit flow passes `force: true`.

This prevents a single accidental B press from interrupting an active game.

## March-order sequence

Public manual evidence and a long-form play report agree that deployment is not a single direct route-edit screen. The sequence is:

1. choose officers;
2. choose military funds;
3. choose provisions;
4. show a dedicated prompt asking the player to decide the route;
5. only then enter cursor route editing and confirm with C.

The current implementation now restores step 4 instead of jumping immediately into route editing.

The officer roster step is still blocked on the verified officer database and remains explicitly marked as incomplete.

## Provisions are expressed as days

The manual gives the daily consumption formula:

`daily provisions = total soldiers / 100 + officer count`

Contemporary play notes also describe the original UI as asking how many days of provisions to carry, with values reaching at least 999 days. The HD replica therefore edits `兵糧日數` and derives the actual grain amount from the daily formula. The available city grain remains the hard upper bound.

Evidence:

- Sega Retro scanned Mega Drive manual, march-command section.
- 埼玉帝国 第83回：三国志列伝 乱世の英雄たち (その2), detailed play-flow notes.
