import { MAP_PROFILE } from '../src/game/data.js'
import { MAP_ACTIVATION_TARGET, mapActivationReport } from '../src/game/map-activation.js'
import { validateRuntimeMapProfile } from '../src/game/map-profile-validation.js'

const report=validateRuntimeMapProfile(MAP_PROFILE)
const activation=mapActivationReport()
const failures=[]

if(!report.ok)failures.push(...report.errors)
if(activation.activeProfileId!==MAP_PROFILE.id){
  failures.push(`activation/data profile mismatch: ${activation.activeProfileId} != ${MAP_PROFILE.id}`)
}
if(MAP_ACTIVATION_TARGET==='canonical'){
  if(!activation.evidenceReady)failures.push('canonical activation requires ready evidence')
  if(!MAP_PROFILE.canonical)failures.push('canonical activation target must expose a canonical profile')
}else if(MAP_ACTIVATION_TARGET==='scaffold'){
  if(MAP_PROFILE.canonical)failures.push('scaffold activation target cannot expose a canonical profile')
}else{
  failures.push(`unknown activation target: ${MAP_ACTIVATION_TARGET}`)
}

if(failures.length){
  console.error('runtime map profile check failed')
  failures.forEach((failure)=>console.error(`- ${failure}`))
  process.exitCode=1
}else{
  console.log(
    `runtime map profile check passed: target=${MAP_ACTIVATION_TARGET}, profile=${MAP_PROFILE.id}, cities=${report.cityCount}, villages=${report.villageCount}`,
  )
}
