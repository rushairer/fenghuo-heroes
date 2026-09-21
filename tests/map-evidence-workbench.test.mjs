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
})

test('capture workbench delegates coordinate math to the audited evidence module',()=>{
  assert.match(js,/cityEvidenceCandidate/)
  assert.match(js,/villageEvidenceCandidate/)
  assert.match(js,/\.\.\/\.\.\/src\/game\/map-evidence-capture\.js/)
  assert.doesNotMatch(js,/verified\s*:\s*true/)
})

test('capture workbench maps CSS click coordinates back to intrinsic screenshot pixels',()=>{
  assert.match(js,/canvas\.width\/rect\.width/)
  assert.match(js,/canvas\.height\/rect\.height/)
  assert.match(js,/imageWidth:canvas\.width/)
  assert.match(js,/imageHeight:canvas\.height/)
})

test('capture workbench remains usable on narrow viewports',()=>{
  assert.match(css,/@media\(max-width:820px\)/)
  assert.match(css,/grid-template-columns:1fr/)
})

test('static build publishes the public tools directory into GitHub Pages output',()=>{
  assert.match(build,/cpSync\('public', 'dist', \{ recursive: true \}\)/)
})
