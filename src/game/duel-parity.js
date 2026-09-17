export const DUEL_MODES = Object.freeze([
  Object.freeze({ id:'manual', label:'手動' }),
  Object.freeze({ id:'auto', label:'自動' }),
])

export const DUEL_COMMANDS = Object.freeze(['說得','罵聲','投降','退卻'])

export function cycleDuelMode(index, delta) {
  const count = DUEL_MODES.length
  return (index + delta + count) % count
}

export function autoDuelIntent(elapsedMs, distance) {
  const phase = Math.floor(elapsedMs / 620) % 6
  if (distance > 46) return Object.freeze({ move:1, guard:false, attack:null })
  if (distance < 26) return Object.freeze({ move:-1, guard:phase === 0 || phase === 1, attack:null })
  if (phase === 0) return Object.freeze({ move:0, guard:true, attack:null })
  if (phase === 2) return Object.freeze({ move:0, guard:false, attack:'high' })
  if (phase === 4) return Object.freeze({ move:0, guard:false, attack:'low' })
  return Object.freeze({ move:0, guard:false, attack:'middle' })
}
