import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createScenarioEvidenceTemplate } from '../src/game/scenario-evidence-template.js'

const year=Number(process.argv[2])
const output=resolve(process.argv[3]??`scenario-${year||'unknown'}-evidence.capture.json`)

try{
  const template=createScenarioEvidenceTemplate(year)
  writeFileSync(output,JSON.stringify(template,null,2)+'\n','utf8')
  console.log(`wrote scenario ${year} evidence template: ${output}`)
}catch(error){
  console.error(error instanceof Error?error.message:String(error))
  process.exitCode=2
}
