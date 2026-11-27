import test from 'node:test'
import assert from 'node:assert/strict'
import { OFFICER_STATUS_FIELDS, openingOfficerListForCity, openingOfficerRows, officerStatusProjection, stationedOfficerListForCity } from '../src/game/officer-roster.js'
import { GameStore } from '../src/game/store.js'
import { StrategyScene } from '../src/scenes/strategy-officers.js'

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

test('later scenarios remain blocked instead of fabricating an officer status list',()=>{
  const store=new GameStore(new MemoryStorage())
  assert.throws(
    ()=>store.newGame({scenarioYear:200,humanFactions:['liu']}),
    /No production scenario start state is calibrated/,
  )
  assert.equal(store.hasGame(),false)
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

test('Chinese-release status screenshot preserves all fifteen named fields',()=>{
  assert.deepEqual(
    OFFICER_STATUS_FIELDS.map(({id,label})=>[id,label]),
    [
      ['level','水平'],
      ['rank','官職'],
      ['civilExperience','文官級'],
      ['militaryExperience','武官級'],
      ['stamina','體力'],
      ['force','武力'],
      ['intelligence','知力'],
      ['virtue','德育'],
      ['loyalty','忠誠度'],
      ['command','率兵力'],
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
    evidence:'name-role-only; status-labels-zh-frame',
  })
})


test('source-backed scenario officer placement overrides the provisional faction roster',()=>{
  const store={
    humanFaction:'liu',
    state:{
      scenarioOfficerPlacementStatus:'source-backed-189',
      cities:{
        dai:{owner:'liu',officers:[{name:'劉備',role:'ruler'},{name:'關羽',role:'officer'}]},
        other:{owner:'liu',officers:[{name:'張飛',role:'officer'}]},
      },
      openingRosters:{
        liu:{ruler:'劉備',officers:['關羽','張飛']},
      },
    },
  }
  const dai=openingOfficerListForCity(store,'dai')
  assert.equal(dai.cityAssignmentVerified,true)
  assert.equal(dai.evidence,'scenario-officer-placement')
  assert.deepEqual(dai.rows,[
    {name:'劉備',role:'君主'},
    {name:'關羽',role:'武將'},
  ])

  const other=openingOfficerListForCity(store,'other')
  assert.deepEqual(other.rows,[{name:'張飛',role:'武將'}])
})

test('provisional scaffold officer projection never claims city assignment verification',()=>{
  const store={
    humanFaction:'liu',
    state:{
      scenarioOfficerPlacementStatus:'provisional-roster-only',
      cities:{test_city:{owner:'liu'}},
      openingRosters:{liu:{ruler:'劉備',officers:['關羽','張飛']}},
    },
  }
  const projection=openingOfficerListForCity(store,'test_city')
  assert.equal(projection.cityAssignmentVerified,false)
  assert.equal(projection.evidence,'opening-faction-roster')
  assert.deepEqual(projection.rows.map((row)=>row.name),['劉備','關羽','張飛'])
})


test('source-backed officer roles do not depend on an opening-roster name heuristic',()=>{
  const store={
    state:{
      scenarioOfficerPlacementStatus:'source-backed-200',
      cities:{
        city:{owner:'custom',officers:[
          {name:'甲',role:'ruler'},
          {name:'乙',role:'officer'},
        ]},
      },
      openingRosters:{},
    },
  }
  const projection=openingOfficerListForCity(store,'city')
  assert.equal(projection.cityAssignmentVerified,true)
  assert.deepEqual(projection.rows,[
    {name:'甲',role:'君主'},
    {name:'乙',role:'武將'},
  ])
})

test('officer status draws the Chinese three-column screen without fabricated values',()=>{
  const texts=[],lines=[]
  const r={clear(){},fillRect(){},strokeRect(){},line(...args){lines.push(args)},text(...args){texts.push(args)}}
  StrategyScene.prototype.drawOfficerStatus.call({app:{r},officerStatusRow:officerStatusProjection({name:'劉備',role:'君主'})})
  for(const label of ['水平','官職','文官級','武官級','德育','率兵力'])assert.ok(texts.some(t=>t[0]===label),label)
  assert.ok(lines.some(l=>l[0]===108&&l[2]===108))
  assert.ok(lines.some(l=>l[0]===204&&l[2]===204))
  assert.ok(texts.filter(t=>t[0]==='—').length>=15)
  assert.ok(!texts.some(t=>t[0]==='15000'))
})

test('verified city drilldown excludes deployed officers without changing opening assignments',()=>{
  const store={state:{
    scenarioOfficerPlacementStatus:'source-backed-189',
    cities:{home:{owner:'liu',officers:[{name:'劉備',role:'ruler'},{name:'關羽',role:'officer'},{name:'張飛',role:'officer'}]}},
    armies:[
      {faction:'liu',officerNames:[' 關羽 '],status:'marching'},
      {faction:'cao',officerNames:['張飛'],status:'waiting'},
    ],
  }}
  const before=structuredClone(store.state)
  assert.deepEqual(stationedOfficerListForCity(store,'home').rows.map(row=>row.name),['劉備','張飛'])
  const scene=Object.create(StrategyScene.prototype)
  scene.app={store}
  scene.officerListCity='home'
  assert.deepEqual(scene.officerListProjection().rows.map(row=>row.name),['劉備','張飛'])
  assert.deepEqual(openingOfficerListForCity(store,'home').rows.map(row=>row.name),['劉備','關羽','張飛'])
  assert.deepEqual(store.state,before)
})

test('scaffold officer drilldown stays an explicitly unverified faction roster',()=>{
  const store={state:{
    scenarioOfficerPlacementStatus:'provisional-roster-only',
    cities:{home:{owner:'liu'}},
    openingRosters:{liu:{ruler:'劉備',officers:['關羽']}},
    armies:[{faction:'liu',officerNames:['關羽']}],
  }}
  const projection=stationedOfficerListForCity(store,'home')
  assert.equal(projection.cityAssignmentVerified,false)
  assert.deepEqual(projection.rows.map(row=>row.name),['劉備','關羽'])
})
