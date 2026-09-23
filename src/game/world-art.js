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

function cubicPoint(p0,p1,p2,p3,t){
  const u=1-t
  const tt=t*t
  const uu=u*u
  const uuu=uu*u
  const ttt=tt*t
  return {
    x:uuu*p0.x+3*uu*t*p1.x+3*u*tt*p2.x+ttt*p3.x,
    y:uuu*p0.y+3*uu*t*p1.y+3*u*tt*p2.y+ttt*p3.y,
  }
}

export function riverSurfaceMarks(path=WORLD_RIVER_PATH){
  const marks=[]
  let start=path.start
  const samples=[.14,.32,.5,.68,.86]
  for(const curve of path.curves){
    const [a,b,end]=curve
    for(const t of samples){
      const p=cubicPoint(start,a,b,end,t)
      const next=cubicPoint(start,a,b,end,Math.min(.985,t+.025))
      const angle=Math.atan2(next.y-p.y,next.x-p.x)
      marks.push(Object.freeze({
        x:Math.round(p.x*100)/100,
        y:Math.round(p.y*100)/100,
        angle,
        length:8+(marks.length%3)*2,
      }))
    }
    start=end
  }
  return Object.freeze(marks)
}


export function riverBankModulations(path=WORLD_RIVER_PATH){
  return Object.freeze(riverSurfaceMarks(path).map((mark,index)=>Object.freeze({
    x:mark.x,
    y:mark.y,
    angle:mark.angle,
    side:index%2===0?-1:1,
    offsetFactor:.3+(index%3)*.035,
    radiusFactor:.15+(index%4)*.018,
    squash:.48+(index%2)*.08,
  })))
}

export function riverEdgeScallops(path=WORLD_RIVER_PATH){
  return Object.freeze(riverSurfaceMarks(path)
    .filter((_,index)=>index%2===1)
    .map((mark,index)=>Object.freeze({
      x:mark.x,
      y:mark.y,
      angle:mark.angle,
      side:index%2===0?-1:1,
      offsetFactor:.42+(index%3)*.035,
      radiusFactor:.13+(index%4)*.014,
      squash:.52+(index%2)*.08,
    })))
}

function drawRiverBankModulations(ctx,S,mods,project,bankWidth,color,alpha=.72){
  ctx.save()
  ctx.fillStyle=color
  ctx.globalAlpha=alpha
  for(const mod of mods){
    const p=projectRiverSurfaceMark({...mod,length:1},project)
    const normalX=-Math.sin(p.angle)
    const normalY=Math.cos(p.angle)
    const offset=bankWidth*mod.offsetFactor*mod.side
    const rx=Math.max(.8,bankWidth*mod.radiusFactor)
    const ry=Math.max(.5,rx*mod.squash)
    ctx.beginPath()
    ctx.ellipse(
      (p.x+normalX*offset)*S,
      (p.y+normalY*offset)*S,
      rx*S,
      ry*S,
      p.angle,
      0,
      Math.PI*2,
    )
    ctx.fill()
  }
  ctx.restore()
}

