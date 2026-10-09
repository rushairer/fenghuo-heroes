# Field battle parity

## Evidence-backed controls

The Mega Drive manual documents a real-time unit-battle control layer separate from the strategic map.

Known behavior:

- A opens the two armies' status/strength window.
- B closes/cancels an open window.
- C opens the command window.
- The command window pauses the real-time battle while orders are selected.
- Outside a command window, the D-pad scrolls the battlefield in all four directions.
- The documented command families are 移動, 計略, 攻城, 退卻, 待機 and 結束. 計略 includes 火計, 落石, 止足, 挑發, 說得 and 連環 with range/terrain conditions.
- Retreat is not immediately available at battle start; the manual says it becomes available after some time, but the exact duration is not yet measured.
- A full unit is not considered retreated until its commander leaves the battlefield.

References:

- Mega Drive Japanese manual, unit-battle control pages:
  https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf
- Public play records used only as corroboration where they match the manual.

## Implemented in this round

The control semantics above are encoded in `src/game/field-battle-parity.js` and protected by tests.

This is intentionally a **contract**, not a fabricated battle engine. It does not guess:

- exact command-window geometry;
- number or shape of directional icons;
- movement speed;
- retreat unlock duration;
- damage / morale / attack formulas;
- collision, capture or victory formulas.

Those are required before the runtime real-time battle scene can be called 1:1.


## Runtime integration — 2026-09-25

- 行軍「攻擊」對鄰接敵行軍部隊現在會立即建立 `field` conflict 並進入部隊戰。
- 戰鬥準備復用「普通／快速」速度選擇與每部隊最多 15 小隊的已確認邊界。
- runtime 已接入 A=雙方戰力、B=關閉窗口、C=命令窗口、窗口外上下捲動畫面。
- 方向移動、向敵總大將移動與待機只保存命令語義；未校準速度、碰撞、傷害不做推測。
- 退卻仍保持鎖定，直到取得「戰鬥進行一段時間後」的精確解鎖時機。
- 本階段不改兵力、不判勝負、不修改城池歸屬。


## Persistent runtime state

The field-battle runtime now persists its preparation phase, selected speed, current
semantic order and whether the current battle day's orders have been closed. Reloading
a save therefore resumes the battle contract instead of silently returning to speed
selection.

The runtime intentionally stops at the evidence boundary:

- 移動 records command intent but does not invent squad coordinates or speed.
- 計略 exposes the documented tactic family, but range/terrain conditions gate tactics
  whose conditions are known and no success/damage formula is fabricated.
- 攻城 is unavailable unless an enemy-city-contact condition is represented.
- 退卻 remains gated because its exact availability timing still requires direct
  calibration.
- 待機 records the order; the documented forest ambush condition (兵力 5000 以下)
  is retained as evidence but ambush effects are not invented.
- 結束 closes command entry until a future calibrated battle-day transition reopens it.

The A-button strength window now projects the documented troops / attack / morale
fields. Unknown attack and morale values remain blank rather than being synthesized.


## Terrain/tactic condition closure

The runtime now enforces the manual-confirmed terrain conditions before a tactic can be selected:

- 火計: enemy in mountain, forest or river.
- 落石: own unit on mountain and enemy on plain.
- 止足: enemy on mountain or in forest.
- 連環: enemy in river.
- 挑發 / 說得 remain range-gated by the parent 計略 availability.

待機 also records the documented ambush condition: a unit with 5,000 troops or fewer waiting in forest enters ambush state. The combat effect of ambush remains uncalibrated.

The persisted battle runtime also records battle day, ambush state and the observed 30-day carryover boundary without assigning a winner.

## 2026-10-08 — explicit battle pause and resume

Both field-battle and siege scenes now use P to open an explicit
save-and-return-to-title confirmation. C/START saves and returns; B cancels
the confirmation. Field-battle Escape/B must no longer erase a conflict
as a shortcut, because retreat availability and combat consequences are
not calibrated. Returning to the title retains the pending conflict
and Continue routes back to its battle scene. This is an engineering
safety control, not a claimed original-ROM key binding.

