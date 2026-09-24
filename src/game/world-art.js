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
  const samples=[.08,.19,.3,.41,.52,.63,.74,.85,.94]
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
        length:6+(marks.length%4)*1.5,
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
    offsetFactor:.32+(index%4)*.034,
    radiusFactor:.16+(index%4)*.018,
    squash:.46+(index%3)*.055,
  })))
}

export function riverEdgeScallops(path=WORLD_RIVER_PATH){
  return Object.freeze(riverSurfaceMarks(path)
    .filter((_,index)=>index%3!==0)
    .map((mark,index)=>Object.freeze({
      x:mark.x,
      y:mark.y,
      angle:mark.angle,
      side:index%2===0?-1:1,
      offsetFactor:.43+(index%4)*.03,
      radiusFactor:.14+(index%4)*.015,
      squash:.48+(index%3)*.055,
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
  for(const [index,mark] of marks.entries()){
    const p=projectRiverSurfaceMark(mark,project)
    const short=index%3===0?.34:.5
    const dx=Math.cos(p.angle)*p.length*short*scale
    const dy=Math.sin(p.angle)*p.length*short*scale
    ctx.strokeStyle=index%3===0?`rgba(2,29,101,${Math.min(.38,alpha*1.65)})`:`rgba(159,214,233,${alpha})`
    ctx.lineWidth=(index%3===0?.62:.3)*scale*S
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
      bankOuterWidth:6.1,
      bankInnerWidth:5.3,
      bankHighlightWidth:5.65,
      bankHighlightAlpha:.13,
      waterWidth:4.6,
      highlightWidth:.48,
      highlightAlpha:.18,
    })
  }
  return Object.freeze({
    bankOuterWidth:26,
    bankInnerWidth:22.4,
    bankHighlightWidth:23.8,
    bankHighlightAlpha:.12,
    waterWidth:17,
    highlightWidth:1.35,
    highlightAlpha:pattern?.1:.18,
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
  drawRiverBankModulations(c,S,riverBankModulations(path),project,style.bankOuterWidth*strokeScale,'#5e432b',.76)
  traceRiver(c,S,path,project)
  c.strokeStyle='#5e432b'
  c.lineWidth=style.bankOuterWidth*strokeScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#a77a47'
  c.lineWidth=style.bankHighlightWidth*strokeScale*S
  c.globalAlpha=style.bankHighlightAlpha
  c.stroke()
  c.globalAlpha=1

  traceRiver(c,S,path,project)
  c.strokeStyle='#16396e'
  c.lineWidth=style.bankInnerWidth*strokeScale*S
  c.stroke()

  const waterColor=pattern??'#073fb4'
  drawRiverEdgeScallops(c,S,riverEdgeScallops(path),project,style.waterWidth*strokeScale,waterColor,.92)
  traceRiver(c,S,path,project)
  c.strokeStyle=waterColor
  c.lineWidth=style.waterWidth*strokeScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle=pattern?'#b9dcdf':'#89bed7'
  c.lineWidth=style.highlightWidth*strokeScale*S
  c.globalAlpha=style.highlightAlpha
  c.stroke()
  c.globalAlpha=1
  drawRiverSurfaceMarks(c,S,riverSurfaceMarks(path),project,{
    scale:widthScale,
    alpha:pattern?.11:.16,
  })
  c.restore()
  return true
}

export function drawProjectedRiver(r,{
  project,
  clip=null,
  path=WORLD_RIVER_PATH,
  outer='#5e432b',
  inner='#073fb4',
  outerWidth=6.1,
  innerWidth=4.6,
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
  const outerScale=outerWidth/style.bankOuterWidth
  const innerScale=innerWidth/style.waterWidth
  drawRiverBankModulations(c,S,riverBankModulations(path),project,style.bankOuterWidth*outerScale,outer,.66)

  traceRiver(c,S,path,project)
  c.strokeStyle=outer
  c.lineWidth=style.bankOuterWidth*outerScale*S
  c.stroke()

  traceRiver(c,S,path,project)
  c.strokeStyle='#a77a47'
  c.lineWidth=style.bankHighlightWidth*outerScale*S
  c.globalAlpha=style.bankHighlightAlpha
  c.stroke()
  c.globalAlpha=1

  traceRiver(c,S,path,project)
  c.strokeStyle='#16396e'
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
    alpha:.14,
  })
  c.restore()
  return true
}
