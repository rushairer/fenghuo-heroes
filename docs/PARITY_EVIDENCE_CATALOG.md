# Parity Evidence Catalog

This catalog defines what each source is allowed to prove. It exists to prevent a
plausible recollection, guide or historical map from silently becoming canonical game
data.

## Confidence tiers

### Tier A — direct target evidence

Use directly for parity when the edition is applicable and the referenced page/frame
is recorded.

- Official manual scan.
- Direct Chinese-ROM screenshot.
- Direct Chinese-ROM video frame / reproducible emulator capture supplied lawfully.

Tier A may establish exact visible copy, layout, coordinates, input behavior or values
when the source actually shows them.

### Tier B — repeatable observed play

Long-form play recordings and detailed play logs from the correct Mega Drive title.

Use for:

- observable state transitions;
- order of prompts;
- movement behavior;
- timing leads;
- scenario/ownership leads that can later be frame-verified.

Do not promote a Tier B statement to an exact coordinate/value when the frame/value is
not directly captured.

### Tier C — community recollection / guide

Use only as a research lead unless independently corroborated.

Never use historical geography or another Three Kingdoms game as a substitute for
Chinese-ROM map evidence.

## Current sources

### JP Mega Drive manual — Tier A

Source:

- https://segaretro.org/images/8/8a/Sangokushiretsuden_md_jp_manual.pdf

Can establish:

- screen/input semantics documented by the manual;
- odd/even month flow;
- march command sequence and documented provision formula;
- full-map function and screen anatomy;
- battle command families documented in the manual.

Cannot establish by itself:

- exact Traditional Chinese strings;
- Chinese-ROM edition-specific ruler counts or spelling variants;
- Chinese-ROM city coordinates unless a page directly depicts the target layout and
  the edition difference is resolved.

### HK / Traditional Chinese manual scan — Tier A when legible

Source currently referenced by the project:

- https://segaretro.org/images/c/c3/Sangokushiretsuden_md_HK_manual.pdf.pdf

Priority use:

- exact Traditional Chinese command terminology;
- exact Chinese-edition screen copy;
- edition-specific differences from the Japanese manual.

Every adopted string/value still needs a page reference.

### 埼玉帝国 play log, part 1 — Tier B

Source:

- https://saitamat.blog.fc2.com/blog-entry-378.html

Observed leads:

- the field map is free-map rather than point-to-point;
- the world is described as a fine square grid and armies move through it cell by
  cell;
- START exposes the full map;
- officers are observed as acting once per month;
- one inspection category (domestic/diplomacy/military) is selected for the turn;
- transport uses the three fixed cargo choices already protected elsewhere.

These observations are valuable for behavior calibration, but exact grid size, movement
days and formulas still require direct frame/timing capture.

### 埼玉帝国 play log, part 2 — Tier B

Source:

- https://saitamat.blog.fc2.com/blog-entry-379.html

Observed leads:

- march flow includes a dedicated route prompt before route editing;
- battle presentation includes field map, battle map, unit combat and duel surfaces;
- ruler death can continue through successor selection.

Do not infer the complete succession rule or battle formulas from the prose alone.

### Chinese-ROM long-form playthrough — Tier B

Source:

- https://www.bilibili.com/video/BV1i4421F7cq/

Priority capture tasks:

- 189 opening full-map frames;
- city labels and ownership colors;
- full-map and field-map correspondence;
- route cursor/grid measurements;
- march timing per grid step;
- siege and duel frame timing.

The repository must store only frame references/measurements, not copied video assets.

### PTT original-game play record — Tier C / corroborating observation

Source:

- https://www.ptt.cc/bbs/Old-Games/M.1299229026.A.78D.html

Current protected fact:

- Liu Bei 189 opening is associated with 代縣.

This remains sparse corroborating evidence and must not be expanded into a complete
ownership map by historical inference.

### Bahamut title page — Tier C / terminology lead

Source:

- https://acg.gamer.com.tw/acgDetail.php?s=48215

Useful lead:

- the Chinese release is repeatedly associated with the memorable monthly prompt
  「（君主名），本月想搞什麼？」.

Do not replace current UI text solely from this page. Capture the Chinese-ROM screen or
legible HK manual page first.

## Immediate acquisition order

1. Chinese-ROM 189 full-map screenshot(s): 40 city coordinates + visible ownership.
2. Chinese-ROM field-map screenshots at known cursor locations: logical grid scale.
3. Village-complete sweep: every village marker and coverage proof.
4. Route/movement capture: one-cell movement timing and monthly movement boundary.
5. 189 city status sweep: starting gold / food / troops / development / rule /
   defense / training where visible.
6. Officer status / city assignment sweep.
7. 200 and 215 opening ownership/state captures.
8. Siege/field-battle/duel frame timing and numeric consequence calibration.

## Promotion rule

A fact moves into production canonical data only when its evidence record includes:

- source ID;
- source tier;
- edition;
- page/frame reference;
- observed value/coordinate;
- verification state.

A source URL by itself is not a canonical data record.
