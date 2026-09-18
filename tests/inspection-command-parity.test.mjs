import test from 'node:test'
import assert from 'node:assert/strict'
import {
  INSPECTION_CATEGORY_SCHEMA,
  INSPECTION_COMMAND_SCHEMA,
  inspectionCommandById,
  inspectionCommandItems,
  inspectionCommandPath,
  isInspectionConfirmButton,
} from '../src/game/inspection-command-parity.js'

test('Chinese target inspection categories preserve the three documented groups',()=>{
  assert.deepEqual(
    INSPECTION_CATEGORY_SCHEMA.map(({id,label})=>[id,label]),
    [['domestic','內政'],['diplomacy','外交'],['military','軍備']],
  )
})

test('domestic command structure keeps eight commands plus explicit end',()=>{
  assert.deepEqual(
    INSPECTION_COMMAND_SCHEMA.domestic.map(({id,label})=>[id,label]),
    [
      ['develop','開發'],['transfer','調動'],['intel','情報'],['welfare','福利'],
      ['appoint','任命'],['tax','稅率'],['educate','教育'],['transport','運輸'],
      ['end','結束'],
    ],
  )
})

test('appointment is a Chinese-ROM submenu with governor strategist and office branches',()=>{
  const appoint=inspectionCommandById('domestic','appoint')
  assert.equal(appoint.kind,'submenu')
  assert.deepEqual(
    inspectionCommandItems('domestic','appoint').map(({id,label})=>[id,label]),
    [['appoint-governor','太守'],['appoint-strategist','軍師'],['appoint-office','官職']],
  )
  assert.deepEqual(inspectionCommandPath('domestic','appoint'),['內政','任命'])
})

test('diplomacy exposes strategy as a submenu instead of flattening its three tactics',()=>{
  assert.deepEqual(
    INSPECTION_COMMAND_SCHEMA.diplomacy.map(({id,label,kind})=>[id,label,kind]),
    [
      ['ally','同盟','action'],
      ['strategy','計策','submenu'],
      ['intel','情報','browser'],
      ['borrow','借款','action'],
      ['repay','還款','action'],
      ['end','結束','end'],
    ],
  )
  assert.deepEqual(
    inspectionCommandItems('diplomacy','strategy').map(({id,label})=>[id,label]),
    [['alienate','離間'],['assassinate','暗殺'],['fire','火計']],
  )
  assert.deepEqual(inspectionCommandPath('diplomacy','strategy'),['外交','計策'])
})

test('military command structure keeps the documented six commands plus end',()=>{
  assert.deepEqual(
    INSPECTION_COMMAND_SCHEMA.military.map(({id,label})=>[id,label]),
    [
      ['recruit','徵兵'],['weapons','武器'],['intel','情報'],
      ['talent','人材'],['defense','防衛'],['train','訓練'],['end','結束'],
    ],
  )
})

test('menu evidence does not pretend prototype effect formulas are verified',()=>{
  for(const category of ['domestic','diplomacy','military']){
    const visit=(items)=>{
      for(const item of items){
        if(item.kind==='submenu')visit(item.children)
        else if(item.kind==='action')assert.equal(item.effectEvidence,'unverified-formula')
      }
    }
    visit(INSPECTION_COMMAND_SCHEMA[category])
  }
  assert.equal(inspectionCommandById('diplomacy','fire').label,'火計')
})

test('information is a repeatable read-only country-status browser in all three groups',()=>{
  for(const category of ['domestic','diplomacy','military']){
    const intel=inspectionCommandById(category,'intel')
    assert.equal(intel.kind,'browser')
    assert.equal(intel.usage,'repeatable')
    assert.equal(intel.effectEvidence,'read-only-country-status')
  }
})


test('inspection menus use C as the original confirm button',()=>{
  assert.equal(isInspectionConfirmButton('C'),true)
  for(const button of ['A','B','START','UP','DOWN'])assert.equal(isInspectionConfirmButton(button),false)
})


test('tax is a persistent configuration command rather than an immediate prototype effect',()=>{
  const tax=inspectionCommandById('domestic','tax')
  assert.equal(tax.kind,'configuration')
  assert.equal(tax.effectEvidence,'persistent-rate-only; settlement-formula-unverified')
})
