import { formationOfficerNames, normalizeFormationDraft, normalizeFormationPlan } from './battle-formation.js'
import { OBSERVED_BATTLE_SEGMENT_DAYS } from './battle-time-parity.js'

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
  unitOrdersPerDay:1,
  dayAdvance:'explicit-engineering-preview',
  carryover:'manual-confirmed-monthly-resumption',
  previewSegmentDays:OBSERVED_BATTLE_SEGMENT_DAYS,
  numericDefenseDelta:'unverified',
  entryBattleProbability:'unverified',
})

export function ensureSiegeRuntime(conflict){
  if(!conflict||conflict.kind!=='siege')throw new Error('攻城資料不存在。')
  const current=conflict.runtime&&typeof conflict.runtime==='object'?conflict.runtime:{}
  // Same conservative preview boundary as field battle; the manual confirms
  // monthly resumption, not an exact 30-day siege clock.
  const day=Number.isSafeInteger(current.day)&&current.day>=1
    ?Math.min(current.day,OBSERVED_BATTLE_SEGMENT_DAYS):1
  const names=formationOfficerNames(conflict)
  const usedOfficerNames=Array.isArray(current.usedOfficerNames)
    ?[...new Set(current.usedOfficerNames.filter(name=>names.includes(name)))]:[]
  conflict.runtime={
    day,
    carryoverPending:day>=OBSERVED_BATTLE_SEGMENT_DAYS,
    usedOfficerNames,
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

export function queueSiegeAttackIntent(conflict,officerName){
  const runtime=ensureSiegeRuntime(conflict)
  if(runtime.phase!=='siege')throw new Error('尚未進入攻城階段。')
  if(runtime.carryoverPending)throw new Error('30日工程段落已結束，待校準跨月續戰。')
  if(!formationOfficerNames(conflict).includes(officerName))throw new Error('必須指定參戰的己方武將。')
  if(runtime.usedOfficerNames.includes(officerName))throw new Error('此部隊本日已接受命令。')
  runtime.usedOfficerNames.push(officerName)
  runtime.attackOrders+=1
  runtime.lastAttackIntent={
    sequence:runtime.attackOrders,
    day:runtime.day,
    officerName,
    effect:'lower-defense-rate',
    numericDelta:null,
    entryBattleProbability:null,
  }
  return Object.freeze({...runtime.lastAttackIntent})
}

// Explicit preview transition only: no automatic clock, movement, resource
// consumption or battle result is inferred from an incremented command day.
export function advanceSiegeOrderDay(conflict){
  const runtime=ensureSiegeRuntime(conflict)
  if(runtime.phase!=='siege')throw new Error('尚未進入攻城階段。')
  if(runtime.carryoverPending)throw new Error('30日工程段落已結束，待校準跨月續戰。')
  runtime.day+=1
  runtime.carryoverPending=runtime.day>=OBSERVED_BATTLE_SEGMENT_DAYS
  runtime.usedOfficerNames=[]
  return runtime.day
}

export function siegeRuntimeSnapshot(conflict){
  const runtime=ensureSiegeRuntime(conflict)
  return Object.freeze({
    phase:runtime.phase,
    speed:runtime.speed,
    day:runtime.day,
    carryoverPending:runtime.carryoverPending,
    usedOfficerNames:Object.freeze([...runtime.usedOfficerNames]),
    attackOrders:runtime.attackOrders,
    defenseRateSnapshot:runtime.defenseRateSnapshot,
    lastAttackIntent:runtime.lastAttackIntent?Object.freeze({...runtime.lastAttackIntent}):null,
  })
}

// Manual-confirmed headquarters role, projected from the actual besieging
// army. The army ledger remains the sole resource owner until a calibrated
// tactical transfer exists. No position or deployed entity is synthesized.
export function siegeHeadquartersProjection(store,conflict){
  if(conflict?.kind!=='siege')return null
  const army=Array.isArray(store?.state?.armies)
    ?store.state.armies.find(item=>item.id===conflict.armyId&&item.faction===conflict.attacker)
    :null
  const amount=value=>Number.isSafeInteger(value)&&value>=0?value:null
  const candidate=conflict.runtime?.commanderPreview?.officerName
  const commanderName=formationOfficerNames(conflict).includes(candidate)?candidate:null
  return Object.freeze({
    commanderName,
    commanderMayMove:true,
    fixedAfterPlacement:true,
    position:null,
    deployed:false,
    resourceSource:army?'attacker-army-ledger':'unavailable',
    gold:amount(army?.gold),
    food:amount(army?.food),
  })
}
