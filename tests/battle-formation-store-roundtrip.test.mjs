import test from 'node:test'
import assert from 'node:assert/strict'
import { GameStore } from '../src/game/store.js'
import {
  beginFieldBattleFromArmies,beginSiegeFromArmy,queueMarch,
} from '../src/game/march.js'
import { cityWorldPoint } from '../src/game/world.js'
import { FieldBattleScene } from '../src/scenes/field-battle.js'
import { SiegeScene } from '../src/scenes/siege.js'

class Storage{
  constructor(){this.map=new Map()}
  getItem(k){return this.map.get(k)??null}
  setItem(k,v){this.map.set(k,v)}
  removeItem(k){this.map.delete(k)}
}
function game(kind){
  const storage=new Storage()
  const store=new GameStore(storage)
  store.newGame({scenarioYear:189,humanFactions:['cao']})
  store.finishCurrentTurn()
  const start=cityWorldPoint(store.mapProfile.cityById.xuchang)
  const army=queueMarch(store,{
    from:'xuchang',route:[start,{x:start.x+8,y:start.y}],
    troops:1000,food:300,gold:0,officerNames:['曹操'],
  })
  if(kind==='field'){
    const enemy={
      id:'enemy-formation-test',faction:'liu',from:'xinye',
      x:start.x+8,y:start.y,
      route:[{x:start.x+8,y:start.y}],routeIndex:0,
      troops:900,food:200,gold:0,officerCount:1,officerNames:['劉備'],
      status:'waiting',
    }
    store.state.armies.push(enemy)
    beginFieldBattleFromArmies(store,army.id,enemy.id)
  }else{
    const target=cityWorldPoint(store.mapProfile.cityById.xinye)
    army.x=target.x-8;army.y=target.y;army.status='waiting'
    beginSiegeFromArmy(store,army.id,'xinye')
  }
  return {store,storage,army}
}
function appFor(store){
  const navigation=[]
  return {
    store,go:(name)=>navigation.push(name),
    audio:{confirm(){},cancel(){},move(){},alert(){}},
    navigation,
  }
}
const press=(scene,key)=>scene.update(0,{consume:()=>key})

for(const [kind,Scene,active] of [
  ['field',FieldBattleScene,'battle'],
  ['siege',SiegeScene,'siege'],
]){
  test(kind+' formation survives real GameStore storage and Continue without troop changes',()=>{
    const {store,storage,army}=game(kind)
    const beforeArmy=structuredClone(army)
    const beforeCities=structuredClone(store.state.cities)
    let app=appFor(store)
    const scene=new Scene(app)
    press(scene,'c')
    assert.equal(scene.phase,'formation')
    press(scene,'ArrowRight')
    press(scene,'ArrowDown')
    press(scene,'ArrowRight')
    const selected=structuredClone(scene.runtime.formationDraft)
    press(scene,'p')
    press(scene,'c')
    assert.deepEqual(app.navigation,['title'])

    const restored=new GameStore(storage)
    assert.equal(restored.load(),true)
    assert.equal(restored.pendingConflict.kind,kind)
    app=appFor(restored)
    const resumed=new Scene(app)
    assert.equal(resumed.phase,'formation')
    assert.deepEqual(resumed.runtime.formationDraft,selected)
    press(resumed,'c')
    assert.equal(resumed.runtime.formationDraft.phase,'review')
    press(resumed,'c')
    assert.equal(resumed.phase,active)
    assert.equal(resumed.runtime.formationPlan.applied,false)
    assert.equal(resumed.runtime.formationPlan.rows[0].infantry,1)
    assert.equal(resumed.runtime.formationPlan.rows[0].cavalry,1)
    assert.equal(resumed.conflict.attackerTroops,beforeArmy.troops)
    assert.deepEqual(restored.state.cities,beforeCities)
    assert.equal(restored.state.armies.find((x)=>x.id===army.id).troops,beforeArmy.troops)

    const again=new GameStore(storage)
    assert.equal(again.load(),true)
    assert.equal(again.pendingConflict.runtime.formationDraft,null)
    assert.deepEqual(again.pendingConflict.runtime.formationPlan,resumed.runtime.formationPlan)
    assert.equal(again.pendingConflict.runtime.phase,active)
    assert.equal(again.state.armies.find((x)=>x.id===army.id).troops,beforeArmy.troops)
  })
}
