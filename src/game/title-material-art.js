export const TITLE_SKIN_SHADOWS=Object.freeze([
  Object.freeze({x:43,y:104,rx:18,ry:26,rotation:-.18,alpha:.16}),
  Object.freeze({x:119,y:100,rx:19,ry:27,rotation:.05,alpha:.14}),
  Object.freeze({x:213,y:62,rx:18,ry:24,rotation:.24,alpha:.15}),
  Object.freeze({x:232,y:151,rx:31,ry:40,rotation:-.08,alpha:.13}),
])

export const TITLE_CLOTH_RIDGES=Object.freeze([
  Object.freeze([78,151,96,216,'#d46a51',.42]),
  Object.freeze([91,147,108,220,'#7f2824',.34]),
  Object.freeze([137,145,153,220,'#d55d48',.36]),
  Object.freeze([150,150,167,218,'#45191a',.34]),
  Object.freeze([190,105,214,151,'#8e342a',.32]),
  Object.freeze([215,109,241,153,'#b54c3b',.28]),
  Object.freeze([176,198,201,223,'#a94739',.34]),
  Object.freeze([257,198,298,223,'#5c2523',.32]),
])

export const TITLE_HEADGEAR_STITCHES=Object.freeze([
  Object.freeze({x1:91,y1:67,x2:151,y2:69,step:5}),
  Object.freeze({x1:179,y1:27,x2:229,y2:26,step:5}),
  Object.freeze({x1:198,y1:101,x2:277,y2:99,step:6}),
])

function drawSkinShadow(ctx,S,shadow){
  ctx.save()
  ctx.translate(shadow.x*S,shadow.y*S)
  ctx.rotate(shadow.rotation)
  const g=ctx.createRadialGradient(-shadow.rx*.24*S,-shadow.ry*.18*S,0,0,0,shadow.rx*S)
  g.addColorStop(0,'rgba(90,43,31,0)')
  g.addColorStop(.62,`rgba(91,42,31,${shadow.alpha*.55})`)
  g.addColorStop(1,`rgba(55,24,20,${shadow.alpha})`)
  ctx.fillStyle=g
  ctx.beginPath()
  ctx.ellipse(0,0,shadow.rx*S,shadow.ry*S,0,0,Math.PI*2)
  ctx.fill()
  ctx.restore()
}

function drawStitches(ctx,S,{x1,y1,x2,y2,step}){
  const dx=x2-x1,dy=y2-y1
  const length=Math.max(1,Math.hypot(dx,dy))
  const count=Math.max(2,Math.floor(length/step))
  ctx.fillStyle='rgba(246,211,151,.62)'
  for(let i=0;i<=count;i++){
    const t=i/count
    const x=x1+dx*t
    const y=y1+dy*t
    ctx.beginPath()
    ctx.arc(x*S,y*S,.34*S,0,Math.PI*2)
    ctx.fill()
  }
}

export function drawTitleMaterialPass(r){
  const c=r.ctx,S=r.S
  c.save()

  for(const shadow of TITLE_SKIN_SHADOWS)drawSkinShadow(c,S,shadow)

  c.lineCap='round'
  for(const [x1,y1,x2,y2,color,width] of TITLE_CLOTH_RIDGES){
    const g=c.createLinearGradient(x1*S,y1*S,x2*S,y2*S)
    g.addColorStop(0,'rgba(255,230,196,.28)')
    g.addColorStop(.36,color)
    g.addColorStop(1,'rgba(38,16,16,.08)')
    c.strokeStyle=g
    c.lineWidth=width*S
    c.beginPath()
    c.moveTo(x1*S,y1*S)
    c.quadraticCurveTo(((x1+x2)/2+3)*S,((y1+y2)/2-4)*S,x2*S,y2*S)
    c.stroke()
  }

  for(const stitch of TITLE_HEADGEAR_STITCHES)drawStitches(c,S,stitch)

  // Fine armor/robe scale hints on the central and right figures.
  c.strokeStyle='rgba(232,181,102,.32)'
  c.lineWidth=.28*S
  for(const [ox,oy,cols,rows] of [[103,158,4,5],[214,116,4,3]]){
    for(let row=0;row<rows;row++){
      for(let col=0;col<cols;col++){
        const x=ox+col*7+(row%2)*3.5
        const y=oy+row*8
        c.beginPath()
        c.arc(x*S,y*S,2.5*S,Math.PI*.08,Math.PI*.92)
        c.stroke()
      }
    }
  }

  // Small metal glints give the headgear and armor a high-DPI response.
  c.fillStyle='rgba(255,226,157,.64)'
  for(const [x,y,radius] of [[120,61,.7],[225,24,.65],[277,98,.55],[112,167,.5],[231,126,.5]]){
    c.beginPath()
    c.arc(x*S,y*S,radius*S,0,Math.PI*2)
    c.fill()
  }

  c.restore()
  return true
}
