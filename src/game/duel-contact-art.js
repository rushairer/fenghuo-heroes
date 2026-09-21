export const DUEL_CONTACT_PRESENTATION_RANGE=43

export function duelWeaponContactGeometry({
  distance=999,
  playerAttacking=false,
  enemyAttacking=false,
}={}){
  const d=Math.max(0,Number(distance)||0)
  const active=Boolean(playerAttacking||enemyAttacking)
  const contact=active&&d<DUEL_CONTACT_PRESENTATION_RANGE
  const intensity=contact?Math.max(.2,Math.min(1,(DUEL_CONTACT_PRESENTATION_RANGE-d)/18+.25)):0
  return Object.freeze({
    active:contact,
    intensity,
    ringRadius:4+intensity*4,
    rays:Object.freeze(contact?[
      Object.freeze({x1:-6,y1:-3,x2:-11,y2:-7}),
      Object.freeze({x1:6,y1:-2,x2:12,y2:-5}),
      Object.freeze({x1:-5,y1:4,x2:-10,y2:8}),
      Object.freeze({x1:5,y1:4,x2:10,y2:8}),
    ]:[]),
  })
}

export function drawDuelWeaponContact(r,{
  leftX,
  rightX,
  y=141,
  playerAttacking=false,
  enemyAttacking=false,
}={}){
  if(!Number.isFinite(leftX)||!Number.isFinite(rightX))return false
  const detail=duelWeaponContactGeometry({
    distance:rightX-leftX,
    playerAttacking,
    enemyAttacking,
  })
  if(!detail.active)return false

  const c=r.ctx,S=r.S
  const x=(leftX+rightX)/2
  c.save()
  c.translate(x*S,y*S)

  const glow=c.createRadialGradient(0,0,0,0,0,detail.ringRadius*2*S)
  glow.addColorStop(0,`rgba(255,245,204,${.38*detail.intensity})`)
  glow.addColorStop(1,'rgba(255,220,150,0)')
  c.fillStyle=glow
  c.beginPath()
  c.arc(0,0,detail.ringRadius*2*S,0,Math.PI*2)
  c.fill()

  c.strokeStyle='rgba(255,236,176,.76)'
  c.lineWidth=.55*S
  for(const ray of detail.rays){
    c.beginPath()
    c.moveTo(ray.x1*S,ray.y1*S)
    c.lineTo(ray.x2*S,ray.y2*S)
    c.stroke()
  }

  c.strokeStyle='rgba(255,255,231,.5)'
  c.lineWidth=.32*S
  c.beginPath()
  c.arc(0,0,detail.ringRadius*S,0,Math.PI*2)
  c.stroke()

  c.restore()
  return true
}
