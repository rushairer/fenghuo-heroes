import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'

const outputRoot=process.argv[2]??'dist'
const generatedManifestPath='public/assets/generated/generated-assets.v1.json'
const runtimeManifestPath='public/assets/manifests/asset-manifest.v1.json'
const generatedManifest=JSON.parse(readFileSync(generatedManifestPath,'utf8'))
const runtimeManifest=JSON.parse(readFileSync(runtimeManifestPath,'utf8'))

function runtimeEntry(key){
  return key.split('.').reduce((value,part)=>value?.[part],runtimeManifest)
}

for(const [key,asset] of Object.entries(generatedManifest.assets??{})){
  const runtime=runtimeEntry(key)
  if(runtime?.status!=='ready'){
    console.log(`skip generated ${key}: runtime status ${runtime?.status??'missing'}`)
    continue
  }
  if(!asset.output||!Array.isArray(asset.parts)||!asset.parts.length)throw new Error(`${key}: invalid generated asset definition`)
  if(runtime.src!==asset.output)throw new Error(`${key}: generated output ${asset.output} does not match runtime src ${runtime.src}`)
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
