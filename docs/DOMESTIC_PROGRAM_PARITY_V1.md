# Domestic Continuous Programs Parity v1

## Confirmed original structure

The original Mega Drive manual documents both 開發 and 福利 as continuing domestic
programs rather than one-shot city actions.

For both commands the player chooses:

- a responsible officer;
- a monthly budget.

Once configured, the game can continue the program month after month without requiring
the player to recreate it every domestic phase.

Primary source:

- Sega Mega Drive Japanese retail manual:
  https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf

Independent play records describe the same model:

- https://saitamat.blog.fc2.com/blog-entry-378.html
- https://www.ptt.cc/bbs/Old-Games/M.1298730665.A.ED3.html

The manual further confirms the intended result categories:

- 開發 raises national production / 産業値;
- 福利 raises 統治度;
- the result depends on budget and the responsible officer's ability.

## What this slice changes

The previous vertical slice implemented invented one-shot formulas:

- 開發: fixed gold cost followed by a fixed development increase;
- 福利: fixed gold cost followed by a fixed rule increase.

Those formulas are not original-game evidence and have been removed.

The command schema now marks both commands as `program` with:

- `continuous: true`;
- required `officer`;
- required `monthlyBudget`;
- a documented result target;
- an explicitly unverified effect formula.

Until the configuration UI can be backed by verified city officer placement and budget
input rules, choosing either command does not mutate city resources or stats.

## Evidence boundary still blocking full activation

Two pieces are intentionally unresolved:

### Per-city officer placement

The repository has evidence-backed 189 faction opening retinues, but it does not yet
have a verified mapping of every officer to every city. Faction-wide opening rosters
must not be silently presented as city-local officer lists.

### Budget input limits and step

The manual confirms that a monthly budget exists. Player reports demonstrate many
actual values (for example 200, 300, 500 and 4000), but that does not prove the original
minimum, maximum, or controller step size.

The HD remaster therefore does not invent a 999 / 9999 cap or arbitrary 100-unit
controller step and label it as original behavior.

## Next activation gate

A future slice may enable the real configuration UI after one of these evidence paths
is satisfied:

1. repeatable emulator capture of the Chinese-ROM 開發 / 福利 setup screens; or
2. a readable Chinese manual/guide that establishes city-local officer selection and
   the budget editor's numeric bounds.

The effect formula itself is a separate gate and remains unimplemented until verified.
