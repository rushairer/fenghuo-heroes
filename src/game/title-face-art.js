export const TITLE_FACE_FEATURES=Object.freeze([
  Object.freeze({
    id:'rear-general',
    brow:Object.freeze([[76,48],[84,47],[91,47],[99,48]]),
    nose:Object.freeze([[88,50],[86,59],[89,63]]),
    cheek:Object.freeze({x:91,y:58,rx:12,ry:11,rotation:.03}),
    highlight:Object.freeze([[72,37],[84,33],[101,36]]),
  }),
  Object.freeze({
    id:'left-profile',
    brow:Object.freeze([[22,87],[43,83]]),
    nose:Object.freeze([[47,92],[55,107],[51,117]]),
    cheek:Object.freeze({x:46,y:112,rx:12,ry:15,rotation:-.15}),
    highlight:Object.freeze([[27,75],[39,72],[48,76]]),
  }),
  Object.freeze({
    id:'center',
    brow:Object.freeze([[108,89],[117,88],[125,88],[134,90]]),
    nose:Object.freeze([[121,91],[120,99],[123,104]]),
    cheek:Object.freeze({x:126,y:104,rx:13,ry:12,rotation:.08}),
    highlight:Object.freeze([[104,78],[119,73],[139,77]]),
  }),
  Object.freeze({
    id:'upper-right',
    brow:Object.freeze([[201,53],[209,51],[217,52],[224,55]]),
    nose:Object.freeze([[214,56],[220,63],[218,69]]),
    cheek:Object.freeze({x:218,y:70,rx:12,ry:10,rotation:.28}),
    highlight:Object.freeze([[190,41],[204,35],[222,38]]),
  }),
  Object.freeze({
    id:'front-right',
    brow:Object.freeze([[196,143],[218,139],[240,139],[261,143]]),
    nose:Object.freeze([[230,148],[226,164],[232,170]]),
    cheek:Object.freeze({x:250,y:162,rx:20,ry:18,rotation:-.1}),
    highlight:Object.freeze([[202,128],[229,120],[257,125]]),
  }),
])

function strokePolyline(c,S,points,color,width){
  if(!points?.length)return
  c.strokeStyle=color
  c.lineWidth=width*S
  c.lineCap='round'
  c.lineJoin='round'
  c.beginPath()
  points.forEach(([x,y],index)=>{
    if(index===0)c.moveTo(x*S,y*S)
    else c.lineTo(x*S,y*S)
  })
  c.stroke()
}

export function drawTitleFaceStructure(r){
  const c=r.ctx,S=r.S
  c.save()

  for(const face of TITLE_FACE_FEATURES){
    const cheek=face.cheek
    c.save()
    c.translate(cheek.x*S,cheek.y*S)
    c.rotate(cheek.rotation)
    const shade=c.createRadialGradient(-cheek.rx*.25*S,-cheek.ry*.15*S,0,0,0,cheek.rx*S)
    shade.addColorStop(0,'rgba(255,220,180,0)')
    shade.addColorStop(.58,'rgba(113,54,38,.06)')
    shade.addColorStop(1,'rgba(73,31,25,.18)')
    c.fillStyle=shade
    c.beginPath()
    c.ellipse(0,0,cheek.rx*S,cheek.ry*S,0,0,Math.PI*2)
    c.fill()
    c.restore()

    strokePolyline(c,S,face.brow,'rgba(54,22,18,.58)',.38)
    strokePolyline(c,S,face.nose,'rgba(119,64,46,.42)',.3)
    strokePolyline(c,S,face.highlight,'rgba(255,224,184,.34)',.28)
  }

  // Lower eyelid glints make the two foreground faces read at high backing scales.
  c.strokeStyle='rgba(255,224,187,.32)'
  c.lineWidth=.24*S
  for(const [x1,y1,x2,y2] of [
    [31,90,39,90],
    [112,96,117,96],
    [126,96,132,96],
    [204,147,215,147],
    [244,147,255,147],
  ]){
    c.beginPath()
    c.moveTo(x1*S,y1*S)
    c.lineTo(x2*S,y2*S)
    c.stroke()
  }

  c.restore()
  return true
}