function drawRiverEdgeScallops(ctx,S,scallops,project,waterWidth,color,alpha=.9){
  ctx.save()
  ctx.fillStyle=color
  ctx.globalAlpha=alpha
  for(const scallop of scallops){
    const p=projectRiverSurfaceMark({...scallop,length:1},project)
    const normalX=-Math.sin(p.angle)
    const normalY=Math.cos(p.angle)
    const offset=waterWidth*scallop.offsetFactor*scallop.side
    const rx=Math.max(.65,waterWidth*scallop.radiusFactor)
    const ry=Math.max(.45,rx*scallop.squash)
    ctx.beginPath()
    ctx.ellipse(
      (p.x+normalX*offset)*S,
      (p.y+normalY*offset)*S,
      rx*S,
      ry*S,
      p.angle,
      0,
      Math.PI*2,
    )
    ctx.fill()
  }
  ctx.restore()
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

export function projectRiverSurfaceMark(mark,project=(point)=>point){
  const p=project(mark)
  const directionPoint={
    x:mark.x+Math.cos(mark.angle),
    y:mark.y+Math.sin(mark.angle),
  }
  const q=project(directionPoint)
  const localScale=Math.hypot(q.x-p.x,q.y-p.y)
  return Object.freeze({
    x:p.x,
    y:p.y,
    angle:Math.atan2(q.y-p.y,q.x-p.x),
    length:mark.length*localScale,
  })
}

function drawRiverSurfaceMarks(ctx,S,marks,project=(point)=>point,{
  scale=1,
  alpha=.28,
}={}){
  ctx.save()
  ctx.lineCap='round'
  ctx.strokeStyle=`rgba(211,243,248,${alpha})`
  ctx.lineWidth=.42*scale*S
  for(const mark of marks){
    const p=projectRiverSurfaceMark(mark,project)
    const dx=Math.cos(p.angle)*p.length*.5*scale
    const dy=Math.sin(p.angle)*p.length*.5*scale
    ctx.beginPath()
    ctx.moveTo((p.x-dx)*S,(p.y-dy)*S)
    ctx.lineTo((p.x+dx)*S,(p.y+dy)*S)
    ctx.stroke()
  }
  ctx.restore()
}

export function riverStrokeStyle({projected=false,pattern=false}={}){
  if(projected){
    return Object.freeze({
      bankOuterWidth:5,
      bankInnerWidth:4.15,
      bankHighlightWidth:4.55,
      bankHighlightAlpha:.26,
      waterWidth:3.4,
      highlightWidth:.72,
      highlightAlpha:.52,
    })
  }
  return Object.freeze({
    bankOuterWidth:23,
    bankInnerWidth:19,
    bankHighlightWidth:21,
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
  widthScale=1,
  viewScale=1,
}={}){
  const c=r.ctx,S=r.S
  const project=(point)=>({x:(point.x-camera.x)*viewScale,y:(point.y-camera.y)*viewScale})
  const style=riverStrokeStyle({pattern:Boolean(pattern)})
  const strokeScale=widthScale*viewScale
  c.save()
  c.lineCap='round'
  c.lineJoin='round'
  drawRiverBankModulations(c,S,riverBankModulations(path),project,style.bankOuterWidth*strokeScale,'#6f5837',.76)
  traceRiver(c,S,path,project)
  c.strokeStyle='#6f5837'
  c.lineWidth=style.bankOuterWidth*strokeScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#d0a66b'
  c.lineWidth=style.bankHighlightWidth*strokeScale*S
  c.globalAlpha=style.bankHighlightAlpha
  c.stroke()
  c.globalAlpha=1

  traceRiver(c,S,path,project)
  c.strokeStyle='#183d79'
  c.lineWidth=style.bankInnerWidth*strokeScale*S
  c.stroke()

  const waterColor=pattern??'#064ac0'
  drawRiverEdgeScallops(c,S,riverEdgeScallops(path),project,style.waterWidth*strokeScale,waterColor,.92)
  traceRiver(c,S,path,project)
  c.strokeStyle=waterColor
  c.lineWidth=style.waterWidth*strokeScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle=pattern?'#d1f4f4':'#6fc8ed'
  c.lineWidth=style.highlightWidth*strokeScale*S
  c.globalAlpha=style.highlightAlpha
  c.stroke()
  c.globalAlpha=1
  drawRiverSurfaceMarks(c,S,riverSurfaceMarks(path),project,{
    scale:widthScale,
    alpha:pattern?.16:.3,
  })
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
  drawRiverBankModulations(c,S,riverBankModulations(path),project,style.bankOuterWidth*outerScale,outer,.66)

  traceRiver(c,S,path,project)
  c.strokeStyle=outer
  c.lineWidth=style.bankOuterWidth*outerScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#d0a66b'
  c.lineWidth=style.bankHighlightWidth*outerScale*S
  c.globalAlpha=style.bankHighlightAlpha
  c.stroke()
  c.globalAlpha=1

  traceRiver(c,S,path,project)
  c.strokeStyle='#244a79'
  c.lineWidth=style.bankInnerWidth*outerScale*S
  c.stroke()

  drawRiverEdgeScallops(c,S,riverEdgeScallops(path),project,style.waterWidth*innerScale,inner,.88)
  traceRiver(c,S,path,project)
  c.strokeStyle=inner
  c.lineWidth=style.waterWidth*innerScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#8fd6ed'
  c.lineWidth=style.highlightWidth*innerScale*S
  c.globalAlpha=style.highlightAlpha
  c.stroke()
  c.globalAlpha=1
  drawRiverSurfaceMarks(c,S,riverSurfaceMarks(path),project,{
    scale:1,
    alpha:.24,
  })
  c.restore()
  return true
}

export function roadSegmentStyle(index=0){
  const i=Math.abs(Math.floor(Number(index)||0))
  const width=.48+(i%3)*.04
  const alpha=Math.round((.34+(i%4)*.03)*100)/100
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
