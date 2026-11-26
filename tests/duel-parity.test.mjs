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

test('QA duel selects a weapon before manual/auto and returns to the weapon picker',async()=>{
  const {DuelScene}=await import('../src/scenes/duel.js')
  const conflict={kind:'siege',qaFixture:true}
  const scene=new DuelScene({store:{pendingConflict:conflict},audio:{move(){},confirm(){},cancel(){},alert(){}}})
  const press=(key)=>scene.update(16,{consume:()=>key,isDown:()=>false})
  assert.equal(scene.weaponSelect,true)
  assert.equal(scene.modeSelect,false)
  press('ArrowDown')
  press('c')
  assert.equal(scene.selectedWeapon.id,'qa-spear')
  assert.equal(scene.modeSelect,true)
  assert.equal(scene.php,100)
  assert.equal(scene.ehp,100)
  press('x')
  assert.equal(scene.weaponSelect,true)
  assert.equal(scene.modeSelect,false)
  assert.equal(scene.weaponIndex,1)
  press('c')
  press('ArrowDown')
  press('c')
  assert.equal(scene.autoMode,true)
  assert.equal(scene.modeSelect,false)
  assert.deepEqual(conflict,{kind:'siege',qaFixture:true})
})

test('duel with no calibrated inventory cannot borrow QA weapons or start fighting',async()=>{
  const {DuelScene}=await import('../src/scenes/duel.js')
  const conflict={kind:'siege'}
  const signals=[]
  const scene=new DuelScene({store:{pendingConflict:conflict},go:target=>signals.push(target),audio:{alert(){signals.push('alert')},cancel(){}}})
  scene.update(1000,{consume:()=> 'c'})
  assert.equal(scene.weaponOptions.length,0)
  assert.equal(scene.weaponSelect,true)
  assert.equal(scene.modeSelect,false)
  assert.equal(scene.php,100)
  scene.update(16,{consume:()=> 'x'})
  assert.deepEqual(signals,['alert','siege'])
  assert.deepEqual(conflict,{kind:'siege'})
})

test('automatic duel accepts player A commands without running either fighter during the menu',async()=>{
  const {DuelScene}=await import('../src/scenes/duel.js')
  const conflict={kind:'siege',qaFixture:true}
  const signals=[]
  const scene=new DuelScene({
    store:{pendingConflict:conflict},
    audio:{move(){},confirm(){},cancel(){},alert(){}},
    toggleHd(){signals.push('HD')},
  })
  const press=(key,dt=16)=>scene.update(dt,{consume:()=>key,isDown:()=>false})
  press('c');press('ArrowDown');press('c')
  assert.equal(scene.autoMode,true)
  const snapshot=()=>[scene.px,scene.ex,scene.php,scene.ehp,scene.autoElapsed,scene.attackCd,scene.enemyCd,scene.enemyRage,scene.hitFlash]
  const before=snapshot()
  press('z',500)
  assert.equal(scene.commandOpen,true)
  assert.deepEqual(snapshot(),before)
  press('ArrowDown',500)
  assert.equal(scene.commandIndex,1)
  press('z',500)
  assert.equal(scene.commandOpen,true)
  assert.deepEqual(snapshot(),before)
  press('c',500)
  assert.equal(scene.commandOpen,false)
  assert.ok(scene.enemyRage>0)
  assert.equal(scene.autoElapsed,before[4])
  press(null,16)
  assert.equal(scene.autoElapsed,before[4]+16)
  press('h')
  assert.deepEqual(signals,['HD'])
  assert.deepEqual(conflict,{kind:'siege',qaFixture:true})
})

test('automatic duel drains non-command keys and B closes a menu without issuing an order',async()=>{
  const {DuelScene}=await import('../src/scenes/duel.js')
  const scene=new DuelScene({store:{pendingConflict:{kind:'siege',qaFixture:true}},audio:{move(){},confirm(){},cancel(){},alert(){}}})
  scene.weaponSelect=false;scene.modeSelect=false;scene.autoMode=true
  const queue=['ArrowRight','x','z','ArrowDown','x']
  const tick=()=>scene.update(16,{consume:()=>queue.shift()??null,isDown:()=>false})
  tick();tick();tick()
  assert.equal(scene.commandOpen,true)
  assert.deepEqual(queue,['ArrowDown','x'])
  tick();tick()
  assert.equal(scene.commandOpen,false)
  assert.equal(scene.enemyRage,0)
  assert.equal(scene.result,null)
  assert.equal(queue.length,0)
})

test('opening manual duel command menu prevents an enemy attack on the same update',async()=>{
  const {DuelScene}=await import('../src/scenes/duel.js')
  const scene=new DuelScene({store:{pendingConflict:{kind:'siege',qaFixture:true}},audio:{move(){},confirm(){},cancel(){},alert(){}}})
  scene.weaponSelect=false;scene.modeSelect=false
  scene.ex=scene.px+30
  scene.enemyCd=0
  scene.update(16,{consume:()=> 'z',isDown:()=>false})
  assert.equal(scene.commandOpen,true)
  assert.equal(scene.php,100)
  scene.update(500,{consume:()=>null,isDown:()=>false})
  assert.equal(scene.php,100)
})
