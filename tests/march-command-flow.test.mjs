import test from 'node:test'
import assert from 'node:assert/strict'
import { StrategyScene } from '../src/scenes/strategy-march.js'
import { StrategyScene as ProductionStrategyScene } from '../src/scenes/strategy-full-map.js'
import { queueMarch, rerouteArmy } from '../src/game/march.js'
import { GameStore } from '../src/game/store.js'
import { cityWorldPoint } from '../src/game/world.js'

function marchScene(){
  const scene=Object.create(StrategyScene.prototype)
  const store={
    humanFaction:'liu',
    mapProfile:{cities:[],cityById:{},villages:[{id:'village-01',x:80,y:96}]},
    state:{
      armies:[
        {id:'a1',faction:'liu',from:'home',x:80,y:96,troops:800,food:100,gold:10,status:'waiting',officerNames:['劉備']},
        {id:'a2',faction:'liu',from:'home',x:80,y:96,troops:600,food:100,gold:10,status:'waiting',officerNames:['關羽']},
      ],
      cities:{},
    },
    assertState(){},
  }
  scene.app={
    store,
    audio:{move(){},cancel(){},confirm(){},alert(){}},
  }
  scene.marchArmyId='a1'
  scene.armyMenuIndex=0
  scene.supplyMenuIndex=0
  scene.view='army-menu'
  return scene
}

test('army menu exposes split and supply only when their manual conditions are present',()=>{
  const scene=marchScene()
  assert.deepEqual(scene.armyMenuOptions(scene.app.store.state.armies[0]).map((item)=>item.id),[
    'move','split','supply','end',
  ])
  scene.app.store.state.armies[1].x=88
  scene.app.store.state.armies[0].x=72
  assert.deepEqual(scene.armyMenuOptions(scene.app.store.state.armies[0]).map((item)=>item.id),[
    'move','end',
  ])
})

test('split command enters a dedicated split route intent instead of a placeholder message',()=>{
  const scene=marchScene()
  scene.armyMenuIndex=1
  let called=null
  scene.beginArmyRoute=(army,reason)=>{called={armyId:army.id,reason}}
  scene.updateArmyMenu('C')
  assert.deepEqual(called,{armyId:'a1',reason:'split'})
})

test('supply command enters the village supply menu instead of a placeholder message',()=>{
  const scene=marchScene()
  scene.armyMenuIndex=2
  scene.updateArmyMenu('C')
  assert.equal(scene.view,'supply-menu')
  assert.equal(scene.supplyMenuIndex,0)
})


test('map confirmation opens the army actually under the cursor rather than an adjacent earlier army',()=>{
  const scene=marchScene()
  const store=scene.app.store
  store.state.armies[1].x=88
  store.state.cursor={x:88,y:96}
  scene.stage='march'
  scene.view='map'
  scene.marchArmyId=null
  scene.updateMap('C')
  assert.equal(scene.view,'army-menu')
  assert.equal(scene.marchArmyId,'a2')
  assert.equal(scene.armyMenuIndex,0)
})

test('exactly overlapping friendly armies can each be selected without touching campaign state',()=>{
  const scene=marchScene()
  const store=scene.app.store
  store.state.armies.push({id:'enemy',faction:'cao',x:80,y:96})
  store.state.armies.push({id:'nearby',faction:'liu',x:88,y:96})
  const before=structuredClone(store.state)
  scene.armyMenuIndex=2
  scene.updateArmyMenu('RIGHT')
  assert.equal(scene.marchArmyId,'a2')
  assert.equal(scene.armyMenuIndex,0)
  scene.updateArmyMenu('RIGHT')
  assert.equal(scene.marchArmyId,'a1')
  scene.updateArmyMenu('LEFT')
  assert.equal(scene.marchArmyId,'a2')
  assert.deepEqual(store.state,before)
})

