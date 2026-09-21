import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { CANONICAL_MAP_EVIDENCE } from '../src/game/canonical-map-evidence.js'
import { diffCanonicalEvidence } from '../src/game/map-evidence-diff.js'

const input=process.argv[2]
if(!input){
  console.error('usage: node scripts/diff-map-evidence.mjs <candidate.json>')
  process.exitCode=2
}else{
  try{
    const candidate=JSON.parse(readFileSync(resolve(input),'utf8'))
    const diff=diffCanonicalEvidence(CANONICAL_MAP_EVIDENCE,candidate)
    console.log(JSON.stringify(diff,null,2))
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=2
  }
}
