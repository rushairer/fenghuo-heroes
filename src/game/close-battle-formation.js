// HK manual pp. 32–33: five formations, left/right selection, C confirm,
// normal speed only. Slot numbering is a QA convention, not original names,
// geometry, ordering or a combat effect.
export const CLOSE_FORMATION_COUNT=5
export const CLOSE_FORMATION_QA='close-battle-formation'

export function initialCloseFormationPreview(){
  return Object.freeze({phase:'speed',speed:'normal',index:0,selected:null,applied:false})
}

export function transitionCloseFormationPreview(state,button){
  const next=(patch)=>Object.freeze({...state,...patch,applied:false})
  if(state.phase==='speed'){
    if(['LEFT','RIGHT','UP','DOWN'].includes(button)){
      return next({speed:state.speed==='normal'?'fast':'normal'})
    }
    if(button==='C'){
      return next({phase:state.speed==='normal'?'formation':'blocked',index:0,selected:null})
    }
  }else if(state.phase==='formation'&&state.speed==='normal'){
    if(button==='LEFT'||button==='RIGHT'){
      const delta=button==='RIGHT'?1:-1
      return next({index:Math.max(0,Math.min(CLOSE_FORMATION_COUNT-1,state.index+delta))})
    }
    if(button==='C')return next({phase:'confirmed',selected:state.index+1})
    if(button==='B')return next({phase:'speed',selected:null})
  }else if((state.phase==='confirmed'||state.phase==='blocked')&&button==='B'){
    return next({phase:state.phase==='confirmed'?'formation':'speed',selected:null})
  }
  return state
}
