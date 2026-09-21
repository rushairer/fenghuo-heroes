import { CITY_ECONOMY_FIELDS } from './scenario-fields.js'
import { canonicalScenarioEvidence } from './canonical-scenario-evidence.js'
import { validateScenarioStartEvidence } from './scenario-evidence.js'
import { normalizeZhRomCityName } from './original-data.js'

export { CITY_ECONOMY_FIELDS } from './scenario-fields.js'

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
    officerPlacementStatus:'provisional-roster-only',
    cities,
  }
}

export function canonicalScenarioOwnershipByCityId(
  mapProfile,
  evidence,
){
  if(!mapProfile?.canonical){
    throw new Error('Canonical scenario ownership requires a canonical map profile.')
  }
  const report=validateScenarioStartEvidence(evidence)
  if(!report.ownershipReady){
    throw new Error('Canonical scenario ownership evidence is incomplete.')
  }

  const ownershipByName=new Map(
    report.verifiedOwnership.map((record)=>[
      normalizeZhRomCityName(record.city),
      record.factionId,
    ]),
  )

  return Object.freeze(Object.fromEntries(mapProfile.cities.map((city)=>{
    const identity=normalizeZhRomCityName(city.canonicalName??city.name)
    const owner=ownershipByName.get(identity)
    if(typeof owner!=='string'||!owner.trim()){
      throw new Error(`Canonical scenario ownership is missing city: ${identity}`)
    }
    return [city.id,owner]
  })))
}

export function canonicalScenarioStateByCityId(
  mapProfile,
  evidence,
){
  if(!mapProfile?.canonical){
    throw new Error('Canonical scenario state requires a canonical map profile.')
  }
  const report=validateScenarioStartEvidence(evidence)
  if(!report.economyReady){
    throw new Error('Canonical scenario city-state evidence is incomplete.')
  }

  const stateByName=new Map(
    report.verifiedCityStates.map((record)=>[
      normalizeZhRomCityName(record.city),
      record,
    ]),
  )
  return Object.freeze(Object.fromEntries(mapProfile.cities.map((city)=>{
    const identity=normalizeZhRomCityName(city.canonicalName??city.name)
    const source=stateByName.get(identity)
    if(!source)throw new Error(`Canonical scenario city state is missing: ${identity}`)
    return [city.id,Object.freeze(Object.fromEntries(
      CITY_ECONOMY_FIELDS.map((field)=>[field,source[field]])
    ))]
  })))
}

export function canonicalOfficerAssignmentsByCityId(
  mapProfile,
  evidence,
){
  if(!mapProfile?.canonical){
    throw new Error('Canonical officer placement requires a canonical map profile.')
  }
  const report=validateScenarioStartEvidence(evidence)
  if(!report.officerPlacementReady){
    throw new Error('Canonical officer-placement evidence is incomplete.')
  }

  const idByIdentity=new Map(mapProfile.cities.map((city)=>[
    normalizeZhRomCityName(city.canonicalName??city.name),
    city.id,
  ]))
  const assignments=Object.fromEntries(mapProfile.cities.map((city)=>[city.id,[]]))
  for(const record of report.verifiedOfficerAssignments){
    const cityId=idByIdentity.get(normalizeZhRomCityName(record.city))
    if(!cityId)throw new Error(`Canonical officer placement references unknown city: ${record.city}`)
    assignments[cityId].push(record.officer.trim())
  }
  return Object.freeze(Object.fromEntries(
    Object.entries(assignments).map(([cityId,officers])=>[
      cityId,
      Object.freeze([...officers].sort((a,b)=>a.localeCompare(b))),
    ])
  ))
}

export function buildCanonical189ScenarioStartState({
  mapProfile,
  scenarioEvidence=canonicalScenarioEvidence(189),
}={}){
  const ownership=canonicalScenarioOwnershipByCityId(mapProfile,scenarioEvidence)
  const cityState=canonicalScenarioStateByCityId(mapProfile,scenarioEvidence)
  const officerAssignments=canonicalOfficerAssignmentsByCityId(mapProfile,scenarioEvidence)
  const cities=Object.fromEntries(mapProfile.cities.map((city)=>[
    city.id,
    {
      id:city.id,
      owner:ownership[city.id],
      ...cityState[city.id],
      officers:[...officerAssignments[city.id]],
    },
  ]))
  return {
    id:'zh-rom-canonical:189',
    mapProfileId:mapProfile.id,
    scenarioYear:189,
    ownershipStatus:'source-backed-189',
    economyStatus:'source-backed-189',
    officerPlacementStatus:'source-backed-189',
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
  if(mapProfile?.canonical&&year===189){
    return buildCanonical189ScenarioStartState({mapProfile})
  }
  throw new Error(
    `No production scenario start state is calibrated for ${mapProfile?.id??'unknown-map'} / ${year}.`,
  )
}
