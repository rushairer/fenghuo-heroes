import test from 'node:test'
import assert from 'node:assert/strict'
import {
  VISUAL_QA_STATES,
  applyVisualQaState,
  initialSceneForVisualQa,
} from '../src/game/qa-state.js'

test('visual QA state catalog covers setup and primary strategy inspection screens',()=>{
  assert.deepEqual(VISUAL_QA_STATES,[
    'title-splash',
    'title-menu',
    'player-count',
    'setup',
    'strategy-map',
    'city-status',
    'country-overview',
    'full-map',
    'officer-list',
    'officer-status',
  ])
})

test('QA states resolve to deterministic initial scenes',()=>{
  assert.equal(initialSceneForVisualQa('title-menu'),'title')
  assert.equal(initialSceneForVisualQa('player-count'),'players')
  assert.equal(initialSceneForVisualQa('setup'),'setup')
  assert.equal(initialSceneForVisualQa('strategy-map'),'strategy')
  assert.equal(initialSceneForVisualQa('officer-status'),'strategy')
  assert.equal(initialSceneForVisualQa('unknown'),'title')
})

test('title QA states fix phase, selection and blink state',()=>{
  const menu={scene:{phase:'splash',selection:1,blink:913}}
  assert.equal(applyVisualQaState(menu,'title-menu'),true)
  assert.equal(menu.scene.phase,'menu')
  assert.equal(menu.scene.selection,0)
  assert.equal(menu.scene.blink,0)

  const splash={scene:{phase:'menu',selection:1,blink:500}}
  assert.equal(applyVisualQaState(splash,'title-splash'),true)
  assert.equal(splash.scene.phase,'splash')
  assert.equal(splash.scene.blink,0)
})

test('player-count and setup QA states reset deterministic controls',()=>{
  const players={scene:{index:2}}
  assert.equal(applyVisualQaState(players,'player-count'),true)
  assert.equal(players.scene.index,0)

  const setup={
    scene:{
      focus:4,scenario:2,difficulty:2,animation:1,speed:2,rulerCursor:5,rulers:new Set([1,2]),
    },
  }
  assert.equal(applyVisualQaState(setup,'setup'),true)
  assert.equal(setup.scene.focus,0)
  assert.equal(setup.scene.scenario,0)
  assert.equal(setup.scene.speed,1)
  assert.equal(setup.scene.rulers.size,0)
})

function strategyApp() {
  return {
    store:{
      humanFaction:'liu',
      hasGame:()=>true,
      state:{cities:{c1:{owner:'liu'},c2:{owner:'cao'}}},
    },
    scene:{
      view:'map',
      infoTab:0,
      infoReturnView:'map',
      infoCommandBrowse:true,
      targetCity:null,
      cityStatusReturnView:'map',
      countryOverviewCursor:0,
      officerListCity:null,
      officerListCursor:4,
      officerStatusRow:null,
      syncCountryOverviewCursorToMap(){this.countryOverviewCursor=2},
      officerListProjection(){
        return {rows:[{name:'關羽',role:'將'}]}
      },
    },
  }
}

test('strategy QA states select map, city and info views from the first owned city',()=>{
  const map=strategyApp()
  assert.equal(applyVisualQaState(map,'strategy-map'),true)
  assert.equal(map.scene.view,'map')

  const city=strategyApp()
  assert.equal(applyVisualQaState(city,'city-status'),true)
  assert.equal(city.scene.view,'city-status')
  assert.equal(city.scene.targetCity,'c1')

  const overview=strategyApp()
  assert.equal(applyVisualQaState(overview,'country-overview'),true)
  assert.equal(overview.scene.view,'info')
  assert.equal(overview.scene.infoTab,0)
  assert.equal(overview.scene.countryOverviewCursor,2)

  const fullMap=strategyApp()
  assert.equal(applyVisualQaState(fullMap,'full-map'),true)
  assert.equal(fullMap.scene.infoTab,1)
})

test('officer QA states derive display rows without inventing new officer data',()=>{
  const list=strategyApp()
  assert.equal(applyVisualQaState(list,'officer-list'),true)
  assert.equal(list.scene.view,'officer-list')
  assert.equal(list.scene.officerListCity,'c1')
  assert.equal(list.scene.officerListCursor,0)

  const status=strategyApp()
  assert.equal(applyVisualQaState(status,'officer-status'),true)
  assert.equal(status.scene.view,'officer-status')
  assert.equal(status.scene.officerStatusRow.name,'關羽')
  assert.equal(status.scene.officerStatusRow.role,'將')
})

test('unknown QA states and missing required scene shapes are inert',()=>{
  assert.equal(applyVisualQaState({scene:{}},'invented-screen'),false)
  assert.equal(applyVisualQaState({scene:{}},'setup'),false)
})