test('production split route changes only the selected stacked army and retains both resource ledgers',()=>{
  const scene=marchScene()
  Object.setPrototypeOf(scene,ProductionStrategyScene.prototype)
  const store=scene.app.store
  store.mode='march'
  store.setCursor=(x,y)=>{store.state.cursor={x,y}}
  store.addLog=()=>{}
  store.save=()=>{}
  scene.updateArmyMenu('RIGHT')
  scene.armyMenuIndex=1
  scene.updateArmyMenu('C')
  assert.equal(scene.view,'march-route-prompt')
  assert.equal(scene.marchArmyId,'a2')
  const first=structuredClone(store.state.armies[0])
  const second=structuredClone(store.state.armies[1])
  scene.updateMarchRoute('RIGHT')
  scene.updateMarchRoute('C')
  assert.equal(scene.view,'message')
  assert.deepEqual(store.state.armies[0],first)
  assert.deepEqual(store.state.armies[1],{
    ...second,status:'marching',routeIndex:0,route:[{x:80,y:96},{x:88,y:96}],
  })
})

test('split eligibility is rechecked when the route is committed',()=>{
  const scene=marchScene()
  const store=scene.app.store
  store.mode='march'
  store.state.armies[1].x=88
  const before=structuredClone(store.state)
  assert.throws(()=>rerouteArmy(store,'a1',[{x:80,y:96},{x:80,y:104}],{reason:'split'}),/分散命令/)
  assert.deepEqual(store.state,before)
})

test('missing army ledger stays absent when a stale army menu is updated or drawn',()=>{
  const scene=marchScene()
  const store=scene.app.store
  delete store.state.armies
  const before=structuredClone(store.state)
  scene.updateArmyMenu('RIGHT')
  assert.equal(scene.view,'map')
  scene.drawArmyMenu()
  assert.deepEqual(store.state,before)
})

test('cycling a stack preserves an existing army ID sequence',()=>{
  const scene=marchScene()
  scene.app.store.state.nextArmyId=71
  const before=structuredClone(scene.app.store.state)
  scene.updateArmyMenu('RIGHT')
  assert.equal(scene.marchArmyId,'a2')
  assert.deepEqual(scene.app.store.state,before)
})

test('production city dispatch remains reachable under a queued army and creates a separate named army',()=>{
  const store=new GameStore(null)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const first=queueMarch(store,{from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:500,food:100,gold:0,officerNames:['曹操']})
  store.setCursor(start.x,start.y)
  const scene=Object.create(ProductionStrategyScene.prototype)
  scene.app={store,audio:{move(){},cancel(){},confirm(){},alert(){}}}
  scene.stage='march'
  scene.view='map'
  const before=structuredClone(store.state)
  scene.updateMap('C')
  assert.equal(scene.view,'army-menu')
  assert.equal(scene.marchArmyId,first.id)
  const options=scene.armyMenuOptions(first)
  scene.armyMenuIndex=options.findIndex(item=>item.id==='city-dispatch')
  assert.ok(scene.armyMenuIndex>=0)
  scene.updateArmyMenu('C')
  assert.equal(scene.view,'march-compose')
  assert.equal(scene.marchFrom,'xuchang')
  assert.equal(scene.marchArmyId,null)
  assert.ok(scene.selectedOfficerNames.length>0)
  assert.ok(!scene.selectedOfficerNames.includes('曹操'))
  assert.deepEqual(store.state,before)
  const expected={troops:scene.marchTroops,food:scene.marchFood,gold:scene.marchGold}
  scene.beginNewMarchRoute()
  scene.updateMarchRoute('DOWN')
  scene.updateMarchRoute('C')
  assert.equal(scene.view,'message')
  assert.equal(store.state.armies.length,2)
  assert.deepEqual(store.state.armies[0],before.armies[0])
  const second=store.state.armies[1]
  assert.notEqual(second.id,first.id)
  assert.equal(second.from,'xuchang')
  assert.ok(!second.officerNames.includes('曹操'))
  for(const field of ['troops','food','gold']){
    assert.equal(store.state.cities.xuchang[field],before.cities.xuchang[field]-expected[field])
  }
})

test('city dispatch shortcut is absent when the selected city is foreign or out of range',()=>{
  const scene=marchScene()
  const store=scene.app.store
  store.state.cursor={x:80,y:96}
  store.state.cities.home={owner:'cao'}
  store.cityAt=()=>({id:'home',name:'城'})
  const army=store.state.armies[0]
  assert.ok(!scene.armyMenuOptions(army).some(item=>item.id==='city-dispatch'))
  store.state.cities.home.owner='liu'
  assert.ok(scene.armyMenuOptions(army).some(item=>item.id==='city-dispatch'))
  store.cityAt=()=>null
  assert.ok(!scene.armyMenuOptions(army).some(item=>item.id==='city-dispatch'))
})
