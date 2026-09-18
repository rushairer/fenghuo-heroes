import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BATTLE_SEGMENT_EVIDENCE,
  OBSERVED_BATTLE_SEGMENT_DAYS,
  advanceBattleDay,
  battleDayState,
} from '../src/game/battle-time-parity.js'

test('thirty-day battle segment is explicitly observed rather than manual-confirmed',()=>{
  assert.equal(OBSERVED_BATTLE_SEGMENT_DAYS,30)
  assert.equal(BATTLE_SEGMENT_EVIDENCE,'observed-gameplay-not-manual-confirmed')
})

test('battle remains active before day thirty and carries over at day thirty',()=>{
  assert.deepEqual(
    battleDayState(29),
    {day:29,segmentComplete:false,shouldReturnToStrategy:false,shouldResumeBattleLater:false},
  )
  assert.deepEqual(
    battleDayState(30),
    {day:30,segmentComplete:true,shouldReturnToStrategy:true,shouldResumeBattleLater:true},
  )
})

test('battle day advancement clamps at the observed segment boundary',()=>{
  assert.equal(advanceBattleDay(28,1).day,29)
  assert.equal(advanceBattleDay(29,5).day,30)
  assert.equal(advanceBattleDay(30,1).day,30)
})
