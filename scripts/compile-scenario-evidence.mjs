import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compileScenarioEvidenceBundle } from '../src/game/scenario-evidence-compiler.js'

const args=process.argv.slice(2)
const scopeIndex=args.indexOf('--scope')
const scope=scopeIndex>=0?(args[scopeIndex+1]??''):'full'
const positional=args.filter((arg,index)=>index!==scopeIndex&&index!==scopeIndex+1)
const input=positional[0]
const output=positional[1]??'scenario-evidence.compiled.json'

if(!input||!['economy','officers','full'].includes(scope)){
  console.error('usage: node scripts/compile-scenario-evidence.mjs <capture.json> [output.json] [--scope economy|officers|full]')
  process.exitCode=2
}else{
  try{
    const bundle=JSON.parse(readFileSync(resolve(input),'utf8'))
    const compiled=compileScenarioEvidenceBundle(bundle,{scope})
    const outputPath=resolve(output)
    writeFileSync(outputPath,JSON.stringify(compiled,null,2)+'\n','utf8')
    console.log(`compiled scenario ${scope} evidence: ${outputPath}`)
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=1
  }
}
