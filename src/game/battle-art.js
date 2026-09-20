export function battlementColumns(width=280,step=28){
  const safeWidth=Math.max(0,Number(width)||0)
  const safeStep=Math.max(8,Number(step)||28)
  const columns=[]
  for(let x=safeStep*.5;x<safeWidth;x+=safeStep)columns.push(Math.round(x*100)/100)
  return Object.freeze(columns)
}

export function duelFighterPose({
  guard=false,
  attacking=false,
  flip=false,
}={}){
  return Object.freeze({
    bodyLean:attacking?4:guard?-2:0,
    spearAngle:attacking?-0.13:guard?-0.42:-0.05,
    frontArm:attacking?12:guard?5:8,
    rearArm:guard?-7:-4,
    flip:Boolean(flip),
  })
}

export function drawDuelFighter(r,{
  x,
  y,
  color,
  flip=false,
  guard=false,
  attacking=false,
}){
  const c=r.ctx
  const S=r.S
  const pose=duelFighterPose({guard,attacking,flip})
  c.save()
  c.translate(x*S,y*S)
  c.scale(flip?-1:1,1)
  c.lineJoin='round'
  c.lineCap='round'

  // Ground shadow.
  c.fillStyle='rgba(25,15,10,.38)'
  c.beginPath()
  c.ellipse(0,11*S,20*S,4*S,0,0,Math.PI*2)
  c.fill()

  // Rear leg.
  c.strokeStyle='#2b1d17'
  c.lineWidth=5*S
  c.beginPath()
  c.moveTo(-5*S,-2*S)
  c.quadraticCurveTo(-9*S,8*S,-12*S,18*S)
  c.stroke()

  // Front leg.
  c.strokeStyle='#4a2e20'
  c.lineWidth=5.5*S
  c.beginPath()
  c.moveTo(5*S,-2*S)
  c.quadraticCurveTo(9*S,7*S,12*S,17*S)
  c.stroke()

  // Robe / armor body.
  c.save()
  c.translate(pose.bodyLean*S,0)
  const body=c.createLinearGradient(-11*S,-29*S,12*S,4*S)
  body.addColorStop(0,color)
  body.addColorStop(1,'#2d251f')
  c.fillStyle=body
  c.beginPath()
  c.moveTo(-10*S,-27*S)
  c.quadraticCurveTo(0,-32*S,10*S,-27*S)
  c.lineTo(13*S,1*S)
  c.quadraticCurveTo(0,6*S,-13*S,1*S)
  c.closePath()
  c.fill()

  // Armor bands.
  c.strokeStyle='rgba(238,211,151,.65)'
  c.lineWidth=.8*S
  for(let yy=-20;yy<=-4;yy+=6){
    c.beginPath()
    c.moveTo(-8*S,yy*S)
    c.quadraticCurveTo(0,(yy+2)*S,9*S,yy*S)
    c.stroke()
  }

  // Head and face.
  c.fillStyle='#d4a06f'
  c.beginPath()
  c.ellipse(0,-37*S,6.5*S,7.5*S,0,0,Math.PI*2)
  c.fill()
  c.strokeStyle='#3b251b'
  c.lineWidth=.8*S
  c.stroke()

  // Helmet.
  c.fillStyle='#24201d'
  c.beginPath()
  c.moveTo(-8*S,-40*S)
  c.quadraticCurveTo(0,-49*S,8*S,-40*S)
  c.lineTo(6*S,-36*S)
  c.quadraticCurveTo(0,-39*S,-6*S,-36*S)
  c.closePath()
  c.fill()
  c.fillStyle='#b98a3a'
  c.fillRect(-1*S,-49*S,2*S,8*S)

  // Arms.
  c.strokeStyle=color
  c.lineWidth=4.4*S
  c.beginPath()
  c.moveTo(-8*S,-21*S)
  c.lineTo(pose.rearArm*S,-9*S)
  c.stroke()
  c.beginPath()
  c.moveTo(8*S,-21*S)
  c.lineTo(pose.frontArm*S,-11*S)
  c.stroke()

  // Hands.
  c.fillStyle='#d4a06f'
  c.beginPath();c.arc(pose.frontArm*S,-11*S,2.2*S,0,Math.PI*2);c.fill()
  c.beginPath();c.arc(pose.rearArm*S,-9*S,2*S,0,Math.PI*2);c.fill()

  // Spear. It stays vector-clean at every backing scale.
  c.save()
  c.translate(pose.frontArm*S,-11*S)
  c.rotate(pose.spearAngle)
  c.strokeStyle='#d8d0b0'
  c.lineWidth=1.7*S
  c.beginPath()
  c.moveTo(-4*S,0)
  c.lineTo(39*S,0)
  c.stroke()
  c.fillStyle='#d7ad55'
  c.beginPath()
  c.moveTo(39*S,0)
  c.lineTo(31*S,-3*S)
  c.lineTo(32*S,3*S)
  c.closePath()
  c.fill()
  c.restore()

  c.restore()
  c.restore()
  return true
}

export function drawSiegeFortress(r,{
  x=15,
  y=48,
  width=290,
  height=105,
}={}){
  const c=r.ctx
  const S=r.S
  const columns=battlementColumns(width-16,28)
  c.save()

  const sky=c.createLinearGradient(0,y*S,0,(y+height)*S)
  sky.addColorStop(0,'#9c623f')
  sky.addColorStop(1,'#5d4129')
  c.fillStyle=sky
  c.fillRect(x*S,y*S,width*S,height*S)

  // Distant wall body.
  const wall=c.createLinearGradient(0,(y+30)*S,0,(y+height)*S)
  wall.addColorStop(0,'#947b5e')
  wall.addColorStop(1,'#5d4a3a')
  c.fillStyle=wall
  c.fillRect((x+7)*S,(y+26)*S,(width-14)*S,(height-26)*S)

  // Battlements and towers.
  for(const offset of columns){
    const bx=x+8+offset
    c.fillStyle='#7e6953'
    c.fillRect((bx-7)*S,(y+17)*S,14*S,13*S)
    c.fillStyle='#3f332a'
    c.fillRect((bx-5)*S,(y+13)*S,10*S,5*S)
    c.fillStyle='rgba(205,176,127,.55)'
    c.fillRect((bx-5)*S,(y+19)*S,10*S,1.2*S)
  }

  // Central gatehouse.
  const gateX=x+width/2
  c.fillStyle='#4a382d'
  c.fillRect((gateX-47)*S,(y+39)*S,94*S,(height-39)*S)
  c.fillStyle='#241a16'
  c.beginPath()
  c.moveTo((gateX-21)*S,(y+height)*S)
  c.lineTo((gateX-21)*S,(y+65)*S)
  c.quadraticCurveTo(gateX*S,(y+48)*S,(gateX+21)*S,(y+65)*S)
  c.lineTo((gateX+21)*S,(y+height)*S)
  c.closePath()
  c.fill()

  // Stone courses.
  c.strokeStyle='rgba(214,188,145,.25)'
  c.lineWidth=.55*S
  for(let yy=y+47;yy<y+height;yy+=9){
    c.beginPath()
    c.moveTo((x+8)*S,yy*S)
    c.lineTo((x+width-8)*S,yy*S)
    c.stroke()
  }

  c.restore()
  return true
}
