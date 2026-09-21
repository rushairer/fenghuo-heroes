export function duelSpacingCueGeometry(distance){
  const d=Math.max(0,Number(distance)||0)
  const closeness=Math.max(0,Math.min(1,(72-d)/46))
  return Object.freeze({
    distance:d,
    closeness,
    lineAlpha:.04+closeness*.16,
    dustAlpha:closeness*.11,
    dustRx:8+closeness*10,
    dustRy:1.6+closeness*1.2,
  })
}

export function drawDuelSpacingCue(r,{
  leftX,
  rightX,
  y=171,
}={}){
  if(!Number.isFinite(leftX)||!Number.isFinite(rightX))return false
  const distance=Math.max(0,rightX-leftX)
  const detail=duelSpacingCueGeometry(distance)
  if(detail.closeness<=0)return false

  const c=r.ctx,S=r.S
  const midpoint=(leftX+rightX)/2
  c.save()

  c.strokeStyle=`rgba(246,211,154,${detail.lineAlpha})`
  c.lineWidth=.34*S
  c.beginPath()
  c.moveTo((leftX+16)*S,y*S)
  c.quadraticCurveTo(midpoint*S,(y+2)*S,(rightX-16)*S,y*S)
  c.stroke()

  c.fillStyle=`rgba(195,158,103,${detail.dustAlpha})`
  c.beginPath()
  c.ellipse(midpoint*S,(y+1.2)*S,detail.dustRx*S,detail.dustRy*S,0,0,Math.PI*2)
  c.fill()

  c.restore()
  return true
}
