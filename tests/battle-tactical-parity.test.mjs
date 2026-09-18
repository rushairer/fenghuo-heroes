import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BATTLE_TACTICAL_COMMAND_ORDER,
  BATTLE_TACTICAL_EVIDENCE,
  BATTLE_TACTICS,
  END_COMMAND_RESULT,
  RETREAT_RESULT,
  battleTacticalCommandOptions,
  tacticAvailable,
  waitCommandOutcome,
} from '../src/game/battle-tactical-parity.js'

test('battle tactical command order and visibility are manual-backed',()=>{
  assert.equal(BATTLE_TACTICAL_EVIDENCE.commandSemantics,'manual-confirmed')
  assert.equal(BATTLE_TACTICAL_EVIDENCE.twoDayRangeProjection,'unimplemented')
  assert.equal(BATTLE_TACTICAL_EVIDENCE.castleContactProjection,'unimplemented')
  assert.deepEqual(BATTLE_TACTICAL_COMMAND_ORDER,[
    'move','tactics','siege','retreat','wait','end',
  ])
  assert.deepEqual(
    battleTacticalCommandOptions().map((item)=>item.id),
    ['move','retreat','wait','end'],
  )
  assert.deepEqual(
    battleTacticalCommandOptions({enemyWithinTwoDayMove:true}).map((item)=>item.id),
    ['move','tactics','retreat','wait','end'],
  )
  assert.deepEqual(
    battleTacticalCommandOptions({touchingEnemyCastle:true}).map((item)=>item.id),
    ['move','siege','retreat','wait','end'],
  )
  assert.deepEqual(
    battleTacticalCommandOptions({enemyWithinTwoDayMove:true,touchingEnemyCastle:true}).map((item)=>item.id),
    ['move','tactics','siege','retreat','wait','end'],
  )
})

test('manual tactics are preserved without inventing ambiguous fire terrain gating',()=>{
  assert.deepEqual(BATTLE_TACTICS.map((item)=>item.id),[
    'fire','rockfall','immobilize','provoke','persuade','chain',
  ])
  assert.equal(tacticAvailable('fire',{enemyTerrain:'forest'}),null)
  assert.equal(tacticAvailable('rockfall',{ownTerrain:'mountain',enemyTerrain:'plain'}),true)
  assert.equal(tacticAvailable('rockfall',{ownTerrain:'plain',enemyTerrain:'plain'}),false)
  assert.equal(tacticAvailable('immobilize',{enemyTerrain:'forest'}),true)
  assert.equal(tacticAvailable('immobilize',{enemyTerrain:'mountain'}),true)
  assert.equal(tacticAvailable('immobilize',{enemyTerrain:'plain'}),false)
  assert.equal(tacticAvailable('chain',{enemyTerrain:'river'}),true)
  assert.equal(tacticAvailable('chain',{enemyTerrain:'plain'}),false)
  assert.equal(tacticAvailable('provoke',{enemyTerrain:'plain'}),true)
  assert.equal(tacticAvailable('persuade',{enemyTerrain:'plain'}),true)
})

test('wait turns a small forest unit into an ambush without guessing combat effects',()=>{
  assert.deepEqual(waitCommandOutcome({terrain:'forest',troops:5000}),{
    state:'ambush',manualConfirmed:true,
  })
  assert.deepEqual(waitCommandOutcome({terrain:'forest',troops:5001}),{
    state:'waiting',manualConfirmed:true,
  })
  assert.deepEqual(waitCommandOutcome({terrain:'plain',troops:3000}),{
    state:'waiting',manualConfirmed:true,
  })
})

test('retreat and end preserve only manual-confirmed transition semantics',()=>{
  assert.equal(RETREAT_RESULT.leavesBattleScreen,true)
  assert.equal(RETREAT_RESULT.returnsAsMarchingArmyNearCastle,true)
  assert.equal(RETREAT_RESULT.casualtyFormula,'none-in-manual-command-description')
  assert.equal(END_COMMAND_RESULT.commandWindowLockedUntilNextBattleDay,true)
})
