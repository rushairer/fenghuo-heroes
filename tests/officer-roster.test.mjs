import test from 'node:test'
import assert from 'node:assert/strict'
import { OFFICER_STATUS_FIELDS, openingOfficerListForCity, openingOfficerRows, officerStatusProjection } from '../src/game/officer-roster.js'
import { GameStore } from '../src/game/store.js'

class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}

test('189 officer status projection exposes ruler and documented opening officers',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu']})
  assert.deepEqual(openingOfficerRows(store),[
    {name:'劉備',role:'君主'},
    {name:'關羽',role:'武將'},
    {name:'張飛',role:'武將'},
  ])
})

test('officer projection follows active human faction',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['liu','cao']})
  assert.deepEqual(openingOfficerRows(store).map((row)=>row.name),['劉備','關羽','張飛'])
  store.finishCurrentTurn()
  assert.deepEqual(openingOfficerRows(store).map((row)=>row.name),['曹操','曹仁','曹洪','夏候惇','夏候淵'])
})

test('later scenarios do not fabricate an officer status list',()=>{
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:200,humanFactions:['liu']})
  assert.deepEqual(openingOfficerRows(store),[])
})

test('country-status drilldown uses opening faction roster without pretending city placement is verified',()=>{
  const store={
    state:{
      cities:{test_city:{owner:'liu'}},
      openingRosters:{liu:{ruler:'劉備',officers:['關羽','張飛']}},
    },
  }
  const projection=openingOfficerListForCity(store,'test_city')
  assert.equal(projection.factionId,'liu')
  assert.equal(projection.cityAssignmentVerified,false)
  assert.equal(projection.evidence,'opening-faction-roster')
  assert.deepEqual(projection.rows.map((row)=>row.name),['劉備','關羽','張飛'])
})

test('manual-backed officer status schema preserves all fifteen original fields',()=>{
  assert.deepEqual(
    OFFICER_STATUS_FIELDS.map(({id,label})=>[id,label]),
    [
      ['level','等級'],
      ['rank','官位'],
      ['civilExperience','文官值'],
      ['militaryExperience','武官值'],
      ['stamina','體力'],
      ['force','武力'],
      ['intelligence','知力'],
      ['virtue','德'],
      ['loyalty','忠誠度'],
      ['command','統率力'],
      ['mobility','機動力'],
      ['troops','兵力'],
      ['morale','士氣'],
      ['attack','攻擊力'],
      ['weapon','武器'],
    ],
  )
})

test('officer status leaves unverified Chinese-ROM character values empty',()=>{
  assert.deepEqual(officerStatusProjection({name:'劉備',role:'君主'}),{
    name:'劉備',
    role:'君主',
    level:null,
    rank:null,
    civilExperience:null,
    militaryExperience:null,
    stamina:null,
    force:null,
    intelligence:null,
    virtue:null,
    loyalty:null,
    command:null,
    mobility:null,
    troops:null,
    morale:null,
    attack:null,
    weapon:null,
    evidence:'name-role-only; status-schema-jp-manual',
  })
})
