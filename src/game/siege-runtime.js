import { formationOfficerNames, normalizeFormationDraft, normalizeFormationPlan } from './battle-formation.js'

const PHASES=new Set(['speed','formation','siege'])
const SPEEDS=new Set(['normal','fast'])

export const SIEGE_RUNTIME_EVIDENCE=Object.freeze({
  targetEdition:'zh-hk-manual',
  attackEffect:'lowers-city-defense-rate',
  lowerDefenseEffect:'raises-probability-of-entering-city-unit-battle',
  headquarters:'fixed-after-placement',
  commander:'attacker-commander-guards-headquarters-and-may-move',
  commanderDefeat:'attacker-loses-surviving-officers-captured',
  deploymentPoints:'map-specific-triangle-markers',
  numericDefenseDelta:'unverified',
  entryBattleProbability:'unverified',
})

export function ensureSiegeRuntime(conflict){
  if(!conflict||conflict.kind!=='siege')throw new Error('攻城資料不存在。')
  const current=conflict.runtime&&typeof conflict.runtime==='object'?conflict.runtime:{}
  conflict.runtime={
    phase:PHASES.has(current.phase)?current.phase:'speed',
    speed:SPEEDS.has(current.speed)?current.speed:null,
    attackOrders:Math.max(0,Math.floor(Number(current.attackOrders)||0)),
    defenseRateSnapshot:Number.isFinite(current.defenseRateSnapshot)
      ?current.defenseRateSnapshot
      :Number.isFinite(conflict.defenderDefense)?conflict.defenderDefense:null,
    lastAttackIntent:current.lastAttackIntent&&typeof current.lastAttackIntent==='object'
      ?{...current.lastAttackIntent}
      :null,
    commanderDraftName:formationOfficerNames(conflict).includes(current.commanderDraftName)
      ?current.commanderDraftName:null,
    commanderPreview:normalizeSiegeCommanderPreview(conflict,current.commanderPreview),
    formationPlan:normalizeFormationPlan(conflict,current.formationPlan),
    formationDraft:current.phase==='siege'
      ?null:normalizeFormationDraft(conflict,current.formationDraft),
  }
  return conflict.runtime
}

// Commander selection is a semantic preview; no headquarters position,
// resource transfer, unit placement or defeat/capture effect is inferred.
function normalizeSiegeCommanderPreview(conflict,preview){
  if(!preview||!formationOfficerNames(conflict).includes(preview.officerName))return null
  return Object.freeze({officerName:preview.officerName,status:'uncalibrated-preview',applied:false})
}

export function siegeCommanderCandidate(conflict){
  const names=formationOfficerNames(conflict)
  const draft=conflict?.runtime?.commanderDraftName
  return names.includes(draft)?draft:names[0]??null
}

export function cycleSiegeCommander(conflict){
  const runtime=ensureSiegeRuntime(conflict)
  if(runtime.phase!=='formation'||runtime.formationDraft?.phase!=='review'){
    throw new Error('尚未進入攻城編成核對。')
  }
  const names=formationOfficerNames(conflict)
  if(!names.length)return null
  const index=names.indexOf(siegeCommanderCandidate(conflict))
  runtime.commanderDraftName=names[(index+1)%names.length]
  return runtime.commanderDraftName
}

export function confirmSiegeCommander(conflict){
  const runtime=ensureSiegeRuntime(conflict)
  if(runtime.phase!=='formation'||runtime.formationDraft?.phase!=='review'){
    throw new Error('尚未進入攻城編成核對。')
  }
  const officerName=siegeCommanderCandidate(conflict)
  runtime.commanderPreview=normalizeSiegeCommanderPreview(conflict,{officerName})
  runtime.commanderDraftName=null
  return runtime.commanderPreview
}

export function setSiegePhase(conflict,phase){
  const runtime=ensureSiegeRuntime(conflict)
  if(!PHASES.has(phase))throw new Error('未知的攻城階段。')
  runtime.phase=phase
  return runtime
}

export function setSiegeSpeed(conflict,speed){
  const runtime=ensureSiegeRuntime(conflict)
  if(!SPEEDS.has(speed))throw new Error('未知的攻城速度。')
  runtime.speed=speed
  return runtime
}

export function queueSiegeAttackIntent(conflict){
  const runtime=ensureSiegeRuntime(conflict)
  if(runtime.phase!=='siege')throw new Error('尚未進入攻城階段。')
  runtime.attackOrders+=1
  runtime.lastAttackIntent={
    sequence:runtime.attackOrders,
    effect:'lower-defense-rate',
    numericDelta:null,
    entryBattleProbability:null,
  }
  return Object.freeze({...runtime.lastAttackIntent})
}

export function siegeRuntimeSnapshot(conflict){
  const runtime=ensureSiegeRuntime(conflict)
  return Object.freeze({
    phase:runtime.phase,
    speed:runtime.speed,
    attackOrders:runtime.attackOrders,
    defenseRateSnapshot:runtime.defenseRateSnapshot,
    lastAttackIntent:runtime.lastAttackIntent?Object.freeze({...runtime.lastAttackIntent}):null,
  })
}
