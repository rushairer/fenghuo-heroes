import { ZH_ROM_SCENARIOS } from './original-data.js'

const RULER_TO_FACTION = Object.freeze({
  '劉備':'liu',
  '曹操':'cao',
  '孫堅':'sun',
  '孫權':'sun',
  '袁紹':'yuan',
  '董卓':'dong',
  '劉表':'liu_biao',
  '馬騰':'ma',
  '劉璋':'liu_zhang',
})

export const TARGET_SCENARIOS = Object.freeze(ZH_ROM_SCENARIOS.map((scenario)=>Object.freeze({
  id:scenario.id,
  year:scenario.year,
  name:scenario.communityName,
  selectableRulerCount:scenario.selectableRulerCount,
  playableRulers:scenario.playableRulers,
  evidence:scenario.evidence,
})))

export function targetScenario(year) {
  return TARGET_SCENARIOS.find((scenario)=>scenario.year===Number(year)) ?? null
}

export function scenarioRulerOptions(year) {
  const scenario=targetScenario(year)
  if(!scenario)return[]
  return scenario.playableRulers.map((ruler)=>Object.freeze({
    ruler,
    factionId:RULER_TO_FACTION[ruler] ?? null,
  }))
}

// Only the 189 runtime currently has a protected opening roster and a usable
// (still provisional) ownership scaffold. Starting 200/215 with 189 ownership
// would create false parity, so Setup deliberately blocks those starts until
// their initial ownership/rosters are independently verified.
export function runtimeScenarioSupported(year) {
  return Number(year)===189
}
