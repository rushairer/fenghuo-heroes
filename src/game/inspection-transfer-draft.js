import { openingOfficerListForCity } from './officer-roster.js'

// The Chinese original exposes a 調動 command. Its effect/timing is not yet
// calibrated. This model captures an officer and an own-city target without
// changing placements, resources, or the strategic calendar.
function availableOfficerRows(store,sourceId){
  const source=store.state.cities[sourceId]
  const deployed=new Set((store.state.armies??[])
    .filter((army)=>army.faction===source.owner)
    .flatMap((army)=>army.officerNames??[]))
  const projection=openingOfficerListForCity(store,sourceId)
  return {
    cityAssignmentVerified:projection.cityAssignmentVerified,
    rows:projection.rows.filter((row)=>!deployed.has(row.name)),
  }
}

export function newInspectionTransferDraft(store,sourceId){
  if(!store?.state||store.mode!=='inspection')throw new Error('只有視察月才能準備調動。')
  const source=store.state.cities[sourceId]
  if(!source||source.owner!==store.humanFaction)throw new Error('只能從本國城池調動武將。')
  const destinations=store.mapProfile.cities
    .filter((city)=>city.id!==sourceId&&store.state.cities[city.id]?.owner===store.humanFaction)
    .map((city)=>Object.freeze({id:city.id,name:city.name}))
  if(!destinations.length)throw new Error('目前沒有另一座本國城市可供調動。')
  const candidates=availableOfficerRows(store,sourceId)
  if(!candidates.rows.length)throw new Error('目前沒有可調動的駐城武將。')
  return Object.freeze({
    sourceId,
    phase:'officer',
    officerIndex:0,
    destinationIndex:0,
    candidates:Object.freeze(candidates.rows.map((row)=>Object.freeze({
      name:row.name,role:row.role,
    }))),
    destinations:Object.freeze(destinations),
    cityAssignmentVerified:candidates.cityAssignmentVerified,
  })
}

export function inspectionTransferDraftStatus(store,draft){
  if(!draft||!store?.state)return Object.freeze({ok:false,reason:'調動準備資料不存在。'})
  const from=store.state.cities[draft.sourceId]
  if(!from||from.owner!==store.humanFaction){
    return Object.freeze({ok:false,reason:'調動出發城已不是本國城市。'})
  }
  const candidate=draft.candidates?.[draft.officerIndex]
  const live=availableOfficerRows(store,draft.sourceId)
  if(!candidate||!live.rows.some((row)=>row.name===candidate.name)){
    return Object.freeze({ok:false,reason:'武將已不可從此城調動。'})
  }
  const destination=draft.destinations?.[draft.destinationIndex]
  if(!destination||destination.id===draft.sourceId||
    store.state.cities[destination.id]?.owner!==store.humanFaction){
    return Object.freeze({ok:false,reason:'調動目的地必須是另一座本國城市。'})
  }
  return Object.freeze({ok:true,reason:''})
}

export function transitionInspectionTransferDraft(store,draft,button){
  if(!draft||!['officer','destination','review'].includes(draft.phase)){
    throw new Error('調動準備階段無效。')
  }
  if(button==='B'){
    if(draft.phase==='officer')return Object.freeze({status:'cancelled',draft})
    return Object.freeze({status:'updated',draft:Object.freeze({
      ...draft,phase:draft.phase==='review'?'destination':'officer',
    })})
  }
  const selection=draft.phase==='officer'?'officerIndex':
    draft.phase==='destination'?'destinationIndex':null
  const rows=draft.phase==='officer'?draft.candidates:draft.destinations
  if(selection&&(button==='UP'||button==='DOWN')){
    const delta=button==='UP'?-1:1
    return Object.freeze({status:'updated',draft:Object.freeze({
      ...draft,[selection]:(draft[selection]+delta+rows.length)%rows.length,
    })})
  }
  if(button!=='C')return Object.freeze({status:'ignored',draft})
  const check=inspectionTransferDraftStatus(store,draft)
  if(!check.ok)return Object.freeze({status:'invalid',reason:check.reason,draft})
  if(draft.phase==='officer')return Object.freeze({
    status:'updated',draft:Object.freeze({...draft,phase:'destination'}),
  })
  if(draft.phase==='destination')return Object.freeze({
    status:'updated',draft:Object.freeze({...draft,phase:'review'}),
  })
  return Object.freeze({status:'preview-only',draft})
}

export function inspectionTransferDraftSummary(draft){
  const officer=draft?.candidates?.[draft.officerIndex]
  const destination=draft?.destinations?.[draft.destinationIndex]
  if(!officer||!destination)throw new Error('調動命令缺少武將或目的地。')
  return Object.freeze({
    commandId:'transfer',
    sourceId:draft.sourceId,
    destinationId:destination.id,
    destinationName:destination.name,
    officerName:officer.name,
    evidence:draft.cityAssignmentVerified?'source-backed-city-officers':'provisional-faction-roster',
    effectApplied:false,
  })
}
