# Field battle parity

## Evidence-backed controls

The Mega Drive manual documents a real-time unit-battle control layer separate from the strategic map.

Known behavior:

- A opens the two armies' status/strength window.
- B closes/cancels an open window.
- C opens the command window.
- The command window pauses the real-time battle while orders are selected.
- Outside a command window, up/down can scroll the battlefield.
- The command set includes directional movement, movement toward the enemy commander, wait, and retreat.
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
