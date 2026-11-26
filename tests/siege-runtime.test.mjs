import test from 'node:test'
import assert from 'node:assert/strict'
import {
  SIEGE_RUNTIME_EVIDENCE,
  advanceSiegeOrderDay,
  confirmSiegeCommander,
  cycleSiegeCommander,
  siegeCommanderCandidate,
  ensureSiegeRuntime,
  queueSiegeAttackIntent,
  setSiegePhase,
  setSiegeSpeed,
  siegeRuntimeSnapshot,
} from '../src/game/siege-runtime.js'

function conflict(){
  return {kind:'siege',defenderDefense:42}
}

test('siege runtime persists preparation speed and defense snapshot',()=>{
  const value=conflict()
  assert.deepEqual(siegeRuntimeSnapshot(value),{
    phase:'speed',
    speed:null,
    day:1,
    usedOfficerNames:[],
    attackOrders:0,
    defenseRateSnapshot:42,
    lastAttackIntent:null,
  })
  setSiegeSpeed(value,'fast')
  setSiegePhase(value,'formation')
  setSiegePhase(value,'siege')
  assert.equal(ensureSiegeRuntime(value).speed,'fast')
  assert.equal(ensureSiegeRuntime(value).phase,'siege')
})

test('siege attack records semantic intent without fabricating defense loss or entry probability',()=>{
  const value={...conflict(),attackerOfficers:['曹操','曹仁']}
  setSiegePhase(value,'siege')
  const first=queueSiegeAttackIntent(value,'曹操')
  const second=queueSiegeAttackIntent(value,'曹仁')
  assert.deepEqual(first,{
    sequence:1,
    day:1,
    officerName:'曹操',
    effect:'lower-defense-rate',
    numericDelta:null,
    entryBattleProbability:null,
  })
  assert.equal(second.sequence,2)
  assert.equal(value.runtime.defenseRateSnapshot,42)
  assert.equal(SIEGE_RUNTIME_EVIDENCE.numericDefenseDelta,'unverified')
  assert.equal(SIEGE_RUNTIME_EVIDENCE.entryBattleProbability,'unverified')
})

test('siege attack is unavailable before entering siege phase',()=>{
  const value=conflict()
  assert.throws(()=>queueSiegeAttackIntent(value),/尚未進入攻城階段/)
})

test('siege commander preview selects only actual named attacker officers and never applies effects',()=>{
  const value={...conflict(),attackerOfficers:['曹操','曹仁'],attackerTroops:1000}
  value.runtime={phase:'formation',formationDraft:{phase:'review',officerIndex:0,typeIndex:0,rows:[
    {officerName:'曹操',infantry:0,cavalry:0,archers:0},
    {officerName:'曹仁',infantry:0,cavalry:0,archers:0},
  ]}}
  assert.equal(siegeCommanderCandidate(value),'曹操')
  assert.equal(cycleSiegeCommander(value),'曹仁')
  assert.deepEqual(confirmSiegeCommander(value),{officerName:'曹仁',status:'uncalibrated-preview',applied:false})
  assert.equal(value.attackerTroops,1000)
  assert.equal(value.defenderDefense,42)
  assert.equal('winner' in value,false)
  assert.equal('headquarters' in value.runtime,false)
})

test('siege commander normalization rejects foreign names and strips claimed applied effects',()=>{
  const value={...conflict(),attackerOfficers:['曹操'],runtime:{
    phase:'siege',commanderDraftName:'劉備',commanderPreview:{officerName:'劉備',applied:true},
  }}
  let runtime=ensureSiegeRuntime(value)
  assert.equal(runtime.commanderDraftName,null)
  assert.equal(runtime.commanderPreview,null)
  assert.throws(()=>cycleSiegeCommander(value),/尚未進入/)
  assert.throws(()=>confirmSiegeCommander(value),/尚未進入/)
  value.runtime.commanderPreview={officerName:'曹操',applied:true,headquarters:{x:1,y:2}}
  runtime=ensureSiegeRuntime(value)
  assert.deepEqual(runtime.commanderPreview,{officerName:'曹操',status:'uncalibrated-preview',applied:false})
  assert.equal(siegeCommanderCandidate({...value,attackerOfficers:[]}),null)
})

test('siege orders are limited per named unit and reset only by explicit day advance',()=>{
  const value={...conflict(),attackerOfficers:['曹操','曹仁']}
  setSiegePhase(value,'siege')
  assert.throws(()=>queueSiegeAttackIntent(value,'劉備'),/己方武將/)
  queueSiegeAttackIntent(value,'曹操')
  const before=structuredClone(value.runtime)
  assert.throws(()=>queueSiegeAttackIntent(value,'曹操'),/本日已接受/)
  assert.deepEqual(value.runtime,before)
  queueSiegeAttackIntent(value,'曹仁')
  assert.equal(advanceSiegeOrderDay(value),2)
  assert.deepEqual(value.runtime.usedOfficerNames,[])
  assert.equal(queueSiegeAttackIntent(value,'曹操').day,2)
  assert.equal(value.runtime.attackOrders,3)
  assert.equal(value.defenderDefense,42)
  assert.equal(value.winner,undefined)
})

test('legacy siege counters do not invent a unit assignment; saved unit usage is normalized',()=>{
  const value={...conflict(),attackerOfficers:['曹操'],runtime:{phase:'siege',attackOrders:4,lastAttackIntent:{sequence:4}}}
  assert.deepEqual(ensureSiegeRuntime(value).usedOfficerNames,[])
  assert.equal(value.runtime.attackOrders,4)
  value.runtime.usedOfficerNames=['曹操','曹操','劉備',null]
  assert.deepEqual(ensureSiegeRuntime(value).usedOfficerNames,['曹操'])
  assert.throws(()=>queueSiegeAttackIntent(value,'曹操'),/本日已接受/)
})
