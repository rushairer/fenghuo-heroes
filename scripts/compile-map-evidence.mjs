import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileCanonicalEvidenceBundle } from '../src/game/map-evidence-compiler.js'

const input=process.argv[2]
const output=process.argv[3]??'map-evidence.compiled.json'

if(!input){
  console.error('usage: node scripts/compile-map-evidence.mjs <capture.json> [output.json]')
  process.exitCode=2
}else{
  try{
    const bundle=JSON.parse(readFileSync(resolve(input),'utf8'))
    const compiled=compileCanonicalEvidenceBundle(bundle)
    const outputPath=resolve(output)
    writeFileSync(outputPath,JSON.stringify(compiled,null,2)+'\n','utf8')
    console.log(`compiled canonical map evidence: ${outputPath}`)
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=1
  }
}
