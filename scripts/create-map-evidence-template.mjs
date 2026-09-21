import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createCanonicalEvidenceTemplate } from '../src/game/map-evidence-template.js'

const output=resolve(process.argv[2]??'map-evidence.capture.json')
const template=createCanonicalEvidenceTemplate()
writeFileSync(output,JSON.stringify(template,null,2)+'\n','utf8')
console.log(`wrote canonical map evidence template: ${output}`)
