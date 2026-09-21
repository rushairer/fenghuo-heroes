export const COUNTRY_OVERVIEW_PAGE_SIZE=10

export function countryOverviewRows(store,{revealAll=false}={}) {
  const state=store?.state
  if(!state?.cities)return []
  const humanFaction=store?.humanFaction??null
  const cities=store?.mapProfile?.cities??[]
  return cities.map((city,index)=>{
    const runtime=state.cities[city.id]??{}
    const owner=runtime.owner??'neutral'
    const visible=revealAll||owner===humanFaction
    return Object.freeze({
      number:index+1,
      cityId:city.id,
      name:city.name,
      owner,
      visible,
      industry:visible?(runtime.development??null):null,
      officerCount:visible?(runtime.officerCount??null):null,
      rule:visible?(runtime.rule??null):null,
      taxRate:visible?(runtime.taxRate??null):null,
    })
  })
}

export function moveCountryOverviewCursor(cursor,delta,total) {
  if(!Number.isInteger(total)||total<=0)return 0
  const current=Number.isInteger(cursor)?cursor:0
  return ((current+delta)%total+total)%total
}

export function countryOverviewWindow(rows,cursor,pageSize=COUNTRY_OVERVIEW_PAGE_SIZE) {
  const total=rows.length
  if(!total)return Object.freeze({start:0,end:0,rows:Object.freeze([])})
  const size=Math.max(1,Math.min(pageSize,total))
  const current=Math.max(0,Math.min(cursor,total-1))
  const maxStart=Math.max(0,total-size)
  const start=Math.min(maxStart,Math.max(0,current-Math.floor(size/2)))
  return Object.freeze({
    start,
    end:start+size,
    rows:Object.freeze(rows.slice(start,start+size)),
  })
}
