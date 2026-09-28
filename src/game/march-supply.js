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
  army.lastSupplyOrder=order
  store.addLog?.(`村莊補給：${option.label}。`)
  store.save?.()
  return Object.freeze({...order})
}
