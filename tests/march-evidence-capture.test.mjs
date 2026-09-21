import test from 'node:test'
import assert from 'node:assert/strict'
import {
  marchAdjacencyCandidate,
  marchCaptureBundle,
  marchMonthlyExecutionCandidate,
  marchMovementWindowCandidate,
  marchRouteStepCandidate,
  marchStarvationCandidate,
  normalizeMarchCaptureBundleForEditing,
} from '../src/game/march-evidence-capture.js'

const source={id:'march-cap',kind:'direct-capture',ref:'march.mp4'}

test('march capture helpers normalize numeric fields and never self-verify',()=>{
  assert.deepEqual(marchRouteStepCandidate({
    fromX:'10',fromY:20,toX:'14',toY:20,
    sourceId:' march-cap ',frameRef:' 00:01→00:02 ',
  }),{
    fromX:10,fromY:20,toX:14,toY:20,space:'logical-320x224',
    sourceId:'march-cap',frameRef:'00:01→00:02',verified:false,
  })
  assert.equal(marchMovementWindowCandidate({
    stepsMoved:'5',calendarDaysElapsed:'5',
    sourceId:source.id,frameRef:'window',
  }).verified,false)
  assert.equal(marchMonthlyExecutionCandidate({
    calendarDaysAdvanced:'30',routeStepsMoved:'20',routeContinuedNextMonth:true,
    sourceId:source.id,frameRef:'month',
  }).routeContinuedNextMonth,true)
  assert.equal(marchAdjacencyCandidate({
    targetKind:'army',gridDistance:'1',commandAvailable:true,
    sourceId:source.id,frameRef:'adj',
  }).gridDistance,1)
  assert.equal(marchStarvationCandidate({
    daysStarved:'1',troopsBefore:'1000',troopsAfter:'970',
    officerHpBefore:'80',officerHpAfter:'78',
    sourceId:source.id,frameRef:'starve',
  }).officerHpAfter,78)
})

test('invalid numeric input remains null instead of becoming a guessed value',()=>{
  const candidate=marchStarvationCandidate({
    daysStarved:'bad',
    troopsBefore:'',
    troopsAfter:null,
    officerHpBefore:'bad',
    officerHpAfter:'',
    sourceId:source.id,
    frameRef:'bad',
  })
  assert.equal(candidate.daysStarved,null)
  assert.equal(candidate.troopsBefore,null)
  assert.equal(candidate.troopsAfter,null)
  assert.equal(candidate.officerHpBefore,null)
  assert.equal(candidate.officerHpAfter,null)
})

test('march capture bundle groups observations without claiming calibration readiness',()=>{
  const route=marchRouteStepCandidate({
    fromX:10,fromY:10,toX:14,toY:10,
    sourceId:source.id,frameRef:'route',
  })
  const bundle=marchCaptureBundle({source,routeSteps:[route]})
  assert.equal(bundle.status,'capture-in-progress')
  assert.equal(bundle.sources.length,1)
  assert.equal(bundle.routeSteps.length,1)
  assert.equal(bundle.routeSteps[0].verified,false)
  assert.deepEqual(bundle.movementWindows,[])
})

test('editing import forces previously verified observations back to candidates',()=>{
  const editable=normalizeMarchCaptureBundleForEditing({
    status:'ready',
    sources:[source],
    routeSteps:[{
      fromX:10,fromY:10,toX:14,toY:10,space:'logical-320x224',
      sourceId:source.id,frameRef:'route',verified:true,
    }],
    movementWindows:[{
      stepsMoved:5,calendarDaysElapsed:5,
      sourceId:source.id,frameRef:'movement',verified:true,
    }],
  })
  assert.equal(editable.routeSteps[0].verified,false)
  assert.equal(editable.movementWindows[0].verified,false)
})

test('editing import refuses cross-source records',()=>{
  assert.throws(
    ()=>normalizeMarchCaptureBundleForEditing({
      sources:[source],
      adjacencyChecks:[{
        targetKind:'army',gridDistance:1,commandAvailable:true,
        sourceId:'other',frameRef:'adj',verified:false,
      }],
    }),
    /another source/,
  )
})
