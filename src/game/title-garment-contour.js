export const TITLE_GARMENT_CONTOURS=Object.freeze([
  Object.freeze({id:'left-robe',points:[[4,188],[24,177],[42,177],[58,190]],alpha:.28,width:.42}),
  Object.freeze({id:'center-left',points:[[78,145],[96,136],[116,136],[132,145]],alpha:.3,width:.44}),
  Object.freeze({id:'center-right',points:[[134,144],[151,151],[164,169],[170,193]],alpha:.23,width:.38}),
  Object.freeze({id:'upper-right',points:[[181,103],[199,96],[221,101],[239,115]],alpha:.24,width:.38}),
  Object.freeze({id:'front-right-left',points:[[168,195],[188,186],[208,194],[225,208]],alpha:.28,width:.42}),
  Object.freeze({id:'front-right-right',points:[[252,201],[276,192],[300,187],[318,190]],alpha:.22,width:.4}),
])

export const TITLE_COLLAR_EDGES=Object.freeze([
  Object.freeze([[34,169],[47,179],[58,194]]),
  Object.freeze([[103,132],[119,141],[128,160]]),
  Object.freeze([[198,95],[215,108],[224,126]]),
  Object.freeze([[190,183],[211,198],[229,210]]),
])

function drawPolyline(c,S,points,color,width){
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

export function drawTitleGarmentContour(r){
  const c=r.ctx,S=r.S
  c.save()

  for(const contour of TITLE_GARMENT_CONTOURS){
    drawPolyline(
      c,S,contour.points,
      `rgba(255,218,178,${contour.alpha})`,
      contour.width,
    )
  }

  for(const points of TITLE_COLLAR_EDGES){
    drawPolyline(c,S,points,'rgba(76,29,26,.34)',.34)
    drawPolyline(c,S,points.map(([x,y])=>[x+.75,y-.55]),'rgba(241,187,146,.18)',.22)
  }

  c.restore()
  return true
}
