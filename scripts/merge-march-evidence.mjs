import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { mergeMarchEvidenceBundles } from '../src/game/march-evidence-merge.js'

const args=process.argv.slice(2)
const separator=args.indexOf('--out')
const inputs=(separator>=0?args.slice(0,separator):args).filter(Boolean)
const output=separator>=0?args[separator+1]:'march-evidence.merged.json'

if(inputs.length<2){
  console.error('usage: node scripts/merge-march-evidence.mjs <a.json> <b.json> [more.json ...] [--out output.json]')
  process.exitCode=2
}else if(!output){
  console.error('missing output path after --out')
  process.exitCode=2
}else{
  try{
    const bundles=inputs.map((input)=>JSON.parse(readFileSync(resolve(input),'utf8')))
    const merged=mergeMarchEvidenceBundles(...bundles)
    const outputPath=resolve(output)
    writeFileSync(outputPath,JSON.stringify(merged,null,2)+'\n','utf8')
    console.log('merged '+inputs.length+' march evidence bundles: '+outputPath)
  }catch(error){
    console.error(error instanceof Error?error.message:String(error))
    process.exitCode=1
  }
}
