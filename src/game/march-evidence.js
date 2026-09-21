import { MAP_COORDINATE_SPACES, mapEvidenceSourceValid } from './map-evidence.js'
import { WORLD_SCALE } from './world.js'

const TARGET_KINDS=new Set(['army','city'])

function sourceBacked(record,sources){
  return Boolean(
    record?.verified===true&&
    typeof record?.sourceId==='string'&&
    typeof record?.frameRef==='string'&&record.frameRef.trim()&&
    sources.some((source)=>source.id===record.sourceId&&mapEvidenceSourceValid(source))
  )
}

function coordinateSpace(id){
  return Object.values(MAP_COORDINATE_SPACES).find((item)=>item.id===id)??null
}

function pointInSpace(x,y,space){
  return Number.isFinite(x)&&Number.isFinite(y)&&
    x>=0&&x<space.width&&y>=0&&y<space.height
}

function routeStepReport(record,sources){
  const errors=[]
  const space=coordinateSpace(record?.space)
  if(!space)errors.push('unknown-coordinate-space')
  if(space&&(
    !pointInSpace(record?.fromX,record?.fromY,space)||
    !pointInSpace(record?.toX,record?.toY,space)
  ))errors.push('coordinate-out-of-range')

  const dx=Math.abs(Number(record?.toX)-Number(record?.fromX))
  const dy=Math.abs(Number(record?.toY)-Number(record?.fromY))
  const orthogonal=(dx>0&&dy===0)||(dy>0&&dx===0)
  if(!orthogonal)errors.push('not-one-axis-step')
  if(!sourceBacked(record,sources))errors.push('not-source-backed')

  const scale=record?.space===MAP_COORDINATE_SPACES.logical.id?WORLD_SCALE:1
  const magnitude=orthogonal&&Number.isFinite(dx+dy)?(dx+dy)*scale:null
  const axis=orthogonal?(dx>0?'x':'y'):null

  return Object.freeze({
    ok:errors.length===0,
    axis,
    worldMagnitude:magnitude,
    errors:Object.freeze(errors),
  })
}

function positiveInteger(value){
  return Number.isInteger(value)&&value>0
}

function movementWindowReport(record,sources){
  const errors=[]
  if(!positiveInteger(record?.stepsMoved))errors.push('invalid-steps-moved')
  if(!positiveInteger(record?.calendarDaysElapsed))errors.push('invalid-calendar-days')
  if(!sourceBacked(record,sources))errors.push('not-source-backed')
  return Object.freeze({
    ok:errors.length===0,
    errors:Object.freeze(errors),
  })
}

function monthlyWindowReport(record,sources){
  const errors=[]
  if(!positiveInteger(record?.calendarDaysAdvanced))errors.push('invalid-calendar-days')
  if(!Number.isInteger(record?.routeStepsMoved)||record.routeStepsMoved<0)errors.push('invalid-route-steps')
  if(typeof record?.routeContinuedNextMonth!=='boolean')errors.push('missing-route-continuation')
  if(!sourceBacked(record,sources))errors.push('not-source-backed')
  return Object.freeze({
    ok:errors.length===0,
    errors:Object.freeze(errors),
  })
}

function adjacencyReport(record,sources){
  const errors=[]
  if(!TARGET_KINDS.has(record?.targetKind))errors.push('invalid-target-kind')
  if(!Number.isInteger(record?.gridDistance)||record.gridDistance<0)errors.push('invalid-grid-distance')
  if(typeof record?.commandAvailable!=='boolean')errors.push('missing-command-availability')
  if(!sourceBacked(record,sources))errors.push('not-source-backed')
  return Object.freeze({
    ok:errors.length===0,
    errors:Object.freeze(errors),
  })
}

function starvationReport(record,sources){
  const errors=[]
  if(!positiveInteger(record?.daysStarved))errors.push('invalid-starvation-days')
  for(const field of ['troopsBefore','troopsAfter']){
    if(!Number.isInteger(record?.[field])||record[field]<0)errors.push(`invalid-${field}`)
  }
  if(record?.officerHpBefore!=null&&(!Number.isFinite(record.officerHpBefore)||record.officerHpBefore<0)){
    errors.push('invalid-officer-hp-before')
  }
  if(record?.officerHpAfter!=null&&(!Number.isFinite(record.officerHpAfter)||record.officerHpAfter<0)){
    errors.push('invalid-officer-hp-after')
  }
  if(!sourceBacked(record,sources))errors.push('not-source-backed')
  return Object.freeze({
    ok:errors.length===0,
    errors:Object.freeze(errors),
  })
}

function duplicateSourceIds(sources){
  const ids=sources.filter(mapEvidenceSourceValid).map((source)=>source.id)
  return [...new Set(ids)].filter((id)=>ids.filter((candidate)=>candidate===id).length>1)
}

function uniqueNumber(values){
  const finite=values.filter(Number.isFinite)
  const unique=[...new Set(finite)]
  return unique.length===1?unique[0]:null
}

function inferRouteStepWorld(validRouteSteps){
  const axes=new Set(validRouteSteps.map((item)=>item.report.axis))
  if(!axes.has('x')||!axes.has('y'))return null
  return uniqueNumber(validRouteSteps.map((item)=>item.report.worldMagnitude))
}

function inferRouteNodeDays(validMovementWindows){
  if(validMovementWindows.length<2)return null
  const ratios=[]
  for(const {record} of validMovementWindows){
    if(record.calendarDaysElapsed%record.stepsMoved!==0)return null
    ratios.push(record.calendarDaysElapsed/record.stepsMoved)
  }
  return uniqueNumber(ratios)
}

