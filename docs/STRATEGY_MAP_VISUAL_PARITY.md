# Strategy Map Visual Parity — Direct Reference Ledger

Status: active parity blocker.

## Implementation status — 2026-09-22

First structural correction is now implemented in the runtime:

- root inspection view uses the full logical 320×224 map area;
- the legacy 48px bottom instruction panel is suppressed in that target-parity state;
- a compact upper-left `視察情況` plaque is rendered over the map;
- provisional city-neighbor graph edges are no longer rendered in local or full-map views;
- the target-parity view avoids the seam-prone sand tile path;
- local river width, landmark scale, coherent mountain asset use and the bright bracket
  cursor have received a first calibration pass.

Second visual calibration pass:

- inspection-only camera density is now 1.18× and is strictly presentation-layer;
- target inspection mountains/hills/forts/flags/cursor use one coherent vector palette;
- ground texture uses deterministic non-tiled grain plus subtle earth etching;
- the river keeps the same provisional center path while receiving broader, irregular
  presentation-only bank modulation.

River silhouette convergence:

- shoreline modulation density increased from 9 to 15 deterministic samples;
- alternating water-edge scallops create visible local inlets on both banks;
- local and full-map rivers use the same irregularity model;
- the canonical three-segment center path is unchanged.

Mountain silhouette convergence:

- the active strategy map no longer uses the generic three-triangle mountain icon;
- target mountains are rendered as four-lobe continuous dark-brown masses with a broad base;
- ridge accents are subordinate to silhouette, reducing the previous icon/sticker appearance;
- the full-map legend now uses the same target mountain mass renderer.

Cross-state strategic map convergence:

- survey, command and march states now share the same ochre procedural ground;
- all strategic states use the same brown mountain / green hill family;
- forts keep the same brown/gold body with hot-pink/yellow banner language;
- armies use the same target-derived flag wrapper instead of changing to faction-colored cloth;
- map cursors remain white bracket forms across state transitions;
- only composition/interaction changes by state; the terrain art language no longer changes.

Full-map visual language convergence:

- full-map ground now uses the same ochre procedural language and etched texture family;
- full-map villages and mountain legend use the same target-derived earth palette;
- the overview cursor now uses the same white bracket language;
- overview river banks/water use the same brown/deep-blue hierarchy as the local map.

This does **not** close camera/landmark, terrain, river, fort/flag or canonical map
evidence work. Those remain open until more direct frames are measured. In particular,
the 1.18× zoom and river-width factors are calibration hypotheses, not claimed original
game constants.

This ledger records observations from a user-supplied direct reference screenshot of
the target Mega Drive game and a user-supplied screenshot of the current Web runtime.
The screenshots themselves are not committed.

Reference screenshot measured in the review session: 627x380.
Current runtime screenshot measured in the review session: 2048x1019.

These measurements describe the supplied images only; they are not canonical game
coordinates.

## High-confidence visual mismatches

### 1. Inspection-mode composition is structurally different

Target reference:

- the map occupies essentially the whole gameplay viewport;
- a compact framed plaque in the upper-left reads `視察情況`;
- there is no large bottom instruction panel in the supplied inspection frame.

Current runtime:

- the map is constrained to the upper portion of the game frame;
- a large light-colored information/control panel consumes roughly the bottom fifth of
  the supplied screenshot;
- the instructional copy becomes one of the dominant visual elements.

Parity action:

- rebuild inspection mode as map-first composition;
- move state labeling/help into a compact overlay/frame consistent with the target;
- do not preserve the large bottom panel merely because it is readable in HD.

### 2. Visible node-link roads are not supported by the reference

Target reference:

- no prominent straight graph edges are visible between forts in the supplied frame;
- the observed game is already documented as free-map / fine-grid movement rather than
  point-to-point graph traversal.

Current runtime:

- thin straight lines visibly connect cities/villages and read as a graph.

Parity action:

- stop treating the provisional route graph as a visible road layer;
- keep any engineering neighbor graph internal only;
- do not render graph edges unless a direct target frame proves a visible road/path at
  that location.

### 3. Camera scale and information density are far apart

Target reference:

- terrain features are dense;
- several forts, mountain clusters, vegetation and a large river section coexist in one
  local viewport;
- landmarks occupy substantial screen area.

Current runtime:

- broad empty sand areas dominate;
- many objects are visually tiny relative to the viewport;
- the camera reads much farther out and the landscape feels sparse.

Parity action:

- recalibrate inspection camera scale from direct frames;
- calibrate landmark size relative to the logical 320x224 viewport before adding more
  micro-detail.

### 4. Terrain language is inconsistent

Target reference:

- continuous ochre/brown land;
- large dark-brown mountain masses;
- green hills/vegetation;
- a saturated deep-blue river with irregular banks;
- terrain appears visually continuous rather than visibly tiled.

Current runtime:

- repeated terrain blocks/seams are visible;
- several mountain assets are pale/blue/purple and belong to a different art language;
- the river is not a dominant local landmark in the supplied frame.

Parity action:

- replace mixed-style terrain fallbacks with one coherent HD redraw language;
- eliminate visible tile seams;
- treat river width/bank silhouette as a first-class reference measurement.

### 5. Fort and flag scale/palette are wrong

Target reference:

- forts are compact brown/gold structures integrated into terrain;
- flags have a strong hot-pink/yellow identity and high contrast;
- fort scale is consistent with surrounding mountains and river.

Current runtime:

- top-row forts are visually bulky/dark;
- purple flags differ strongly from the supplied reference palette;
- small lower-map settlement/marker shapes use a separate visual scale.

Parity action:

- derive fort bounding-box ratios from direct screenshots;
- derive target flag silhouette/palette from direct frames;
- unify city marker scale across the inspection surface.

### 6. Cursor language differs

Target reference:

- the cursor is a bright white square/bracket-style outline near the selected map object.

Current runtime:

- the cursor is a dark/tan rectangular box with a bright center.

Parity action:

- redesign the inspection cursor from the reference before further glow/detail work.

### 7. UI framing and typography are not merely “HD reinterpretation”

Target reference:

- compact ornamented MD-era frame;
- small, localized title plaque integrated over the map.

Current runtime:

- modern large CJK text on a broad light panel;
- information hierarchy is inverted: instructions dominate the scene.

HD parity rule:

> Preserve target composition, hierarchy, silhouette and timing; improve source
> resolution and material quality, not the fundamental screen layout.

## Consequence for the roadmap

Do **not** spend the next major batch on extra mountain micro-detail, flag folds or
river highlights.

Priority order:

1. inspection-mode screen composition;
2. camera/viewport scale calibration;
3. remove unsupported visible graph roads;
4. terrain atlas/style unification and seam removal;
5. river silhouette/width calibration;
6. fort/flag/cursor silhouette parity;
7. only then resume HD material micro-detail.

## Evidence boundary

The supplied reference screenshot is strong evidence for visible composition and local
art relationships.

It is **not** sufficient by itself to establish:

- all 40 city coordinates;
- complete river/world geometry;
- complete village coverage;
- scenario ownership outside the visible frame;
- movement timing or numeric formulas.

Those remain in their dedicated evidence workflows.
