import test from 'node:test'
import assert from 'node:assert/strict'
import { StrategyScene } from '../src/scenes/strategy-parity.js'

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