## 2026-10-09 — battle scene state synchronization and manual-day bridge

- Field and siege scene references are refreshed after mutation because
  ensureFieldBattleRuntime/ensureSiegeRuntime normalize into new objects.
  Previously, battle orders could persist but the scene still displayed stale
  ordersClosed or siege attack count. Dedicated scene tests cover both.
- After the field-battle 結束 command closes a battle day's orders, START
  explicitly advances exactly one in-memory day and reopens commands.
  This is an **engineering-only/manual bridge** because original real-time
  frame-to-day conversion and troop-combat effects have not been calibrated.
- The observed day-30 boundary sets carryoverPending and blocks further
  manual advance. It does not invent a winner, automatically discard a battle
  or pretend the strategic-month handoff has been restored.
- P saves and returns to title without resetting battle armies or results.
  Continue resumes the same pending conflict.

## 2026-10-09 — Battle-day lifecycle invariants

The observed 30-day segment is now enforced at the runtime boundary, not
only by the scene. An explicit manual day advance requires `phase=battle`,
a closed day (`end` command), and a one-day increment. Once the end order
is accepted, no order may overwrite it until the next day. Day 30 disables
additional advances, order reopening, or new orders until a separately
verified strategic carryover mechanism exists.

Legacy invalid saved battle-day numbers are bounded to day 30, with
`carryoverPending` and `ordersClosed` normalized consistently.
Only a valid strategy order may carry a known tactic ID.

This improves deterministic state transitions and save integrity without
inventing a duration, AI turn, casualties, or victory rules.

The old `reopenFieldBattleOrders` helper now delegates to the guarded
one-day transition rather than resetting `ordersClosed` within the same
day. It can no longer bypass an end-order or a day-30 carryover barrier.

## 2026-10-09 — Two-step movement command, no fabricated motion

The battlefield command `移動` now opens its actual input structure:
select one of the attacker army's **existing named officers**, then select
a destination using the D-pad. C commits a source-qualified semantic order;
B returns one step or cancels the uncommitted draft. The draft and completed
order are retained in the active pendingConflict and can survive P/Continue
save/load, including a pause midway through choosing a target.

The current destination cursor uses a bounded 8-logical-pixel engineering
input grid inside 320x224. This grid is a provisional UI interaction aid,
not a measured original tactical map cell size. A committed order only
records `{officerName,target}` and does NOT move any squad, update
world coordinates, consume food, determine contact or apply damage.
The engine verifies that the officer is in the recorded participating
army roster and that the target stays on the provisional cursor grid;
invented officers or out-of-bounds targets cannot enter a saved order.

The deterministic inspection entry is `?qa=field-battle-move`.

## 2026-10-09 — Shared editable squad formation (non-combat preview)

Field battle and siege now share `src/game/battle-formation.js`.
A formation draft is keyed to the *existing* attacker officer roster
(no forged commanders). During preparation, A selects the next officer,
UP/DOWN selects infantry/cavalry/archers, LEFT/RIGHT changes that
officer's tentative squad count, C opens review and confirms, and
B returns one step. The total is bounded at 15 for each commander
unit; rank-specific ceilings, exact individual squad troop counts,
and allocation conversion formulas remain unverified.

`formationDraft` and `formationPlan` persist within `pendingConflict.runtime`
and survive closing and reopening the application, including mid-edit
restoration and subsequent reloading of the completed plan.
Validation rejects enemy/unlisted officers, malformed values or excess
squads. The confirmed plan is explicitly tagged
`{status:'uncalibrated-preview',applied:false}` and has zero effect
on city troops, strategic armies, tactics, formations on the battlefield,
morale, damage, siege defense, or battle outcome.

This is a user-operable *input and persistence layer* for subsequent
Chinese-ROM calibration, not a claim that precise formation rules
or combat itself are finished. The QA screenshots are available as
`?qa=field-battle-formation`, `?qa=field-battle-formation-review`,
`?qa=siege-formation`, and `?qa=siege-formation-review`.

Field battle orders (including ambush and day advances) and siege
attack intents now also roll back their runtime mutations if saving
the player's battle state fails.
