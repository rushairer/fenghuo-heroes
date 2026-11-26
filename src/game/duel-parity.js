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

// Original play material confirms horizontal scrolling, not the arena width
// or camera rule. Keep these preview values isolated from original statistics.
export const DUEL_VIEWPORT = Object.freeze({
  width:320,
  worldWidth:640,
  edgePadding:28,
  evidence:'horizontal-scroll-confirmed; geometry-and-camera-provisional',
})

export function duelCameraX(playerX,enemyX){
  return Math.max(0,Math.min(DUEL_VIEWPORT.worldWidth-DUEL_VIEWPORT.width,
    (playerX+enemyX)/2-DUEL_VIEWPORT.width/2))
}

export function duelStartingPositions(){
  const center=DUEL_VIEWPORT.worldWidth/2
  return Object.freeze({playerX:center-82,enemyX:center+82})
}

// JP manual p.35 describes weapon selection before control-mode selection.
 // The target-edition inventory and weapon effects are not calibrated. Only
 // isolated visual QA receives synthetic category choices, not real equipment.
export const DUEL_QA_WEAPONS=Object.freeze([
  Object.freeze({id:'qa-sword',label:'劍'}),
  Object.freeze({id:'qa-spear',label:'槍'}),
  Object.freeze({id:'qa-blade',label:'大刀'}),
])

export function duelWeaponOptions(conflict){
  return conflict?.qaFixture===true?DUEL_QA_WEAPONS:Object.freeze([])
}
