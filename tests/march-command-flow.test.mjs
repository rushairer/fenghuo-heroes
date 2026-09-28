import test from 'node:test'
import assert from 'node:assert/strict'
import { StrategyScene } from '../src/scenes/strategy-march.js'

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
