import test from 'node:test'
import assert from 'node:assert/strict'
import { validateMarchEvidence } from '../src/game/march-evidence.js'

const source={id:'march-cap',kind:'direct-capture',ref:'march.mp4'}

function completeEvidence(){
  return {
    status:'test-complete',
    sources:[source],
    routeSteps:[
      {
        fromX:10,fromY:10,toX:14,toY:10,space:'logical-320x224',
        sourceId:source.id,frameRef:'00:01.000→00:01.100',verified:true,
      },
      {
        fromX:14,fromY:10,toX:14,toY:14,space:'logical-320x224',
        sourceId:source.id,frameRef:'00:01.100→00:01.200',verified:true,
      },
    ],
    movementWindows:[
      {stepsMoved:5,calendarDaysElapsed:5,sourceId:source.id,frameRef:'00:02→00:03',verified:true},
      {stepsMoved:10,calendarDaysElapsed:10,sourceId:source.id,frameRef:'00:04→00:06',verified:true},
    ],
    monthlyExecutionWindows:[
      {
        calendarDaysAdvanced:30,routeStepsMoved:30,routeContinuedNextMonth:true,
        sourceId:source.id,frameRef:'month-window-1',verified:true,
      },
      {
        calendarDaysAdvanced:30,routeStepsMoved:24,routeContinuedNextMonth:true,
        sourceId:source.id,frameRef:'month-window-2',verified:true,
      },
    ],
    adjacencyChecks:[
      {targetKind:'army',gridDistance:1,commandAvailable:true,sourceId:source.id,frameRef:'army-near',verified:true},
      {targetKind:'army',gridDistance:2,commandAvailable:false,sourceId:source.id,frameRef:'army-far',verified:true},
      {targetKind:'city',gridDistance:3,commandAvailable:true,sourceId:source.id,frameRef:'city-near',verified:true},
      {targetKind:'city',gridDistance:4,commandAvailable:false,sourceId:source.id,frameRef:'city-far',verified:true},
    ],
    starvationObservations:[],
  }
}

test('direct march observations can infer the current engineering baseline without hardcoding it',()=>{
  const report=validateMarchEvidence(completeEvidence())
  assert.equal(report.sourceLedgerValid,true)
  assert.equal(report.verified.routeSteps,2)
  assert.equal(report.verified.movementWindows,2)
  assert.equal(report.verified.monthlyExecutionWindows,2)
  assert.equal(report.verified.armyAdjacencyChecks,2)
  assert.equal(report.verified.cityAdjacencyChecks,2)
  assert.deepEqual(report.inferred,{
    routeStepWorld:8,
    routeNodeDays:1,
    executionDaysPerEvenMonth:30,
    enemyArmyAdjacencyGrid:1,
    enemyArmyAdjacencyWorld:8,
    enemyCityAdjacencyGrid:3,
    enemyCityAdjacencyWorld:24,
  })
  assert.equal(report.readiness.routeStep,true)
  assert.equal(report.readiness.routeNodeDays,true)
  assert.equal(report.readiness.executionDaysPerEvenMonth,true)
  assert.equal(report.readiness.enemyArmyAdjacency,true)
  assert.equal(report.readiness.enemyCityAdjacency,true)
  assert.equal(report.readiness.starvationEffects,false)
})

test('route-step inference requires both axes and one consistent square-grid magnitude',()=>{
  const evidence=completeEvidence()
  evidence.routeSteps=evidence.routeSteps.slice(0,1)
  let report=validateMarchEvidence(evidence)
  assert.equal(report.inferred.routeStepWorld,null)

  evidence.routeSteps=[
    completeEvidence().routeSteps[0],
    {
      ...completeEvidence().routeSteps[1],
      toY:15,
    },
  ]
  report=validateMarchEvidence(evidence)
  assert.equal(report.inferred.routeStepWorld,null)
})

test('movement-day inference refuses inconsistent ratios instead of averaging them',()=>{
  const evidence=completeEvidence()
  evidence.movementWindows[1]={...evidence.movementWindows[1],calendarDaysElapsed:20}
  const report=validateMarchEvidence(evidence)
  assert.equal(report.inferred.routeNodeDays,null)
  assert.equal(report.readiness.routeNodeDays,false)
})

test('monthly execution inference requires repeatable unfinished-route windows',()=>{
  const evidence=completeEvidence()
  evidence.monthlyExecutionWindows=evidence.monthlyExecutionWindows.slice(0,1)
  let report=validateMarchEvidence(evidence)
  assert.equal(report.inferred.executionDaysPerEvenMonth,null)

  evidence.monthlyExecutionWindows=[
    completeEvidence().monthlyExecutionWindows[0],
    {...completeEvidence().monthlyExecutionWindows[1],calendarDaysAdvanced:29},
  ]
  report=validateMarchEvidence(evidence)
  assert.equal(report.inferred.executionDaysPerEvenMonth,null)
})

test('adjacency inference requires a positive/negative one-grid boundary pair',()=>{
  const evidence=completeEvidence()
  evidence.adjacencyChecks=evidence.adjacencyChecks.filter((record)=>record.targetKind==='army')
  evidence.adjacencyChecks[1]={...evidence.adjacencyChecks[1],gridDistance:3}
  const report=validateMarchEvidence(evidence)
  assert.equal(report.inferred.enemyArmyAdjacencyGrid,null)
  assert.equal(report.inferred.enemyArmyAdjacencyWorld,null)
  assert.equal(report.readiness.enemyArmyAdjacency,false)
})

test('unverified or duplicate-source observations cannot calibrate runtime parameters',()=>{
  const evidence=completeEvidence()
  evidence.sources.push({...source,ref:'duplicate.mp4'})
  const report=validateMarchEvidence(evidence)
  assert.equal(report.sourceLedgerValid,false)
  assert.deepEqual(report.duplicateSourceIds,['march-cap'])
  assert.equal(report.inferred.routeStepWorld,null)
  assert.equal(report.inferred.routeNodeDays,null)
})

test('starvation observations are recorded but do not invent an effect formula',()=>{
  const evidence=completeEvidence()
  evidence.starvationObservations=[{
    daysStarved:1,
    troopsBefore:1000,
    troopsAfter:970,
    officerHpBefore:80,
    officerHpAfter:78,
    sourceId:source.id,
    frameRef:'starvation-day-1',
    verified:true,
  }]
  const report=validateMarchEvidence(evidence)
  assert.equal(report.verified.starvationObservations,1)
  assert.equal(report.readiness.starvationEffects,false)
})
