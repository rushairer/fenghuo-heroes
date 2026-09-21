import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { auditScenarioEvidenceBundle } from '../src/game/scenario-evidence-audit.js'

const input=process.argv[2]
if(!input){
  console.error('usage: node scripts/audit-scenario-evidence.mjs <capture.json> [--require-ownership-ready|--require-economy-ready|--require-officer-ready|--require-ready]')
  process.exitCode=2
}else{
  try{
    const bundle=JSON.parse(readFileSync(resolve(input),'utf8'))
    const audit=auditScenarioEvidenceBundle(bundle)
    console.log(JSON.stringify(audit,null,2))
    if(process.argv.includes('--require-ownership-ready')&&!audit.ownershipReady)process.exitCode=1
    if(process.argv.includes('--require-economy-ready')&&!audit.economyReady)process.exitCode=1
    if(process.argv.includes('--require-officer-ready')&&!audit.officerPlacementReady)process.exitCode=1
    if(process.argv.includes('--require-ready')&&!audit.ready)process.exitCode=1
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=2
  }
}
