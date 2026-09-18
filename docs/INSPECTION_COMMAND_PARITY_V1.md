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
   - 太守
   - 軍師
   - 官職
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


Chinese-ROM player documentation also records 任命 as a second-level structure with
太守 / 軍師 / 官職 panels. Runtime now restores those three entries, but appointment
eligibility and effects remain blocked until officer city assignment, ability
thresholds and the office table are verified.

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

The old vertical slice once contained fixed placeholder effects such as fixed gold
costs, fixed development/training increments, a fixed +300 loan and a food-ratio
recruitment formula. Those prototype mutations are now retired. A command whose
`effectEvidence` remains `unverified-formula` must not change city resources,
troops, governance, defense, training, diplomacy or officer state.

The only numerical/configuration behavior that may mutate state is behavior already
moved into an evidence-specific module (for example the persistent 0-99 tax-rate
configuration). Settlement formulas remain separate and unimplemented until verified.

### Qualitative evidence already useful for the next slices

Chinese-ROM player documentation gives several workflow-level facts that are useful
without pretending they are exact formulas:

- 開發 uses an executing officer and a user-chosen money investment; player reports
  associate better results with higher intelligence.
- 福利 uses an executing officer and a money investment; player reports associate
  the command with governance/unification improvement and officer virtue.
- 教育 targets non-ruler officers and accepts a money investment; reports describe
  loyalty/virtue effects, including a known 1-gold edge case.
- 借款 / 還款 require an alliance relationship.
- 訓練 cost is related to the soldiers carried by the trained officer and affects
  morale; the exact cost/result formula is not yet verified.
- 運輸 is an own-city-to-own-city resource workflow and may create an interceptable
  transport unit on the march map.

These are **workflow clues**, not permission to invent numbers.

Rules for later work:

- keep menu structure evidence separate from formula evidence;
- implement input/target/amount state machines before numerical effects when only the
  workflow is known;
- replace blocked effects only from manual/ROM/emulator evidence;
- never infer exact formulas from another Three Kingdoms title;
- never promote a community heuristic or prototype number to a parity fact.
