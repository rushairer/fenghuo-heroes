import { existsSync, readFileSync } from 'node:fs'
import { join, normalize } from 'node:path'

const manifestPath='public/assets/manifests/asset-manifest.v1.json'
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'))
const allowedStatuses=new Set(['planned','ready','disabled'])
const allowedExtensions=new Set(['.png','.webp'])
const entries=[]

function visit(value,key=''){
  if(!value||typeof value!=='object')return
  if(typeof value.src==='string'){
    entries.push({key,src:value.src,status:value.status})
    return
  }
  for(const [childKey,child] of Object.entries(value)){
    if(childKey==='version'||childKey==='policy')continue
    visit(child,key?`${key}.${childKey}`:childKey)
  }
}

visit(manifest)

const failures=[]
const seenSrc=new Map()
for(const entry of entries){
  if(!allowedStatuses.has(entry.status))failures.push(`${entry.key}: invalid status ${entry.status}`)
  if(!entry.src.startsWith('assets/'))failures.push(`${entry.key}: src must be project-relative under assets/`)
  if(entry.src.includes('\\')||entry.src.includes('..')||entry.src.startsWith('/'))failures.push(`${entry.key}: unsafe src ${entry.src}`)
  const ext=entry.src.slice(entry.src.lastIndexOf('.')).toLowerCase()
  if(!allowedExtensions.has(ext))failures.push(`${entry.key}: runtime image must be PNG or WebP`)
  if(seenSrc.has(entry.src))failures.push(`${entry.key}: duplicate src also used by ${seenSrc.get(entry.src)}`)
  else seenSrc.set(entry.src,entry.key)
  if(entry.status==='ready'){
    const file=normalize(join('public',entry.src))
    if(!existsSync(file))failures.push(`${entry.key}: ready asset missing at ${file}`)
  }
}

if(!entries.length)failures.push('manifest contains no asset entries')
if(failures.length){
  console.error('asset manifest check failed:')
  for(const failure of failures)console.error(`- ${failure}`)
  process.exit(1)
}

const counts=entries.reduce((acc,entry)=>{acc[entry.status]=(acc[entry.status]??0)+1;return acc},{})
console.log(`asset manifest check passed: ${entries.length} entries (${counts.ready??0} ready, ${counts.planned??0} planned, ${counts.disabled??0} disabled)`)
