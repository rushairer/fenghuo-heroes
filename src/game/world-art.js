export const WORLD_RIVER_PATH=Object.freeze({
  start:Object.freeze({x:205,y:-12}),
  curves:Object.freeze([
    Object.freeze([{x:229,y:48},{x:287,y:69},{x:323,y:126}]),
    Object.freeze([{x:360,y:184},{x:421,y:218},{x:473,y:235}]),
    Object.freeze([{x:526,y:254},{x:579,y:278},{x:658,y:326}]),
  ]),
})

export function worldRiverBounds(path=WORLD_RIVER_PATH){
  const points=[path.start,...path.curves.flat()]
  return Object.freeze({
    minX:Math.min(...points.map((p)=>p.x)),
    maxX:Math.max(...points.map((p)=>p.x)),
    minY:Math.min(...points.map((p)=>p.y)),
    maxY:Math.max(...points.map((p)=>p.y)),
  })
}

function traceRiver(ctx,S,path,project=(point)=>point){
  const start=project(path.start)
  ctx.beginPath()
  ctx.moveTo(start.x*S,start.y*S)
  for(const curve of path.curves){
    const [a,b,end]=curve.map(project)
    ctx.bezierCurveTo(a.x*S,a.y*S,b.x*S,b.y*S,end.x*S,end.y*S)
  }
}

export function drawWorldRiver(r,{
  camera={x:0,y:0},
  pattern=null,
  path=WORLD_RIVER_PATH,
}={}){
  const c=r.ctx,S=r.S
  const project=(point)=>({x:point.x-camera.x,y:point.y-camera.y})
  c.save()
  c.lineCap='round'
  c.lineJoin='round'
  traceRiver(c,S,path,project)
  c.strokeStyle='#6f5837'
  c.lineWidth=23*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#082d92'
  c.lineWidth=19*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle=pattern??'#064ac0'
  c.lineWidth=13*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle=pattern?'#b8e7ef':'#0d63d7'
  c.lineWidth=3*S
  c.globalAlpha=pattern?.24:.55
  c.stroke()
  c.restore()
  return true
}

export function drawProjectedRiver(r,{
  project,
  clip=null,
  path=WORLD_RIVER_PATH,
  outer='#644b30',
  inner='#0b55d8',
  outerWidth=5,
  innerWidth=3.4,
}={}){
  if(typeof project!=='function')return false
  const c=r.ctx,S=r.S
  c.save()
  if(clip){
    c.beginPath()
    c.rect(clip.x*S,clip.y*S,clip.w*S,clip.h*S)
    c.clip()
  }
  c.lineCap='round'
  c.lineJoin='round'

  traceRiver(c,S,path,project)
  c.strokeStyle=outer
  c.lineWidth=outerWidth*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle=inner
  c.lineWidth=innerWidth*S
  c.stroke()
  c.restore()
  return true
}

export function roadSegmentStyle(index=0){
  const i=Math.abs(Math.floor(Number(index)||0))
  return Object.freeze({
    width:.48+(i%3)*.04,
    alpha:.34+(i%4)*.03,
  })
}

export function drawRoadNetwork(r,segments,{
  color='#6b542f',
}={}){
  let drawn=0
  for(const [index,segment] of (segments??[]).entries()){
    const a=segment?.a,b=segment?.b
    if(!a||!b)continue
    const style=roadSegmentStyle(index)
    r.line(a.x,a.y,b.x,b.y,color,style.width,style.alpha)
    drawn++
  }
  return drawn
}


export function uniqueRoadPairs(cities=[]){
  const seen=new Set()
  const pairs=[]
  for(const city of cities){
    for(const neighbor of city?.neighbors??[]){
      const key=[city.id,neighbor].sort().join(':')
      if(seen.has(key))continue
      seen.add(key)
      pairs.push(Object.freeze([city.id,neighbor]))
    }
  }
  return Object.freeze(pairs)
}
