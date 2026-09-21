import { buildCanonical189ScenarioStartState } from '../../src/game/scenario-start-state.js'
import { ZH_ROM_CANONICAL_CITY_SET } from '../../src/game/original-data.js'

export const CANONICAL_TEST_ECONOMY=Object.freeze({
  gold:20000,
  food:20000,
  troops:5000,
  development:50,
  rule:80,
  defense:40,
  training:35,
})

export function completeCanonicalScenarioEvidence({
  year=189,
  economy=CANONICAL_TEST_ECONOMY,
}={}){
  const source={id:`scenario-${year}-fixture`,kind:'direct-capture',ref:`scenario-${year}-fixture.png`}
  const ownership=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    factionId:index===0?'liu':index===1?'cao':'neutral',
    sourceId:source.id,
    frameRef:`frame#owner-${index}`,
    verified:true,
  }))
  const cityStates=ZH_ROM_CANONICAL_CITY_SET.map((city,index)=>({
    city,
    ...economy,
    sourceId:source.id,
    frameRef:`frame#city-${index}`,
    verified:true,
  }))
  const officerAssignments=[
    {officer:'關羽',city:'代縣',sourceId:source.id,frameRef:'frame#officer-guan-yu',verified:true},
    {officer:'張飛',city:'代縣',sourceId:source.id,frameRef:'frame#officer-zhang-fei',verified:true},
  ]
  return {
    status:'test-fixture-complete',
    scenarioYear:year,
    sources:[source],
    ownership,
    ownershipCoverage:{
      sourceId:source.id,
      frameRef:'frame#ownership-coverage',
      itemCount:ownership.length,
      verified:true,
    },
    cityStates,
    cityStateCoverage:{
      sourceId:source.id,
      frameRef:'frame#city-state-coverage',
      itemCount:cityStates.length,
      verified:true,
    },
    officerAssignments,
    officerCoverage:{
      sourceId:source.id,
      frameRef:'frame#officer-coverage',
      itemCount:officerAssignments.length,
      verified:true,
    },
  }
}

export function canonical189TestScenarioFactory(
  mapEvidence,
  {scenarioEvidence=completeCanonicalScenarioEvidence()}={},
){
  return ({mapProfile})=>buildCanonical189ScenarioStartState({
    mapProfile,
    mapEvidence,
    scenarioEvidence,
  })
}
