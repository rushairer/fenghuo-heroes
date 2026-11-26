import test from 'node:test'
import assert from 'node:assert/strict'
import { DUEL_COMMANDS, DUEL_MODES, DUEL_VIEWPORT, autoDuelIntent, cycleDuelMode, duelCameraX, duelStartingPositions } from '../src/game/duel-parity.js'

test('duel exposes original manual / auto choice',()=>{
  assert.deepEqual(DUEL_MODES.map((mode)=>mode.id),['manual','auto'])
  assert.equal(cycleDuelMode(0,-1),1)
  assert.equal(cycleDuelMode(1,1),0)
})

test('A-command menu keeps the four documented duel commands',()=>{
  assert.deepEqual(DUEL_COMMANDS,['說得','罵聲','投降','退卻'])
})

test('auto duel intent approaches at range and can attack at fighting distance',()=>{
  assert.equal(autoDuelIntent(0,80).move,1)
  const intents=[0,620,1240,1860,2480,3100].map((t)=>autoDuelIntent(t,36))
  assert.ok(intents.some((intent)=>intent.attack))
  assert.ok(intents.some((intent)=>intent.guard))
})

test('duel camera preserves opening screen positions and tracks fighters across the world',()=>{
  const {playerX,enemyX}=duelStartingPositions()
  const camera=duelCameraX(playerX,enemyX)
  assert.equal(playerX-camera,78)
  assert.equal(enemyX-camera,242)
  assert.equal(duelCameraX(28,50),0)
  assert.equal(duelCameraX(590,612),DUEL_VIEWPORT.worldWidth-DUEL_VIEWPORT.width)
  const shifted=duelCameraX(playerX+60,enemyX+60)
  assert.equal(shifted-camera,60)
  assert.equal((enemyX-shifted)-(playerX-shifted),enemyX-playerX)
})

test('manual duel movement and enemy retreat can leave the original fixed viewport',async()=>{
  const {DuelScene}=await import('../src/scenes/duel.js')
  const conflict={kind:'siege'}
  const scene=new DuelScene({store:{pendingConflict:conflict},audio:{alert(){},confirm(){}}})
  const input={isDown:key=>key==='ArrowLeft',consume:()=>null}
  scene.updateManualPlayer(4000,input)
  assert.equal(scene.px,DUEL_VIEWPORT.edgePadding)
  scene.px=DUEL_VIEWPORT.worldWidth-DUEL_VIEWPORT.edgePadding-24
  scene.ex=scene.px+22
  scene.enemyCd=100
  scene.updateEnemy(1000)
  assert.equal(scene.ex,DUEL_VIEWPORT.worldWidth-DUEL_VIEWPORT.edgePadding)
  assert.ok(scene.ex-scene.px>=22)
  assert.equal(scene.c,conflict)
  assert.deepEqual(conflict,{kind:'siege'})
})
