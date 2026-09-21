import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { marchCalibrationReport } from '../src/game/march-calibration.js'
import { validateMarchEvidence } from '../src/game/march-evidence.js'

const input=process.argv[2]
if(!input){
  console.error(
    'usage: node scripts/audit-march-evidence.mjs <capture.json> '+
    '[--require-route-step-ready|--require-timing-ready|--require-month-ready|--require-adjacency-ready]'
  )
  process.exitCode=2
}else{
  try{
    const bundle=JSON.parse(readFileSync(resolve(input),'utf8'))
    const validation=validateMarchEvidence(bundle)
    const calibration=marchCalibrationReport(bundle)
    console.log(JSON.stringify({validation,calibration},null,2))

    const required=[
      ['--require-route-step-ready',validation.readiness.routeStep],
      ['--require-timing-ready',validation.readiness.routeNodeDays],
      ['--require-month-ready',validation.readiness.executionDaysPerEvenMonth],
      [
        '--require-adjacency-ready',
        validation.readiness.enemyArmyAdjacency&&validation.readiness.enemyCityAdjacency,
      ],
    ]
    for(const [flag,ready] of required){
      if(process.argv.includes(flag)&&!ready)process.exitCode=1
    }
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=2
  }
}
