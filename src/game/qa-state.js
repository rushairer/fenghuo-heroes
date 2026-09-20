import { officerStatusProjection } from './officer-roster.js'

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
])

const STRATEGY_QA_STATES=new Set([
  'strategy-map',
  'city-status',
  'country-overview',
  'full-map',
  'officer-list',
  'officer-status',
])

export function initialSceneForVisualQa(qaState) {
  if(qaState==='player-count')return 'players'
  if(qaState==='setup')return 'setup'
  if(STRATEGY_QA_STATES.has(qaState))return 'strategy'
  return 'title'
}

function firstOwnedCityId(app) {
  const state=app?.store?.state
  const faction=app?.store?.humanFaction
  if(!state?.cities||!faction)return null
  return Object.entries(state.cities).find(([,runtime])=>runtime?.owner===faction)?.[0]??null
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

  if (!app?.store?.hasGame?.()) return false
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
