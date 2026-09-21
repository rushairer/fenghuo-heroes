import { TARGET_SCENARIOS } from './scenario-target.js'
import { INSPECTION_CATEGORY_SCHEMA } from './inspection-command-parity.js'
import { RUNTIME_SCAFFOLD_CITIES, RUNTIME_SCAFFOLD_CITY_BY_ID } from './runtime-map-scaffold.js'

// `SCENARIOS` is the runtime target profile. Edition-neutral / Japanese manual
// facts live in original-data.js and must not be silently mixed into this UI.
export const SCENARIOS = TARGET_SCENARIOS
export const DIFFICULTIES = Object.freeze([{id:'easy',label:'初級'},{id:'normal',label:'中級'},{id:'hard',label:'上級'}])
// The first seven entries intentionally follow the documented Chinese-ROM 189
// setup-screen order. Runtime lookup is ID-based, so this does not change city
// ownership or faction identity.
export const FACTIONS = Object.freeze([
  {id:'liu',ruler:'劉備',label:'劉備軍',color:'#22b7cf'},
  {id:'cao',ruler:'曹操',label:'曹操軍',color:'#5b86d8'},
  {id:'sun',ruler:'孫堅',label:'孫堅軍',color:'#d85848'},
  {id:'yuan',ruler:'袁紹',label:'袁紹軍',color:'#d7a847'},
  {id:'dong',ruler:'董卓',label:'董卓軍',color:'#a455b8'},
  {id:'liu_biao',ruler:'劉表',label:'劉表軍',color:'#58a56b'},
  {id:'ma',ruler:'馬騰',label:'馬騰軍',color:'#6ec2a3'},
  {id:'neutral',ruler:'群雄',label:'群雄'// Runtime map selection remains scaffolded until the canonical evidence ledger
// opens the migration gate. The provisional rows/edges live in
// runtime-map-scaffold.js so they cannot be mistaken for evidence-backed data.
export const CITIES=RUNTIME_SCAFFOLD_CITIES
export const CITY_BY_ID=RUNTIME_SCAFFOLD_CITY_BY_ID
.freeze(neighbors[id])})))
export const CITY_BY_ID=Object.fromEntries(CITIES.map((c)=>[c.id,c]))
export const CATEGORY_LABELS=Object.freeze(Object.fromEntries(INSPECTION_CATEGORY_SCHEMA.map(({id,label})=>[id,label])))
