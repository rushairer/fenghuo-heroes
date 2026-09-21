import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html=readFileSync('public/tools/march-evidence-capture.html','utf8')
const js=readFileSync('public/tools/march-evidence-capture.js','utf8')
const css=readFileSync('public/tools/march-evidence-capture.css','utf8')
const build=readFileSync('scripts/build.mjs','utf8')

test('march workbench exposes all five direct-observation domains',()=>{
  for(const type of [
    'route-step','movement-window','month-window','adjacency','starvation',
  ])assert.match(html,new RegExp('value="'+type+'"'))
  assert.match(html,/id="route-step-editor"/)
  assert.match(html,/id="movement-window-editor"/)
  assert.match(html,/id="month-window-editor"/)
  assert.match(html,/id="adjacency-editor"/)
  assert.match(html,/id="starvation-editor"/)
})

test('march workbench accepts local video or image without embedding media in JSON',()=>{
  assert.match(html,/accept="image\/\*,video\/\*"/)
  assert.match(html,/id="reference-video"/)
  assert.match(html,/id="reference-image"/)
  assert.match(js,/URL\.createObjectURL/)
  assert.match(js,/mediaUrl/)
  assert.doesNotMatch(js,/FileReader/)
})

test('march workbench can stamp the current video time into frame evidence',()=>{
  assert.match(html,/id="use-time"/)
  assert.match(js,/referenceVideo\.currentTime/)
  assert.match(js,/\.toFixed\(3\)/)
  assert.match(js,/#t=/)
})

test('march workbench delegates records to safe capture helpers and never self-verifies',()=>{
  assert.match(js,/marchRouteStepCandidate/)
  assert.match(js,/marchMovementWindowCandidate/)
  assert.match(js,/marchMonthlyExecutionCandidate/)
  assert.match(js,/marchAdjacencyCandidate/)
  assert.match(js,/marchStarvationCandidate/)
  assert.match(js,/marchCaptureBundle/)
  assert.doesNotMatch(js,/verified\s*:\s*true/)
})

test('march workbench isolates one source and validates identity before record or copy',()=>{
  assert.match(js,/function ensureBatchIdentity/)
  assert.match(js,/Source ID 不可為空/)
  assert.match(js,/Source Ref 不可為空/)
  assert.match(js,/Frame Ref 不可為空/)
  assert.match(js,/saveRecord\.addEventListener\('click',[\s\S]*if\(!ensureBatchIdentity\(\)\)return/)
  assert.match(js,/copyOutput\.addEventListener\('click',async\(\)=>\{\n  if\(!ensureBatchIdentity\(\)\)return/)
})

test('march workbench upserts same-type observations by frame reference and supports resume undo',()=>{
  assert.match(js,/function upsertByFrame/)
  assert.match(js,/item\.frameRef===candidate\.frameRef/)
  assert.match(js,/normalizeMarchCaptureBundleForEditing/)
  assert.match(js,/history\.push/)
  assert.match(js,/undoOutput\.addEventListener/)
})

test('march workbench publishes progress and adapts to narrow viewports',()=>{
  assert.match(js,/格步 /)
  assert.match(js,/日數 /)
  assert.match(js,/月窗 /)
  assert.match(js,/鄰接 /)
  assert.match(js,/缺糧 /)
  assert.match(css,/@media\(max-width:860px\)/)
  assert.match(css,/grid-template-columns:1fr/)
})

test('static build publishes march workbench through public tools',()=>{
  assert.match(build,/cpSync\('public', 'dist', \{ recursive: true \}\)/)
})
