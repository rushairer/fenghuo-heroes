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

export function duelArmorDetailGeometry(){
  return Object.freeze({
    verticalSeams:Object.freeze([-5.2,0,5.2]),
    helmetRivets:Object.freeze([-4.2,0,4.2]),
    beltY:-4,
    face:Object.freeze({
      eyeY:-38,
      eyeOffset:2.2,
      browY:-40.2,
      mouthY:-33.7,
    }),
    spearBindings:Object.freeze([3.5,6.2,8.9]),
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

  const armorDetail=duelArmorDetailGeometry()
  c.strokeStyle='rgba(41,29,23,.42)'
  c.lineWidth=.34*S
  for(const seam of armorDetail.verticalSeams){
    c.beginPath()
    c.moveTo(seam*S,-22*S)
    c.lineTo((seam*.72)*S,-5*S)
    c.stroke()
  }
  c.strokeStyle='rgba(246,217,160,.48)'
  c.lineWidth=.5*S
  c.beginPath()
  c.moveTo(-9*S,armorDetail.beltY*S)
  c.quadraticCurveTo(0,(armorDetail.beltY+1.2)*S,10*S,armorDetail.beltY*S)
  c.stroke()

  // Head and face.
  c.fillStyle='#d4a06f'
  c.beginPath()
  c.ellipse(0,-37*S,6.5*S,7.5*S,0,0,Math.PI*2)
  c.fill()
  c.strokeStyle='#3b251b'
  c.lineWidth=.8*S
  c.stroke()

  c.strokeStyle='#4a281f'
  c.lineWidth=.42*S
  c.beginPath()
  c.moveTo(-4.2*S,armorDetail.face.browY*S)
  c.lineTo(-.8*S,(armorDetail.face.browY-.5)*S)
  c.moveTo(.8*S,(armorDetail.face.browY-.5)*S)
  c.lineTo(4.2*S,armorDetail.face.browY*S)
  c.stroke()
  c.fillStyle='#17110f'
  for(const eyeX of [-armorDetail.face.eyeOffset,armorDetail.face.eyeOffset]){
    c.beginPath()
    c.arc(eyeX*S,armorDetail.face.eyeY*S,.48*S,0,Math.PI*2)
    c.fill()
  }
  c.strokeStyle='#7b4734'
  c.lineWidth=.32*S
  c.beginPath()
  c.moveTo(-1.8*S,armorDetail.face.mouthY*S)
  c.lineTo(2.2*S,armorDetail.face.mouthY*S)
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
  c.fillStyle='rgba(233,194,112,.72)'
  for(const rivetX of armorDetail.helmetRivets){
    c.beginPath()
    c.arc(rivetX*S,-40.5*S,.48*S,0,Math.PI*2)
    c.fill()
  }

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
  c.strokeStyle='#6b3f28'
  c.lineWidth=.7*S
  for(const bind of armorDetail.spearBindings){
    c.beginPath()
    c.moveTo(bind*S,-1.4*S)
    c.lineTo((bind+1.1)*S,1.4*S)
    c.stroke()
  }
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

export function siegeDetailGeometry(width=290,height=105){
  const w=Math.max(120,Number(width)||290)
  const h=Math.max(70,Number(height)||105)
  const embrasures=[]
  for(let x=26;x<w-24;x+=34)embrasures.push(Object.freeze({x,y:34+(x%3)*.8}))
  const brickJoints=[]
  for(let row=0,y=52;y<h-6;y+=9,row++){
    const offset=row%2?12:0
    for(let x=18+offset;x<w-16;x+=28)brickJoints.push(Object.freeze({x,y1:y,y2:Math.min(h-4,y+9)}))
  }
  return Object.freeze({
    embrasures:Object.freeze(embrasures),
    brickJoints:Object.freeze(brickJoints),
    gateBeams:Object.freeze([-31,-16,16,31]),
    dust:Object.freeze([
      Object.freeze({x:w*.18,y:h-7,rx:28,ry:5,alpha:.12}),
      Object.freeze({x:w*.76,y:h-5,rx:34,ry:6,alpha:.1}),
    ]),
  })
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

  const detail=siegeDetailGeometry(width,height)

  // Arrow slits and upper-wall articulation.
  c.fillStyle='rgba(32,24,20,.76)'
  for(const slit of detail.embrasures){
    c.fillRect((x+slit.x-1)*S,(y+slit.y)*S,2*S,5*S)
    c.fillStyle='rgba(225,194,145,.25)'
    c.fillRect((x+slit.x-1)*S,(y+slit.y)*S,.45*S,5*S)
    c.fillStyle='rgba(32,24,20,.76)'
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

  // Offset vertical joints keep the wall from reading as flat horizontal bands.
  c.strokeStyle='rgba(58,45,36,.34)'
  c.lineWidth=.35*S
  for(const joint of detail.brickJoints){
    c.beginPath()
    c.moveTo((x+joint.x)*S,(y+joint.y1)*S)
    c.lineTo((x+joint.x)*S,(y+joint.y2)*S)
    c.stroke()
  }

  // Gatehouse beams and metal studs.
  c.strokeStyle='rgba(122,83,48,.72)'
  c.lineWidth=1.1*S
  for(const beam of detail.gateBeams){
    c.beginPath()
    c.moveTo((gateX+beam)*S,(y+44)*S)
    c.lineTo((gateX+beam*.72)*S,(y+height-5)*S)
    c.stroke()
  }
  c.fillStyle='rgba(215,166,82,.68)'
  for(const dx of [-13,0,13]){
    for(const dy of [73,86,99]){
      c.beginPath()
      c.arc((gateX+dx)*S,(y+dy)*S,.65*S,0,Math.PI*2)
      c.fill()
    }
  }

  // Foreground dust adds depth without encoding any game-state fact.
  for(const dust of detail.dust){
    c.fillStyle=`rgba(218,188,134,${dust.alpha})`
    c.beginPath()
    c.ellipse((x+dust.x)*S,(y+dust.y)*S,dust.rx*S,dust.ry*S,0,0,Math.PI*2)
    c.fill()
  }

  c.restore()
  return true
}


export function duelArenaPosts(width=280,step=20){
  const safeWidth=Math.max(80,Number(width)||280)
  const safeStep=Math.max(12,Number(step)||20)
  const posts=[]
  for(let x=12;x<safeWidth-8;x+=safeStep)posts.push(x)
  return Object.freeze(posts)
}

export function drawDuelArena(r,{
  x=0,
  y=38,
  width=320,
  height=152,
}={}){
  const c=r.ctx,S=r.S
  c.save()

  const sky=c.createLinearGradient(0,y*S,0,(y+height)*S)
  sky.addColorStop(0,'#b27650')
  sky.addColorStop(.52,'#c99b68')
  sky.addColorStop(1,'#7d6842')
  c.fillStyle=sky
  c.fillRect(x*S,y*S,width*S,height*S)

  // Distant timber spectator wall.
  c.fillStyle='#4e3b31'
  c.fillRect((x+18)*S,(y+46)*S,(width-36)*S,50*S)
  c.fillStyle='#2d221d'
  c.fillRect((x+132)*S,(y+55)*S,56*S,41*S)

  for(const px of duelArenaPosts(width-40,20)){
    const worldX=x+20+px
    c.fillStyle='#5a4639'
    c.fillRect(worldX*S,(y+35)*S,11*S,15*S)
    c.fillStyle='rgba(218,187,145,.22)'
    c.fillRect((worldX+1.5)*S,(y+37)*S,1.2*S,11*S)
  }

  // Arena floor with converging plank lines.
  const floorY=y+96
  const floor=c.createLinearGradient(0,floorY*S,0,(y+height)*S)
  floor.addColorStop(0,'#9a8254')
  floor.addColorStop(1,'#6f5c39')
  c.fillStyle=floor
  c.fillRect(x*S,floorY*S,width*S,(height-96)*S)

  c.strokeStyle='rgba(59,42,29,.38)'
  c.lineWidth=.65*S
  for(let px=x+18;px<x+width;px+=26){
    c.beginPath()
    c.moveTo(px*S,(y+height)*S)
    c.lineTo((x+width/2+(px-(x+width/2))*.62)*S,floorY*S)
    c.stroke()
  }
  for(let yy=floorY+10;yy<y+height;yy+=12){
    c.beginPath()
    c.moveTo(x*S,yy*S)
    c.lineTo((x+width)*S,yy*S)
    c.stroke()
  }

  // Central gate depth.
  c.fillStyle='#1f1714'
  c.beginPath()
  c.moveTo((x+138)*S,(y+96)*S)
  c.lineTo((x+138)*S,(y+67)*S)
  c.quadraticCurveTo((x+160)*S,(y+49)*S,(x+182)*S,(y+67)*S)
  c.lineTo((x+182)*S,(y+96)*S)
  c.closePath()
  c.fill()

  c.restore()
  return true
}
