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


export function strategyPanelGeometry(width,height){
  const w=Math.max(24,Number(width)||24)
  const h=Math.max(18,Number(height)||18)
  return Object.freeze({width:w,height:h,outerInset:.5,goldInset:1.5,innerInset:4,corner:Math.min(5,Math.max(2.5,h*.08))})
}

export function drawStrategyPanel(r,x,y,w,h,fill='#020202',border='#b07118'){
  const g=strategyPanelGeometry(w,h)
  r.fillRect(x,y,g.width,g.height,fill)
  r.strokeRect(x+.5,y+.5,g.width-1,g.height-1,'#170b07',1)
  r.strokeRect(x+1.5,y+1.5,g.width-3,g.height-3,border,.75)
  r.strokeRect(x+4,y+4,g.width-8,g.height-8,'#5a2b18',.45)
  const c=g.corner
  for(const [cx,cy,sx,sy] of [[x+2.5,y+2.5,1,1],[x+g.width-2.5,y+2.5,-1,1],[x+2.5,y+g.height-2.5,1,-1],[x+g.width-2.5,y+g.height-2.5,-1,-1]]){
    r.line(cx,cy,cx+sx*c,cy,border,.55,.9)
    r.line(cx,cy,cx,cy+sy*c,border,.55,.9)
  }
  return true
}

export function strategyTextWindowGeometry(width=320,height=68){
  const w=Math.max(64,Number(width)||320),h=Math.max(40,Number(height)||68)
  return Object.freeze({width:w,height:h,railHeight:5,paddingX:10,primaryY:14,secondaryY:41})
}

export function drawStrategyTextWindow(r,x=0,y=156,w=320,h=68){
  const g=strategyTextWindowGeometry(w,h)
  const rail=(yy,flip=false)=>{
    r.fillRect(x,yy,g.width,g.railHeight,'#1d1a17')
    r.line(x+1,yy+(flip?3.8:1.1),x+g.width-1,yy+(flip?3.8:1.1),'#eee9df',.45,.9)
    r.line(x+1,yy+(flip?1.2:3.7),x+g.width-1,yy+(flip?1.2:3.7),'#6b6259',.45,.95)
    for(let xx=x+3;xx<x+g.width-5;xx+=8){
      const a=flip?yy+1.4:yy+3.6,b=flip?yy+3.6:yy+1.4
      r.line(xx,a,xx+3,b,'#bcb5a9',.4,.8);r.line(xx+3,b,xx+6,a,'#4b443e',.4,.8)
    }
  }
  r.fillRect(x,y,g.width,g.height,'#deddd8');rail(y,false);rail(y+g.height-g.railHeight,true)
  return Object.freeze({...g,x,y,textX:x+g.paddingX,primaryTextY:y+g.primaryY,secondaryTextY:y+g.secondaryY})
}
