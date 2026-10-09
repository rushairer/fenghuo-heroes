// The original battle move command is a two-stage interaction: choose a
// friendly unit, then its destination. This deliberately tracks only an order
// intent. Cursor geometry below is a temporary logical-canvas input aid,
// NOT original tactical coordinates or a troop movement/speed formula.

export const FIELD_MOVE_GRID=Object.freeze({
  minX:16,maxX:304,minY:32,maxY:184,step:8,startX:56,startY:104,
})

export function fieldMoveOfficers(conflict){
  const names=Array.isArray(conflict?.attackerOfficers)?conflict.attackerOfficers:[]
  return Object.freeze([...new Set(names
    .filter((name)=>typeof name==='string')
    .map((name)=>name.trim())
    .filter(Boolean))])
}

export function validFieldMovePoint(point){
  const g=FIELD_MOVE_GRID
  return Boolean(point)&&Number.isSafeInteger(point.x)&&Number.isSafeInteger(point.y)&&
    point.x>=g.minX&&point.x<=g.maxX&&point.y>=g.minY&&point.y<=g.maxY&&
    (point.x-g.minX)%g.step===0&&(point.y-g.minY)%g.step===0
}

export function normalizeFieldMoveDraft(conflict,draft){
  if(!draft||typeof draft!=='object')return null
  const officers=fieldMoveOfficers(conflict)
  if(!officers.length||!Number.isSafeInteger(draft.officerIndex)||
    draft.officerIndex<0||draft.officerIndex>=officers.length)return null
  if(draft.phase==='officer'){
    return {
      phase:'officer',officerIndex:draft.officerIndex,
      officerName:null,target:null,
    }
  }
  if(draft.phase!=='destination'||
    draft.officerName!==officers[draft.officerIndex]||
    !validFieldMovePoint(draft.target))return null
  return {
    phase:'destination',officerIndex:draft.officerIndex,
    officerName:draft.officerName,target:{x:draft.target.x,y:draft.target.y},
  }
}

export function initialFieldMoveDraft(conflict){
  if(!fieldMoveOfficers(conflict).length){
    throw new Error('出征部隊缺少可選的實際武將，不能指定移動命令。')
  }
  return Object.freeze({
    phase:'officer',officerIndex:0,officerName:null,target:null,
  })
}

export function validFieldMoveOrder(conflict,move){
  if(!move||typeof move!=='object'||!validFieldMovePoint(move.target)||
    !fieldMoveOfficers(conflict).includes(move.officerName))return null
  return Object.freeze({
    officerName:move.officerName,
    target:Object.freeze({x:move.target.x,y:move.target.y}),
  })
}

export function transitionFieldMoveDraft(conflict,draft,button){
  const current=normalizeFieldMoveDraft(conflict,draft)
  if(!current)throw new Error('部隊移動草稿已失效。')
  const officers=fieldMoveOfficers(conflict)
  if(button==='B'){
    return current.phase==='officer'
      ?Object.freeze({status:'cancelled',draft:null})
      :Object.freeze({status:'updated',draft:Object.freeze(initialFieldMoveDraftWithIndex(current.officerIndex))})
  }
  if(current.phase==='officer'){
    if(button==='UP'||button==='DOWN'){
      const delta=button==='UP'?-1:1
      return Object.freeze({
        status:'updated',
        draft:Object.freeze(initialFieldMoveDraftWithIndex(
          (current.officerIndex+delta+officers.length)%officers.length,
        )),
      })
    }
    if(button==='C'){
      const g=FIELD_MOVE_GRID
      return Object.freeze({status:'updated',draft:Object.freeze({
        phase:'destination',officerIndex:current.officerIndex,
        officerName:officers[current.officerIndex],
        target:Object.freeze({x:g.startX,y:g.startY}),
      })})
    }
  }else{
    if(['UP','DOWN','LEFT','RIGHT'].includes(button)){
      const g=FIELD_MOVE_GRID
      const dx=(button==='LEFT'?-1:button==='RIGHT'?1:0)*g.step
      const dy=(button==='UP'?-1:button==='DOWN'?1:0)*g.step
      const target={
        x:Math.max(g.minX,Math.min(g.maxX,current.target.x+dx)),
        y:Math.max(g.minY,Math.min(g.maxY,current.target.y+dy)),
      }
      return Object.freeze({status:'updated',draft:Object.freeze({
        ...current,target:Object.freeze(target),
      })})
    }
    if(button==='C'){
      return Object.freeze({
        status:'committed',draft:null,
        order:Object.freeze({
          commandId:'move',
          move:validFieldMoveOrder(conflict,{
            officerName:current.officerName,target:current.target,
          }),
        }),
      })
    }
  }
  return Object.freeze({status:'ignored',draft:current})
}

function initialFieldMoveDraftWithIndex(officerIndex){
  return {
    phase:'officer',officerIndex,officerName:null,target:null,
  }
}
