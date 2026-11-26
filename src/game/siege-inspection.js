import { officerStatusProjection } from './officer-roster.js'

// Only conflict participants, never a faction-wide opening roster or
// invented tactical positions. Unknown officer values stay unknown.
export function siegeInspectionRows(conflict){
  if(conflict?.kind!=='siege')return Object.freeze([])
  const rows=[]
  for(const side of ['attacker','defender']){
    const names=conflict[side+'Officers']
    if(!Array.isArray(names))continue
    for(const name of new Set(names.filter(n=>typeof n==='string').map(n=>n.trim()).filter(Boolean))){
      rows.push(Object.freeze({side,status:officerStatusProjection({name,role:null})}))
    }
  }
  return Object.freeze(rows)
}

export function siegeStrengthRows(conflict){
  if(conflict?.kind!=='siege')return Object.freeze([])
  const value=(key)=>Number.isFinite(conflict[key])?conflict[key]:null
  return Object.freeze(['attacker','defender'].map(side=>Object.freeze({
    side,troops:value(side+'Troops'),attack:value(side+'Attack'),morale:value(side+'Morale'),
  })))
}
