import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MARCH_RUNTIME_PROJECTION,
  marchProjectionReport,
} from '../src/game/march-runtime-projection.js'

test('current march projection is explicit and entirely provisional where uncalibrated',()=>{
  assert.equal(MARCH_RUNTIME_PROJECTION.routeStepWorld,8)
  assert.equal(MARCH_RUNTIME_PROJECTION.routeNodeDays,1)
  assert.equal(MARCH_RUNTIME_PROJECTION.executionDaysPerEvenMonth,30)
  assert.equal(MARCH_RUNTIME_PROJECTION.enemyArmyAdjacencyWorld,8)
  assert.equal(MARCH_RUNTIME_PROJECTION.enemyCityAdjacencyWorld,24)
  assert.equal(MARCH_RUNTIME_PROJECTION.evidence.routeStepWorld,'provisional-engineering')
  assert.equal(MARCH_RUNTIME_PROJECTION.evidence.routeNodeDays,'provisional-engineering')
  assert.equal(
    MARCH_RUNTIME_PROJECTION.evidence.executionDaysPerEvenMonth,
    'provisional-calendar-baseline',
  )
})

test('projection report exposes values and evidence status together',()=>{
  const report=marchProjectionReport()
  assert.equal(report.routeStepWorld,8)
  assert.equal(report.routeNodeDays,1)
  assert.equal(report.evidence.enemyCityAdjacencyWorld,'provisional-engineering')
})

test('march scene no longer owns independent route-step or 30-day magic constants',()=>{
  const source=readFileSync('src/scenes/strategy-march.js','utf8')
  assert.match(source,/MARCH_RUNTIME_PROJECTION\.routeStepWorld/)
  assert.match(source,/MARCH_RUNTIME_PROJECTION\.executionDaysPerEvenMonth/)
  assert.doesNotMatch(source,/const routeStep=8/)
  assert.doesNotMatch(source,/advanceMarchArmies\(this\.app\.store,30\)/)
})

test('march runtime consumes projection values for execution and enemy-city proximity',()=>{
  const source=readFileSync('src/game/march.js','utf8')
  assert.match(source,/days = MARCH_RUNTIME_PROJECTION\.executionDaysPerEvenMonth/)
  assert.match(source,/const routeNodeDays=MARCH_RUNTIME_PROJECTION\.routeNodeDays/)
  assert.match(source,/MARCH_RUNTIME_PROJECTION\.enemyCityAdjacencyWorld/)
})
