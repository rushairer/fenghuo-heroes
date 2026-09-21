export const TERRAIN_GRAIN_TONES=Object.freeze([
  '#9f7548','#c49a64','#8f693f','#d0aa75',
])

export function createTerrainGrain({
  width,
  height,
  count=1500,
  seed=0x19910429,
}={}){
  const w=Math.max(1,Math.floor(Number(width)||1))
  const h=Math.max(1,Math.floor(Number(height)||1))
  const n=Math.max(0,Math.floor(Number(count)||0))
  let state=(Number(seed)>>>0)||0x19910429
  const items=[]
  for(let i=0;i<n;i++){
    state=(Math.imul(state,1664525)+1013904223)>>>0
    const x=state%w
    state=(Math.imul(state,1664525)+1013904223)>>>0
    const y=state%h
    state=(Math.imul(state,1664525)+1013904223)>>>0
    items.push(Object.freeze({
      x,
      y,
      tone:TERRAIN_GRAIN_TONES[state%TERRAIN_GRAIN_TONES.length],
      size:.35+((state>>>8)%4)*.14,
    }))
  }
  return Object.freeze(items)
}

export function drawTerrainGrain(r,items,{
  project=(point)=>point,
  visible=()=>true,
  alpha=1,
}={}){
  const c=r.ctx,S=r.S
  let drawn=0
  c.save()
  c.globalAlpha=alpha
  for(const item of items??[]){
    const point=project(item)
    if(!visible(point,item))continue
    c.fillStyle=item.tone
    c.beginPath()
    c.arc(point.x*S,point.y*S,item.size*S,0,Math.PI*2)
    c.fill()
    drawn++
  }
  c.restore()
  return drawn
}
