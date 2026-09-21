import test from 'node:test'
import assert from 'node:assert/strict'
import { CITIES, CITY_BY_ID, MAP_PROFILE } from '../src/game/data.js'

test('data exports expose one auditable active map profile',()=>{
  assert.equal(MAP_PROFILE.id,'runtime-scaffold')
  assert.equal(MAP_PROFILE.canonical,false)
  assert.equal(CITIES,MAP_PROFILE.cities)
  assert.equal(CITY_BY_ID,MAP_PROFILE.cityById)
  assert.equal(CITIES.length,40)
})

test('every active city lookup resolves back to the same profile object',()=>{
  for(const city of CITIES){
    assert.equal(CITY_BY_ID[city.id],city)
  }
})
