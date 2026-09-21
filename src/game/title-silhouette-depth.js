export const TITLE_SEPARATION_EDGES=Object.freeze([
  Object.freeze({points:[[62,72],[73,92],[74,122],[64,151]],alpha:.16,width:1.2}),
  Object.freeze({points:[[89,72],[86,96],[91,125],[101,143]],alpha:.13,width:1}),
  Object.freeze({points:[[153,75],[162,98],[170,122],[181,145]],alpha:.14,width:1.05}),
  Object.freeze({points:[[182,101],[190,121],[193,145],[188,170]],alpha:.15,width:1.1}),
  Object.freeze({points:[[272,115],[282,137],[284,165],[274,191]],alpha:.13,width:1}),
])

export const TITLE_SHOULDER_GLOWS=Object.freeze([
  Object.freeze({x:37,y:177,rx:31,ry:19,rotation:-.35,alpha:.1}),
  Object.freeze({x:108,y:160,rx:34,ry:17,rotation:.08,alpha:.11}),
  Object.freeze({x:220,y:116,rx:31,ry:16,rotation:.25,alpha:.09}),
  Object.freeze({x:255,y:195,rx:46,ry:20,rotation:-.1,alpha:.1}),
])

function strokePath(c,S,edge){
  c.strokeStyle=`rgba(37,15,14,${edge.alpha})`
  c.lineWidth=edge.width*S
  c.lineCap='round'
  c.lineJoin='round'
  c.beginPath()
  edge.points.forEach(([x,y],index)=>{
    if(index===0)c.moveTo(x*S,y*S)
    else c.lineTo(x*S,y*S)
  })
  c.stroke()
}

export function drawTitleSilhouetteDepth(r){
  const c=r.ctx,S=r.S
  c.save()

  for(const glow of TITLE_SHOULDER_GLOWS){
    c.save()
    c.translate(glow.x*S,glow.y*S)
    c.rotate(glow.rotation)
    const g=c.createRadialGradient(-glow.rx*.15*S,-glow.ry*.2*S,0,0,0,glow.rx*S)
    g.addColorStop(0,'rgba(255,228,185,.16)')
    g.addColorStop(.55,`rgba(255,211,167,${glow.alpha})`)
    g.addColorStop(1,'rgba(255,211,167,0)')
    c.fillStyle=g
    c.beginPath()
    c.ellipse(0,0,glow.rx*S,glow.ry*S,0,0,Math.PI*2)
    c.fill()
    c.restore()
  }

  for(const edge of TITLE_SEPARATION_EDGES)strokePath(c,S,edge)

  // Thin contact shadows at the two strongest foreground overlaps.
  c.strokeStyle='rgba(27,10,11,.2)'
  c.lineWidth=.65*S
  c.beginPath()
  c.moveTo(68*S,132*S)
  c.quadraticCurveTo(79*S,146*S,91*S,151*S)
  c.moveTo(171*S,170*S)
  c.quadraticCurveTo(190*S,183*S,209*S,190*S)
  c.stroke()

  c.restore()
  return true
}
