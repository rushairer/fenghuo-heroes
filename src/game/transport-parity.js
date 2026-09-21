
export const TRANSPORT_LOAD_UNIT = 10000
export const TRANSPORT_LOAD_OPTIONS = Object.freeze([
  Object.freeze({ id:'gold', label:'金1萬', gold:TRANSPORT_LOAD_UNIT, food:0 }),
  Object.freeze({ id:'food', label:'米1萬', gold:0, food:TRANSPORT_LOAD_UNIT }),
  Object.freeze({ id:'both', label:'金＋米', gold:TRANSPORT_LOAD_UNIT, food:TRANSPORT_LOAD_UNIT }),
])

export const TRANSPORT_EVIDENCE = Object.freeze({
  sources: Object.freeze(['jp-manual-page-21','zh-player-report']),
  resources: Object.freeze(['gold','food']),
  reportedMaximum: 20000,
  capacityInterpretation: '10000-each-when-both-selected',
  deliveryModel: 'march-map-transport-unit',
  interception: true,
  interceptionTrigger: 'same-map-cell-overlap',
  transportRelativeSpeed: 'faster-than-marching-army-observed',
  capturedCargoDestination: 'unverified',
  movementParity: 'unverified',
})

export function transportLoadOption(loadId) {
  return TRANSPORT_LOAD_OPTIONS.find((option)=>option.id===loadId)??null
}

export function transportLoadStatus(store, sourceId, loadId) {
  if(!store?.state?.cities||!store.mapProfile?.cityById?.[sourceId])return Object.freeze({ok:false,reason:'來源城市不存在。'})
  const source=store.state.cities[sourceId]
  if(!source||source.owner!==store.humanFaction)return Object.freeze({ok:false,reason:'只能從本國城市發出運輸。'})
  const load=transportLoadOption(loadId)
  if(!load)return Object.freeze({ok:false,reason:'請選擇運輸物資。'})
  if(source.gold<load.gold)return Object.freeze({ok:false,reason:`金不足：需要${load.gold}。`})
  if(source.food<load.food)return Object.freeze({ok:false,reason:`米不足：需要${load.food}。`})
  return Object.freeze({ok:true,reason:'',load})
}

export function transportEligibleDestinations(store, sourceId) {
  if(!store?.state?.cities||!sourceId)return Object.freeze([])
  const source=store.state.cities[sourceId]
  if(!source||source.owner!==store.humanFaction)return Object.freeze([])
  return Object.freeze(
    store.mapProfile.cities
      .filter((city)=>city.id!==sourceId&&store.state.cities[city.id]?.owner===store.humanFaction)
      .map((city)=>city.id),
  )
}

export function transportTargetStatus(store, sourceId, targetId) {
  if(!store?.mapProfile?.cityById?.[sourceId])return Object.freeze({ok:false,reason:'來源城市不存在。'})
  if(!store?.mapProfile?.cityById?.[targetId])return Object.freeze({ok:false,reason:'請選擇目的城市。'})
  const eligible=transportEligibleDestinations(store,sourceId)
  if(!eligible.includes(targetId))return Object.freeze({ok:false,reason:'運輸目的地必須是另一座本國城市。'})
  return Object.freeze({ok:true,reason:''})
}


export function transportInterceptStatus(army, transport) {
  if(!army||!transport)return Object.freeze({ok:false,reason:'缺少行軍部隊或運輸隊。'})
  if(army.faction===transport.faction)return Object.freeze({ok:false,reason:'不能截獲本國運輸隊。'})
  if(!Number.isFinite(army.x)||!Number.isFinite(army.y)||!Number.isFinite(transport.x)||!Number.isFinite(transport.y)){
    return Object.freeze({ok:false,reason:'地圖座標不存在。'})
  }
  if(army.x!==transport.x||army.y!==transport.y){
    return Object.freeze({ok:false,reason:'必須與敵方運輸隊在地圖上重疊。'})
  }
  return Object.freeze({ok:true,reason:''})
}

export function capturedTransportCargo(transport) {
  return Object.freeze({
    gold:Math.max(0,Math.floor(transport?.gold??0)),
    food:Math.max(0,Math.floor(transport?.food??0)),
  })
}
