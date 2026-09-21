import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html=readFileSync('public/tools/map-evidence-capture.html','utf8')
const js=readFileSync('public/tools/map-evidence-capture.js','utf8')
const css=readFileSync('public/tools/map-evidence-capture.css','utf8')
const build=readFileSync('scripts/build.mjs','utf8')

test('capture workbench loads screenshots locally and exposes city/village modes',()=>{
  assert.match(html,/type="file" accept="image\/\*"/)
  assert.match(html,/value="city"/)
  assert.match(html,/value="village"/)
  assert.match(html,/id="capture-canvas"/)
  assert.match(html,/id="city-name"/)
  assert.match(html,/id="auto-next"/)
  assert.match(html,/id="undo-output"/)
  assert.match(html,/id="capture-progress"/)
  assert.match(html,/id="source-ref"/)
})

test('capture workbench delegates coordinate math to the audited evidence module',()=>{
  assert.match(js,/captureEvidenceBundle/)
  assert.match(js,/cityEvidenceCandidate/)
  assert.match(js,/villageEvidenceCandidate/)
  assert.match(js,/location\.pathname\.includes\('\/public\/tools\/'\)/)
  assert.match(js,/\.\.\/\.\.\/src\/game\//)
  assert.match(js,/\.\.\/src\/game\//)
  assert.match(js,/ZH_ROM_CANONICAL_CITY_SET/)
  assert.match(js,/normalizeZhRomCityName/)
  assert.doesNotMatch(js,/verified\s*:\s*true/)
})

test('capture workbench maps CSS click coordinates back to intrinsic screenshot pixels',()=>{
  assert.match(js,/canvas\.width\/rect\.width/)
  assert.match(js,/canvas\.height\/rect\.height/)
  assert.match(js,/imageWidth:canvas\.width/)
  assert.match(js,/imageHeight:canvas\.height/)
  assert.match(js,/canvas\.width-1e-6/)
  assert.match(js,/canvas\.height-1e-6/)
})

test('capture workbench remains usable on narrow viewports',()=>{
  assert.match(css,/@media\(max-width:820px\)/)
  assert.match(css,/grid-template-columns:1fr/)
})

test('static build publishes the public tools directory into GitHub Pages output',()=>{
  assert.match(build,/cpSync\('public', 'dist', \{ recursive: true \}\)/)
})


test('capture workbench upserts canonical city candidates instead of creating duplicate city records',()=>{
  assert.match(js,/function upsertCity/)
  assert.match(js,/normalizeZhRomCityName\(item\.name\)===identity/)
  assert.match(js,/if\(index>=0\)candidates\[index\]=candidate/)
})

test('capture workbench supports auto-next progress undo and visible canvas markers',()=>{
  assert.match(js,/function selectNextMissingCity/)
  assert.match(js,/history\.push/)
  assert.match(js,/undoOutput\.addEventListener/)
  assert.match(js,/capture-progress/)
  assert.match(js,/drawCandidateMarker/)
  assert.match(js,/城市 \$\{cityCount\}\/\$\{ZH_ROM_CANONICAL_CITY_SET\.length\}/)
})

test('capture workbench refuses exact duplicate village clicks in one frame',()=>{
  assert.match(js,/function addVillage/)
  assert.match(js,/Math\.abs\(item\.x-candidate\.x\)<\.01/)
  assert.match(js,/同一 frame 的這個村莊座標已存在/)
})


test('capture workbench emits merge-ready bundles rather than raw candidate arrays',()=>{
  assert.match(js,/function currentBundle/)
  assert.match(js,/captureEvidenceBundle\(\{/)
  assert.match(js,/cityCoordinates:cityCandidates\(\)/)
  assert.match(js,/villages:villageCandidates\(\)/)
  assert.match(js,/JSON\.stringify\(currentBundle\(\),null,2\)/)
})

test('capture workbench keeps each batch on one source ID and derives source ref from the local file name',()=>{
  assert.match(js,/batchSourceId&&batchSourceId!==requestedSourceId/)
  assert.match(js,/請先複製\/清空批次後再切換 Source ID/)
  assert.match(js,/sourceRef\.value=file\.name/)
})
