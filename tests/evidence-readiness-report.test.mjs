import test from 'node:test'
import assert from 'node:assert/strict'
import { evidenceReadinessReport } from '../src/game/evidence-readiness-report.js'

test('repository evidence report keeps the live map and canonical evidence state separate',()=>{
  const report=evidenceReadinessReport()
  assert.equal(report.runtime.mapActivationTarget,'scaffold')
  assert.equal(report.runtime.activeMapProfileId,'runtime-scaffold')
  assert.equal(report.runtime.activeCanonical,false)
  assert.equal(report.mapGeometry.ready,false)
  assert.equal(report.mapGeometry.cityCoordinates.required,40)
})

test('repository evidence report exposes all three independent scenario gates',()=>{
  const report=evidenceReadinessReport()
  assert.deepEqual(report.scenarios.map((item)=>item.year),[189,200,215])
  assert.ok(report.scenarios.every((item)=>item.ready===false))
  assert.ok(report.scenarios.every((item)=>item.ownershipEvidenceCount===0))
  assert.ok(report.scenarios.every((item)=>item.cityStateEvidenceCount===0))
  assert.ok(report.scenarios.every((item)=>item.officerAssignmentEvidenceCount===0))
})

test('copy report distinguishes protected corroborated text from unresolved copy gaps',()=>{
  const report=evidenceReadinessReport()
  assert.equal(report.chineseCopy.protected.length,1)
  assert.equal(report.chineseCopy.protected[0].id,'monthly-command-prompt')
  assert.equal(report.chineseCopy.protected[0].directFramePending,true)
  assert.ok(report.chineseCopy.gaps.length>=4)
  assert.ok(report.scopeNote.includes('combat formulas'))
})


test('repository evidence report exposes provisional march parameters without pretending calibration',()=>{
  const report=evidenceReadinessReport()
  assert.equal(report.marchCalibration.status,'blocked-awaiting-direct-capture')
  assert.equal(report.marchCalibration.verified.routeSteps,0)
  assert.equal(report.marchCalibration.verified.movementWindows,0)
  assert.equal(report.marchCalibration.parameters.routeStepWorld.current,8)
  assert.equal(report.marchCalibration.parameters.routeStepWorld.observed,null)
  assert.equal(report.marchCalibration.parameters.routeStepWorld.ready,false)
  assert.equal(report.marchCalibration.parameters.routeStepWorld.matches,null)
  assert.equal(report.marchCalibration.parameters.routeNodeDays.current,1)
  assert.equal(report.marchCalibration.parameters.executionDaysPerEvenMonth.current,30)
  assert.equal(report.marchCalibration.starvation.formulaReady,false)
})
