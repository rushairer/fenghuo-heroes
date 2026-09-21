import { mapActivationReport } from './map-activation.js'
import { canonicalMapMigrationReadiness } from './map-parity.js'
import { canonicalScenarioReadinessReport } from './scenario-parity.js'
import { marchCalibrationReport } from './march-calibration.js'
import { MONTHLY_COMMAND_PROMPT_EVIDENCE } from './chinese-copy-parity.js'
import { chineseCopyGapReport } from './chinese-copy-gaps.js'

export function evidenceReadinessReport(){
  const activation=mapActivationReport()
  const map=canonicalMapMigrationReadiness()
  const scenarios=canonicalScenarioReadinessReport()
  const copyGaps=chineseCopyGapReport()
  const march=marchCalibrationReport()

  return Object.freeze({
    runtime:Object.freeze({
      mapActivationTarget:activation.activationTarget,
      activeMapProfileId:activation.activeProfileId,
      activeCanonical:activation.activeCanonical,
    }),
    mapGeometry:Object.freeze({
      ready:map.geometryReady,
      sourceLedgerValid:map.sourceLedgerValid,
      cityCoordinates:Object.freeze({
        verified:map.verifiedCityCoordinateCount,
        required:map.requiredCityCoordinateCount,
      }),
      cityNamesResolved:map.cityNamesResolved,
      villageCoverageVerified:map.villageCoordinatesVerified,
      routeNetworkVerified:map.routeNetworkVerified,
      routeEvidenceCount:map.routeEvidenceCount,
    }),
    marchCalibration:march,
    scenarios:Object.freeze(scenarios.map((scenario)=>Object.freeze({
      year:scenario.year,
      ready:scenario.ready,
      ownershipReady:scenario.ownershipReady,
      ownershipEvidenceCount:scenario.ownershipEvidenceCount,
      economyReady:scenario.economyReady,
      cityStateEvidenceCount:scenario.cityStateEvidenceCount,
      officerPlacementReady:scenario.officerPlacementReady,
      officerAssignmentEvidenceCount:scenario.officerAssignmentEvidenceCount,
      blockers:scenario.blockers,
    }))),
    chineseCopy:Object.freeze({
      protected:Object.freeze([
        Object.freeze({
          id:'monthly-command-prompt',
          status:MONTHLY_COMMAND_PROMPT_EVIDENCE.status,
          directFramePending:MONTHLY_COMMAND_PROMPT_EVIDENCE.directFramePending,
        }),
      ]),
      gaps:Object.freeze(copyGaps),
    }),
    scopeNote:'evidence pipeline only; combat formulas, timing, visuals and other parity domains are tracked separately',
  })
}
