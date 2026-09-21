import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mergeScenarioEvidenceBundles } from '../src/game/scenario-evidence-merge.js'

const args=process.argv.slice(2)
const separator=args.indexOf('--out')
const inputs=(separator>=0?args.slice(0,separator):args).filter(Boolean)
const output=separator>=0?args[separator+1]:'scenario-evidence.merged.json'

if(inputs.length<2){
  console.error('usage: node scripts/merge-scenario-evidence.mjs <a.json> <b.json> [more.json ...] [--out output.json]')
  process.exitCode=2
}else if(!output){
  console.error('missing output path after --out')
  process.exitCode=2
}else{
  try{
    const bundles=inputs.map((input)=>JSON.parse(readFileSync(resolve(input),'utf8')))
    const merged=mergeScenarioEvidenceBundles(...bundles)
    const outputPath=resolve(output)
    writeFileSync(outputPath,JSON.stringify(merged,null,2)+'\n','utf8')
    console.log(`merged ${inputs.length} scenario evidence bundles: ${outputPath}`)
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=1
  }
}
