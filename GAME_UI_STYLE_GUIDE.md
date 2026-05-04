# Game UI Style Guide

## Design Language

The game uses a restrained late-Han military dossier style: dark lacquer panels, warm gold borders, compact command grids, and parchment-gold controls. The interface should feel like a strategy command board, not a marketing screen.

## Screen Families

- Title screens: cinematic backdrop, centered title, one vertical action stack.
- Full campaign screens: outer frame, title at top left, context at top right, content panels in a 12-column grid, footer actions at bottom.
- Strategy map screens: map panel left, intelligence panel right, command bar bottom.
- Modal command layers: full-screen dark mask, centered panel, title row, command grid, one cancel/back action.
- Confirmation dialogs: dark mask, centered compact panel, structured actor/target/scope/effect rows, confirm/cancel pair.
- Battle screens: top force summary, board left, status/action panel right, log footer.

## Layout Rules

- Canvas reference size is 1280 x 760.
- Outer frame: x 42, y 34, width 1196, height 690.
- Page content begins at y 140 and ends before y 570.
- Footer command bars occupy y 584-706.
- Footer command bars must reserve a left primary-command zone and a right auxiliary-command zone separated by a subtle divider when both groups are present.
- Modal masks must cover the full canvas with at least 0.48 opacity.
- Modal panels must not include extra decorative bands unless they carry readable text.
- Modal action buttons always belong inside the current panel. Secondary and tertiary layers must not place cancel/back/confirm controls outside the panel border.
- Standard command modal: center `(640, 402)`, size `820 x 470`, left inset `58`, title at `top + 58`, helper text at `top + 112`, option grid at `top + 202`, action row at `top + 410`.
- All command-family layers use the same option grid: 3 columns, 230 px column pitch, 82 px row pitch, 168 x 40 buttons.
- All modal action buttons use one fixed size: `150 x 38`. A single action is centered at x `640`; two or three actions are centered as a group using the shared modal action gap.
- Modal option buttons and modal action buttons must be created through the shared helpers, not direct `makeButton` calls with per-screen widths.
- Confirmation dialogs use the same modal title and action-row offsets. They may use a narrower panel only when the content remains aligned to the same inset rhythm.
- Opening a confirmation dialog must clear the previous command-selection modal first; do not leave a prior modal panel visible behind the new mask.
- Repeated command choices use a 3-column grid, 168 x 40 buttons, 82 px row pitch.
- Button labels include fixed shortcut letters only in persistent footer commands.
- Lists and tables must render through a bounded viewport. If the data can exceed the visible area, show a pager inside the same panel instead of allowing item rows to push into buttons, footers, or sibling sections.
- List item cards must reserve separate regions for portrait, title, metadata, stats, and action button. Multi-line stats stay inside the card and never share the same horizontal lane as the action button.
- Tables use fixed column x positions and column widths. Do not align table data with space-padded strings.

## Typography

- Page title: Georgia 42-46 px, gold, dark stroke.
- Section title: Georgia 30-34 px, gold.
- Body text: Microsoft YaHei/Arial 16-20 px.
- Dense stat text: 15-17 px, line spacing 2-6.
- Compact two-column stat panels may use 14-15 px text with fixed label/value columns.
- Buttons: 18-21 px, centered, fixed width and height.
- Long Chinese text should be manually shortened or split with explicit newlines when Phaser wrapping is unreliable.

## Color Tokens

- Backdrop veil: `0x071017` at 0.90-0.94.
- Main panel: `0x101722` at 0.95-0.98.
- Sub panel / command bar: `0x21160f` at 0.86-0.97.
- Border gold: `0xd4af37`.
- Highlight gold: `0xf8df9d`.
- Body text: `#f8ecd0`.
- Muted text: `#ead7b3`.
- Button fill: `#f5d487`; hover `#ffe7a6`; text `#21140f`.

## Interaction Rules

- Persistent strategic shortcuts:
  - `D` 内政, `F` 外交, `M` 军事, `N` 月令, `V` 势力, `P` 人事, `S` 机能.
- March shortcuts:
  - `A` 部队, `R` 路线, `G` 移动, `X` 攻击, `B` 情报, `C` 截粮, `Z` 占村, `Q` 撤退, `W` 待机, `N` 月令.
- Battle shortcuts:
  - `Q/W/E/R` 选择我方武将；`M` 移动, `A` 攻击, `T` 计略/救护, `W` 待机, `G` 委任, `X` 撤退.
- Equivalent actions must keep the same shortcut at every layer.
- Only the primary next-step button gets central emphasis; cancel/back stays lower priority.
- No page should require users to visually separate stacked menus without a mask.
- Pagination controls are part of the content panel, not footer commands. Use them only for overflow within the current list/table.

## Acceptance Checklist

- No visible text overlaps a button, panel border, or another text block.
- Long lists and table-like areas have a viewport or pager, with no item content hidden under action buttons.
- City markers and labels stay inside the map panel.
- Right intelligence panels never overflow vertically.
- Footer buttons fit within the command bar at desktop canvas size.
- Every modal layer visibly separates itself from the underlying page.
- Sibling command-selection screens share title, helper text, option grid, and cancel placement.
