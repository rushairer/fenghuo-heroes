# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fenghuo Heroes (三国志列传：群英新篇) — a browser-based Three Kingdoms turn-based strategy game built with Phaser 4 + TypeScript + Vite. Inspired by the 1991 SEGA Mega Drive game "三国志列传：乱世群英" but with all-original code, art, music, and data.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check (`tsc`) then build production bundle |
| `npm run preview` | Preview production build locally |

No automated tests exist yet. Playwright is a devDependency but has no config or test files. The CI pipeline (`.github/workflows/deploy-pages.yml`) runs `npm run build` only.

## Architecture

The game is a **single-scene Phaser application**. Nearly all logic lives in one file:

- **`src/main.ts`** (~8500 lines) — contains the entire game: types, static data, the `KingdomsScene` Phaser.Scene class (~374 private methods), and the `ProceduralMusic` WebAudio class.
- **`src/domain/campaignSnapshot.ts`** — serializable campaign state model for save/load (not yet imported by main.ts; preparatory for V0.9).

### Key structures in `main.ts`

- **Types** (top of file): `Phase`, `FactionId`, `CityId`, `StrategyFaction`, `StrategyCity`, `StrategyOfficer`, `MarchArmy`, `SiegeState`, `DuelState`, plus command enums.
- **Static game data** (const arrays): `strategyFactions` (6 factions), `strategyCities` (40 cities), `strategyOfficers` (84 officers), `scenarioOptions`, `difficultyOptions`.
- **`KingdomsScene`** (class starting ~line 608): all game state, UI rendering, and game loop logic. UI is drawn entirely with Phaser.GameObjects (Text, Rectangle, etc.) — no HTML DOM, no external UI framework.
- **`ProceduralMusic`** (class ~line 562): oscillator-based background music.
- **Phaser config** (~line 8500): 1280×760 canvas, `Phaser.AUTO` renderer, `Phaser.Scale.FIT`, single scene.

### Game loop / Phase state machine

18 phases cycle through the game: `title` → `scenarioSetup` → `rulerSelect` → main loop alternates **inspection months** (odd: domestic/diplomacy/military commands) and **march months** (even: army movement, siege, duel, field battle) → `monthReport` → repeat. `result` phase for victory/defeat.

### UI layout constants

Canvas is 1280×760. Outer frame: x42, y34, 1196×690. Page content: y140–570. Footer command bars: y584–706. Standard modal: center (640,402), 820×470. All modals use a 3-column grid, 230px column pitch, 82px row pitch, 168×40 option buttons, 150×38 action buttons.

## TypeScript Config

- Target: ES2023, bundler module resolution, no emit (`noEmit: true`)
- Strict linting flags: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `noFallthroughCasesInSwitch`
- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports

## Design Documentation

Extensive Chinese-language design docs at the repo root:

- `GAME_UI_STYLE_GUIDE.md` — pixel-level UI spec: layout rules, typography, color tokens, keyboard shortcuts, interaction rules
- `DEVELOPMENT_PLAN.md` — scope, replication boundaries, feature checklist, milestones
- `ROADMAP.md` — version roadmap (V0.4–V0.9), acceptance criteria per version
- `REPLICATION_BLUEPRINT.md` — state machine design, menu matrix, march/siege/duel systems
- `COMMAND_FLOW_AUDIT.md` — per-command audit with object selection protocol and flow tables
- `MENU_SWEEP_PLAN.md` — acceptance checklist per menu item
- `DESIGN_DATA.md` — faction, city, and officer data tables
- `ORIGINAL_GAME_STUDY.md` — reference study of the 1991 SEGA original

## Working on This Codebase

- All game logic and rendering is in `src/main.ts`. When adding or modifying features, you'll be editing this file alongside the design docs.
- The `GAME_UI_STYLE_GUIDE.md` is the authoritative source for layout coordinates, colors, typography, and keyboard shortcuts — consult it before making UI changes.
- The `COMMAND_FLOW_AUDIT.md` defines the standard flow for every command (domestic, diplomacy, military) — follow its patterns when implementing new commands.
- CI deploys to GitHub Pages at `https://rushairer.github.io/fenghuo-heroes/` on push to main. The `base` in `vite.config.ts` is set to `/fenghuo-heroes/` to match.
- Do not commit any commercial game assets (ROMs, screenshots, music, original art/text). All content must be original.
