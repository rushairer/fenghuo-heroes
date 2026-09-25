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
