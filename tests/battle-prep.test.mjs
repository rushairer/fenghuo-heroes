import test from 'node:test'
import assert from 'node:assert/strict'
import { BATTLE_SPEEDS, MAX_SQUADS_PER_UNIT, battlePreparation, cycleBattleSpeed } from '../src/game/battle-prep.js'

test('battle preparation exposes the two documented speed choices',()=>{
  assert.deepEqual(BATTLE_SPEEDS.map((item)=>item.id),['normal','fast'])
  assert.equal(cycleBattleSpeed(0,-1),1)
  assert.equal(cycleBattleSpeed(1,1),0)
})

test('battle preparation keeps the documented fifteen-squad ceiling without inventing a troop-to-squad formula',()=>{
  const prep=battlePreparation({
    kind:'siege',
    attackerTroops:3200,
    defenderTroops:2800,
    attackerOfficers:['曹操','夏候惇'],
  },'fast')
  assert.equal(prep.speed,'fast')
  assert.equal(prep.maxSquadsPerUnit,15)
  assert.equal(MAX_SQUADS_PER_UNIT,15)
  assert.equal(prep.attackerTroops,3200)
  assert.deepEqual(prep.attackerOfficers,['曹操','夏候惇'])
})
