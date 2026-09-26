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
- 兩隊以上共同行軍時才出現「分散」。
- 部隊進入村莊時才出現「補給」，可購買武器、米與治療武將。
- 與行軍中的敵部隊鄰接時才出現「攻擊」；選定後立即切換到部隊戰畫面。
- 與敵城鄰接時才出現「攻城」。
- 「結束」完成本國本月的行軍命令；各國策略完成後才執行行軍移動。

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

- 「攻擊」已不再停留在提示訊息：鄰接敵行軍部隊後會建立持久 `field` conflict 並立即進入部隊戰控制層。
- 部隊戰 conflict 保存攻守雙方 army ID、武將名冊、兵力與進入戰鬥前狀態；目前不套用任何未校準傷害公式。
- pending conflict 隨存檔恢復，避免頁面重載後部隊仍為 engaged 但戰鬥本身消失。

## 行軍人員與回合一致性

- 出陣武將優先使用 source-backed 的城市配屬；只有配屬尚未校準的 scaffold 才退回開局勢力名冊。
- 已隨其他己方部隊出陣的武將不再出現在新的出陣候選中，底層 queue 也會拒絕武將重複出陣。
- engaged / besieging 部隊不能在戰鬥未結束時改寫行軍路線。
- 行軍部隊菜單的「結束」現在真正結束本國本月行軍命令；最後一位玩家結束後才統一執行行軍移動。
- 攻城中止會恢復進入攻城前的部隊狀態，而不是一律改成 waiting。

## 仍待實機校準

- 每一格實際代表多少行軍日數。当前由 `march-runtime-projection.js` 明確標記 `routeNodeDays=1` 為工程基線，不宣稱為原版數值。
- 一個偶數月內實際最多執行多少日/多少格。当前 `executionDaysPerEvenMonth=30` 只是工程月曆基線，待 direct observation 校準後替換。
- 缺糧後每一天的士兵脫落數與武將體力下降公式。
- 全部村莊精確座標及各村補給內容。
- 分散部隊的武將/兵/糧分配界面。
- 「敵軍／敵城鄰接才出現攻擊／攻城」屬說明書直接確認；但目前空間投影仍是工程基線：route step 8 world units、敵軍 8 world units、敵城 24 world units、共同進軍暫以同一地圖座標判定。這些數值集中在 `march-runtime-projection.js`，都不是原作數值。`march-evidence.js` 只有在正/負邊界觀測形成精確一格臨界時才接受新的 adjacency 值。
- 野戰/攻城的戰鬥速度與 15 小隊上限已建模；小隊兵力分配、實時移動、攻擊、傷害、勝負與戰後處理仍待校準。
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


## Direct observation calibration pipeline

The direct-observation ledger is `src/game/canonical-march-evidence.js` and is currently empty/blocked.

The calibration workflow is:

```text
local Chinese-ROM image/video
  -> tools/march-evidence-capture.html
  -> single-source verified:false batch
  -> march:evidence:merge
  -> human review / source verification
  -> march:evidence:audit
  -> march-calibration runtime diff
```

Evidence inference is deliberately conservative:

- route-cell size requires matching horizontal and vertical one-cell observations;
- cell/day timing requires at least two equal integer ratios;
- month execution length requires at least two unfinished-route monthly windows with the same day count;
- attack/siege adjacency requires both the last visible-command distance and the next unavailable distance;
- starvation observations are stored, but no casualty/HP formula is fitted yet.

See `docs/MARCH_EVIDENCE_CAPTURE.md`.
