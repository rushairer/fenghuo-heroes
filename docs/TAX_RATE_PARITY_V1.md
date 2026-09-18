# Tax Rate Parity v1

## Confirmed structure

The Mega Drive retail manual documents 稅率 as a **rate setting**, not an instant
resource command.

It states that the configured rate affects:

- April money income;
- October rice harvest;
- governance/rule when the rate is pushed too high.

Primary source:

- Sega Retro scanned Japanese retail manual:
  https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf

Chinese-ROM player documentation independently confirms that the rate is directly shown
in the city data and affects money/rice income. Long-running Chinese-ROM strategy notes
also document 99 as the maximum player-set rate and describe setting 99 before the
April/October settlements.

Cross-checks:

- https://www.mobile01.com/topicdetail.php?f=37&t=3156936
- https://www.ptt.cc/bbs/Old-Games/M.1298730665.A.ED3.html
- https://home.gamer.com.tw/artwork.php?sn=337133

## Runtime contract

The HD clean-room target now treats tax as persistent configuration:

- valid integer range: 0..99;
- only an owned city may be configured;
- C commits the draft value;
- B cancels without changing state;
- the configured value is saved with the game;
- the country overview displays the value once it exists.

The editor starts at the city's existing rate. If the starting Chinese-ROM rate has not
yet been transcribed, the city remains `null/undefined` until the player explicitly
sets a rate; the UI presents that state as `未設定`.

## Deliberately not implemented yet

This slice does **not** invent:

- the exact April money formula;
- the exact October rice formula;
- the exact per-month governance penalty formula;
- the exact initial tax rate for every scenario/city.

The former prototype behavior — immediately adding money and immediately subtracting
rule when the 稅率 command was selected — has been removed because it contradicted the
documented settlement model.

## Input note

The original project-wide inspection contract uses C as confirm and B as cancel.
Left/right adjusts the HD editor by one percentage point. That adjustment cadence is a
UI implementation detail; it is not claimed as a verified original-frame input rule.
