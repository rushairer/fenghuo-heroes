import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_FOOD_DAYS, foodForDays, maxFoodDaysForStock, shouldBlockTitleNavigation } from '../src/game/parity.js'

test('root strategy map cannot jump to title without an explicit forced exit',()=>{
  assert.equal(shouldBlockTitleNavigation({hasGame:true,fromStrategy:true}),true)
  assert.equal(shouldBlockTitleNavigation({hasGame:true,fromStrategy:true,force:true}),false)
  assert.equal(shouldBlockTitleNavigation({hasGame:false,fromStrategy:true}),false)
})

test('march grain is selected in days and derived from the manual daily formula',()=>{
  assert.equal(foodForDays(3000,2,30),960)
  assert.equal(foodForDays(1000,1,30),330)
})

test('march food days respect both stock and the observed 999-day ceiling',()=>{
  assert.equal(maxFoodDaysForStock(1000,1,330),30)
  assert.equal(maxFoodDaysForStock(100,1,999999),MAX_FOOD_DAYS)
})
