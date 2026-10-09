export const MARCH_SUPPLY_OPTIONS=Object.freeze([
  Object.freeze({id:'buy-weapons',label:'購買武器',effectEvidence:'price-and-weapon-effect-unverified'}),
  Object.freeze({id:'buy-rice',label:'購買大米',effectEvidence:'price-and-amount-unverified'}),
  Object.freeze({id:'heal',label:'治療武將',effectEvidence:'price-and-recovery-unverified'}),
])

export const MARCH_SUPPLY_EVIDENCE=Object.freeze({
  targetEdition:'zh-hk-manual',
  availability:'army-inside-village',
  options:Object.freeze(['buy-weapons','buy-rice','heal']),
  numericEffects:'unverified',
})

export function villageAtPoint(mapProfile,x,y,tolerance=0){
  const range=Math.max(0,Number(tolerance)||0)
  return (mapProfile?.villages??[]).find((village)=>
    Math.abs(village.x-x)<=range&&Math.abs(village.y-y)<=range
  )??null
}

export function villageAtArmy(store,armyId,tolerance=0){
  const army=(store?.state?.armies??[]).find((item)=>item.id===armyId)
  if(!army)return null
  return villageAtPoint(store?.mapProfile,army.x,army.y,tolerance)
}

export function marchSupplyOrder(store,armyId,optionId){
  if(store?.pendingConflict)throw new Error('戰鬥尚未結束，不能下達補給命令。')
  if(store?.mode!=='march')throw new Error('只有行軍月能下達補給命令。')
  const army=(store?.state?.armies??[]).find((item)=>item.id===armyId&&item.faction===store.humanFaction)
  if(!army)throw new Error('找不到可補給的行軍部隊。')
  const village=villageAtArmy(store,armyId)
  if(!village)throw new Error('部隊必須進入村莊才能補給。')
  const option=MARCH_SUPPLY_OPTIONS.find((item)=>item.id===optionId)
  if(!option)throw new Error('未知的補給命令。')
  const order={
    armyId:army.id,
    villageId:village.id,
    optionId:option.id,
    status:'awaiting-calibrated-effect',
  }
  const hadOrder=Object.hasOwn(army,'lastSupplyOrder')
  const previousOrder=army.lastSupplyOrder
  const oldLog=Array.isArray(store.state.log)?[...store.state.log]:store.state.log
  try{
    army.lastSupplyOrder=order
    store.addLog?.(`村莊補給：${option.label}。`)
    store.save?.()
  }catch(error){
    if(hadOrder)army.lastSupplyOrder=previousOrder
    else delete army.lastSupplyOrder
    if(oldLog!==undefined)store.state.log=oldLog
    else delete store.state.log
    throw error
  }
  return Object.freeze({...order})
}
