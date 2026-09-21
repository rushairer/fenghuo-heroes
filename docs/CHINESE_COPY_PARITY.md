# Chinese-ROM Copy Parity

Strict 1:1 copy work must distinguish three things:

1. target-edition copy supported by direct evidence;
2. copy corroborated by multiple Chinese-release sources but still awaiting a direct frame;
3. engineering/help text written by this remake.

A Traditional-Chinese rewrite is **not** automatically original-game copy.

## Protected corroborated copy

### Monthly command prompt

Current protected form:

`（君主名），本月想搞什麼？`

Runtime contract:

`src/game/chinese-copy-parity.js`

Status:

- corroborated by multiple independent Chinese-release recollections;
- current runtime wording already matched that recollection before centralization;
- protected against casual wording modernization;
- direct Chinese-ROM frame still pending.

This is intentionally not marked Tier A until a direct target-edition frame or legible
Traditional-Chinese manual page is recorded.

## Explicit strategy copy gaps

Runtime registry:

`src/game/chinese-copy-gaps.js`

The following messages preserve current behavior but are **not** parity evidence:

| Gap ID | Current engineering copy | Status |
| --- | --- | --- |
| `commandEntryHint` | 先把方框移到地图空白处按 C，决定本月是内政、外交还是军备。 | unverified |
| `commandCategoryLocked` | 本月已经决定执行「…」，不能再改成其他类别。 | unverified |
| `ownCityRequired` | 请选择本国城池。 | unverified |
| `confirmCategoryAtCity` | 确定在「…」执行…？ | unverified |
| `foreignCityCommandRejected` | 只能向本国城池下令。 | unverified |
| `retiredAdjacentMarchHint` | 舊版相鄰城市行軍入口已退休… | engineering diagnostic |

The first five require direct Chinese-ROM copy evidence before they may be promoted.
The last item is deliberately a remake diagnostic and should eventually disappear from
a strict parity player flow instead of being “translated into original copy”.

## Rules

- Do not silently convert Simplified characters to Traditional and call that parity.
- Do not infer wording from the Japanese edition when the Chinese edition can differ.
- Do not keep raw unverified strategy copy inside scene code; route it through an
  explicit gap contract.
- A copy gap closes only with source ID + edition + page/frame reference + exact text.
- A diagnostic string is not a copy gap; the correct long-term fix may be removing the
  diagnostic path entirely.

## Immediate capture targets

1. monthly command category screen;
2. invalid/non-owned city selection response;
3. category already chosen response;
4. city/category confirmation screen if the original actually has one;
5. odd-month survey instructions and bottom dialog;
6. even-month march root prompt;
7. save confirmation prompt.

Where the original has no equivalent explanatory message, remove the remake-only
message rather than inventing retro-styled copy.
