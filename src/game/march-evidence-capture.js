import { sourceEvidenceCandidate } from './map-evidence-capture.js'

const text=(value)=>String(value??'').trim()
const numberOrNull=(value)=>{
  if(value===''||value==null)return null
  const n=Number(value)
  return Number.isFinite(n)?n:null
}
const integerOrNull=(value)=>{
  const n=numberOrNull(value)
  return Number.isInteger(n)?n:null
}
const base=({sourceId,frameRef}={})=>({
  sourceId:text(sourceId),
  frameRef:text(frameRef),
  verified:false,
})

export function marchRouteStepCandidate({
  fromX,fromY,toX,toY,space='logical-320x224',sourceId,frameRef,
}={}){
  return Object.freeze({
    fromX:numberOrNull(fromX),
    fromY:numberOrNull(fromY),
    toX:numberOrNull(toX),
    toY:numberOrNull(toY),
    space:text(space),
    ...base({sourceId,frameRef}),
  })
}

export function marchMovementWindowCandidate({
  stepsMoved,calendarDaysElapsed,sourceId,frameRef,
}={}){
  return Object.freeze({
    stepsMoved:integerOrNull(stepsMoved),
    calendarDaysElapsed:integerOrNull(calendarDaysElapsed),
    ...base({sourceId,frameRef}),
  })
}

export function marchMonthlyExecutionCandidate({
  calendarDaysAdvanced,routeStepsMoved,routeContinuedNextMonth,
  sourceId,frameRef,
}={}){
  return Object.freeze({
    calendarDaysAdvanced:integerOrNull(calendarDaysAdvanced),
    routeStepsMoved:integerOrNull(routeStepsMoved),
    routeContinuedNextMonth:Boolean(routeContinuedNextMonth),
    ...base({sourceId,frameRef}),
  })
}

export function marchAdjacencyCandidate({
  targetKind,gridDistance,commandAvailable,sourceId,frameRef,
}={}){
  return Object.freeze({
    targetKind:text(targetKind),
    gridDistance:integerOrNull(gridDistance),
    commandAvailable:Boolean(commandAvailable),
    ...base({sourceId,frameRef}),
  })
}

export function marchStarvationCandidate({
  daysStarved,troopsBefore,troopsAfter,officerHpBefore,officerHpAfter,
  sourceId,frameRef,
}={}){
  return Object.freeze({
    daysStarved:integerOrNull(daysStarved),
    troopsBefore:integerOrNull(troopsBefore),
    troopsAfter:integerOrNull(troopsAfter),
    officerHpBefore:numberOrNull(officerHpBefore),
    officerHpAfter:numberOrNull(officerHpAfter),
    ...base({sourceId,frameRef}),
  })
}

export function marchCaptureBundle({
  source,
  routeSteps=[],
  movementWindows=[],
  monthlyExecutionWindows=[],
  adjacencyChecks=[],
  starvationObservations=[],
}={}){
  const normalizedSource=sourceEvidenceCandidate(source)
  const forceCandidate=(record)=>Object.freeze({...record,verified:false})
  return Object.freeze({
    status:'capture-in-progress',
    sources:Object.freeze([normalizedSource]),
    routeSteps:Object.freeze(routeSteps.map(forceCandidate)),
    movementWindows:Object.freeze(movementWindows.map(forceCandidate)),
    monthlyExecutionWindows:Object.freeze(monthlyExecutionWindows.map(forceCandidate)),
    adjacencyChecks:Object.freeze(adjacencyChecks.map(forceCandidate)),
    starvationObservations:Object.freeze(starvationObservations.map(forceCandidate)),
  })
}

export function normalizeMarchCaptureBundleForEditing(bundle={}){
  const sources=Array.isArray(bundle.sources)?bundle.sources:[]
  if(sources.length!==1)throw new Error('March capture import requires exactly one source.')
  const source=sourceEvidenceCandidate(sources[0])
  if(!source.id||!source.ref)throw new Error('March capture import requires a source ID and source ref.')

  const normalize=(records,label)=>Object.freeze((records??[]).map((record)=>{
    if(record?.sourceId!==source.id){
      throw new Error(`Imported ${label} candidate uses another source: ${record?.sourceId??'missing'}`)
    }
    return Object.freeze({...record,verified:false})
  }))

  return Object.freeze({
    source,
    routeSteps:normalize(bundle.routeSteps,'route-step'),
    movementWindows:normalize(bundle.movementWindows,'movement-window'),
    monthlyExecutionWindows:normalize(bundle.monthlyExecutionWindows,'monthly-window'),
    adjacencyChecks:normalize(bundle.adjacencyChecks,'adjacency'),
    starvationObservations:normalize(bundle.starvationObservations,'starvation'),
  })
}
