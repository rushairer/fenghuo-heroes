import { openingOfficerListForCity } from './officer-roster.js'

// Only workflows corroborated by Chinese-ROM play documentation are modelled.
// No input here is permission to mutate resources or officer attributes.
export const INSPECTION_DRAFT_COMMANDS=Object.freeze({
  develop:Object.freeze({id:'develop',label:'開發',officerRole:'executor'}),
  welfare:Object.freeze({id:'welfare',label:'福利',officerRole:'executor'}),
  educate:Object.freeze({id:'educate',label:'教育',officerRole:'target-non-ruler'}),
})

export function inspectionDraftCommand(commandId){
  return INSPECTION_DRAFT_COMMANDS[commandId]??null
}

function eligibleRows(store,cityId,command){
  const projection=openingOfficerListForCity(store,cityId)
  const rows=projection.rows.filter((row)=>
    command.officerRole!=='target-non-ruler'||row.role!=='君主'
  )
  return Object.freeze({
    rows:Object.freeze(rows.map(({name,role})=>Object.freeze({name,role}))),
    cityAssignmentVerified:projection.cityAssignmentVerified,
  })
}

export function newInspectionActionDraft(store,cityId,commandId){
  const command=inspectionDraftCommand(commandId)
  if(!command)throw new Error('未知的內政命令。')
  if(store?.mode!=='inspection')throw new Error('只有視察月才能準備內政命令。')
  const city=store?.state?.cities?.[cityId]
  if(!city||city.owner!==store.humanFaction)throw new Error('只能在本國城池準備命令。')
  if(!Number.isSafeInteger(city.gold)||city.gold<=0){
    throw new Error('城內無可投入的金，不能準備此命令。')
  }
  const candidates=eligibleRows(store,cityId,command)
  if(!candidates.rows.length){
    throw new Error(command.officerRole==='target-non-ruler'
      ?'目前沒有可選擇的非君主教育對象。'
      :'目前沒有可選擇的執行武將。')
  }
  return Object.freeze({
    cityId,
    commandId,
    phase:'officer',
    officerIndex:0,
    gold:1,
    candidates:candidates.rows,
    cityAssignmentVerified:candidates.cityAssignmentVerified,
  })
}

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))

// This reducer is deliberately read-only. The operator can cancel at every step;
// neither previews nor confirmations deduct gold or advance the month.
export function transitionInspectionActionDraft(draft,button,availableGold){
  if(!draft||!inspectionDraftCommand(draft.commandId))throw new Error('內政準備資料無效。')
  if(!Number.isSafeInteger(availableGold)||availableGold<0)throw new Error('城內金額資料無效。')
  const budget=clamp(availableGold,0,Number.MAX_SAFE_INTEGER)
  if(button==='B'){
    if(draft.phase==='officer')return Object.freeze({status:'cancelled',draft})
    if(draft.phase==='gold')return Object.freeze({status:'updated',draft:Object.freeze({...draft,phase:'officer'})})
    return Object.freeze({status:'updated',draft:Object.freeze({...draft,phase:'gold'})})
  }
  if(draft.phase==='officer'){
    if((button==='UP'||button==='DOWN')&&draft.candidates.length){
      const delta=button==='UP'?-1:1
      return Object.freeze({status:'updated',draft:Object.freeze({
        ...draft,
        officerIndex:(draft.officerIndex+delta+draft.candidates.length)%draft.candidates.length,
      })})
    }
    if(button==='C'){
      if(budget<1)return Object.freeze({status:'invalid',reason:'城內已無可投入的金。',draft})
      return Object.freeze({status:'updated',draft:Object.freeze({...draft,phase:'gold'})})
    }
  }else if(draft.phase==='gold'){
    const delta={LEFT:-1,RIGHT:1,UP:100,DOWN:-100}[button]
    if(delta!==undefined){
      const gold=budget>=1?clamp(draft.gold+delta,1,budget):0
      return Object.freeze({status:'updated',draft:Object.freeze({...draft,gold})})
    }
    if(button==='C'){
      if(budget<1||draft.gold>budget)return Object.freeze({status:'invalid',reason:'投入金額已超過城內現有金。',draft})
      return Object.freeze({status:'updated',draft:Object.freeze({...draft,phase:'review'})})
    }
  }else if(draft.phase==='review'&&button==='C'){
    if(budget<1||draft.gold>budget)return Object.freeze({status:'invalid',reason:'投入金額已超過城內現有金。',draft})
    return Object.freeze({status:'preview-only',draft})
  }
  return Object.freeze({status:'ignored',draft})
}

export function inspectionActionDraftSummary(draft){
  const command=inspectionDraftCommand(draft?.commandId)
  const officer=draft?.candidates?.[draft.officerIndex]
  if(!command||!officer||!Number.isSafeInteger(draft.gold)||draft.gold<1){
    throw new Error('內政準備資料不完整。')
  }
  const role=command.officerRole==='target-non-ruler'?'對象':'執行'
  return Object.freeze({
    commandId:command.id,
    commandLabel:command.label,
    officerName:officer.name,
    officerRole:role,
    gold:draft.gold,
    evidence:draft.cityAssignmentVerified?'source-backed-city-officers':'provisional-faction-roster',
    effectApplied:false,
  })
}
