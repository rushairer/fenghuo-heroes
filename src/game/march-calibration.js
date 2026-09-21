import { CANONICAL_MARCH_EVIDENCE } from './canonical-march-evidence.js'
import { validateMarchEvidence } from './march-evidence.js'
import { MARCH_RUNTIME_PROJECTION } from './march-runtime-projection.js'

function parameter(current,observed,ready,evidenceStatus){
  return Object.freeze({
    current,
    observed,
    ready,
    matches:ready?Object.is(current,observed):null,
    runtimeEvidence:evidenceStatus,
  })
}

export function marchCalibrationReport(evidence=CANONICAL_MARCH_EVIDENCE){
  const report=validateMarchEvidence(evidence)
  return Object.freeze({
    status:evidence.status??'unknown',
    sourceLedgerValid:report.sourceLedgerValid,
    verified:report.verified,
    parameters:Object.freeze({
      routeStepWorld:parameter(
        MARCH_RUNTIME_PROJECTION.routeStepWorld,
        report.inferred.routeStepWorld,
        report.readiness.routeStep,
        MARCH_RUNTIME_PROJECTION.evidence.routeStepWorld,
      ),
      routeNodeDays:parameter(
        MARCH_RUNTIME_PROJECTION.routeNodeDays,
        report.inferred.routeNodeDays,
        report.readiness.routeNodeDays,
        MARCH_RUNTIME_PROJECTION.evidence.routeNodeDays,
      ),
      executionDaysPerEvenMonth:parameter(
        MARCH_RUNTIME_PROJECTION.executionDaysPerEvenMonth,
        report.inferred.executionDaysPerEvenMonth,
        report.readiness.executionDaysPerEvenMonth,
        MARCH_RUNTIME_PROJECTION.evidence.executionDaysPerEvenMonth,
      ),
      enemyArmyAdjacencyWorld:parameter(
        MARCH_RUNTIME_PROJECTION.enemyArmyAdjacencyWorld,
        report.inferred.enemyArmyAdjacencyWorld,
        report.readiness.enemyArmyAdjacency,
        MARCH_RUNTIME_PROJECTION.evidence.enemyArmyAdjacencyWorld,
      ),
      enemyCityAdjacencyWorld:parameter(
        MARCH_RUNTIME_PROJECTION.enemyCityAdjacencyWorld,
        report.inferred.enemyCityAdjacencyWorld,
        report.readiness.enemyCityAdjacency,
        MARCH_RUNTIME_PROJECTION.evidence.enemyCityAdjacencyWorld,
      ),
    }),
    starvation:Object.freeze({
      observationCount:report.verified.starvationObservations,
      formulaReady:report.readiness.starvationEffects,
    }),
  })
}
