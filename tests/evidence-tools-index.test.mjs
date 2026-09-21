import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const html=readFileSync('public/tools/index.html','utf8')
const css=readFileSync('public/tools/index.css','utf8')
const build=readFileSync('scripts/build.mjs','utf8')

test('evidence tools index links every active capture workbench',()=>{
  assert.match(html,/href="\.\/map-evidence-capture\.html"/)
  assert.match(html,/href="\.\/scenario-evidence-capture\.html"/)
  assert.match(html,/href="\.\/march-evidence-capture\.html"/)
})

test('evidence tools index states the non-verifying promotion boundary',()=>{
  assert.match(html,/verified:false/)
  assert.match(html,/先 merge，再人工復核，再 audit/)
  assert.match(html,/互相矛盾的觀測不取平均/)
})

test('evidence tools index exposes the matching audit commands',()=>{
  assert.match(html,/npm run map:evidence:audit/)
  assert.match(html,/npm run scenario:evidence:audit/)
  assert.match(html,/npm run march:evidence:audit/)
})

test('evidence tools index stays single-column on narrow screens and is published by build',()=>{
  assert.match(css,/@media\(max-width:860px\)/)
  assert.match(css,/grid-template-columns:1fr/)
  assert.match(build,/cpSync\('public', 'dist', \{ recursive: true \}\)/)
})
