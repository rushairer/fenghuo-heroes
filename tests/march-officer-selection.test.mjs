import test from 'node:test'
import assert from 'node:assert/strict'
import { StrategyScene } from '../src/scenes/strategy-parity.js'
import { GameStore } from '../src/game/store.js'
import { queueMarch } from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'

function sceneWithStore(store,cityId='home'){
  const scene=Object.create(StrategyScene.prototype)
  scene.app={store}
  scene.marchFrom=cityId
  return scene
}

test('source-backed city officer placement drives march selection instead of the whole faction roster',()=>{
  const store={
    humanFaction:'liu',
    state:{
      scenarioOfficerPlacementStatus:'source-backed-189',
      openingRosters:{liu:{ruler:'劉備',officers:['關羽','張飛','趙雲']}},
      cities:{
        home:{
          owner:'liu',
          officers:[
            {name:'關羽',role:'officer'},
            {name:'張飛',role:'officer'},
          ],
        },
      },
      armies:[],
    },
    assertState(){},
  }
  assert.deepEqual(sceneWithStore(store).availableOfficerNames(),['關羽','張飛'])
})

test('officers already deployed by the faction disappear from later march composition',()=>{
  const store={
    humanFaction:'liu',
    state:{
      scenarioOfficerPlacementStatus:'source-backed-189',
      openingRosters:{liu:{ruler:'劉備',officers:['關羽','張飛']}},
      cities:{
        home:{
          owner:'liu',
          officers:[
            {name:'關羽',role:'officer'},
            {name:'張飛',role:'officer'},
          ],
        },
      },
      armies:[
        {id:'army-1',faction:'liu',officerNames:['關羽']},
        {id:'army-2',faction:'cao',officerNames:['張飛']},
      ],
    },
    assertState(){},
  }
  assert.deepEqual(sceneWithStore(store).availableOfficerNames(),['張飛'])
})

test('a city with exactly 200 soldiers proposes only 100 instead of an impossible 500',()=>{
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  store.finishCurrentTurn()
  store.state.cities.xuchang.troops=200
  const app={store,audio:{confirm(){},move(){},alert(){},cancel(){}}}
  const scene=Object.create(StrategyScene.prototype)
  scene.app=app
  scene.beginMarchCompose('xuchang')
  assert.equal(scene.view,'march-compose')
  assert.equal(scene.marchTroops,100)
  assert.ok(scene.selectedOfficerNames.length>=1)
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const army=queueMarch(store,{
    from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:scene.marchTroops,food:scene.marchFood,gold:scene.marchGold,
    officerNames:scene.selectedOfficerNames,
  })
  assert.equal(army.troops,100)
  assert.equal(store.state.cities.xuchang.troops,100)
})

test('sub-200 garrison prevents opening a march draft at all',()=>{
  const store=new GameStore(null)
  store.newGame({humanFactions:['cao']})
  store.finishCurrentTurn()
  store.state.cities.xuchang.troops=199
  const signals=[]
  const scene=Object.create(StrategyScene.prototype)
  scene.app={store,audio:{confirm(){},alert(){signals.push('alert')}}}
  scene.beginMarchCompose('xuchang')
  assert.equal(scene.view,'message')
  assert.match(scene.message,/兵力不足/)
  assert.deepEqual(signals,['alert'])
})
