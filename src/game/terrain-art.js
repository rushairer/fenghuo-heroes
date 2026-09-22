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


export function drawTerrainEtching(r,items,{
  project=(point)=>point,
  visible=()=>true,
  alpha=.22,
  stride=9,
}={}){
  const c=r.ctx,S=r.S
  const step=Math.max(1,Math.floor(Number(stride)||1))
  let drawn=0
  c.save()
  c.globalAlpha=alpha
  c.lineCap='round'
  for(let i=0;i<(items??[]).length;i+=step){
    const item=items[i]
    const point=project(item)
    if(!visible(point,item))continue
    const length=1.4+(i%4)*.35
    const slope=((i>>1)%3-1)*.32
    c.strokeStyle=i%2===0?'#6f482e':'#d0a06a'
    c.lineWidth=.24*S
    c.beginPath()
    c.moveTo((point.x-length*.5)*S,(point.y-slope)*S)
    c.lineTo((point.x+length*.5)*S,(point.y+slope)*S)
    c.stroke()
    drawn++
  }
  c.restore()
  return drawn
}
