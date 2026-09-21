import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html=readFileSync('public/tools/scenario-evidence-capture.html','utf8')
const js=readFileSync('public/tools/scenario-evidence-capture.js','utf8')
const css=readFileSync('public/tools/scenario-evidence-capture.css','utf8')
const build=readFileSync('scripts/build.mjs','utf8')

test('scenario workbench exposes all three target years and evidence domains',()=>{
  for(const year of ['189','200','215'])assert.match(html,new RegExp('value="'+year+'"'))
  for(const type of ['ownership','city-state','officer'])assert.match(html,new RegExp('value="'+type+'"'))
  assert.match(html,/id="city-name"/)
  assert.match(html,/id="faction-id"/)
  assert.match(html,/id="officer-name"/)
  assert.match(html,/id="officer-role"/)
})

test('scenario workbench builds seven numeric city-state inputs from shared schema',()=>{
  assert.match(js,/CITY_ECONOMY_FIELDS/)
  assert.match(js,/populateCityStateFields/)
  assert.match(js,/input\.dataset\.field=field/)
  assert.match(js,/尚未填寫；不以猜值補齊/)
})

test('scenario workbench delegates candidate normalization to audited capture module',()=>{
  assert.match(js,/scenarioOwnershipCandidate/)
  assert.match(js,/scenarioCityStateCandidate/)
  assert.match(js,/scenarioOfficerCandidate/)
  assert.match(js,/scenarioCaptureBundle/)
  assert.doesNotMatch(js,/verified\s*:\s*true/)
})

test('scenario workbench upserts cities and officers instead of creating accidental duplicates',()=>{
  assert.match(js,/function upsertCityRecord/)
  assert.match(js,/normalizeZhRomCityName\(item\.city\)===identity/)
  assert.match(js,/function upsertOfficer/)
  assert.match(js,/String\(item\.officer\|\|''\)\.trim\(\)===name/)
})

test('scenario workbench locks one source and one scenario year per editable batch',()=>{
  assert.match(js,/activeBatchSourceId/)
  assert.match(js,/activeBatchYear/)
  assert.match(js,/請先複製\/清空批次後再切換 Source ID/)
  assert.match(js,/請先複製\/清空批次後再切換劇本/)
})

test('scenario workbench can resume a bundle but forces editing through safe normalization',()=>{
  assert.match(html,/id="bundle-input"/)
  assert.match(js,/normalizeScenarioCaptureBundleForEditing/)
  assert.match(js,/await file\.text\(\)/)
  assert.match(js,/所有記錄保持 verified:false/)
})

test('scenario workbench supports local screenshot reference progress undo and responsive layout',()=>{
  assert.match(html,/id="image-input"/)
  assert.match(html,/id="reference-image"/)
  assert.match(js,/URL\.createObjectURL/)
  assert.match(js,/history\.push/)
  assert.match(js,/undoOutput\.addEventListener/)
  assert.match(js,/歸屬 /)
  assert.match(js,/數值 /)
  assert.match(js,/武將 /)
  assert.match(css,/@media\(max-width:860px\)/)
})

test('static build publishes scenario capture workbench with the public tools directory',()=>{
  assert.match(build,/cpSync\('public', 'dist', \{ recursive: true \}\)/)
})


test('scenario workbench refuses copy when source or frame identity is incomplete',()=>{
  assert.match(js,/copyOutput\.addEventListener\('click',async\(\)=>\{\n  if\(!ensureBatchIdentity\(\)\)return/)
  assert.match(js,/Source Ref 不可為空/)
  assert.match(js,/Frame Ref 不可為空/)
})
