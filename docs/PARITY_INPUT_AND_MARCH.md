# Input & March parity notes — 2026-09-17

## Safe B-button contract

`B` is a cancel/back button inside menus. On the root strategy map it never exits to the title screen. This is deliberately enforced at multiple layers:

1. base `strategy.js` consumes root-map B without navigation;
2. `strategy-march.js` independently does the same for the even-month march root;
3. the parity/final StrategyScene inheritance keeps the same contract;
4. `App.go('title')` blocks accidental title navigation while an active strategy scene owns a live game, unless a future explicit quit flow passes `force: true`.

Automated tests execute root B against the base strategy class, march class, and final exported strategy class in both odd- and even-month modes. This prevents a single accidental B press from interrupting an active game even if the inheritance chain changes later.

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
