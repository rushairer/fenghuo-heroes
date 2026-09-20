import test from 'node:test'
import assert from 'node:assert/strict'
import {
  VISUAL_QA_STATES,
  applyVisualQaState,
  initialSceneForVisualQa,
} from '../src/game/qa-state.js'

test('visual QA state catalog covers setup, strategy, march, siege and duel screens',()=>{
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
    'march-compose',
    'march-officers',
    'march-route-prompt',
    'army-menu',
    'siege-speed',
    'siege-formation',
    'duel-mode',
    'duel-manual',
  ])
})

test('QA states resolve to deterministic initial scenes',()=>{
  assert.equal(initialSceneForVisualQa('title-menu'),'title')
  assert.equal(initialSceneForVisualQa('player-count'),'players')
  assert.equal(initialSceneForVisualQa('setup'),'setup')
  assert.equal(initialSceneForVisualQa('strategy-map'),'strategy')
  assert.equal(initialSceneForVisualQa('march-compose'),'strategy')
  assert.equal(initialSceneForVisualQa('siege-speed'),'siege')
  assert.equal(initialSceneForVisualQa('duel-mode'),'duel')
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
  const store={
    humanFaction:'liu',
    hasGame:()=>true,
    state:{
      cities:{c1:{owner:'liu',troops:5000,food:3000,gold:900},c2:{owner:'cao',troops:4200}},
      armies:[],
      openingRosters:{liu:{ruler:'劉備',officers:['關羽','張飛']}},
      cursor:{x:20,y:20},
    },
    assertState(){},
    setCursor(x,y){this.state.cursor={x,y}},
  }
  return {
    store,
    audio:{confirm(){},move(){},cancel(){},alert(){}},
    scene:{
      app:null,
      view:'map',
      stage:'march',
      infoTab:0,
      infoReturnView:'map',
      infoCommandBrowse:true,
      targetCity:null,
      cityStatusReturnView:'map',
      countryOverviewCursor:0,
      officerListCity:null,
      officerListCursor:4,
      officerStatusRow:null,
      marchArmyId:null,
      armyMenuIndex:4,
      officerCursor:3,
      selectedOfficerNames:[],
      composeFocus:4,
      marchTroops:1000,
      marchFood:300,
      marchGold:100,
      marchFoodDays:30,
      syncCountryOverviewCursorToMap(){this.countryOverviewCursor=2},
      officerListProjection(){return {rows:[{name:'關羽',role:'將'}]}},
      beginMarchCompose(cityId){
        this.marchFrom=cityId
        this.composeFocus=0
        this.selectedOfficerNames=['劉備']
        this.view='march-compose'
      },
      beginNewMarchRoute(){
        this.marchRoute=[{x:20,y:20}]
        this.view='march-route-prompt'
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

test('march QA states deterministically open compose, officers, route prompt and army menu',()=>{
  for(const qaState of ['march-compose','march-officers','march-route-prompt']){
    const app=strategyApp()
    assert.equal(applyVisualQaState(app,qaState),true)
    assert.equal(app.scene.stage,'march')
    assert.equal(app.scene.marchFrom,'c1')
    if(qaState==='march-compose')assert.equal(app.scene.view,'march-compose')
    if(qaState==='march-officers')assert.equal(app.scene.view,'march-officers')
    if(qaState==='march-route-prompt')assert.equal(app.scene.view,'march-route-prompt')
  }

  const armyMenu=strategyApp()
  armyMenu.store.state.armies=[{
    id:'qa-army',faction:'liu',x:40,y:50,qaFixture:true,
  }]
  assert.equal(applyVisualQaState(armyMenu,'army-menu'),true)
  assert.equal(armyMenu.scene.view,'army-menu')
  assert.equal(armyMenu.scene.marchArmyId,'qa-army')
  assert.deepEqual(armyMenu.store.state.cursor,{x:40,y:50})
})

test('siege QA states reset phase and overlays deterministically',()=>{
  for(const [qaState,phase] of [['siege-speed','speed'],['siege-formation','formation']]){
    const app={scene:{phase:'formation',speedIndex:2,message:'old',conflict:{target:'x'}}}
    assert.equal(applyVisualQaState(app,qaState),true)
    assert.equal(app.scene.phase,phase)
    assert.equal(app.scene.speedIndex,0)
    assert.equal(app.scene.message,'')
  }
})

test('duel QA states reset mode, health and transient command state',()=>{
  for(const [qaState,modeSelect] of [['duel-mode',true],['duel-manual',false]]){
    const app={scene:{
      c:{target:'x'},modeSelect:false,modeIndex:2,autoMode:true,commandOpen:true,
      result:'勝',message:'old',php:12,ehp:5,
    }}
    assert.equal(applyVisualQaState(app,qaState),true)
    assert.equal(app.scene.modeSelect,modeSelect)
    assert.equal(app.scene.modeIndex,0)
    assert.equal(app.scene.autoMode,false)
    assert.equal(app.scene.commandOpen,false)
    assert.equal(app.scene.result,null)
    assert.equal(app.scene.php,100)
    assert.equal(app.scene.ehp,100)
  }
})

test('unknown QA states and missing required scene shapes are inert',()=>{
  assert.equal(applyVisualQaState({scene:{}},'invented-screen'),false)
  assert.equal(applyVisualQaState({scene:{}},'setup'),false)
})
