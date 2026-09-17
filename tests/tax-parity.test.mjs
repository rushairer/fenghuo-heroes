import test from 'node:test'
import assert from 'node:assert/strict'
import { TAX_RATE_MAX, TAX_RATE_MIN, adjustTaxRate, clampTaxRate, isTaxRate } from '../src/game/tax-parity.js'

test('Chinese-ROM tax configuration uses the observed 0 to 99 range',()=>{
  assert.equal(TAX_RATE_MIN,0)
  assert.equal(TAX_RATE_MAX,99)
  assert.equal(isTaxRate(0),true)
  assert.equal(isTaxRate(99),true)
  assert.equal(isTaxRate(-1),false)
  assert.equal(isTaxRate(100),false)
  assert.equal(isTaxRate(44.5),false)
})

test('tax editor adjustment clamps without inventing settlement effects',()=>{
  assert.equal(adjustTaxRate(0,-1),0)
  assert.equal(adjustTaxRate(44,1),45)
  assert.equal(adjustTaxRate(99,1),99)
  assert.equal(clampTaxRate(120),99)
})
