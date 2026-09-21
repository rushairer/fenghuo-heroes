import { canonicalMapMigrationReadiness } from './map-parity.js'
import { MAP_COORDINATE_SPACES } from './map-evidence.js'
import {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
} from './original-data.js'
import { WORLD_SCALE } from './world.js'

function toWorldPoint(record){
  if(record.space===MAP_COORDINATE_SPACES.world.id){
    return Object.freeze({x:Math.round(record.x),y:Math.round(record.y)})
  }
  if(record.space===MAP_COORDINATE_SPACES.logical.id){
    return Object.freeze({
      x:Math.round(record.x*WORLD_SCALE),
      y:Math.round(record.y*WORLD_SCALE),
    })
  }
  throw new Error(`Unsupported canonical coordinate space: ${record.space}`)
}

function cityIdFor(name){
  const index=ZH_ROM_CANONICAL_CITY_SET.indexOf(normalizeZhRomCityName(name))
  if(index<0)throw new Error(`Unknown canonical city identity: ${name}`)
  return `zh-${String(index+1).padStart(2,'0')}`
}

export function buildCanonicalRuntimeMap(evidence){
  const readiness=canonicalMapMigrationReadiness(evidence)
  if(!readiness.ready){
    throw new Error('Canonical map evidence is incomplete; runtime migration remains blocked.')
  }

  const report=readiness.evidenceReport
  const coordinateByName=new Map(
    report.verifiedCityCoordinates.map((record)=>[
      normalizeZhRomCityName(record.name),
      record,
    ]),
  )
  const ownershipByName=new Map(
    report.verifiedOwnership.map((record)=>[
      normalizeZhRomCityName(record.city),
      record.factionId,
    ]),
  )
  const displayNameByIdentity=new Map(
    report.verifiedNameResolutions.map((record)=>[
      normalizeZhRomCityName(record.ram),
      record.chosen,
    ]),
  )
  const nameToId=new Map(
    ZH_ROM_CANONICAL_CITY_SET.map((name)=>[name,cityIdFor(name)]),
  )
  const neighborIds=Object.fromEntries(
    ZH_ROM_CANONICAL_CITY_SET.map((name)=>[nameToId.get(name),[]]),
  )

  for(const route of report.verifiedRoutes){
    const from=normalizeZhRomCityName(route.from)
    const to=normalizeZhRomCityName(route.to)
    const fromId=nameToId.get(from)
    const toId=nameToId.get(to)
    if(!fromId||!toId)continue
    if(!neighborIds[fromId].includes(toId))neighborIds[fromId].push(toId)
    if(!neighborIds[toId].includes(fromId))neighborIds[toId].push(fromId)
  }

  const cities=ZH_ROM_CANONICAL_CITY_SET.map((name)=>{
    const coordinate=coordinateByName.get(name)
    const point=toWorldPoint(coordinate)
    const id=nameToId.get(name)
    return Object.freeze({
      id,
      name:displayNameByIdentity.get(name)??name,
      canonicalName:name,
      x:point.x,
      y:point.y,
      owner:ownershipByName.get(name)??'neutral',
      neighbors:Object.freeze([...neighborIds[id]].sort()),
      evidence:Object.freeze({
        coordinateSourceId:coordinate.sourceId,
        coordinateFrameRef:coordinate.frameRef,
      }),
    })
  })

  const villages=Object.freeze(report.verifiedVillages.map((record,index)=>{
    const point=toWorldPoint(record)
    return Object.freeze({
      id:`village-${String(index+1).padStart(2,'0')}`,
      x:point.x,
      y:point.y,
      sourceId:record.sourceId,
      frameRef:record.frameRef,
    })
  }))

  return Object.freeze({
    id:'zh-rom-canonical',
    canonical:true,
    evidenceStatus:evidence.status,
    cities:Object.freeze(cities),
    villages,
    cityById:Object.freeze(Object.fromEntries(cities.map((city)=>[city.id,city]))),
  })
}

export function canonicalCityId(name){
  return cityIdFor(name)
}
