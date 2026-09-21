import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MONTHLY_COMMAND_PROMPT_EVIDENCE,
  monthlyCommandPrompt,
} from '../src/game/chinese-copy-parity.js'

test('monthly command prompt preserves corroborated Traditional Chinese copy exactly',()=>{
  assert.equal(MONTHLY_COMMAND_PROMPT_EVIDENCE.copy,'本月想搞什麼？')
  assert.equal(MONTHLY_COMMAND_PROMPT_EVIDENCE.directFramePending,true)
  assert.equal(MONTHLY_COMMAND_PROMPT_EVIDENCE.sources.length,2)
  assert.equal(monthlyCommandPrompt('劉備'),'劉備，本月想搞什麼？')
  assert.equal(monthlyCommandPrompt('  曹操  '),'曹操，本月想搞什麼？')
  assert.equal(monthlyCommandPrompt(''),'本月想搞什麼？')
})

test('strategy scene consumes the protected prompt instead of duplicating the literal',()=>{
  const source=readFileSync('src/scenes/strategy.js','utf8')
  assert.match(source,/import \{ monthlyCommandPrompt \} from '\.\.\/game\/chinese-copy-parity\.js'/)
  assert.ok((source.match(/monthlyCommandPrompt\(ruler\)/g)??[]).length>=2)
  assert.doesNotMatch(source,/本月想搞什麼？/)
})

test('corroborated prompt remains explicitly below direct-frame confidence',()=>{
  assert.equal(
    MONTHLY_COMMAND_PROMPT_EVIDENCE.status,
    'corroborated-chinese-release-recollection',
  )
  assert.equal(MONTHLY_COMMAND_PROMPT_EVIDENCE.directFramePending,true)
})
