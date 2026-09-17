import test from 'node:test'
import assert from 'node:assert/strict'
import { DUEL_COMMANDS, DUEL_MODES, autoDuelIntent, cycleDuelMode } from '../src/game/duel-parity.js'

test('duel exposes original manual / auto choice',()=>{
  assert.deepEqual(DUEL_MODES.map((mode)=>mode.id),['manual','auto'])
  assert.equal(cycleDuelMode(0,-1),1)
  assert.equal(cycleDuelMode(1,1),0)
})

test('A-command menu keeps the four documented duel commands',()=>{
  assert.deepEqual(DUEL_COMMANDS,['說得','罵聲','投降','退卻'])
})

test('auto duel intent approaches at range and can attack at fighting distance',()=>{
  assert.equal(autoDuelIntent(0,80).move,1)
  const intents=[0,620,1240,1860,2480,3100].map((t)=>autoDuelIntent(t,36))
  assert.ok(intents.some((intent)=>intent.attack))
  assert.ok(intents.some((intent)=>intent.guard))
})
