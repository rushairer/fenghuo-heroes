import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES } from '../src/game/data.js'
import { GameStore } from '../src/game/store.js'
import { MARCH_COMMAND_EVIDENCE,MARCH_COMMAND_ORDER,advanceMarchArmies,beginFieldBattleFromArmies,beginSiegeFromArmy,cancelFieldBattleFromArmies,cancelSiegeFromArmy,dailyFoodFor,deployedOfficerNames,enemyArmyNearArmy,ensureMarchState,executeMarchTurn,friendlyArmyStack,marchCommandOptions,queueMarch,rerouteArmy } from '../src/game/march.js'
import { WORLD_W, cityWorldPoint } from '../src/game/world.js'
import { MARCH_RUNTIME_PROJECTION } from '../src/game/march-runtime-projection.js'

class MemoryStorage{constructor(){this.m=new Map()}getItem(k){return this.m.get(k)??null}setItem(k,v){this.m.set(k,v)}removeItem(k){this.m.delete(k)}}
const city=(id)=>CITIES.find((item)=>item.id===id)

function routeToward(start,target){
  const step=MARCH_RUNTIME_PROJECTION.routeStepWorld
  const points=[{...start}]
  let x=start.x,y=start.y
  while(x!==target.x||y!==target.y){
    x+=Math.sign(target.x-x)*Math.min(step,Math.abs(target.x-x))
    y+=Math.sign(target.y-y)*Math.min(step,Math.abs(target.y-y))
    points.push({x,y})
    if(points.length>256)throw new Error('fixture route exceeded world bounds')
  }
  return points
}

function marchingCaoStore(){
  const store=new GameStore(new MemoryStorage())
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  return store
}

test('manual daily grain formula is soldiers / 100 + officers',()=>{
  assert.equal(dailyFoodFor(3000,2),32)
  assert.equal(dailyFoodFor(999,1),10)
  assert.equal(dailyFoodFor(1000,3),13)
})

test('free cursor route creates persistent march army',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y+8}],troops:1000,food:400,gold:50,officerCount:1})
  assert.equal(ensureMarchState(s).length,1)
  assert.equal(army.dailyFood,11)
  assert.equal(army.route.length,3)
})


test('invalid troop, food, gold and route data are rejected atomically',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const source=s.state.cities.xuchang
  const before=structuredClone(source)
  const valid={from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:100,food:10,gold:1}
  const invalid=[
    {...valid,troops:source.troops},
    {...valid,troops:-1},
    {...valid,troops:NaN},
    {...valid,food:source.food+1},
    {...valid,food:1.1},
    {...valid,gold:source.gold+1},
    {...valid,gold:Infinity},
    {...valid,officerCount:Infinity},
    {...valid,officerCount:NaN},
    {...valid,officerCount:0},
    {...valid,officerNames:'曹操'},
    {...valid,route:[start,{x:NaN,y:start.y}]},
    {...valid,route:[start,{x:WORLD_W+9,y:start.y}]},
    {...valid,route:[start,{x:start.x+80,y:start.y}]},
    {...valid,route:[start,start]},
    {...valid,route:[{x:start.x+8,y:start.y},{x:start.x+16,y:start.y}]},
  ]
  for(const request of invalid){
    assert.throws(()=>queueMarch(s,request),/出陣|行軍路線|武將/)
    assert.deepEqual(source,before)
    assert.equal(ensureMarchState(s).length,0)
    assert.equal(s.state.nextArmyId,1)
  }
})

test('a city with fewer than 200 soldiers cannot create an army or mint troops',()=>{
  const s=marchingCaoStore()
  const cityState=s.state.cities.xuchang
  cityState.troops=150
  const start=cityWorldPoint(city('xuchang'))
  assert.throws(()=>queueMarch(s,{
    from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:100,food:0,gold:0,
  }),/至少須留下100兵/)
  assert.equal(cityState.troops,150)
  assert.equal(ensureMarchState(s).length,0)
})

test('rejected reroute leaves the original army position and route untouched',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  const before=structuredClone(army)
  assert.throws(()=>rerouteArmy(s,army.id,[start,{x:NaN,y:start.y}]),/行軍路線/)
  assert.throws(()=>rerouteArmy(s,army.id,[start,{x:start.x+40,y:start.y}]),/每格步長/)
  assert.throws(()=>rerouteArmy(s,army.id,[{x:start.x+8,y:start.y},{x:start.x+16,y:start.y}]),/部隊目前位置/)
  assert.deepEqual(army,before)
})

test('selected officer names persist on army and drive grain consumption',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{
    from:'xuchang',
    route:[start,{x:start.x+8,y:start.y}],
    troops:1000,
    food:400,
    gold:50,
    officerNames:['曹操','曹仁','夏候惇'],
  })
  assert.deepEqual(army.officerNames,['曹操','曹仁','夏候惇'])
  assert.equal(army.officerCount,3)
  assert.equal(army.dailyFood,13)
  advanceMarchArmies(s,1)
  assert.equal(army.food,387)
})

