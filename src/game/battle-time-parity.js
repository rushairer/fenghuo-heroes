export const OBSERVED_BATTLE_SEGMENT_DAYS = 30
export const BATTLE_SEGMENT_EVIDENCE = 'observed-gameplay-not-manual-confirmed'

export function battleDayState(day) {
  const current=Math.max(0,Math.floor(Number(day)||0))
  return Object.freeze({
    day:current,
    segmentComplete:current>=OBSERVED_BATTLE_SEGMENT_DAYS,
    shouldReturnToStrategy:current>=OBSERVED_BATTLE_SEGMENT_DAYS,
    shouldResumeBattleLater:current>=OBSERVED_BATTLE_SEGMENT_DAYS,
  })
}

export function advanceBattleDay(day,delta=1) {
  const current=Math.max(0,Math.floor(Number(day)||0))
  const step=Math.max(0,Math.floor(Number(delta)||0))
  return battleDayState(Math.min(OBSERVED_BATTLE_SEGMENT_DAYS,current+step))
}
