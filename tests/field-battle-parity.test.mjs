import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FIELD_BATTLE_COMMANDS,
  RETREAT_UNLOCK_TIMING,
  commandWindowPausesBattle,
  fieldBattleCommandAvailable,
  fieldBattleInputAction,
} from '../src/game/field-battle-parity.js'

test('field battle A B C controls follow the documented window semantics',()=>{
  assert.equal(fieldBattleInputAction('A'),'status-window')
  assert.equal(fieldBattleInputAction('C'),'command-window')
  assert.equal(fieldBattleInputAction('B',{windowOpen:true}),'cancel-window')
  assert.equal(fieldBattleInputAction('B'),null)
})

test('opening the command window pauses the real-time battle',()=>{
  assert.equal(commandWindowPausesBattle(),true)
})

test('up and down scroll the battlefield outside command windows',()=>{
  assert.equal(fieldBattleInputAction('UP'),'scroll-battlefield')
  assert.equal(fieldBattleInputAction('DOWN'),'scroll-battlefield')
  assert.equal(fieldBattleInputAction('UP',{windowOpen:true}),null)
})

test('field battle command families include movement enemy commander wait and retreat',()=>{
  assert.deepEqual(
    FIELD_BATTLE_COMMANDS.map((item)=>item.id),
    ['directional-movement','enemy-commander','wait','retreat'],
  )
})

test('retreat timing stays explicitly unmeasured instead of inventing a duration',()=>{
  assert.equal(RETREAT_UNLOCK_TIMING,'verified-later-in-battle-duration-unmeasured')
  assert.equal(fieldBattleCommandAvailable('retreat'),false)
  assert.equal(fieldBattleCommandAvailable('retreat',{retreatUnlocked:true}),true)
  assert.equal(fieldBattleCommandAvailable('wait'),true)
})
