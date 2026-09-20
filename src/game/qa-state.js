import { ensureMarchState } from './march.js'
import { officerStatusProjection } from './officer-roster.js'
import {
  BATTLE_VISUAL_QA_STATES,
  MARCH_VISUAL_QA_STATES,
  qaOwnedCity,
} from './qa-fixtures.js'

export const VISUAL_QA_STATES = Object.freeze([
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
  ...MARCH_VISUAL_QA_STATES,
  ...BATTLE_VISUAL_QA_STATES,
])

const STRATEGY_QA_STATES=new Set([
  'strategy-map',
  'city-status',
  'country-overview',
  'full-map',
  'officer-list',
  'officer-status',
  ...MARCH_VISUAL_QA_STATES,
])

export function initialSceneForVisualQa(qaState) {
  if(qaState==='player-count')return 'players'
  if(qaState==='setup')return 'setup'
  if(qaState==='siege-speed'||qaState==='siege-formation')return 'siege'
  if(qaState==='duel-mode'||qaState==='duel-manual')return 'duel'
  if(STRATEGY_QA_STATES.has(qaState))return 'strategy'
  return 'title'
}

function firstOwnedCityId(app) {
  return qaOwnedCity(app?.store)?.id??null
}

function applyMarchVisualQaState(app,qaState){
  const scene=app?.scene
  const cityId=firstOwnedCityId(app)
  if(!scene||!cityId)return false

  if(qaState==='army-menu'){
    const army=ensureMarchState(app.store).find((item)=>item.qaFixture)||ensureMarchState(app.store)[0]
    if(!army)return false
    scene.stage='march'
    scene.marchArmyId=army.id
    scene.armyMenuIndex=0
    scene.view='army-menu'
    app.store.setCursor(army.x,army.y)
    return true
  }

  if(typeof scene.beginMarchCompose!=='function')return false
  scene.stage='march'
  scene.beginMarchCompose(cityId)

  if(qaState==='march-compose')return true
  if(qaState==='march-officers'){
    scene.officerCursor=0
    scene.view='march-officers'
    return true
  }
  if(qaState==='march-route-prompt'){
    if(typeof scene.beginNewMarchRoute!=='function')return false
    scene.beginNewMarchRoute()
    scene.view='march-route-prompt'
    return true
  }
  return false
}

export function applyVisualQaState(app, qaState) {
  if (!VISUAL_QA_STATES.includes(qaState)) return false
  const scene=app?.scene
  if (!scene) return false

  if (qaState==='title-splash'||qaState==='title-menu') {
    if (!('phase' in scene)) return false
    scene.phase=qaState==='title-menu'?'menu':'splash'
    scene.selection=0
    scene.blink=0
    return true
  }

  if (qaState==='player-count') {
    if(!('index' in scene))return false
    scene.index=0
    return true
  }

  if (qaState==='setup') {
    if(!('focus' in scene)||!('scenario' in scene))return false
    scene.focus=0
    scene.scenario=0
    scene.difficulty=0
    scene.animation=0
    scene.speed=1
    scene.rulerCursor=0
    scene.rulers?.clear?.()
    return true
  }

  if(qaState==='siege-speed'||qaState==='siege-formation'){
    if(!('phase' in scene)||!scene.conflict)return false
    scene.phase=qaState==='siege-formation'?'formation':'speed'
    scene.speedIndex=0
    scene.message=''
    return true
  }

  if(qaState==='duel-mode'||qaState==='duel-manual'){
    if(!('modeSelect' in scene)||!scene.c)return false
    scene.modeSelect=qaState==='duel-mode'
    scene.modeIndex=0
    scene.autoMode=false
    scene.commandOpen=false
    scene.result=null
    scene.message=''
    scene.php=100
    scene.ehp=100
    return true
  }

  if (!app?.store?.hasGame?.()) return false
  if(MARCH_VISUAL_QA_STATES.includes(qaState))return applyMarchVisualQaState(app,qaState)
  if (!STRATEGY_QA_STATES.has(qaState)) return false

  if(qaState==='strategy-map'){
    scene.view='map'
    return true
  }

  const cityId=firstOwnedCityId(app)
  if(!cityId)return false

  if(qaState==='city-status'){
    scene.targetCity=cityId
    scene.cityStatusReturnView='map'
    scene.view='city-status'
    return true
  }

  if(qaState==='country-overview'||qaState==='full-map'){
    if(!('infoTab' in scene))return false
    scene.view='info'
    scene.infoReturnView='map'
    scene.infoCommandBrowse=false
    scene.infoTab=qaState==='country-overview'?0:1
    scene.syncCountryOverviewCursorToMap?.()
    return true
  }

  if(qaState==='officer-list'||qaState==='officer-status'){
    if(!('officerListCity' in scene))return false
    scene.officerListCity=cityId
    scene.officerListCursor=0
    scene.officerStatusRow=null
    if(qaState==='officer-list'){
      scene.view='officer-list'
      return true
    }
    const row=scene.officerListProjection?.()?.rows?.[0]
    scene.officerStatusRow=row?officerStatusProjection(row):null
    scene.view='officer-status'
    return true
  }

  return false
}
