export function focusFrameGeometry(width,height){
  const w=Math.max(6,Number(width)||6)
  const h=Math.max(6,Number(height)||6)
  const corner=Math.min(6,w*.18,h*.22)
  return Object.freeze({width:w,height:h,corner})
}

export function drawFocusFrame(r,x,y,w,h,{
  color='#27dfe8',
  inner='rgba(18,8,8,.72)',
}={}){
  const c=r.ctx,S=r.S
  const g=focusFrameGeometry(w,h)
  c.save()
  c.translate(x*S,y*S)
  c.strokeStyle=color
  c.lineWidth=1.15*S

  const mark=(ox,oy,sx,sy)=>{
    c.beginPath()
    c.moveTo((ox+sx*g.corner)*S,oy*S)
    c.lineTo(ox*S,oy*S)
    c.lineTo(ox*S,(oy+sy*g.corner)*S)
    c.stroke()
  }
  mark(0,0,1,1)
  mark(g.width,0,-1,1)
  mark(0,g.height,1,-1)
  mark(g.width,g.height,-1,-1)

  c.strokeStyle=inner
  c.lineWidth=.35*S
  c.strokeRect(1.5*S,1.5*S,(g.width-3)*S,(g.height-3)*S)
  c.restore()
  return true
}

export function promptPlateGeometry(width=132,height=17){
  const w=Math.max(24,Number(width)||132)
  const h=Math.max(10,Number(height)||17)
  return Object.freeze({
    width:w,
    height:h,
    inset:Math.min(3,h*.2),
  })
}

export function drawPromptPlate(r,x,y,w=132,h=17,{
  fill='rgba(32,12,14,.76)',
  border='#8d5f24',
}={}){
  const c=r.ctx,S=r.S,g=promptPlateGeometry(w,h)
  c.save()
  c.translate(x*S,y*S)
  c.fillStyle=fill
  c.beginPath()
  c.moveTo(g.inset*S,0)
  c.lineTo((g.width-g.inset)*S,0)
  c.lineTo(g.width*S,g.inset*S)
  c.lineTo(g.width*S,(g.height-g.inset)*S)
  c.lineTo((g.width-g.inset)*S,g.height*S)
  c.lineTo(g.inset*S,g.height*S)
  c.lineTo(0,(g.height-g.inset)*S)
  c.lineTo(0,g.inset*S)
  c.closePath()
  c.fill()
  c.strokeStyle=border
  c.lineWidth=.55*S
  c.stroke()
  c.restore()
  return true
}
