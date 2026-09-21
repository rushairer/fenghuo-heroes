import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CHINESE_COPY_GAPS,
  chineseCopyGapReport,
} from '../src/game/chinese-copy-gaps.js'

test('unverified strategy copy stays explicitly quarantined',()=>{
  const report=chineseCopyGapReport()
  assert.deepEqual(
    report.map(({id,status})=>[id,status]),
    [
      ['commandCategoryLocked','unverified-engineering-copy'],
      ['ownCityRequired','unverified-engineering-copy'],
      ['confirmCategoryAtCity','unverified-engineering-copy'],
      ['foreignCityCommandRejected','unverified-engineering-copy'],
      ['commandEntryHint','unverified-engineering-copy'],
      ['retiredAdjacentMarchHint','engineering-diagnostic-not-original-copy'],
    ],
  )
  assert.equal(report.filter((item)=>item.directFramePending).length,5)
})

test('gap registry preserves current behavior without promoting copy to parity evidence',()=>{
  assert.equal(
    CHINESE_COPY_GAPS.commandCategoryLocked.text('內政'),
    '本月已经决定执行「內政」，不能再改成其他类别。',
  )
  assert.equal(CHINESE_COPY_GAPS.ownCityRequired.text(),'请选择本国城池。')
  assert.equal(CHINESE_COPY_GAPS.foreignCityCommandRejected.text(),'只能向本国城池下令。')
  assert.equal(
    CHINESE_COPY_GAPS.confirmCategoryAtCity.text('代縣','內政'),
    '确定在「代縣」执行內政？',
  )
  assert.equal(
    CHINESE_COPY_GAPS.commandEntryHint.text(),
    '先把方框移到地图空白处按 C，决定本月是内政、外交还是军备。',
  )
})

test('strategy scene references gap IDs instead of hiding raw modern copy literals',()=>{
  const source=readFileSync('src/scenes/strategy.js','utf8')
  assert.match(source,/CHINESE_COPY_GAPS\.commandEntryHint\.text\(\)/)
  assert.match(source,/CHINESE_COPY_GAPS\.commandCategoryLocked\.text/)
  assert.match(source,/CHINESE_COPY_GAPS\.ownCityRequired\.text\(\)/)
  assert.match(source,/CHINESE_COPY_GAPS\.confirmCategoryAtCity\.text/)
  assert.match(source,/CHINESE_COPY_GAPS\.foreignCityCommandRejected\.text\(\)/)
  assert.match(source,/CHINESE_COPY_GAPS\.retiredAdjacentMarchHint\.text\(\)/)
  for(const literal of [
    '本月已经决定执行',
    '请选择本国城池',
    '确定在「',
    '只能向本国城池下令',
    '先把方框移到地图空白处',
    '舊版相鄰城市行軍入口已退休',
  ]){
    assert.equal(source.includes(literal),false)
  }
})
