import { WORLD_H, WORLD_W } from './world.js'

export function validateRuntimeMapProfile(profile){
  const errors=[]
  if(!profile||typeof profile!=='object')return Object.freeze({ok:false,errors:Object.freeze(['missing-profile'])})
  if(typeof profile.id!=='string'||!profile.id.trim())errors.push('missing-profile-id')
  if(!Array.isArray(profile.cities)||profile.cities.length===0)errors.push('missing-cities')

  const cities=Array.isArray(profile.cities)?profile.cities:[]
  const cityIds=new Set()
  for(const city of cities){
    if(typeof city?.id!=='string'||!city.id.trim()){
      errors.push('invalid-city-id')
      continue
    }
    if(cityIds.has(city.id))errors.push(`duplicate-city-id:${city.id}`)
    cityIds.add(city.id)
    if(typeof city.name!=='string'||!city.name.trim())errors.push(`missing-city-name:${city.id}`)
    if(!Number.isFinite(city.x)||!Number.isFinite(city.y))errors.push(`invalid-city-coordinate:${city.id}`)
    else if(city.x<0||city.x>WORLD_W||city.y<0||city.y>WORLD_H)errors.push(`city-out-of-range:${city.id}`)
    if(typeof city.owner!=='string'||!city.owner.trim())errors.push(`missing-city-owner:${city.id}`)
  }

  const cityById=profile.cityById
  if(!cityById||typeof cityById!=='object')errors.push('missing-city-index')
  else{
    for(const city of cities){
      if(cityById[city.id]!==city)errors.push(`city-index-mismatch:${city.id}`)
    }
  }

  for(const city of cities){
    const neighbors=Array.isArray(city.neighbors)?city.neighbors:[]
    const seen=new Set()
    for(const neighborId of neighbors){
      if(seen.has(neighborId))errors.push(`duplicate-neighbor:${city.id}:${neighborId}`)
      seen.add(neighborId)
      if(!cityIds.has(neighborId))errors.push(`unknown-neighbor:${city.id}:${neighborId}`)
      const neighbor=cityById?.[neighborId]
      if(neighbor&&!neighbor.neighbors?.includes(city.id)){
        errors.push(`asymmetric-neighbor:${city.id}:${neighborId}`)
      }
    }
  }

  const villages=Array.isArray(profile.villages)?profile.villages:[]
  const villageIds=new Set()
  for(const village of villages){
    if(typeof village?.id!=='string'||!village.id.trim()){
      errors.push('invalid-village-id')
      continue
    }
    if(villageIds.has(village.id))errors.push(`duplicate-village-id:${village.id}`)
    villageIds.add(village.id)
    if(!Number.isFinite(village.x)||!Number.isFinite(village.y)){
      errors.push(`invalid-village-coordinate:${village.id}`)
    }else if(village.x<0||village.x>WORLD_W||village.y<0||village.y>WORLD_H){
      errors.push(`village-out-of-range:${village.id}`)
    }
  }

  return Object.freeze({
    ok:errors.length===0,
    errors:Object.freeze(errors),
    cityCount:cities.length,
    villageCount:villages.length,
  })
}

export function assertRuntimeMapProfile(profile){
  const report=validateRuntimeMapProfile(profile)
  if(!report.ok)throw new Error(`Invalid runtime map profile: ${report.errors.join(', ')}`)
  return profile
}
