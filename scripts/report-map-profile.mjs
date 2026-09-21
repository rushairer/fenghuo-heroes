import { mapActivationReport } from '../src/game/map-activation.js'
import { canonicalMapMigrationReadiness } from '../src/game/map-parity.js'
import { runtimeMapParityReport } from '../src/game/map-parity.js'

const activation=mapActivationReport()
const readiness=canonicalMapMigrationReadiness()
const parity=runtimeMapParityReport()

console.log(JSON.stringify({
  active:{
    target:activation.activationTarget,
    profileId:activation.activeProfileId,
    canonical:activation.activeCanonical,
  },
  canonicalEvidence:{
    ready:readiness.ready,
    ledgerStatus:readiness.ledgerStatus,
    cityCoordinates:`${readiness.verifiedCityCoordinateCount}/${readiness.requiredCityCoordinateCount}`,
    cityNamesResolved:readiness.cityNamesResolved,
    villagesVerified:readiness.villageCoordinatesVerified,
    ownership189:`${readiness.verifiedOwnershipCityCount}/${readiness.requiredCityCoordinateCount}`,
    routeNetworkVerified:readiness.routeNetworkVerified,
    routeEvidenceCount:readiness.routeEvidenceCount,
  },
  runtimeScaffold:{
    cityIdentityMatchesTarget:parity.cityIdentityMatchesTarget,
    parityComplete:parity.parityComplete,
    missingTarget:parity.missingTarget,
    unexpectedRuntime:parity.unexpectedRuntime,
  },
},null,2))
