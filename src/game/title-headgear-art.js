export const TITLE_HEADGEAR_DETAILS=Object.freeze([
  Object.freeze({
    id:'rear-general',
    trim:Object.freeze([[49,18],[83,15],[119,18]]),
    studs:Object.freeze([[61,20],[83,18],[106,20]]),
    ribbons:Object.freeze([]),
  }),
  Object.freeze({
    id:'center-wrap',
    trim:Object.freeze([[88,67],[121,61],[154,69]]),
    studs:Object.freeze([[101,66],[121,63],[141,67]]),
    ribbons:Object.freeze([
      Object.freeze([[88,70],[84,84],[87,96]]),
      Object.freeze([[153,70],[158,84],[155,98]]),
    ]),
  }),
  Object.freeze({
    id:'upper-right',
    trim:Object.freeze([[178,23],[204,18],[229,25]]),
    studs:Object.freeze([[188,25],[205,21],[221,25]]),
    ribbons:Object.freeze([]),
  }),
  Object.freeze({
    id:'front-right',
    trim:Object.freeze([[190,102],[232,91],[278,101]]),
    studs:Object.freeze([[204,102],[232,95],[263,101]]),
    ribbons:Object.freeze([
      Object.freeze([[199,106],[191,116],[188,126]]),
      Object.freeze([[270,105],[278,116],[282,128]]),
    ]),
  }),
])

function polyline(c,S,points,color,width){
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

export function drawTitleHeadgearDetail(r){
  const c=r.ctx,S=r.S
  c.save()

  for(const detail of TITLE_HEADGEAR_DETAILS){
    polyline(c,S,detail.trim,'rgba(255,220,163,.42)',.32)
    c.fillStyle='rgba(239,194,102,.72)'
    for(const [x,y] of detail.studs){
      c.beginPath()
      c.arc(x*S,y*S,.55*S,0,Math.PI*2)
      c.fill()
    }
    for(const ribbon of detail.ribbons){
      polyline(c,S,ribbon,'rgba(86,42,31,.52)',.34)
      polyline(c,S,ribbon.map(([x,y])=>[x+1.1,y-.5]),'rgba(240,200,148,.2)',.22)
    }
  }

  // Small cap-wing edges on the largest foreground scholar cap.
  c.strokeStyle='rgba(245,208,154,.34)'
  c.lineWidth=.3*S
  c.beginPath()
  c.moveTo(183*S,108*S)
  c.quadraticCurveTo(172*S,111*S,164*S,116*S)
  c.moveTo(278*S,104*S)
  c.quadraticCurveTo(291*S,108*S,300*S,113*S)
  c.stroke()

  c.restore()
  return true
}
