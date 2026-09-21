import { buildCanonical189ScenarioStartState } from '../../src/game/scenario-start-state.js'

export const CANONICAL_TEST_ECONOMY=Object.freeze({
  gold:20000,
  food:20000,
  troops:5000,
  development:50,
  rule:80,
  defense:40,
  training:35,
})

export function canonical189TestScenarioFactory(evidence,{
  economy=CANONICAL_TEST_ECONOMY,
  economyStatus='test-fixture',
}={}){
  return (args)=>buildCanonical189ScenarioStartState({
    ...args,
    evidence,
    economyForCity:()=>({...economy}),
    economyStatus,
  })
}
