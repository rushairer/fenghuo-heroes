export const TITLE_DETAIL_STROKES=Object.freeze([
  // left foreground profile: cheek / beard / robe folds
  Object.freeze([42,126,55,130,'#6d3025',.42]),
  Object.freeze([45,132,58,138,'#47201a',.46]),
  Object.freeze([48,138,59,147,'#3b1a17',.42]),
  Object.freeze([29,181,40,206,'#b0523d',.34]),
  Object.freeze([36,178,49,211,'#6f261f',.4]),
  // central warrior: face / long beard / robe seams
  Object.freeze([105,106,111,126,'#7c3d2d',.32]),
  Object.freeze([113,107,116,135,'#321714',.36]),
  Object.freeze([121,108,121,143,'#241311',.4]),
  Object.freeze([128,107,126,138,'#321714',.36]),
  Object.freeze([136,105,131,128,'#6b3027',.32]),
  Object.freeze([99,151,94,210,'#d15e46',.34]),
  Object.freeze([137,151,143,215,'#6d251f',.36]),
  // upper-right general
  Object.freeze([206,66,218,70,'#f1bd8a',.28]),
  Object.freeze([214,75,229,82,'#713123',.32]),
  Object.freeze([202,108,219,139,'#a54031',.34]),
  Object.freeze([220,106,239,145,'#4a1b18',.38]),
  // front-right scholar / warlord
  Object.freeze([194,151,211,154,'#f0bd8d',.3]),
  Object.freeze([244,153,262,158,'#9a5039',.32]),
  Object.freeze([207,185,224,206,'#b85b42',.34]),
  Object.freeze([249,184,270,207,'#7f352b',.34]),
  Object.freeze([188,201,199,221,'#a43e33',.36]),
])

export const TITLE_EMBROIDERY_MARKS=Object.freeze([
  Object.freeze({x:105,y:162,r:4}),
  Object.freeze({x:124,y:174,r:3.6}),
  Object.freeze({x:108,y:191,r:3.2}),
  Object.freeze({x:221,y:117,r:3}),
  Object.freeze({x:235,y:127,r:3.4}),
  Object.freeze({x:201,y:205,r:3.2}),
  Object.freeze({x:278,y:201,r:3.6}),
])

export function titleDetailBounds(){
  const xs=TITLE_DETAIL_STROKES.flatMap((item)=>[item[0],item[2]])
  const ys=TITLE_DETAIL_STROKES.flatMap((item)=>[item[1],item[3]])
  return Object.freeze({
    minX:Math.min(...xs),
    maxX:Math.max(...xs),
    minY:Math.min(...ys),
    maxY:Math.max(...ys),
  })
}

function embroidery(ctx,S,{x,y,r}){
  ctx.save()
  ctx.translate(x*S,y*S)
  ctx.strokeStyle='rgba(235,184,92,.48)'
  ctx.lineWidth=.34*S
  ctx.beginPath()
  for(let i=0;i<6;i++){
    const a=(Math.PI*2*i)/6
    const px=Math.cos(a)*r*S
    const py=Math.sin(a)*r*S
    if(i===0)ctx.moveTo(px,py)
    else ctx.lineTo(px,py)
  }
  ctx.closePath()
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(0,0,r*.28*S,0,Math.PI*2)
  ctx.stroke()
  ctx.restore()
}

export function drawTitleHdDetail(r){
  const c=r.ctx,S=r.S
  c.save()
  c.lineCap='round'
  for(const [x1,y1,x2,y2,color,width] of TITLE_DETAIL_STROKES){
    c.strokeStyle=color
    c.lineWidth=width*S
    c.beginPath()
    c.moveTo(x1*S,y1*S)
    c.quadraticCurveTo(((x1+x2)/2+1.5)*S,((y1+y2)/2-1)*S,x2*S,y2*S)
    c.stroke()
  }

  for(const mark of TITLE_EMBROIDERY_MARKS)embroidery(c,S,mark)

  // Individual beard/hair strands are deliberately geometric rather than raster.
  c.strokeStyle='rgba(35,17,15,.72)'
  c.lineWidth=.26*S
  for(let i=0;i<11;i++){
    const x=111+i*1.9
    c.beginPath()
    c.moveTo(x*S,(119+(i%3))*S)
    c.quadraticCurveTo((x-2+(i%2)*4)*S,151*S,(x-4+(i%4))*S,184*S)
    c.stroke()
  }
  for(let i=0;i<7;i++){
    const x=229+i*2.1
    c.beginPath()
    c.moveTo(x*S,(179+(i%2))*S)
    c.quadraticCurveTo((x+1)*S,195*S,(x-2+(i%3))*S,217*S)
    c.stroke()
  }

  // Fine rim lights survive high-DPI scaling and separate overlapping silhouettes.
  c.strokeStyle='rgba(255,220,166,.34)'
  c.lineWidth=.3*S
  c.beginPath()
  c.moveTo(86*S,76*S)
  c.quadraticCurveTo(118*S,52*S,154*S,75*S)
  c.stroke()
  c.beginPath()
  c.moveTo(177*S,111*S)
  c.quadraticCurveTo(235*S,83*S,290*S,111*S)
  c.stroke()

  c.restore()
  return true
}
