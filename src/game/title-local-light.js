export const TITLE_LOCAL_LIGHTS=Object.freeze([
  Object.freeze({id:'rear',x:88,y:51,rx:17,ry:13,rotation:-.04,alpha:.10}),
  Object.freeze({id:'left',x:43,y:103,rx:23,ry:29,rotation:-.2,alpha:.11}),
  Object.freeze({id:'center',x:121,y:99,rx:23,ry:30,rotation:.02,alpha:.12}),
  Object.freeze({id:'upper-right',x:214,y:63,rx:22,ry:25,rotation:.2,alpha:.10}),
  Object.freeze({id:'front-right',x:231,y:158,rx:35,ry:39,rotation:-.08,alpha:.12}),
])

export const TITLE_JAW_HIGHLIGHTS=Object.freeze([
  Object.freeze([[78,59],[83,67],[85,74]]),
  Object.freeze([[51,101],[56,114],[54,127]]),
  Object.freeze([[137,91],[142,106],[137,120]]),
  Object.freeze([[229,52],[233,65],[229,76]]),
  Object.freeze([[258,145],[267,160],[263,176]]),
])

function strokePolyline(c,S,points){
  c.strokeStyle='rgba(255,229,194,.28)'
  c.lineWidth=.3*S
  c.lineCap='round'
  c.lineJoin='round'
  c.beginPath()
  points.forEach(([x,y],index)=>{
    if(index===0)c.moveTo(x*S,y*S)
    else c.lineTo(x*S,y*S)
  })
  c.stroke()
}

export function drawTitleLocalLight(r){
  const c=r.ctx,S=r.S
  c.save()

  for(const light of TITLE_LOCAL_LIGHTS){
    c.save()
    c.translate(light.x*S,light.y*S)
    c.rotate(light.rotation)
    const g=c.createRadialGradient(-light.rx*.32*S,-light.ry*.24*S,0,0,0,light.rx*S)
    g.addColorStop(0,`rgba(255,239,207,${light.alpha})`)
    g.addColorStop(.58,`rgba(255,219,181,${light.alpha*.45})`)
    g.addColorStop(1,'rgba(255,219,181,0)')
    c.fillStyle=g
    c.beginPath()
    c.ellipse(0,0,light.rx*S,light.ry*S,0,0,Math.PI*2)
    c.fill()
    c.restore()
  }

  for(const points of TITLE_JAW_HIGHLIGHTS)strokePolyline(c,S,points)

  c.restore()
  return true
}
