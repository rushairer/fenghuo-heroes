// Raw screen-space observations only. A pair of stationary landmarks can
// reject obvious camera/scale changes, but does not prove original world geometry.
const nonempty=(value,label)=>{
  if(typeof value!=='string'||!value.trim())throw new Error(label+' is required.')
  return value.trim()
}
function point(value,width,height,label){
  if(!value||!Number.isInteger(value.x)||!Number.isInteger(value.y)||
    value.x<0||value.y<0||value.x>=width||value.y>=height){
    throw new Error(label+' must be an in-bounds integer source pixel.')
  }
  return Object.freeze({x:value.x,y:value.y})
}
function frame(raw){
  const {width,height}=raw??{}
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<1||height<1){
    throw new Error('Invalid source frame dimensions.')
  }
  const anchors=raw.anchors
  if(!Array.isArray(anchors)||anchors.length!==2)throw new Error('Two stationary landmarks are required.')
  const a=point(anchors[0],width,height,'Landmark A')
  const b=point(anchors[1],width,height,'Landmark B')
  if(a.x===b.x&&a.y===b.y)throw new Error('Landmarks must be distinct.')
  const mediaSeconds=raw.mediaSeconds??null
  if(mediaSeconds!==null&&(!Number.isFinite(mediaSeconds)||mediaSeconds<0))throw new Error('Invalid media time.')
  const battleDay=raw.battleDay??null
  if(battleDay!==null&&(!Number.isSafeInteger(battleDay)||battleDay<1))throw new Error('Invalid observed battle day.')
  return Object.freeze({frameRef:nonempty(raw.frameRef,'Frame ref'),width,height,
    mediaSeconds,battleDay,anchors:Object.freeze([a,b]),marker:point(raw.marker,width,height,'Unit marker')})
}
const delta=(a,b)=>Object.freeze({x:b.x-a.x,y:b.y-a.y})
export function battleMovementCandidate({sourceId,sourceRef,battleRef,unitRef,kind,speed,before,after}={}){
  if(!['field','siege','unknown'].includes(kind))throw new Error('Invalid battle kind.')
  if(!['normal','fast','unknown'].includes(speed))throw new Error('Invalid battle speed.')
  const first=frame(before),second=frame(after)
  if(first.frameRef===second.frameRef)throw new Error('Distinct frame references are required.')
  if(first.width!==second.width||first.height!==second.height)throw new Error('Frame dimensions differ.')
  if(first.mediaSeconds!==null&&second.mediaSeconds!==null&&second.mediaSeconds<=first.mediaSeconds){
    throw new Error('The after frame must be later in the same recording.')
  }
  if(first.battleDay!==null&&second.battleDay!==null&&second.battleDay<first.battleDay){
    throw new Error('Battle day cannot decrease within an observation.')
  }
  const shiftA=delta(first.anchors[0],second.anchors[0])
  const shiftB=delta(first.anchors[1],second.anchors[1])
  if(shiftA.x!==shiftB.x||shiftA.y!==shiftB.y){
    throw new Error('Landmarks disagree: recheck anchors, crop, scale or camera.')
  }
  const screenDelta=delta(first.marker,second.marker)
  return Object.freeze({
    schema:'battle-movement-observation-v1',verified:false,
    sourceId:nonempty(sourceId,'Source ID'),sourceRef:nonempty(sourceRef,'Source ref'),
    battleRef:nonempty(battleRef,'Battle ref'),unitRef:nonempty(unitRef,'Unit ref'),kind,speed,
    before:first,after:second,coordinateSpace:'native-source-pixels',
    screenDelta,landmarkShift:shiftA,
    relativeDelta:Object.freeze({x:screenDelta.x-shiftA.x,y:screenDelta.y-shiftA.y}),
    mediaElapsedSeconds:first.mediaSeconds!==null&&second.mediaSeconds!==null
      ?second.mediaSeconds-first.mediaSeconds:null,
    observedDayDelta:first.battleDay!==null&&second.battleDay!==null?second.battleDay-first.battleDay:null,
  })
}
