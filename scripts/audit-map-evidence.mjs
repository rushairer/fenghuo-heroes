import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { auditCanonicalEvidenceBundle } from '../src/game/map-evidence-audit.js'

const input=process.argv[2]
if(!input){
  console.error('usage: node scripts/audit-map-evidence.mjs <capture.json> [--require-geometry-ready|--require-scenario-189-ready|--require-ready]')
  process.exitCode=2
}else{
  try{
    const path=resolve(input)
    const bundle=JSON.parse(readFileSync(path,'utf8'))
    const audit=auditCanonicalEvidenceBundle(bundle)
    console.log(JSON.stringify(audit,null,2))
    if(process.argv.includes('--require-geometry-ready')&&!audit.geometryReady)process.exitCode=1
    if(process.argv.includes('--require-scenario-189-ready')&&!audit.scenario189Ready)process.exitCode=1
    if(process.argv.includes('--require-ready')&&!audit.ready)process.exitCode=1
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=2
  }
}
