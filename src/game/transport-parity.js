import { CITIES, CITY_BY_ID } from './data.js'

export const TRANSPORT_EVIDENCE = Object.freeze({
  source: 'zh-rom-community',
  resources: Object.freeze(['gold','food']),
  reportedMaximum: 20000,
  capacityInterpretation: 'ambiguous-total-vs-per-resource',
  deliveryModel: 'march-map-transport-unit',
  interception: true,
})

export function transportEligibleDestinations(store, sourceId) {
  if(!store?.state?.cities||!sourceId)return Object.freeze([])
  const source=store.state.cities[sourceId]
  if(!source||source.owner!==store.humanFaction)return Object.freeze([])
  return Object.freeze(
    CITIES
      .filter((city)=>city.id!==sourceId&&store.state.cities[city.id]?.owner===store.humanFaction)
      .map((city)=>city.id),
  )
}

export function transportTargetStatus(store, sourceId, targetId) {
  if(!CITY_BY_ID[sourceId])return Object.freeze({ok:false,reason:'來源城市不存在。'})
  if(!CITY_BY_ID[targetId])return Object.freeze({ok:false,reason:'請選擇目的城市。'})
  const eligible=transportEligibleDestinations(store,sourceId)
  if(!eligible.includes(targetId))return Object.freeze({ok:false,reason:'運輸目的地必須是另一座本國城市。'})
  return Object.freeze({ok:true,reason:''})
}
