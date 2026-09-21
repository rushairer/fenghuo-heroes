import test from 'node:test'
import assert from 'node:assert/strict'
import {
  normalizeScenarioCaptureBundleForEditing,
  scenarioCaptureBundle,
  scenarioCityStateCandidate,
  scenarioOfficerCandidate,
  scenarioOwnershipCandidate,
} from '../src/game/scenario-evidence-capture.js'

const source={id:'scenario-cap-1',kind:'direct-capture',ref:'frame.png'}

test('scenario capture candidates normalize text and remain unverified',()=>{
  assert.deepEqual(scenarioOwnershipCandidate({
    city:' 代縣 ',
    factionId:' liu ',
    sourceId:' scenario-cap-1 ',
    frameRef:' frame#owner ',
  }),{
    city:'代縣',
    factionId:'liu',
    sourceId:'scenario-cap-1',
    frameRef:'frame#owner',
    verified:false,
  })

  assert.deepEqual(scenarioOfficerCandidate({
    officer:' 劉備 ',
    role:'ruler',
    city:'代縣',
    sourceId:'scenario-cap-1',
    frameRef:'frame#officer',
  }),{
    officer:'劉備',
    role:'ruler',
    city:'代縣',
    sourceId:'scenario-cap-1',
    frameRef:'frame#officer',
    verified:false,
  })
})

test('scenario city-state candidates preserve only finite numeric evidence values',()=>{
  const record=scenarioCityStateCandidate({
    city:'代縣',
    gold:'100',
    food:200,
    troops:'3000',
    development:'40',
    rule:'70',
    defense:'bad',
    training:'',
    sourceId:'scenario-cap-1',
    frameRef:'frame#state',
  })
  assert.equal(record.gold,100)
  assert.equal(record.food,200)
  assert.equal(record.troops,3000)
  assert.equal(record.development,40)
  assert.equal(record.rule,70)
  assert.equal(record.defense,null)
  assert.equal(record.training,null)
  assert.equal(record.verified,false)
})

test('scenario capture bundle is merge-ready but never self-certifies coverage',()=>{
  const bundle=scenarioCaptureBundle({
    scenarioYear:189,
    source,
    ownership:[scenarioOwnershipCandidate({
      city:'代縣',factionId:'liu',sourceId:source.id,frameRef:'frame#owner',
    })],
    cityStates:[scenarioCityStateCandidate({
      city:'代縣',gold:1,food:2,troops:3,development:4,rule:5,defense:6,training:7,
      sourceId:source.id,frameRef:'frame#state',
    })],
    officerAssignments:[scenarioOfficerCandidate({
      officer:'劉備',role:'ruler',city:'代縣',sourceId:source.id,frameRef:'frame#officer',
    })],
  })
  assert.equal(bundle.status,'capture-in-progress')
  assert.equal(bundle.scenarioYear,189)
  assert.equal(bundle.sources.length,1)
  assert.equal(bundle.ownershipCoverage,null)
  assert.equal(bundle.cityStateCoverage,null)
  assert.equal(bundle.officerCoverage,null)
  assert.equal(bundle.ownership[0].verified,false)
  assert.equal(bundle.cityStates[0].verified,false)
  assert.equal(bundle.officerAssignments[0].verified,false)
})

test('editable scenario import forces verified records back to candidates',()=>{
  const editable=normalizeScenarioCaptureBundleForEditing({
    status:'ready-for-scenario-start',
    scenarioYear:189,
    sources:[source],
    ownership:[{
      city:'代縣',factionId:'liu',sourceId:source.id,frameRef:'frame#owner',verified:true,
    }],
    cityStates:[{
      city:'代縣',gold:1,food:2,troops:3,development:4,rule:5,defense:6,training:7,
      sourceId:source.id,frameRef:'frame#state',verified:true,
    }],
    officerAssignments:[{
      officer:'劉備',role:'ruler',city:'代縣',
      sourceId:source.id,frameRef:'frame#officer',verified:true,
    }],
  })
  assert.equal(editable.scenarioYear,189)
  assert.equal(editable.ownership[0].verified,false)
  assert.equal(editable.cityStates[0].verified,false)
  assert.equal(editable.officerAssignments[0].verified,false)
})

test('scenario capture rejects cross-source editable bundles and unknown years',()=>{
  assert.throws(
    ()=>scenarioCaptureBundle({scenarioYear:999,source}),
    /Unknown target scenario/,
  )
  assert.throws(
    ()=>normalizeScenarioCaptureBundleForEditing({
      scenarioYear:189,
      sources:[source],
      ownership:[{
        city:'代縣',factionId:'liu',sourceId:'other',frameRef:'frame#owner',verified:false,
      }],
    }),
    /another source/,
  )
})
