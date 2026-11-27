export const OFFICER_STATUS_FIELDS = Object.freeze([
  Object.freeze({ id:'level', label:'水平' }),
  Object.freeze({ id:'rank', label:'官職' }),
  Object.freeze({ id:'civilExperience', label:'文官級' }),
  Object.freeze({ id:'militaryExperience', label:'武官級' }),
  Object.freeze({ id:'stamina', label:'體力' }),
  Object.freeze({ id:'force', label:'武力' }),
  Object.freeze({ id:'intelligence', label:'知力' }),
  Object.freeze({ id:'virtue', label:'德育' }),
  Object.freeze({ id:'loyalty', label:'忠誠度' }),
  Object.freeze({ id:'command', label:'率兵力' }),
  Object.freeze({ id:'mobility', label:'機動力' }),
  Object.freeze({ id:'troops', label:'兵力' }),
  Object.freeze({ id:'morale', label:'士氣' }),
  Object.freeze({ id:'attack', label:'攻擊力' }),
  Object.freeze({ id:'weapon', label:'武器' }),
])

export function openingOfficerRows(store, factionId = store?.humanFaction) {
  const roster = store?.state?.openingRosters?.[factionId]
  if (!roster) return []

  const rows = []
  const seen = new Set()
  const push = (name, role) => {
    const normalized = String(name ?? '').trim()
    if (!normalized || seen.has(normalized)) return
    seen.add(normalized)
    rows.push(Object.freeze({ name:normalized, role }))
  }

  push(roster.ruler, '君主')
  for (const name of roster.officers ?? []) push(name, '武將')
  return rows
}

function officerRole(store,name){
  const normalized=String(name??'').trim()
  if(!normalized)return'武將'
  const rosters=Object.values(store?.state?.openingRosters??{})
  return rosters.some((roster)=>roster?.ruler===normalized)?'君主':'武將'
}

// The country -> officer drilldown prefers source-backed per-city placement when
// the active scenario start state provides it. The old faction-roster projection
// remains only as an explicit scaffold fallback.
export function openingOfficerListForCity(store, cityId) {
  const runtime=store?.state?.cities?.[cityId]
  const factionId=runtime?.owner??null
  const placementVerified=String(store?.state?.scenarioOfficerPlacementStatus??'')
    .startsWith('source-backed-')
  if(placementVerified&&Array.isArray(runtime?.officers)){
    const rows=runtime.officers
      .map((item)=>{
        if(typeof item==='string'){
          const name=item.trim()
          return name?{name,role:officerRole(store,name)}:null
        }
        const name=String(item?.name??'').trim()
        if(!name)return null
        const role=item?.role==='ruler'?'君主':item?.role==='officer'?'武將':officerRole(store,name)
        return {name,role}
      })
      .filter(Boolean)
      .map((row)=>Object.freeze(row))
    return Object.freeze({
      cityId:cityId??null,
      factionId,
      rows:Object.freeze(rows),
      cityAssignmentVerified:true,
      evidence:'scenario-officer-placement',
    })
  }

  const rows=factionId&&factionId!=='neutral'?openingOfficerRows(store,factionId):[]
  return Object.freeze({
    cityId:cityId??null,
    factionId,
    rows:Object.freeze([...rows]),
    cityAssignmentVerified:false,
    evidence:rows.length?'opening-faction-roster':'unverified',
  })
}

// The opening assignment is evidence, not a live garrison roster. Keep it
// intact for provenance while excluding named officers already on the map.
// A scaffold faction roster cannot prove which officers are in a given city.
export function stationedOfficerListForCity(store, cityId) {
  const opening=openingOfficerListForCity(store,cityId)
  if(!opening.cityAssignmentVerified)return opening
  const armies=Array.isArray(store?.state?.armies)?store.state.armies:[]
  const deployed=new Set()
  for(const army of armies){
    if(army?.faction!==opening.factionId||!Array.isArray(army.officerNames))continue
    for(const name of army.officerNames){
      if(typeof name==='string'&&name.trim())deployed.add(name.trim())
    }
  }
  return Object.freeze({
    ...opening,
    rows:Object.freeze(opening.rows.filter(row=>!deployed.has(row.name))),
  })
}

// The Japanese manual documents the status semantics; direct Chinese-release
// screenshots establish the displayed labels. Chinese-ROM per-officer values have not yet been transcribed, so the
// projection exposes the verified schema while deliberately leaving every value
// empty instead of borrowing numbers from history books or another game.
export function officerStatusProjection(row) {
  if (!row) return null
  const status = Object.fromEntries(OFFICER_STATUS_FIELDS.map((field)=>[field.id,null]))
  return Object.freeze({
    name:row.name,
    role:row.role,
    ...status,
    evidence:'name-role-only; status-labels-zh-frame',
  })
}
