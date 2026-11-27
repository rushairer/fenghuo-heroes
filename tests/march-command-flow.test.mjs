import test from 'node:test'
import assert from 'node:assert/strict'
import { StrategyScene } from '../src/scenes/strategy-march.js'
import { StrategyScene as ProductionStrategyScene } from '../src/scenes/strategy-full-map.js'
import { rerouteArmy } from '../src/game/march.js'

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
