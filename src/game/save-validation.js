import { WORLD_H, WORLD_W } from './world.js'

// Validation precedes assigning an untrusted browser save to GameStore.
// This is a structural compatibility gate, NOT canonical scenario evidence.
export const REQUIRED_SAVED_CITY_FIELDS=Object.freeze([
  'gold','food','troops','development','rule','defense','training',
])

const isObject=(value)=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
const count=(value,min,max)=>Number.isSafeInteger(value)&&value>=min&&value<=max

export function validateSavedGameState(state,mapProfile){
  const errors=[]
  if(!isObject(state))return Object.freeze({ok:false,errors:Object.freeze(['missing-state'])})
  if(!mapProfile||!Array.isArray(mapProfile.cities)){
    return Object.freeze({ok:false,errors:Object.freeze(['missing-map-profile'])})
  }

  if(!count(state.scenarioYear,1,9999))errors.push('invalid-scenario-year')
  if(!count(state.year,1,9999)||state.year<state.scenarioYear)errors.push('invalid-calendar-year')
  if(!count(state.month,1,12))errors.push('invalid-calendar-month')

  const humans=state.humanFactions
  if(!Array.isArray(humans)||humans.length<1||humans.length>3||
    humans.some((id)=>typeof id!=='string'||!id.trim()||id==='neutral')||
    new Set(humans).size!==humans.length){
    errors.push('invalid-human-factions')
  }
  if(!Array.isArray(humans)||!count(state.activeHumanIndex,0,humans.length-1)){
    errors.push('invalid-active-human-index')
  }

  const cityIds=new Set(mapProfile.cities.map((city)=>city.id))
  if(!cityIds.has(state.activeCity))errors.push('invalid-active-city')
  if(!isObject(state.cursor)||!Number.isFinite(state.cursor.x)||
    !Number.isFinite(state.cursor.y)||state.cursor.x<0||state.cursor.x>WORLD_W||
    state.cursor.y<0||state.cursor.y>WORLD_H){
    errors.push('invalid-cursor')
  }

  if(!isObject(state.cities))errors.push('missing-city-states')
  else{
    for(const id of cityIds){
      const city=state.cities[id]
      if(!isObject(city)||typeof city.owner!=='string'||!city.owner.trim()){
        errors.push('invalid-city:'+id)
        continue
      }
      for(const field of REQUIRED_SAVED_CITY_FIELDS){
        if(!Number.isSafeInteger(city[field])||city[field]<0){
          errors.push('invalid-'+field+':'+id)
        }
      }
      if(city.taxRate!=null&&(!Number.isInteger(city.taxRate)||city.taxRate<0||city.taxRate>99)){
        errors.push('invalid-tax-rate:'+id)
      }
      if(city.officers!=null&&!Array.isArray(city.officers)){
        errors.push('invalid-officers:'+id)
      }
    }
  }

  if(state.armies!=null&&!Array.isArray(state.armies))errors.push('invalid-armies')
  if(state.nextArmyId!=null&&!count(state.nextArmyId,1,Number.MAX_SAFE_INTEGER)){
    errors.push('invalid-next-army-id')
  }
  if(state.inspectionCategories!=null&&!isObject(state.inspectionCategories)){
    errors.push('invalid-inspection-categories')
  }
  if(state.openingRosters!=null&&!isObject(state.openingRosters)){
    errors.push('invalid-opening-rosters')
  }
  if(state.log!=null&&(!Array.isArray(state.log)||
    state.log.some((line)=>typeof line!=='string'))){
    errors.push('invalid-log')
  }
  return Object.freeze({ok:errors.length===0,errors:Object.freeze(errors)})
}

export function assertSavedGameState(state,mapProfile){
  const report=validateSavedGameState(state,mapProfile)
  if(!report.ok)throw new Error('Invalid saved game: '+report.errors.join(','))
  return state
}
