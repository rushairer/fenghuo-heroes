import test from 'node:test'
import assert from 'node:assert/strict'
import {
  FIELD_BATTLE_COMMANDS,
  FIELD_BATTLE_TACTICS,
  RETREAT_UNLOCK_TIMING,
  commandWindowPausesBattle,
  fieldBattleCommandAvailable,
  fieldBattleInputAction,
  fieldBattleOrder,
  fieldBattleStatusProjection,
  fieldBattleTacticAvailable,
  fieldBattleTacticOrder,
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

test('all four directions scroll the battlefield outside command windows',()=>{
  for(const button of ['UP','DOWN','LEFT','RIGHT']){
    assert.equal(fieldBattleInputAction(button),'scroll-battlefield')
    assert.equal(fieldBattleInputAction(button,{windowOpen:true}),null)
  }
})

test('field battle restores the six manual command families',()=>{
  assert.deepEqual(
    FIELD_BATTLE_COMMANDS.map((item)=>item.id),
    ['move','strategy','siege','retreat','wait','end'],
  )
})

test('field battle exposes the documented tactic family without inventing effects',()=>{
  assert.deepEqual(
    FIELD_BATTLE_TACTICS.map((item)=>item.id),
    ['fire','rockfall','immobilize','provoke','persuade','chain'],
  )
  assert.equal(fieldBattleTacticAvailable('chain',{strategyAvailable:true,enemyTerrain:'river'}),true)
  assert.equal(fieldBattleTacticAvailable('chain',{strategyAvailable:true,enemyTerrain:'plain'}),false)
  assert.equal(fieldBattleTacticAvailable('rockfall',{strategyAvailable:true,ownTerrain:'mountain',enemyTerrain:'plain'}),true)
  assert.equal(fieldBattleTacticAvailable('immobilize',{strategyAvailable:true,enemyTerrain:'forest'}),true)
})

test('conditional battle commands remain locked until their verified condition is represented',()=>{
  assert.equal(RETREAT_UNLOCK_TIMING,'verified-later-in-battle-duration-unmeasured')
  assert.equal(fieldBattleCommandAvailable('move'),true)
  assert.equal(fieldBattleCommandAvailable('wait'),true)
  assert.equal(fieldBattleCommandAvailable('end'),true)
  assert.equal(fieldBattleCommandAvailable('strategy'),false)
  assert.equal(fieldBattleCommandAvailable('strategy',{strategyAvailable:true}),true)
  assert.equal(fieldBattleCommandAvailable('siege'),false)
  assert.equal(fieldBattleCommandAvailable('siege',{siegeAvailable:true}),true)
  assert.equal(fieldBattleCommandAvailable('retreat'),false)
  assert.equal(fieldBattleCommandAvailable('retreat',{retreatUnlocked:true}),true)
  assert.equal(fieldBattleCommandAvailable('move',{ordersClosed:true}),false)
})

test('field battle orders preserve only evidence-backed command intent',()=>{
  assert.deepEqual(fieldBattleOrder('move'),{commandId:'move'})
  assert.deepEqual(fieldBattleOrder('wait'),{commandId:'wait'})
  assert.equal(fieldBattleOrder('retreat'),null)
  assert.deepEqual(fieldBattleOrder('retreat',{retreatUnlocked:true}),{commandId:'retreat'})
  assert.equal(fieldBattleOrder('invented-command'),null)
  assert.deepEqual(
    fieldBattleTacticOrder('chain',{strategyAvailable:true,enemyTerrain:'river'}),
    {commandId:'strategy',tacticId:'chain'},
  )
})

test('battle status projection exposes documented attack morale and troops without filling unknown values',()=>{
  assert.deepEqual(
    fieldBattleStatusProjection({
      attackerTroops:1200,
      defenderTroops:900,
      attackerOfficers:['曹操'],
      defenderOfficers:['劉備'],
    }),
    {
      attacker:{troops:1200,attack:null,morale:null,officers:['曹操']},
      defender:{troops:900,attack:null,morale:null,officers:['劉備']},
    },
  )
})