function inferMonthlyExecutionDays(validWindows){
  const bounded=validWindows.filter(({record})=>record.routeContinuedNextMonth===true)
  if(bounded.length<2)return null
  return uniqueNumber(bounded.map(({record})=>record.calendarDaysAdvanced))
}

function inferAdjacencyThreshold(validChecks,targetKind){
  const checks=validChecks.filter(({record})=>record.targetKind===targetKind)
  const positive=checks.filter(({record})=>record.commandAvailable).map(({record})=>record.gridDistance)
  const negative=checks.filter(({record})=>!record.commandAvailable).map(({record})=>record.gridDistance)
  if(!positive.length||!negative.length)return null
  const maxPositive=Math.max(...positive)
  const minNegative=Math.min(...negative.filter((distance)=>distance>maxPositive))
  if(!Number.isFinite(minNegative)||minNegative!==maxPositive+1)return null
  return maxPositive
}

export function validateMarchEvidence(evidence={}){
  const sources=Array.isArray(evidence.sources)?evidence.sources:[]
  const invalidSources=sources.filter((source)=>!mapEvidenceSourceValid(source))
  const duplicateSources=duplicateSourceIds(sources)

  const routeSteps=Array.isArray(evidence.routeSteps)?evidence.routeSteps:[]
  const movementWindows=Array.isArray(evidence.movementWindows)?evidence.movementWindows:[]
  const monthlyExecutionWindows=Array.isArray(evidence.monthlyExecutionWindows)?evidence.monthlyExecutionWindows:[]
  const adjacencyChecks=Array.isArray(evidence.adjacencyChecks)?evidence.adjacencyChecks:[]
  const starvationObservations=Array.isArray(evidence.starvationObservations)?evidence.starvationObservations:[]

  const routeStepReports=routeSteps.map((record)=>routeStepReport(record,sources))
  const movementWindowReports=movementWindows.map((record)=>movementWindowReport(record,sources))
  const monthlyExecutionWindowReports=monthlyExecutionWindows.map((record)=>monthlyWindowReport(record,sources))
  const adjacencyReports=adjacencyChecks.map((record)=>adjacencyReport(record,sources))
  const starvationReports=starvationObservations.map((record)=>starvationReport(record,sources))

  const validRouteSteps=routeSteps
    .map((record,index)=>({record,report:routeStepReports[index]}))
    .filter((item)=>item.report.ok)
  const validMovementWindows=movementWindows
    .map((record,index)=>({record,report:movementWindowReports[index]}))
    .filter((item)=>item.report.ok)
  const validMonthlyExecutionWindows=monthlyExecutionWindows
    .map((record,index)=>({record,report:monthlyExecutionWindowReports[index]}))
    .filter((item)=>item.report.ok)
  const validAdjacencyChecks=adjacencyChecks
    .map((record,index)=>({record,report:adjacencyReports[index]}))
    .filter((item)=>item.report.ok)
  const validStarvationObservations=starvationObservations
    .map((record,index)=>({record,report:starvationReports[index]}))
    .filter((item)=>item.report.ok)

  const sourceLedgerValid=invalidSources.length===0&&duplicateSources.length===0
  const inferred=Object.freeze({
    routeStepWorld:sourceLedgerValid?inferRouteStepWorld(validRouteSteps):null,
    routeNodeDays:sourceLedgerValid?inferRouteNodeDays(validMovementWindows):null,
    executionDaysPerEvenMonth:sourceLedgerValid?inferMonthlyExecutionDays(validMonthlyExecutionWindows):null,
    enemyArmyAdjacencyGrid:sourceLedgerValid?inferAdjacencyThreshold(validAdjacencyChecks,'army'):null,
    enemyCityAdjacencyGrid:sourceLedgerValid?inferAdjacencyThreshold(validAdjacencyChecks,'city'):null,
  })

  return Object.freeze({
    sourceLedgerValid,
    invalidSourceCount:invalidSources.length,
    duplicateSourceIds:Object.freeze(duplicateSources),
    routeStepReports:Object.freeze(routeStepReports),
    movementWindowReports:Object.freeze(movementWindowReports),
    monthlyExecutionWindowReports:Object.freeze(monthlyExecutionWindowReports),
    adjacencyReports:Object.freeze(adjacencyReports),
    starvationReports:Object.freeze(starvationReports),
    verified:Object.freeze({
      routeSteps:validRouteSteps.length,
      movementWindows:validMovementWindows.length,
      monthlyExecutionWindows:validMonthlyExecutionWindows.length,
      armyAdjacencyChecks:validAdjacencyChecks.filter(({record})=>record.targetKind==='army').length,
      cityAdjacencyChecks:validAdjacencyChecks.filter(({record})=>record.targetKind==='city').length,
      starvationObservations:validStarvationObservations.length,
    }),
    inferred,
    readiness:Object.freeze({
      routeStep:inferred.routeStepWorld!=null,
      routeNodeDays:inferred.routeNodeDays!=null,
      executionDaysPerEvenMonth:inferred.executionDaysPerEvenMonth!=null,
      enemyArmyAdjacency:inferred.enemyArmyAdjacencyGrid!=null&&inferred.routeStepWorld!=null,
      enemyCityAdjacency:inferred.enemyCityAdjacencyGrid!=null&&inferred.routeStepWorld!=null,
      starvationEffects:false,
    }),
  })
}
