export const BATTLE_SPEEDS = Object.freeze([
  Object.freeze({ id:'normal', label:'普通' }),
  Object.freeze({ id:'fast', label:'快速' }),
])

export const MAX_SQUADS_PER_UNIT = 15

export function cycleBattleSpeed(index, delta) {
  const count = BATTLE_SPEEDS.length
  return (index + delta + count) % count
}

export function battlePreparation(conflict, speedId = 'normal') {
  const speed = BATTLE_SPEEDS.find((item) => item.id === speedId)
  if (!speed) throw new Error('未知的戰鬥速度。')
  if (!conflict) throw new Error('戰鬥資料不存在。')
  return Object.freeze({
    kind: conflict.kind ?? 'battle',
    speed: speed.id,
    maxSquadsPerUnit: MAX_SQUADS_PER_UNIT,
    attackerTroops: Math.max(0, Math.floor(conflict.attackerTroops ?? 0)),
    defenderTroops: Math.max(0, Math.floor(conflict.defenderTroops ?? 0)),
    attackerOfficers: Object.freeze([...(conflict.attackerOfficers ?? [])]),
  })
}
