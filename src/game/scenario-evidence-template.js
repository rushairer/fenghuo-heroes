import { CITY_ECONOMY_FIELDS } from './scenario-fields.js'
import { ZH_ROM_CANONICAL_CITY_SET } from './original-data.js'
import { targetScenario } from './scenario-target.js'

export function createScenarioEvidenceTemplate(year,{
  status='capture-in-progress',
}={}){
  const scenario=targetScenario(year)
  if(!scenario)throw new Error(`Unknown target scenario: ${year}`)
  return {
    status,
    scenarioYear:scenario.year,
    sources:[],
    cityStates:ZH_ROM_CANONICAL_CITY_SET.map((city)=>{
      const record={
        city,
        sourceId:'',
        frameRef:'',
        verified:false,
      }
      for(const field of CITY_ECONOMY_FIELDS)record[field]=null
      return record
    }),
    cityStateCoverage:{
      sourceId:'',
      frameRef:'',
      itemCount:null,
      verified:false,
    },
    officerAssignments:[],
    officerCoverage:{
      sourceId:'',
      frameRef:'',
      itemCount:null,
      verified:false,
    },
  }
}

export function scenarioTemplateProgress(template){
  const states=template?.cityStates??[]
  const assignments=template?.officerAssignments??[]
  return Object.freeze({
    scenarioYear:Number(template?.scenarioYear),
    cityStateSlots:states.length,
    cityStatesEntered:states.filter((record)=>
      CITY_ECONOMY_FIELDS.every((field)=>Number.isFinite(record?.[field]))
    ).length,
    officerAssignments:assignments.length,
  })
}
