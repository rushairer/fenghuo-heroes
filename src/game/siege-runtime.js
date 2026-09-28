const PHASES=new Set(['speed','formation','siege'])
const SPEEDS=new Set(['normal','fast'])

export const SIEGE_RUNTIME_EVIDENCE=Object.freeze({
  targetEdition:'zh-hk-manual',
  attackEffect:'lowers-city-defense-rate',
  lowerDefenseEffect:'raises-probability-of-entering-city-unit-battle',
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
  }
  return conflict.runtime
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
