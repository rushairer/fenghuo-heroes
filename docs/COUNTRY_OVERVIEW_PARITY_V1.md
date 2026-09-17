# Country Overview Parity v1

## Confirmed original fields

The Mega Drive retail manual describes `統治國一覽` as a 40-country list whose
governance columns are:

1. 產值 / 産業値
2. 武將數
3. 統治度
4. 稅率

The previous prototype instead showed ruler and troop count. Those columns were useful
for an early vertical slice but did not match the documented overview screen.

## Visibility rule

The manual states that all 40 countries are listed while the governance details shown
by the ordinary overview are for the player's own territory.

The explicit `情報` command is separately documented as allowing inspection of own
and other countries. Runtime therefore uses the same 40-country browser with two
visibility modes:

- ordinary overview: governance fields are exposed only for the active player's cities;
- explicit 情報 command: governance fields may be revealed for other countries.

## Evidence boundary

Current runtime development/rule numbers are still prototype game-state values, not a
claim that the starting Chinese-ROM values are calibrated.

Two fields deliberately remain `—` unless verified state exists:

- per-city officer count: opening faction rosters are known, but per-city officer
  placement is not yet verified;
- tax rate: the field is known, but per-city starting tax rates have not been
  transcribed from the Chinese ROM.

Do not infer either value from history, another Three Kingdoms game, or faction-wide
rosters.

## Source

- Sega Mega Drive Japanese retail manual, `統治国一覧` section.
