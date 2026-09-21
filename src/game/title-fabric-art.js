export const TITLE_FABRIC_REGIONS=Object.freeze([
  Object.freeze({id:'left',x:7,y:181,w:58,h:39,step:5,alpha:.12}),
  Object.freeze({id:'center',x:83,y:145,w:76,h:74,step:5,alpha:.13}),
  Object.freeze({id:'upper-right',x:184,y:105,w:66,h:48,step:6,alpha:.1}),
  Object.freeze({id:'front-right',x:168,y:193,w:142,h:29,step:6,alpha:.11}),
])

export const TITLE_FABRIC_SEAMS=Object.freeze([
  Object.freeze([[18,198],[38,187],[57,195]]),
  Object.freeze([[94,163],[112,170],[127,188],[139,215]]),
  Object.freeze([[201,119],[218,129],[234,147]]),
  Object.freeze([[188,205],[211,212],[239,209],[270,200]]),
])

function drawRegion(c,S,region){
  c.save()
  c.beginPath()
  c.rect(region.x*S,region.y*S,region.w*S,region.h*S)
  c.clip()
  c.strokeStyle=`rgba(255,229,198,${region.alpha})`
  c.lineWidth=.2*S
  for(let offset=-region.h;offset<region.w;offset+=region.step){
    c.beginPath()
    c.moveTo((region.x+offset)*S,region.y*S)
    c.lineTo((region.x+offset+region.h)*S,(region.y+region.h)*S)
    c.stroke()
  }
  c.strokeStyle=`rgba(58,22,23,${region.alpha*.72})`
  for(let yy=region.y+region.step;yy<region.y+region.h;yy+=region.step*1.7){
    c.beginPath()
    c.moveTo(region.x*S,yy*S)
    c.lineTo((region.x+region.w)*S,yy*S)
    c.stroke()
  }
  c.restore()
}

function drawSeam(c,S,points){
  c.strokeStyle='rgba(244,197,154,.24)'
  c.lineWidth=.28*S
  c.setLineDash([1.2*S,1.5*S])
  c.beginPath()
  points.forEach(([x,y],index)=>{
    if(index===0)c.moveTo(x*S,y*S)
    else c.lineTo(x*S,y*S)
  })
  c.stroke()
  c.setLineDash([])
}

export function drawTitleFabricPass(r){
  const c=r.ctx,S=r.S
  c.save()
  for(const region of TITLE_FABRIC_REGIONS)drawRegion(c,S,region)
  for(const seam of TITLE_FABRIC_SEAMS)drawSeam(c,S,seam)
  c.restore()
  return true
}
