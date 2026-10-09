import { MAX_SQUADS_PER_UNIT } from './battle-prep.js'

// Engineering input plan: known squad ceiling and documented troop categories,
// but NO unverified rank, troop-to-squad conversion, or casualty formula.
export const BATTLE_SQUAD_TYPES=Object.freeze([
  Object.freeze({id:'infantry',label:'步兵'}),
  Object.freeze({id:'cavalry',label:'騎兵'}),
  Object.freeze({id:'archers',label:'弓箭'}),
])
const TYPE_IDS=BATTLE_SQUAD_TYPES.map((type)=>type.id)
const emptyRow=(officerName)=>({
  officerName,infantry:0,cavalry:0,archers:0,
})
const isObject=(value)=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value)
const integer=(value)=>Number.isSafeInteger(value)&&value>=0&&value<=MAX_SQUADS_PER_UNIT

export function formationOfficerNames(conflict){
  if(!Array.isArray(conflict?.attackerOfficers))return Object.freeze([])
  return Object.freeze([...new Set(conflict.attackerOfficers
    .filter((name)=>typeof name==='string')
    .map((name)=>name.trim())
    .filter(Boolean))])
}

function normalizedRows(conflict,rows){
  const names=formationOfficerNames(conflict)
  if(!Array.isArray(rows)||rows.length!==names.length)return null
  const normalized=[]
  for(let i=0;i<names.length;i++){
    const row=rows[i]
    if(!isObject(row)||row.officerName!==names[i]||
      !TYPE_IDS.every((type)=>integer(row[type]))||
      TYPE_IDS.reduce((sum,type)=>sum+row[type],0)>MAX_SQUADS_PER_UNIT){
      return null
    }
    normalized.push(emptyRow(row.officerName))
    for(const type of TYPE_IDS)normalized[i][type]=row[type]
  }
  return normalized
}

export function formationRowSquads(row){
  return TYPE_IDS.reduce((total,type)=>total+(integer(row?.[type])?row[type]:0),0)
}

export function normalizeFormationPlan(conflict,plan){
  if(!isObject(plan))return null
  const rows=normalizedRows(conflict,plan.rows)
  if(!rows)return null
  // Never trust legacy or injected "applied:true": this plan is a record,
  // not squad creation or military-grade enforcement.
  return Object.freeze({
    status:'uncalibrated-preview',
    applied:false,
    rows:Object.freeze(rows.map((row)=>Object.freeze(row))),
  })
}

export function normalizeFormationDraft(conflict,draft){
  if(!isObject(draft)||!['edit','review'].includes(draft.phase))return null
  const rows=normalizedRows(conflict,draft.rows)
  if(!rows)return null
  const officers=formationOfficerNames(conflict)
  if(!Number.isSafeInteger(draft.officerIndex)||
    draft.officerIndex<0||draft.officerIndex>=Math.max(1,officers.length)||
    !Number.isSafeInteger(draft.typeIndex)||
    draft.typeIndex<0||draft.typeIndex>=TYPE_IDS.length)return null
  return Object.freeze({
    phase:draft.phase,
    officerIndex:draft.officerIndex,
    typeIndex:draft.typeIndex,
    rows:Object.freeze(rows.map((row)=>Object.freeze(row))),
  })
}

export function initialFormationDraft(conflict,plan=null){
  const roster=formationOfficerNames(conflict)
  const previous=normalizeFormationPlan(conflict,plan)
  return normalizeFormationDraft(conflict,{
    phase:'edit',officerIndex:0,typeIndex:0,
    rows:previous?previous.rows:roster.map((name)=>emptyRow(name)),
  })
}

export function formationPlanFromDraft(conflict,draft){
  const checked=normalizeFormationDraft(conflict,draft)
  if(!checked||checked.phase!=='review')throw new Error('小隊編成尚未進入確認階段。')
  return normalizeFormationPlan(conflict,{rows:checked.rows})
}

export function transitionFormationDraft(conflict,draft,button){
  const checked=normalizeFormationDraft(conflict,draft)
  if(!checked)throw new Error('小隊編成草稿已失效。')
  if(checked.phase==='review'){
    if(button==='B')return Object.freeze({
      status:'updated',draft:Object.freeze({...checked,phase:'edit'}),
    })
    if(button==='C'||button==='START')return Object.freeze({
      status:'committed',plan:formationPlanFromDraft(conflict,checked),
    })
    return Object.freeze({status:'ignored',draft:checked})
  }
  if(button==='B')return Object.freeze({status:'back',draft:checked})
  if(button==='C'||button==='START')return Object.freeze({
    status:'updated',draft:Object.freeze({...checked,phase:'review'}),
  })
  const rows=checked.rows.map((row)=>({...row}))
  const current=rows[checked.officerIndex]
  if(button==='A'&&rows.length>1)return Object.freeze({
    status:'updated',
    draft:normalizeFormationDraft(conflict,{
      ...checked,officerIndex:(checked.officerIndex+1)%rows.length,rows,
    }),
  })
  if(button==='UP'||button==='DOWN'){
    const delta=button==='UP'?-1:1
    return Object.freeze({
      status:'updated',draft:normalizeFormationDraft(conflict,{
        ...checked,typeIndex:(checked.typeIndex+delta+TYPE_IDS.length)%TYPE_IDS.length,rows,
      }),
    })
  }
  if((button==='LEFT'||button==='RIGHT')&&current){
    const type=TYPE_IDS[checked.typeIndex]
    const delta=button==='LEFT'?-1:1
    const candidate=current[type]+delta
    if(candidate<0||formationRowSquads(current)+delta>MAX_SQUADS_PER_UNIT){
      return Object.freeze({status:'limit',draft:checked})
    }
    current[type]=candidate
    return Object.freeze({
      status:'updated',draft:normalizeFormationDraft(conflict,{...checked,rows}),
    })
  }
  return Object.freeze({status:'ignored',draft:checked})
}
