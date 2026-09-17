import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const outputRoot=process.argv[2]??'dist'
const manifestPath='public/assets/generated/generated-assets.v1.json'
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'))

for(const [key,asset] of Object.entries(manifest.assets??{})){
  if(!asset.output||!Array.isArray(asset.parts)||!asset.parts.length)throw new Error(`${key}: invalid generated asset definition`)
  const encoded=asset.parts.map((part)=>readFileSync(normalize(join('public',part)),'utf8').trim()).join('')
  const bytes=Buffer.from(encoded,'base64')
  if(asset.byteLength!==undefined&&bytes.length!==asset.byteLength)throw new Error(`${key}: expected ${asset.byteLength} bytes, got ${bytes.length}`)
  const hash=createHash('sha256').update(bytes).digest('hex')
  if(asset.sha256&&hash!==asset.sha256)throw new Error(`${key}: sha256 mismatch: ${hash}`)
  const output=normalize(join(outputRoot,asset.output))
  mkdirSync(dirname(output),{recursive:true})
  writeFileSync(output,bytes)
  console.log(`materialized ${key}: ${output} (${bytes.length} bytes)`)
}
