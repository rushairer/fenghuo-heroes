import test from 'node:test'
import assert from 'node:assert/strict'
import { SiegeScene } from '../src/scenes/siege.js'
import { siegeInspectionRows, siegeStrengthRows } from '../src/game/siege-inspection.js'

function harness(extra={}){
  const conflict={kind:'siege',attackerOfficers:['曹操','曹仁'],attackerTroops:1200,defenderTroops:800,runtime:{phase:'siege',speed:'normal'},...extra}
  let saves=0
  const scene=new SiegeScene({store:{pendingConflict:conflict,save(){saves++}},audio:{confirm(){},move(){},cancel(){},alert(){}},go(){throw Error('unexpected navigation')}})
  const press=key=>scene.update(0,{consume:()=>key})
  return {scene,conflict,press,saves:()=>saves}
}

test('START inspects named participants without issuing or saving any siege order',()=>{
  const {scene,conflict,press,saves}=harness({defenderOfficers:['劉備']})
  const before=structuredClone(conflict)
  press('Enter')
  assert.equal(scene.inspection,'roster')
  press('ArrowUp')
  assert.equal(scene.inspectionIndex,2)
  press('c')
  assert.equal(scene.inspection,'officer')
  press('c')
  press('x')
  assert.equal(scene.inspection,'roster')
  press('x')
  assert.equal(scene.inspection,null)
  assert.equal(scene.retreatConfirm,false)
  assert.deepEqual(conflict,before)
  assert.equal(saves(),0)
  press('c')
  assert.equal(scene.orderMenu,true)
  press('c')
  assert.equal(scene.runtime.attackOrders,1)
  assert.equal(saves(),1)
})

test('A opens read-only strength comparison and B closes it instead of retreating',()=>{
  const {scene,press,saves}=harness()
  press('z')
  assert.equal(scene.inspection,'strength')
  press('c')
  assert.equal(scene.runtime.attackOrders,0)
  press('x')
  assert.equal(scene.inspection,null)
  assert.equal(scene.retreatConfirm,false)
  assert.equal(saves(),0)
})

test('inspection deduplicates known participants and never invents officer stats or missing defenders',()=>{
  const conflict={kind:'siege',attackerOfficers:['曹操',' 曹操 ',null,42,''],attackerTroops:1200}
  const rows=siegeInspectionRows(conflict)
  assert.equal(rows.length,1)
  assert.equal(rows[0].status.name,'曹操')
  assert.equal(rows[0].status.troops,null)
  assert.equal(rows[0].status.stamina,null)
  assert.deepEqual(siegeStrengthRows(conflict),[
    {side:'attacker',troops:1200,attack:null,morale:null},
    {side:'defender',troops:null,attack:null,morale:null},
  ])
})

test('empty roster consumes confirmation without starting an attack',()=>{
  const {scene,press,saves}=harness({attackerOfficers:[]})
  press('Enter')
  press('c')
  assert.equal(scene.inspection,'roster')
  assert.equal(scene.runtime.attackOrders,0)
  assert.equal(saves(),0)
})

test('strength inspection displays real army ledger amounts and leaves them untouched',()=>{
  const {scene,conflict,press,saves}=harness({armyId:'a',attacker:'cao'})
  scene.app.store.state={armies:[{id:'a',faction:'cao',gold:0,food:125}]}
  const labels=[]
  scene.app.r={panel(){},text(label){labels.push(label)}}
  const before=structuredClone({state:scene.app.store.state,conflict})
  press('z')
  scene.drawInspection()
  assert.ok(labels.some(label=>label.includes('軍資金 0')&&label.includes('兵糧 125')))
  press('x')
  assert.equal(saves(),0)
  assert.deepEqual({state:scene.app.store.state,conflict},before)
})

test('A toggles the strength comparison without entering a command or saving',()=>{
  const {scene,conflict,press,saves}=harness()
  const before=structuredClone(conflict)
  press('z')
  assert.equal(scene.inspection,'strength')
  press('z')
  assert.equal(scene.inspection,null)
  assert.equal(scene.orderMenu,false)
  assert.equal(scene.retreatConfirm,false)
  assert.equal(saves(),0)
  assert.deepEqual(conflict,before)
})
