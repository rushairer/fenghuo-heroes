import test from 'node:test'
import assert from 'node:assert/strict'
import { DUEL_CONTACT_PRESENTATION_RANGE, duelWeaponContactGeometry } from '../src/game/duel-contact-art.js'

test('duel weapon contact activates only for attacking fighters inside presentation range',()=>{
  assert.equal(DUEL_CONTACT_PRESENTATION_RANGE,43)
  assert.equal(duelWeaponContactGeometry({distance:60,playerAttacking:true}).active,false)
  assert.equal(duelWeaponContactGeometry({distance:43,playerAttacking:true}).active,false)
  assert.equal(duelWeaponContactGeometry({distance:40}).active,false)
  const contact=duelWeaponContactGeometry({distance:40,playerAttacking:true})
  assert.equal(contact.active,true)
  assert.equal(contact.rays.length,4)
  assert.ok(contact.intensity>0)
})

test('duel weapon contact intensity strengthens as fighters close',()=>{
  const far=duelWeaponContactGeometry({distance:42,enemyAttacking:true})
  const close=duelWeaponContactGeometry({distance:30,enemyAttacking:true})
  assert.ok(close.intensity>far.intensity)
  assert.ok(close.ringRadius>far.ringRadius)
})
