import { stationedOfficerListForCity } from './officer-roster.js'

// HK manual pp.16–17 documents this field sequence and vertical scrolling.
// Missing runtime fields remain unknown; the scaffold is not canonical data.
export const CITY_STATUS_PAGE_SIZE=6

export function cityStatusRows(store,cityId){
  const state=store?.state
  const rt=state?.cities?.[cityId]
  if(!rt||!store.mapProfile?.cityById?.[cityId])return []
  const stationed=stationedOfficerListForCity(store,cityId)
  return [
    ['君主',state.openingRosters?.[rt.owner]?.ruler??null],
    ['太守',null],
    ['金',rt.gold??null],
    ['借債',null],
    ['米',rt.food??null],
    ['民',null],
    ['產值',rt.development??null],
    ['農業比',null],
    ['統治力',rt.rule??null],
    ['稅率',rt.taxRate==null?null:`${rt.taxRate}%`],
    ['武將',stationed.cityAssignmentVerified?stationed.rows.length:rt.officerCount??null],
    ['士兵',rt.troops??null],
    ['防禦力',rt.defense??null],
  ]
}

export function cityStatusScrollOffset(offset,delta,total){
  const current=Number.isInteger(offset)?offset:0
  return Math.min(Math.max(0,total-CITY_STATUS_PAGE_SIZE),Math.max(0,current+delta))
}
