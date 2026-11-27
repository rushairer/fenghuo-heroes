// Identity is an engineering persistence invariant, not original-ROM data.
// Existing opaque fixture/legacy IDs remain valid; never rename referenced armies.
export function armyIdentityErrors(armies){
  if(armies==null)return []
  if(!Array.isArray(armies))return ['invalid-armies']
  const errors=[],seen=new Set()
  for(const [index,army] of armies.entries()){
    const id=army?.id
    if(!army||typeof army!=='object'||Array.isArray(army)||
      typeof id!=='string'||!id.trim()||id!==id.trim()){
      errors.push('invalid-army-id:'+index)
      continue
    }
    if(seen.has(id))errors.push('duplicate-army-id:'+id)
    seen.add(id)
  }
  return errors
}

// Compute without mutating the save. A missing/stale counter is compatible
// with old saves; advance past all existing generated IDs and the counter.
export function nextArmyIdentity(state){
  const errors=armyIdentityErrors(state.armies)
  if(errors.length)throw new Error('行軍部隊識別碼無效：'+errors.join(','))
  let next=state.nextArmyId??1
  if(!Number.isSafeInteger(next)||next<1)throw new Error('行軍部隊編號無效。')
  for(const army of state.armies??[]){
    const match=/^army-([1-9][0-9]*)$/.exec(army.id)
    if(!match)continue
    const issued=Number(match[1])
    if(!Number.isSafeInteger(issued)||issued>=Number.MAX_SAFE_INTEGER){
      throw new Error('行軍部隊編號已達上限。')
    }
    next=Math.max(next,issued+1)
  }
  if(next>=Number.MAX_SAFE_INTEGER)throw new Error('行軍部隊編號已達上限。')
  return {id:'army-'+next,nextArmyId:next+1}
}
