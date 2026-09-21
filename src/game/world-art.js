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

export function riverStrokeStyle({projected=false,pattern=false}={}){
  if(projected){
    return Object.freeze({
      bankOuterWidth:5,
      bankInnerWidth:4.15,
      bankHighlightWidth:.36,
      bankHighlightAlpha:.26,
      waterWidth:3.4,
      highlightWidth:.72,
      highlightAlpha:.52,
    })
  }
  return Object.freeze({
    bankOuterWidth:23,
    bankInnerWidth:19,
    bankHighlightWidth:1.7,
    bankHighlightAlpha:.24,
    waterWidth:13,
    highlightWidth:3,
    highlightAlpha:pattern?.24:.55,
  })
}

export function drawWorldRiver(r,{
  camera={x:0,y:0},
  pattern=null,
  path=WORLD_RIVER_PATH,
}={}){
  const c=r.ctx,S=r.S
  const project=(point)=>({x:point.x-camera.x,y:point.y-camera.y})
  const style=riverStrokeStyle({pattern:Boolean(pattern)})
  c.save()
  c.lineCap='round'
  c.lineJoin='round'
  traceRiver(c,S,path,project)
  c.strokeStyle='#6f5837'
  c.lineWidth=style.bankOuterWidth*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#183d79'
  c.lineWidth=style.bankInnerWidth*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#d0a66b'
  c.lineWidth=style.bankHighlightWidth*S
  c.globalAlpha=style.bankHighlightAlpha
  c.stroke()
  c.globalAlpha=1

  traceRiver(c,S,path,project)
  c.strokeStyle=pattern??'#064ac0'
  c.lineWidth=style.waterWidth*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle=pattern?'#d1f4f4':'#6fc8ed'
  c.lineWidth=style.highlightWidth*S
  c.globalAlpha=style.highlightAlpha
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
  const style=riverStrokeStyle({projected:true})
  const outerScale=outerWidth/5
  const innerScale=innerWidth/3.4

  traceRiver(c,S,path,project)
  c.strokeStyle=outer
  c.lineWidth=style.bankOuterWidth*outerScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#244a79'
  c.lineWidth=style.bankInnerWidth*outerScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle=inner
  c.lineWidth=style.waterWidth*innerScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#8fd6ed'
  c.lineWidth=style.highlightWidth*innerScale*S
  c.globalAlpha=style.highlightAlpha
  c.stroke()
  c.restore()
  return true
}

export function roadSegmentStyle(index=0){
  const i=Math.abs(Math.floor(Number(index)||0))
  const width=.48+(i%3)*.04
  const alpha=.34+(i%4)*.03
  return Object.freeze({
    width,
    alpha,
    shadowWidth:width*2.45,
    highlightWidth:Math.max(.16,width*.34),
    highlightAlpha:Math.min(.28,alpha*.58),
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
    r.line(a.x,a.y,b.x,b.y,'#3f321f',style.shadowWidth,style.alpha*.34)
    r.line(a.x,a.y,b.x,b.y,color,style.width,style.alpha)
    r.line(a.x,a.y,b.x,b.y,'#d2ad6b',style.highlightWidth,style.highlightAlpha)
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
