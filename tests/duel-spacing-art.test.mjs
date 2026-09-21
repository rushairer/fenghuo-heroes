import test from 'node:test'
import assert from 'node:assert/strict'
import { duelSpacingCueGeometry } from '../src/game/duel-spacing-art.js'

test('duel spacing cue strengthens as fighters approach',()=>{
  const far=duelSpacingCueGeometry(72)
  const mid=duelSpacingCueGeometry(48)
  const close=duelSpacingCueGeometry(26)
  assert.equal(far.closeness,0)
  assert.ok(mid.closeness>far.closeness)
  assert.ok(close.closeness>mid.closeness)
  assert.ok(close.dustRx>mid.dustRx)
  assert.ok(close.lineAlpha>mid.lineAlpha)
})

test('duel spacing cue clamps safely for extreme values',()=>{
  assert.equal(duelSpacingCueGeometry(500).closeness,0)
  assert.equal(duelSpacingCueGeometry(-20).distance,0)
  assert.equal(duelSpacingCueGeometry(-20).closeness,1)
})
