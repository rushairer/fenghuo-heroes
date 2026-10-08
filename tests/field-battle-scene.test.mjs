import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')

test('adjacent-army attack is wired into the field-battle runtime scene',()=>{
  const march=read('src/scenes/strategy-march.js')
  const main=read('src/main.js')
  assert.match(march,/beginFieldBattleFromArmies/)
  assert.match(march,/this\.app\.go\('field-battle'\)/)
  assert.match(main,/FieldBattleScene/)
  assert.match(main,/'field-battle':FieldBattleScene/)
})

test('field battle runtime uses documented A B C control contract',()=>{
  const source=read('src/scenes/field-battle.js')
  assert.match(source,/fieldBattleInputAction/)
  assert.match(source,/FIELD_BATTLE_COMMANDS/)
  assert.match(source,/fieldBattleCommandAvailable/)
  assert.match(source,/battlePreparation/)
  assert.match(source,/MAX_SQUADS_PER_UNIT/)
})

test('uncalibrated field battle contains no fabricated damage resolver',()=>{
  const source=read('src/scenes/field-battle.js')
  assert.doesNotMatch(source,/resolveConflict/)
  assert.match(source,/cancelFieldBattleFromArmies/)
})

test('battle pause returns to title only after explicit confirmation and never clears conflict',async()=>{
  const { FieldBattleScene }=await import('../src/scenes/field-battle.js')
  const { SiegeScene }=await import('../src/scenes/siege.js')
  for(const [Scene,kind] of [[FieldBattleScene,'field'],[SiegeScene,'siege']]){
    const conflict={kind,runtime:{phase:kind==='field'?'battle':'siege'}}
    const calls=[]
    const app={
      store:{pendingConflict:conflict,save:()=>calls.push('saved')},
      go:(name,options)=>calls.push({name,options}),
      audio:{move(){},cancel(){},confirm(){},alert(){}},
    }
    const scene=new Scene(app)
    const send=(key)=>scene.update(0,{consume:()=>key})
    send('Escape')
    assert.equal(app.store.pendingConflict,conflict)
    assert.equal(calls.length,0)
    send('p')
    assert.equal(scene.pauseConfirm,true)
    send('x')
    assert.equal(scene.pauseConfirm,false)
    send('p')
    send('c')
    assert.equal(app.store.pendingConflict,conflict)
    assert.deepEqual(calls,[ 'saved',{name:'title',options:{force:true}} ])
  }
})
