// Presentation-only terrain relief. These patches add large-scale depth to the
// provisional/HD map surface but are NOT canonical geography evidence.
export const TERRAIN_RELIEF_TONES=Object.freeze([
  Object.freeze({dark:'rgba(91,63,38,.16)',light:'rgba(232,194,133,.12)'}),
  Object.freeze({dark:'rgba(79,68,43,.13)',light:'rgba(210,184,125,.1)'}),
  Object.freeze({dark:'rgba(111,70,39,.12)',light:'rgba(240,207,151,.09)'}),
])

export function createTerrainRelief({
  width=640,
  height=448,
  count=22,
  seed=0x31415926,
}={}){
  const w=Math.max(1,Number(width)||640)
  const h=Math.max(1,Number(height)||448)
  const n=Math.max(0,Math.floor(Number(count)||0))
  let state=(Number(seed)>>>0)||0x31415926
  const next=()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0
    return state/0x100000000
  }
  return Object.freeze(Array.from({length:n},(_,index)=>{
    const x=next()*w
    const y=next()*h
    const rx=38+next()*78
    const ry=20+next()*52
    const rotation=(next()-.5)*.9
    return Object.freeze({
      x:Math.round(x*100)/100,
      y:Math.round(y*100)/100,
      rx:Math.round(rx*100)/100,
      ry:Math.round(ry*100)/100,
      rotation,
      tone:index%TERRAIN_RELIEF_TONES.length,
      contourCount:2+(index%3),
    })
  }))
}

function drawPatch(c,S,patch,tone,x,y,scaleX=1,scaleY=1){
  c.save()
  c.translate(x*S,y*S)
  c.rotate(patch.rotation)

  const rx=patch.rx*scaleX
  const ry=patch.ry*scaleY
  const shadow=c.createRadialGradient(-rx*.2*S,-ry*.1*S,0,0,0,rx*S)
  shadow.addColorStop(0,'rgba(0,0,0,0)')
  shadow.addColorStop(.62,tone.light)
  shadow.addColorStop(1,tone.dark)
  c.fillStyle=shadow
  c.beginPath()
  c.ellipse(0,0,rx*S,ry*S,0,0,Math.PI*2)
  c.fill()

  c.strokeStyle='rgba(88,58,35,.12)'
  c.lineWidth=.34*S
  for(let ring=1;ring<=patch.contourCount;ring++){
    const factor=.34+ring*.18
    c.beginPath()
    c.ellipse(0,0,rx*factor*S,ry*factor*S,0,0,Math.PI*2)
    c.stroke()
  }
  c.restore()
}

export function drawWorldTerrainRelief(r,patches,{
  camera={x:0,y:0},
  viewWidth=320,
  viewHeight=176,
}={}){
  const c=r.ctx,S=r.S
  let drawn=0
  c.save()
  for(const patch of patches??[]){
    const x=patch.x-camera.x
    const y=patch.y-camera.y
    if(x+patch.rx<0||x-patch.rx>viewWidth||y+patch.ry<0||y-patch.ry>viewHeight)continue
    drawPatch(c,S,patch,TERRAIN_RELIEF_TONES[patch.tone],x,y)
    drawn++
  }
  c.restore()
  return drawn
}

export function drawProjectedTerrainRelief(r,patches,{
  project,
  scaleX=1,
  scaleY=1,
  clip=null,
}={}){
  if(typeof project!=='function')return 0
  const c=r.ctx,S=r.S
  let drawn=0
  c.save()
  if(clip){
    c.beginPath()
    c.rect(clip.x*S,clip.y*S,clip.w*S,clip.h*S)
    c.clip()
  }
  for(const patch of patches??[]){
    const point=project(patch)
    drawPatch(c,S,patch,TERRAIN_RELIEF_TONES[patch.tone],point.x,point.y,scaleX,scaleY)
    drawn++
  }
  c.restore()
  return drawn
}


export const WORLD_TERRAIN_RELIEF=createTerrainRelief({
  width:640,
  height:448,
  count:22,
  seed:0x31415926,
})
