import { mapActivationReport } from '../src/game/map-activation.js'
import { canonicalMapMigrationReadiness } from '../src/game/map-parity.js'
import { runtimeMapParityReport } from '../src/game/map-parity.js'
import { canonicalScenarioReadinessReport } from '../src/game/scenario-parity.js'
import { runtimeMapSelectionReport } from '../src/game/map-profile-selection.js'

const activation=mapActivationReport()
const readiness=canonicalMapMigrationReadiness()
const parity=runtimeMapParityReport()
const scenarios=canonicalScenarioReadinessReport()
const selection=runtimeMapSelectionReport()

console.log(JSON.stringify({
  active:{
    target:activation.activationTarget,
    profileId:activation.activeProfileId,
    canonical:activation.activeCanonical,
  },
  canonicalSelection:{
    reason:selection.reason,
    geometryPreviewAvailable:selection.geometryPreviewAvailable,
    geometryPreviewProfileId:selection.geometryPreviewProfileId,
  },
  canonicalEvidence:{
    ready:readiness.ready,
    geometryReady:readiness.geometryReady,
    scenario189Ready:readiness.scenario189Ready,
    sourceLedgerValid:readiness.sourceLedgerValid,
    ledgerStatus:readiness.ledgerStatus,
    cityCoordinates:`${readiness.verifiedCityCoordinateCount}/${readiness.requiredCityCoordinateCount}`,
    cityNamesResolved:readiness.cityNamesResolved,
    villagesVerified:readiness.villageCoordinatesVerified,
    ownership189:`${readiness.verifiedOwnershipCityCount}/${readiness.requiredCityCoordinateCount}`,
    routeNetworkVerified:readiness.routeNetworkVerified,
    routeEvidenceCount:readiness.routeEvidenceCount,
  },
  canonicalScenarios:scenarios,
  runtimeScaffold:{
    cityIdentityMatchesTarget:parity.cityIdentityMatchesTarget,
    parityComplete:parity.parityComplete,
    missingTarget:parity.missingTarget,
    unexpectedRuntime:parity.unexpectedRuntime,
  },
},null,2))
