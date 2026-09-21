import test from 'node:test'
import assert from 'node:assert/strict'
import { createCanonicalEvidenceTemplate, templateProgress } from '../src/game/map-evidence-template.js'

test('canonical evidence template exposes all 40 city slots without guessed coordinates',()=>{
  const template=createCanonicalEvidenceTemplate()
  assert.equal(template.cityCoordinates.length,40)
  assert.equal(template.ownership189.length,40)
  assert.ok(template.cityCoordinates.every((item)=>item.x===null&&item.y===null&&item.verified===false))
  assert.ok(template.ownership189.every((item)=>item.factionId===''&&item.verified===false))
})

test('template exposes unresolved display-name decisions without choosing for the operator',()=>{
  const template=createCanonicalEvidenceTemplate()
  assert.ok(template.nameResolutions.length>=2)
  assert.ok(template.nameResolutions.every((item)=>item.chosen===''&&item.verified===false))
})

test('template progress reports entered data separately from verified evidence',()=>{
  const template=createCanonicalEvidenceTemplate()
  template.cityCoordinates[0].x=10
  template.cityCoordinates[0].y=20
  template.ownership189[0].factionId='liu'
  template.nameResolutions[0].chosen=template.nameResolutions[0].ram
  const progress=templateProgress(template)
  assert.equal(progress.cityCoordinateSlots,40)
  assert.equal(progress.cityCoordinatesEntered,1)
  assert.equal(progress.ownershipEntered,1)
  assert.equal(progress.nameResolutionsEntered,1)
})
