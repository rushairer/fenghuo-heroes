import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_FOOD_DAYS, foodForDays, maxFoodDaysForStock, shouldBlockTitleNavigation } from '../src/game/parity.js'
import { StrategyScene as BaseStrategyScene } from '../src/scenes/strategy.js'
import { StrategyScene as MarchStrategyScene } from '../src/scenes/strategy-march.js'
import { StrategyScene as FinalStrategyScene } from '../src/scenes/strategy-full-map.js'

test('root strategy map cannot jump to title without an explicit forced exit',()=>{
  assert.equal(shouldBlockTitleNavigation({hasGame:true,fromStrategy:true}),true)
  assert.equal(shouldBlockTitleNavigation({hasGame:true,fromStrategy:true,force:true}),false)
  assert.equal(shouldBlockTitleNavigation({hasGame:false,fromStrategy:true}),false)
})



function rootBEvents(Scene,stage) {
  const events=[]
  const scene=Object.create(Scene.prototype)
  scene.stage=stage
  scene.app={
    store:{state:{}},
    audio:{cancel(){events.push('cancel')}},
    go(name){events.push(`go:${name}`)},
  }
  scene.updateMap('B')
  return events
}

test('base strategy root B only cancels and never navigates',()=>{
  assert.deepEqual(rootBEvents(BaseStrategyScene,'survey'),['cancel'])
})


test('base strategy cannot re-enter the retired adjacent-city march flow',()=>{
  const events=[]
  const scene=Object.create(BaseStrategyScene.prototype)
  scene.stage='march'
  scene.view='map'
  scene.message=''
  scene.infoTab=0
  scene.infoReturnView='map'
  scene.infoCommandBrowse=false
  scene.app={
    store:{
      state:{cursor:{x:10,y:10},cities:{home:{owner:'cao'}}},
      humanFaction:'cao',
      cityAt(){return{id:'home'}},
      planMarch(){events.push('legacy-planMarch')},
    },
    audio:{
      confirm(){events.push('confirm')},
      alert(){events.push('alert')},
      cancel(){events.push('cancel')},
    },
  }
  scene.updateMap('C')
  assert.equal(scene.view,'message')
  assert.match(scene.message,/自由路線部隊狀態機/)
  assert.deepEqual(events,['alert'])
})

test('march strategy root B only cancels and never navigates',()=>{
  assert.deepEqual(rootBEvents(MarchStrategyScene,'march'),['cancel'])
})

test('final strategy scene keeps root B safe in both odd and even month modes',()=>{
  assert.deepEqual(rootBEvents(FinalStrategyScene,'survey'),['cancel'])
  assert.deepEqual(rootBEvents(FinalStrategyScene,'march'),['cancel'])
})

test('march grain is selected in days and derived from the manual daily formula',()=>{
  assert.equal(foodForDays(3000,2,30),960)
  assert.equal(foodForDays(1000,1,30),330)
})

test('march food days respect both stock and the observed 999-day ceiling',()=>{
  assert.equal(maxFoodDaysForStock(1000,1,330),30)
  assert.equal(maxFoodDaysForStock(100,1,999999),MAX_FOOD_DAYS)
})
