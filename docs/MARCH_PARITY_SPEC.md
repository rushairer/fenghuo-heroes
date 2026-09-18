# 行軍 Parity Spec

## 已由說明書直接確認

Mega Drive 原版說明書的行軍章節明確描述：

- 偶數月出現行軍指令。
- 從城內選擇出陣武將。
- 決定軍資金與兵糧。
- 用光標在中國地圖上指定到目的地的路線，按 C 決定。
- 行軍中同樣消耗兵糧。
- 每日兵糧消耗公式：`全體士兵數 ÷ 100 + 武將數`。
- 兵糧耗盡會造成士兵脫落與武將體力下降。
- 已在行軍中的部隊可再次選擇「移動」並重新指定路線。
- 兩隊以上共同行軍時存在「分散」。
- 部隊進入村莊時出現「補給」，可購買武器、米與治療武將。
- 接近行軍中的敵部隊時出現「攻擊」。
- 接近敵城時出現「攻城」。
- 結束本月命令後才執行行軍移動。

來源：

- https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf
- https://segaretro.org/images/c/c3/Sangokushiretsuden_md_HK_manual.pdf.pdf

## 本輪已實現

- 行軍部隊改為世界地圖上的持久實體，不再用「相鄰城市列表 → 瞬移戰鬥」作為主流程。
- 出陣界面加入兵力、軍資金、兵糧和路線入口。
- 路線由地圖方框逐格指定；B 撤回一格，C 決定。
- 行軍中部隊可再次選擇並重新指定路線。
- 行軍部隊菜單改為按原作條件動態顯示：移動常駐；兩隊同點時顯示分散；敵行軍部隊鄰接時顯示攻擊；敵城接近時顯示攻城。\n- 補給不再作為常駐假選項；必須等村莊座標/進村判定校準後才出現。
- 每日兵糧公式按說明書建立為可測試函數。
- 最後一位玩家結束偶數月命令時，才統一執行已下達的行軍路線。
- 行軍部隊在地圖上以勢力旗幟顯示並保留兵力/兵糧狀態。
- 攻城不再使用 `攻擊兵力 × 1.12 >= 防守兵力` 的虛構瞬時勝負公式；攻城部隊保留在地圖狀態中。
- 攻城準備已按說明書建立戰鬥速度「普通／快速」與每部隊最多 15 小隊的明確邊界；尚未確認的小隊分兵公式不猜測。
- 攻城前直接進入一騎討的捷徑已退休；一騎討只能在後續部隊戰中按原作接觸流程重新接入。

## 仍待實機校準

- 每一格實際代表多少行軍日數。当前先以一個路線節點消耗一天作工程基線，不宣稱為原版數值。
- 一個偶數月內實際最多執行多少日/多少格。当前 30 節點只是月曆基線，待錄屏計時後替換。
- 缺糧後每一天的士兵脫落數與武將體力下降公式。
- 全部村莊精確座標及各村補給內容。
- 分散部隊的武將/兵/糧分配界面。
- 敵軍「鄰接才出現攻擊」的菜單條件已建立；目前以一個 8px 路線步長作工程鄰接基線，精確接觸判定仍待實機校準。\n- 野戰/攻城的戰鬥速度與 15 小隊上限已建模；小隊兵力分配、實時移動、攻擊、傷害、勝負與戰後處理仍待校準。
- 運輸隊與截糧仍待校準。
- 攻城失敗後部隊實際退卻路徑。

以上未校準項不得標記為 1:1 完成。

## Retired prototype path

The original clean-room vertical slice exposed `GameStore.planMarch(from,target)` as an
adjacent-city shortcut that immediately removed troops and created a conflict. That
model contradicts the evidence-backed march flow now implemented by `game/march.js`:
officer/resource composition, free route drawing, persistent world-map armies and
later siege entry.

The legacy API is therefore a hard failure and must never be used as a compatibility
shortcut. Tests explicitly require it to leave city state and pending-conflict state
unchanged. Any future march work must extend the persistent route/army model instead.