test('officer names are trimmed deduplicated and empty entries are ignored',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{
    from:'xuchang',
    route:[start,{x:start.x+8,y:start.y}],
    troops:1000,
    food:400,
    gold:0,
    officerNames:[' 曹操 ','曹操','','曹洪'],
  })
  assert.deepEqual(army.officerNames,['曹操','曹洪'])
  assert.equal(army.officerCount,2)
  assert.equal(army.dailyFood,12)
})

test('march execution consumes grain per route day and leaves army on map',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y},{x:start.x+24,y:start.y}],troops:1000,food:400,gold:0,officerCount:1})
  advanceMarchArmies(s,30)
  assert.equal(army.x,start.x+24)
  assert.equal(army.food,367)
  assert.equal(army.status,'waiting')
})

test('an existing army can receive a new free route',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:1000,food:400,gold:0})
  advanceMarchArmies(s,1)
  rerouteArmy(s,army.id,[{x:army.x,y:army.y},{x:army.x,y:army.y+8}])
  assert.equal(army.routeIndex,0)
  assert.equal(army.status,'marching')
  assert.equal(army.route.at(-1).y,start.y+8)
})

test('siege preparation preserves the attacking army instead of applying fake instant casualties',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const target=cityWorldPoint(city('xinye'))
  const army=queueMarch(s,{
    from:'xuchang',
    route:routeToward(start,target),
    troops:1200,
    food:400,
    gold:0,
    officerNames:['曹操','夏候惇'],
  })
  advanceMarchArmies(s,200)
  const citiesBefore=structuredClone(s.state.cities)
  const conflict=beginSiegeFromArmy(s,army.id,'xinye')
  assert.equal(conflict.kind,'siege')
  assert.equal(conflict.armyId,army.id)
  assert.deepEqual(conflict.attackerOfficers,['曹操','夏候惇'])
  assert.equal(ensureMarchState(s).length,1)
  assert.equal(army.status,'besieging')
  assert.deepEqual(s.state.cities,citiesBefore)

  assert.equal(cancelSiegeFromArmy(s),true)
  assert.equal(s.pendingConflict,null)
  assert.equal(army.status,'waiting')
  assert.deepEqual(s.state.cities,citiesBefore)
})


test('friendly stack detection requires armies to share the same map point',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const a=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  const b=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y+8}],troops:500,food:100,gold:0})
  assert.equal(friendlyArmyStack(s,a.id).length,2)
  b.x+=8
  assert.equal(friendlyArmyStack(s,a.id).length,1)
})

test('enemy attack proximity is one route-step engineering baseline and excludes friendly armies',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const own=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0})
  s.state.armies.push({
    id:'enemy-near',faction:'liu',from:'xinye',x:start.x+8,y:start.y,
    route:[{x:start.x+8,y:start.y}],routeIndex:0,troops:500,food:100,gold:0,
    officerCount:1,officerNames:['劉備'],dailyFood:6,starving:false,status:'waiting',
  })
  s.state.armies.push({
    id:'enemy-far',faction:'liu',from:'xinye',x:start.x+16,y:start.y,
    route:[{x:start.x+16,y:start.y}],routeIndex:0,troops:500,food:100,gold:0,
    officerCount:1,officerNames:['關羽'],dailyFood:6,starving:false,status:'waiting',
  })
  assert.equal(enemyArmyNearArmy(s,own.id)?.id,'enemy-near')
  s.state.armies.find((army)=>army.id==='enemy-near').x=start.x
  s.state.armies.find((army)=>army.id==='enemy-near').y=start.y
  assert.equal(enemyArmyNearArmy(s,own.id),null)
})


test('manual-confirmed march menu keeps the documented command order and conditions',()=>{
  assert.equal(MARCH_COMMAND_EVIDENCE.conditionSemantics,'manual-confirmed')
  assert.deepEqual(MARCH_COMMAND_EVIDENCE.sources,['jp-manual-pages-24-25','zh-hk-manual-pages-24-25'])
  assert.equal(MARCH_COMMAND_EVIDENCE.targetAttackTransition,'zh-hk-manual-immediate-field-battle')
  assert.equal(MARCH_COMMAND_EVIDENCE.japaneseAttackTransition,'jp-manual-after-march-orders')
  assert.equal(MARCH_COMMAND_EVIDENCE.enemyArmyAdjacencyProjection,'provisional-8px-route-step')
  assert.equal(MARCH_COMMAND_EVIDENCE.enemyCityAdjacencyProjection,'provisional-24px-city-tolerance')
  assert.equal(MARCH_COMMAND_EVIDENCE.splitGroupingProjection,'same-map-point-engineering')
  assert.equal(MARCH_COMMAND_EVIDENCE.villageProjection,'map-profile-evidence')
  assert.deepEqual(MARCH_COMMAND_ORDER,['move','split','supply','attack','siege','end'])

  assert.deepEqual(marchCommandOptions().map((item)=>item.id),['move','end'])
  assert.deepEqual(
    marchCommandOptions({canSplit:true}).map((item)=>item.id),
    ['move','split','end'],
  )
  assert.deepEqual(
    marchCommandOptions({inVillage:true}).map((item)=>item.id),
    ['move','supply','end'],
  )
  assert.deepEqual(
    marchCommandOptions({enemyArmyAdjacent:true}).map((item)=>item.id),
    ['move','attack','end'],
  )
  assert.deepEqual(
    marchCommandOptions({enemyCityAdjacent:true,enemyCityName:'新野'}).map((item)=>item.id),
    ['move','siege','end'],
  )
  assert.equal(
    marchCommandOptions({enemyCityAdjacent:true,enemyCityName:'新野'}).find((item)=>item.id==='siege')?.label,
    '攻城 新野',
  )
  assert.deepEqual(
    marchCommandOptions({
      canSplit:true,
      inVillage:true,
      enemyArmyAdjacent:true,
      enemyCityAdjacent:true,
      enemyCityName:'新野',
    }).map((item)=>item.id),
    ['move','split','supply','attack','siege','end'],
  )
})


