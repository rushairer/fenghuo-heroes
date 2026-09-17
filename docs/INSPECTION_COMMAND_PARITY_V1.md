# Inspection Command Parity v1

## Scope

This slice restores the **menu hierarchy** of the odd-month inspection/command phase.
It does not claim that the current numerical command effects are original-game formulas.

## Evidence

Primary structure source:

- Japanese Mega Drive manual:
  https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf

Chinese-ROM cross-checks:

- Chinese overview:
  https://zh.wikipedia.org/wiki/%E4%B8%89%E5%9C%8B%E5%BF%97%E5%88%97%E5%82%B3_%E4%BA%82%E4%B8%96%E7%BE%A4%E8%8B%B1
- Long-running Chinese-ROM player documentation:
  https://www.mobile01.com/topicdetail.php?f=37&t=3156936

## Target hierarchy

### 內政

1. 開發
2. 調動
3. 情報
4. 福利
5. 任命
6. 稅率
7. 教育
8. 運輸
9. 結束

### 外交

1. 同盟
2. 計策
   - 離間
   - 暗殺
   - 火計
3. 情報
4. 借款
5. 還款
6. 結束

The important structural correction is that 離間 / 暗殺 / 火計 are **not** three
top-level diplomacy commands. They are children of 計策.

### 軍備

1. 徵兵
2. 武器
3. 情報
4. 人材
5. 防衛
6. 訓練
7. 結束

The project targets the Chinese-ROM wording `軍備`. Some secondary summaries use
`軍事`; do not silently switch the visible Chinese target label without direct
Chinese-ROM screen evidence.

## 情報 behavior

The original manual explicitly says 情報 can inspect both own and other countries'
status and can be used any number of times in the month.

Runtime behavior therefore is:

1. choose 情報 from any of the three command groups;
2. open the 40-country status browser;
3. C opens the highlighted country's status;
4. C may continue into the officer list/status hierarchy already established by the
   status-screen parity work;
5. B walks back through those screens and finally returns to the original command menu;
6. no city resource is mutated and no prototype formula is executed.

Ordinary command-phase access to the country overview remains read-only with respect to
command targeting; only the explicit 情報 command enables this documented drilldown.

## End-command behavior

The manual explicitly documents an end command that terminates the current month's
orders and advances to the next ruler/phase. Runtime `結束` therefore calls the
existing turn-finalization/save flow; it is not passed to `executeInspection()` as
a fake city action.

## Formula boundary

Menu presence and hierarchy are evidence-backed. Most command **formulas are not**.

At the time of this document, `GameStore.executeInspection()` still contains several
prototype effects created to keep the vertical slice playable (for example fixed gold
costs and fixed development/training increments). Those numbers are engineering
placeholders, not parity facts.

Rules for later work:

- keep menu structure evidence separate from formula evidence;
- replace prototype effects only from manual/ROM/emulator evidence;
- never infer exact formulas from another Three Kingdoms title;
- never promote a prototype number to a parity document merely because it feels
  plausible.
