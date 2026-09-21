import { CANONICAL_MAP_EVIDENCE } from './canonical-map-evidence.js'
import { canonicalMapMigrationReadiness } from './map-parity.js'
import { normalizeZhRomCityName } from './original-data.js'

export const CITY_ECONOMY_FIELDS=Object.freeze([
  'gold',
  'food',
  'troops',
  'development',
  'rule',
  'defense',
  'training',
])

function provisionalScaffoldEconomy(city){
  return {
    gold:300+((city.x*7+city.y*3)%700),
    food:500+((city.x*11+city.y*5)%1100),
    troops:2500+((city.x*73+city.y*37)%9500),
    development:40+((city.x+city.y)%80),
    rule:80,
    defense:40,
    training:35,
  }
}

function assertEconomyRecord(record,cityId){
  if(!record||typeof record!=='object'){
    throw new Error(`Missing scenario economy for city: ${cityId}`)
  }
  for(const field of CITY_ECONOMY_FIELDS){
    if(!Number.isFinite(record[field])){
      throw new Error(`Invalid scenario economy field ${field} for city: ${cityId}`)
    }
  }
  return record
}

export function buildScaffold189ScenarioStartState(mapProfile){
  if(mapProfile?.id!=='runtime-scaffold'){
    throw new Error('Scaffold 189 start state requires the runtime scaffold map profile.')
  }
  const cities=Object.fromEntries(mapProfile.cities.map((city)=>{
    if(typeof city.owner!=='string'||!city.owner.trim()){
      throw new Error(`Scaffold city is missing provisional owner: ${city.id}`)
    }
    return [city.id,{
      id:city.id,
      owner:city.owner,
      ...provisionalScaffoldEconomy(city),
    }]
  }))
  return {
    id:'runtime-scaffold:189',
    mapProfileId:mapProfile.id,
    scenarioYear:189,
    ownershipStatus:'provisional-scaffold',
    economyStatus:'provisional-coordinate-derived',
    cities,
  }
}

export function canonical189OwnershipByCityId(
  mapProfile,
  evidence=CANONICAL_MAP_EVIDENCE,
){
  if(!mapProfile?.canonical){
    throw new Error('Canonical 189 ownership requires a canonical map profile.')
  }
  const readiness=canonicalMapMigrationReadiness(evidence)
  if(!readiness.scenario189Ready){
    throw new Error('Canonical 189 ownership evidence is incomplete.')
  }

  const ownershipByName=new Map(
    readiness.evidenceReport.verifiedOwnership.map((record)=>[
      normalizeZhRomCityName(record.city),
      record.factionId,
    ]),
  )

  return Object.freeze(Object.fromEntries(mapProfile.cities.map((city)=>{
    const identity=normalizeZhRomCityName(city.canonicalName??city.name)
    const owner=ownershipByName.get(identity)
    if(typeof owner!=='string'||!owner.trim()){
      throw new Error(`Canonical 189 ownership is missing city: ${identity}`)
    }
    return [city.id,owner]
  })))
}

export function buildCanonical189ScenarioStartState({
  mapProfile,
  evidence=CANONICAL_MAP_EVIDENCE,
  economyForCity,
  economyStatus='caller-supplied',
}={}){
  if(typeof economyForCity!=='function'){
    throw new Error('Canonical scenario start state requires an explicit economyForCity source.')
  }
  const ownership=canonical189OwnershipByCityId(mapProfile,evidence)
  const cities=Object.fromEntries(mapProfile.cities.map((city)=>{
    const economy=assertEconomyRecord(economyForCity(city),city.id)
    return [city.id,{
      id:city.id,
      owner:ownership[city.id],
      ...economy,
    }]
  }))
  return {
    id:'zh-rom-canonical:189',
    mapProfileId:mapProfile.id,
    scenarioYear:189,
    ownershipStatus:'source-backed-189',
    economyStatus,
    cities,
  }
}

export function defaultScenarioStartStateFactory({
  mapProfile,
  scenarioYear,
}={}){
  const year=Number(scenarioYear)
  if(mapProfile?.id==='runtime-scaffold'&&year===189){
    return buildScaffold189ScenarioStartState(mapProfile)
  }
  throw new Error(
    `No production scenario start state is calibrated for ${mapProfile?.id??'unknown-map'} / ${year}.`,
  )
}