test('march execution reports elapsed calendar days separately from route steps',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{
    from:'xuchang',
    route:[start,{x:start.x+8,y:start.y},{x:start.x+16,y:start.y}],
    troops:1000,
    food:400,
    gold:0,
    officerCount:1,
  })
  const [event]=executeMarchTurn(s,1)
  assert.equal(event.steps,1)
  assert.equal(event.daysElapsed,1)
  assert.equal(army.routeIndex,1)
  assert.equal(army.food,389)
})


test('adjacent enemy armies enter a persistent field-battle conflict without fake casualties',()=>{
  const mem=new MemoryStorage()
  const s=new GameStore(mem)
  s.newGame({scenarioYear:189,humanFactions:['cao']})
  s.finishCurrentTurn()
  const start=cityWorldPoint(city('xuchang'))
  const own=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:1200,food:400,gold:0,officerNames:['曹操','夏候惇']})
  const enemy={id:'enemy-field',faction:'liu',from:'xinye',x:start.x+8,y:start.y,route:[{x:start.x+8,y:start.y}],routeIndex:0,troops:900,food:300,gold:0,officerCount:2,officerNames:['劉備','關羽'],dailyFood:11,starving:false,status:'waiting'}
  s.state.armies.push(enemy)
  const before=[own.troops,enemy.troops]
  const conflict=beginFieldBattleFromArmies(s,own.id,enemy.id)
  assert.equal(conflict.kind,'field')
  assert.equal(conflict.attackerArmyId,own.id)
  assert.equal(conflict.defenderArmyId,enemy.id)
  assert.equal(own.status,'engaged')
  assert.equal(enemy.status,'engaged')
  assert.deepEqual([own.troops,enemy.troops],before)

  const loaded=new GameStore(mem)
  assert.equal(loaded.load(),true)
  assert.equal(loaded.pendingConflict?.kind,'field')
  assert.equal(loaded.pendingConflict?.attackerArmyId,own.id)
})

test('field battle cancel restores pre-battle army statuses without changing troops',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const own=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:800,food:200,gold:0})
  own.status='waiting'
  const enemy={id:'enemy-cancel',faction:'liu',from:'xinye',x:start.x+8,y:start.y,route:[{x:start.x+8,y:start.y}],routeIndex:0,troops:700,food:200,gold:0,officerCount:1,officerNames:['劉備'],dailyFood:8,starving:false,status:'marching'}
  s.state.armies.push(enemy)
  const before=[own.troops,enemy.troops]
  beginFieldBattleFromArmies(s,own.id,enemy.id)
  assert.equal(cancelFieldBattleFromArmies(s),true)
  assert.equal(s.pendingConflict,null)
  assert.equal(own.status,'waiting')
  assert.equal(enemy.status,'marching')
  assert.deepEqual([own.troops,enemy.troops],before)
})


test('same officer cannot be deployed into two armies at once',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0,officerNames:['曹操']})
  assert.equal(deployedOfficerNames(s).has('曹操'),true)
  assert.throws(
    ()=>queueMarch(s,{from:'xuchang',route:[start,{x:start.x,y:start.y+8}],troops:500,food:100,gold:0,officerNames:['曹操']}),
    /已隨其他部隊出陣/,
  )
})

test('engaged and besieging armies cannot be rerouted',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const army=queueMarch(s,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],troops:500,food:100,gold:0,officerNames:['曹操']})
  for(const status of ['engaged','besieging']){
    army.status=status
    assert.throws(
      ()=>rerouteArmy(s,army.id,[{x:army.x,y:army.y},{x:army.x+8,y:army.y}]),
      /戰鬥中的部隊不能變更/,
    )
  }
})

test('cancelled siege restores the exact pre-siege army status',()=>{
  const s=marchingCaoStore()
  const start=cityWorldPoint(city('xuchang'))
  const target=cityWorldPoint(city('xinye'))
  const army=queueMarch(s,{from:'xuchang',route:routeToward(start,target),troops:1200,food:400,gold:0,officerNames:['曹操']})
  advanceMarchArmies(s,200)
  army.status='marching'
  beginSiegeFromArmy(s,army.id,'xinye')
  assert.equal(army.status,'besieging')
  cancelSiegeFromArmy(s)
  assert.equal(army.status,'marching')
})
