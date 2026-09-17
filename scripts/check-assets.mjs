import { existsSync, readFileSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'

const manifestPath='public/assets/manifests/asset-manifest.v1.json'
const productionSpecPath='public/assets/manifests/production-spec.v1.json'
const manifest=JSON.parse(readFileSync(manifestPath,'utf8'))
const productionSpec=existsSync(productionSpecPath)
  ? JSON.parse(readFileSync(productionSpecPath,'utf8'))
  : {assets:{}}
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

function pngSize(buffer){
  if(buffer.length<24||buffer.toString('ascii',1,4)!=='PNG')return null
  return {width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)}
}

function webpSize(buffer){
  if(buffer.length<30||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')return null
  const type=buffer.toString('ascii',12,16)
  if(type==='VP8X'){
    return {
      width:1+buffer.readUIntLE(24,3),
      height:1+buffer.readUIntLE(27,3),
    }
  }
  if(type==='VP8 '&&buffer.length>=30){
    return {
      width:buffer.readUInt16LE(26)&0x3fff,
      height:buffer.readUInt16LE(28)&0x3fff,
    }
  }
  if(type==='VP8L'&&buffer.length>=25){
    const bits=buffer.readUInt32LE(21)
    return {
      width:1+(bits&0x3fff),
      height:1+((bits>>14)&0x3fff),
    }
  }
  return null
}

function imageSize(file){
  const buffer=readFileSync(file)
  const ext=extname(file).toLowerCase()
  if(ext==='.png')return pngSize(buffer)
  if(ext==='.webp')return webpSize(buffer)
  return null
}

visit(manifest)

const failures=[]
const seenSrc=new Map()
for(const entry of entries){
  if(!allowedStatuses.has(entry.status))failures.push(`${entry.key}: invalid status ${entry.status}`)
  if(!entry.src.startsWith('assets/'))failures.push(`${entry.key}: src must be project-relative under assets/`)
  if(entry.src.includes('\\')||entry.src.includes('..')||entry.src.startsWith('/'))failures.push(`${entry.key}: unsafe src ${entry.src}`)
  const ext=extname(entry.src).toLowerCase()
  if(!allowedExtensions.has(ext))failures.push(`${entry.key}: runtime image must be PNG or WebP`)
  if(seenSrc.has(entry.src))failures.push(`${entry.key}: duplicate src also used by ${seenSrc.get(entry.src)}`)
  else seenSrc.set(entry.src,entry.key)

  const spec=productionSpec.assets?.[entry.key]
  if(spec?.target&&spec.target!==entry.src){
    failures.push(`${entry.key}: production spec target ${spec.target} does not match manifest src ${entry.src}`)
  }

  if(entry.status==='ready'){
    const file=normalize(join('public',entry.src))
    if(!existsSync(file)){
      failures.push(`${entry.key}: ready asset missing at ${file}`)
      continue
    }
    const dimensions=imageSize(file)
    if(!dimensions){
      failures.push(`${entry.key}: could not read image dimensions from ${file}`)
      continue
    }
    const minimum=spec?.minimumRuntime
    if(minimum&&(dimensions.width<minimum.width||dimensions.height<minimum.height)){
      failures.push(`${entry.key}: ${dimensions.width}x${dimensions.height} is smaller than minimum ${minimum.width}x${minimum.height}`)
    }
  }
}

for(const [key,spec] of Object.entries(productionSpec.assets??{})){
  const entry=entries.find((item)=>item.key===key)
  if(!entry)failures.push(`${key}: production spec has no matching manifest entry`)
  if(spec.sourceGenId!==undefined&&typeof spec.sourceGenId!=='string'){
    failures.push(`${key}: sourceGenId must be a string when present`)
  }
  if(spec.forbiddenBakedUI!==undefined&&!Array.isArray(spec.forbiddenBakedUI)){
    failures.push(`${key}: forbiddenBakedUI must be an array when present`)
  }
}

if(!entries.length)failures.push('manifest contains no asset entries')
if(failures.length){
  console.error('asset manifest check failed:')
  for(const failure of failures)console.error(`- ${failure}`)
  process.exit(1)
}

const counts=entries.reduce((acc,entry)=>{acc[entry.status]=(acc[entry.status]??0)+1;return acc},{})
console.log(`asset manifest check passed: ${entries.length} entries (${counts.ready??0} ready, ${counts.planned??0} planned, ${counts.disabled??0} disabled); production specs ${Object.keys(productionSpec.assets??{}).length}`)
