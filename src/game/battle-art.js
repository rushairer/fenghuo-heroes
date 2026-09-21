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

export function duelFighterOrnamentGeometry(){
  return Object.freeze({
    plume:Object.freeze([
      Object.freeze({x:0,y:-49}),
      Object.freeze({x:2.5,y:-55}),
      Object.freeze({x:-1.5,y:-60}),
      Object.freeze({x:3.2,y:-65}),
    ]),
    shoulderPlates:Object.freeze([
      Object.freeze({x:-11.5,y:-23,rx:3.6,ry:2.2}),
      Object.freeze({x:11.5,y:-23,rx:3.6,ry:2.2}),
    ]),
    tassels:Object.freeze([
      Object.freeze({x:-5,y:-2,dx:-2.8,dy:9}),
      Object.freeze({x:0,y:-1,dx:.8,dy:10}),
      Object.freeze({x:5,y:-2,dx:3.1,dy:9}),
    ]),
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

  const ornament=duelFighterOrnamentGeometry()
  c.fillStyle='rgba(92,61,40,.8)'
  for(const plate of ornament.shoulderPlates){
    c.beginPath()
    c.ellipse(plate.x*S,plate.y*S,plate.rx*S,plate.ry*S,0,0,Math.PI*2)
    c.fill()
    c.strokeStyle='rgba(235,199,130,.45)'
    c.lineWidth=.28*S
    c.stroke()
  }

  c.strokeStyle='rgba(112,50,35,.75)'
  c.lineWidth=.55*S
  for(const tassel of ornament.tassels){
    c.beginPath()
    c.moveTo(tassel.x*S,tassel.y*S)
    c.quadraticCurveTo((tassel.x+tassel.dx*.4)*S,(tassel.y+tassel.dy*.55)*S,(tassel.x+tassel.dx)*S,(tassel.y+tassel.dy)*S)
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

  c.strokeStyle='rgba(141,43,31,.82)'
  c.lineWidth=1.35*S
  c.beginPath()
  ornament.plume.forEach((point,index)=>{
    if(index===0)c.moveTo(point.x*S,point.y*S)
    else c.quadraticCurveTo((point.x-1.2)*S,(point.y+1.5)*S,point.x*S,point.y*S)
  })
  c.stroke()
  c.strokeStyle='rgba(244,173,111,.42)'
  c.lineWidth=.42*S
  c.beginPath()
  ornament.plume.forEach((point,index)=>{
    if(index===0)c.moveTo((point.x+.5)*S,point.y*S)
    else c.lineTo((point.x+.5)*S,point.y*S)
  })
  c.stroke()

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
    gateStudYs:Object.freeze([
      Math.round(h*.7*100)/100,
      Math.round(h*.82*100)/100,
      Math.round(h*.94*100)/100,
    ]),
    dust:Object.freeze([
      Object.freeze({x:w*.18,y:h-7,rx:28,ry:5,alpha:.12}),
      Object.freeze({x:w*.76,y:h-5,rx:34,ry:6,alpha:.1}),
    ]),
  })
}

export function siegeTowerDetailGeometry(width=290){
  const w=Math.max(120,Number(width)||290)
  return Object.freeze({
    towers:Object.freeze([
      Object.freeze({x:26,roofY:20,bodyW:24,bodyH:29}),
      Object.freeze({x:w-26,roofY:20,bodyW:24,bodyH:29}),
    ]),
    eaves:Object.freeze([
      Object.freeze({x1:12,x2:40,y:20}),
      Object.freeze({x1:w-40,x2:w-12,y:20}),
    ]),
  })
}

export function siegeGateDepthGeometry(width=290,height=105){
  const w=Math.max(120,Number(width)||290)
  const h=Math.max(70,Number(height)||105)
  const gateHalf=Math.min(21,w*.08)
  const gateTop=h*.62
  return Object.freeze({
    gateHalf,
    gateTop,
    innerHalf:gateHalf*.62,
    innerTop:gateTop+8,
    plankXs:Object.freeze([-gateHalf*.55,-gateHalf*.18,gateHalf*.18,gateHalf*.55]),
    thresholdY:h-4,
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

  const towerDetail=siegeTowerDetailGeometry(width)
  for(const tower of towerDetail.towers){
    c.fillStyle='#66513f'
    c.fillRect((x+tower.x-tower.bodyW/2)*S,(y+tower.roofY+4)*S,tower.bodyW*S,tower.bodyH*S)
    const roof=c.createLinearGradient((x+tower.x)*S,(y+tower.roofY-5)*S,(x+tower.x)*S,(y+tower.roofY+5)*S)
    roof.addColorStop(0,'#2f2520')
    roof.addColorStop(1,'#594336')
    c.fillStyle=roof
    c.beginPath()
    c.moveTo((x+tower.x-tower.bodyW*.68)*S,(y+tower.roofY+4)*S)
    c.lineTo((x+tower.x)*S,(y+tower.roofY-5)*S)
    c.lineTo((x+tower.x+tower.bodyW*.68)*S,(y+tower.roofY+4)*S)
    c.closePath()
    c.fill()
    c.fillStyle='rgba(225,192,140,.42)'
    c.fillRect((x+tower.x-tower.bodyW*.35)*S,(y+tower.roofY+11)*S,tower.bodyW*.7*S,1.2*S)
  }
  c.strokeStyle='rgba(227,193,137,.4)'
  c.lineWidth=.55*S
  for(const eave of towerDetail.eaves){
    c.beginPath()
    c.moveTo((x+eave.x1)*S,(y+eave.y)*S)
    c.lineTo((x+eave.x2)*S,(y+eave.y)*S)
    c.stroke()
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
  const gateDepth=siegeGateDepthGeometry(width,height)
  c.fillStyle='#241a16'
  c.beginPath()
  c.moveTo((gateX-gateDepth.gateHalf)*S,(y+height)*S)
  c.lineTo((gateX-gateDepth.gateHalf)*S,(y+gateDepth.gateTop)*S)
  c.quadraticCurveTo(gateX*S,(y+gateDepth.gateTop-17)*S,(gateX+gateDepth.gateHalf)*S,(y+gateDepth.gateTop)*S)
  c.lineTo((gateX+gateDepth.gateHalf)*S,(y+height)*S)
  c.closePath()
  c.fill()

  c.fillStyle='rgba(11,9,8,.62)'
  c.beginPath()
  c.moveTo((gateX-gateDepth.innerHalf)*S,(y+height)*S)
  c.lineTo((gateX-gateDepth.innerHalf)*S,(y+gateDepth.innerTop)*S)
  c.quadraticCurveTo(gateX*S,(y+gateDepth.innerTop-10)*S,(gateX+gateDepth.innerHalf)*S,(y+gateDepth.innerTop)*S)
  c.lineTo((gateX+gateDepth.innerHalf)*S,(y+height)*S)
  c.closePath()
  c.fill()

  c.strokeStyle='rgba(119,79,45,.58)'
  c.lineWidth=.55*S
  for(const dx of gateDepth.plankXs){
    c.beginPath()
    c.moveTo((gateX+dx)*S,(y+gateDepth.innerTop+2)*S)
    c.lineTo((gateX+dx)*S,(y+height-2)*S)
    c.stroke()
  }
  c.strokeStyle='rgba(222,184,121,.3)'
  c.lineWidth=.7*S
  c.beginPath()
  c.moveTo((gateX-gateDepth.gateHalf-2)*S,(y+gateDepth.thresholdY)*S)
  c.lineTo((gateX+gateDepth.gateHalf+2)*S,(y+gateDepth.thresholdY)*S)
  c.stroke()

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
    for(const dy of detail.gateStudYs){
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

export function duelArenaDetailGeometry(width=320,height=152){
  const w=Math.max(200,Number(width)||320)
  const h=Math.max(120,Number(height)||152)
  return Object.freeze({
    upperBeams:Object.freeze([
      Object.freeze({x1:w*.12,y1:30,x2:w*.42,y2:42}),
      Object.freeze({x1:w*.88,y1:30,x2:w*.58,y2:42}),
      Object.freeze({x1:w*.2,y1:51,x2:w*.8,y2:51}),
    ]),
    crowdRows:Object.freeze([
      Object.freeze({y:61,count:14,phase:0}),
      Object.freeze({y:74,count:16,phase:.5}),
      Object.freeze({y:86,count:13,phase:.2}),
    ]),
    ropeY:95,
    dust:Object.freeze([
      Object.freeze({x:w*.28,y:h-8,rx:30,ry:4,alpha:.08}),
      Object.freeze({x:w*.72,y:h-10,rx:34,ry:5,alpha:.07}),
    ]),
  })
}

export function duelArenaOrnamentGeometry(width=320){
  const w=Math.max(200,Number(width)||320)
  return Object.freeze({
    lanterns:Object.freeze([
      Object.freeze({x:w*.18,y:39,r:3.4}),
      Object.freeze({x:w*.82,y:39,r:3.4}),
    ]),
    pennants:Object.freeze([
      Object.freeze({x:w*.31,y:31,w:9,h:12}),
      Object.freeze({x:w*.5,y:27,w:10,h:14}),
      Object.freeze({x:w*.69,y:31,w:9,h:12}),
    ]),
  })
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

  const detail=duelArenaDetailGeometry(width,height)
  c.strokeStyle='rgba(51,36,28,.62)'
  c.lineWidth=2*S
  for(const beam of detail.upperBeams){
    c.beginPath()
    c.moveTo((x+beam.x1)*S,(y+beam.y1)*S)
    c.lineTo((x+beam.x2)*S,(y+beam.y2)*S)
    c.stroke()
  }

  const ornament=duelArenaOrnamentGeometry(width)
  for(const lantern of ornament.lanterns){
    c.strokeStyle='rgba(62,42,30,.8)'
    c.lineWidth=.4*S
    c.beginPath()
    c.moveTo((x+lantern.x)*S,(y+20)*S)
    c.lineTo((x+lantern.x)*S,(y+lantern.y-lantern.r)*S)
    c.stroke()
    const glow=c.createRadialGradient((x+lantern.x)*S,(y+lantern.y)*S,0,(x+lantern.x)*S,(y+lantern.y)*S,lantern.r*2.2*S)
    glow.addColorStop(0,'rgba(255,214,122,.32)')
    glow.addColorStop(1,'rgba(255,214,122,0)')
    c.fillStyle=glow
    c.beginPath()
    c.arc((x+lantern.x)*S,(y+lantern.y)*S,lantern.r*2.2*S,0,Math.PI*2)
    c.fill()
    c.fillStyle='#8d4931'
    c.fillRect((x+lantern.x-lantern.r*.7)*S,(y+lantern.y-lantern.r)*S,lantern.r*1.4*S,lantern.r*2*S)
    c.strokeStyle='rgba(246,198,108,.58)'
    c.lineWidth=.28*S
    c.strokeRect((x+lantern.x-lantern.r*.7)*S,(y+lantern.y-lantern.r)*S,lantern.r*1.4*S,lantern.r*2*S)
  }
  for(const pennant of ornament.pennants){
    c.fillStyle='rgba(105,47,37,.8)'
    c.beginPath()
    c.moveTo((x+pennant.x)*S,(y+pennant.y)*S)
    c.lineTo((x+pennant.x+pennant.w)*S,(y+pennant.y+2)*S)
    c.lineTo((x+pennant.x+pennant.w*.72)*S,(y+pennant.y+pennant.h)*S)
    c.lineTo((x+pennant.x)*S,(y+pennant.y+pennant.h-2)*S)
    c.closePath()
    c.fill()
  }

  for(const row of detail.crowdRows){
    const spacing=(width-54)/row.count
    for(let i=0;i<row.count;i++){
      const px=x+27+(i+row.phase)*spacing
      const py=y+row.y+((i%3)-1)*1.1
      c.fillStyle=i%4===0?'#3a2c26':'#46342b'
      c.beginPath()
      c.arc(px*S,py*S,2.1*S,0,Math.PI*2)
      c.fill()
      c.fillRect((px-1.5)*S,(py+1.5)*S,3*S,4.2*S)
    }
  }

  c.strokeStyle='rgba(91,64,42,.7)'
  c.lineWidth=.7*S
  c.beginPath()
  c.moveTo((x+12)*S,(y+detail.ropeY)*S)
  c.quadraticCurveTo((x+width/2)*S,(y+detail.ropeY+2)*S,(x+width-12)*S,(y+detail.ropeY)*S)
  c.stroke()

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

  for(const dust of detail.dust){
    c.fillStyle=`rgba(214,183,127,${dust.alpha})`
    c.beginPath()
    c.ellipse((x+dust.x)*S,(y+dust.y)*S,dust.rx*S,dust.ry*S,0,0,Math.PI*2)
    c.fill()
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


export function siegeStandardGeometry(width=290){
  const w=Math.max(160,Number(width)||290)
  return Object.freeze([
    Object.freeze({x:w*.15,y:91,flip:false}),
    Object.freeze({x:w*.85,y:91,flip:true}),
  ])
}

export function drawSiegeStandards(r,{
  x=15,
  y=48,
  width=290,
  attackerColor='#587cc7',
  defenderColor='#b75f52',
}={}){
  const c=r.ctx,S=r.S
  const standards=siegeStandardGeometry(width)
  const colors=[attackerColor,defenderColor]
  c.save()
  standards.forEach((standard,index)=>{
    const baseX=x+standard.x
    const baseY=y+standard.y
    const dir=standard.flip?-1:1

    c.strokeStyle='#3a261a'
    c.lineWidth=1.15*S
    c.beginPath()
    c.moveTo(baseX*S,(baseY+15)*S)
    c.lineTo(baseX*S,(baseY-23)*S)
    c.stroke()

    const cloth=c.createLinearGradient(baseX*S,(baseY-22)*S,(baseX+dir*15)*S,(baseY-12)*S)
    cloth.addColorStop(0,colors[index])
    cloth.addColorStop(1,'rgba(43,26,20,.92)')
    c.fillStyle=cloth
    c.beginPath()
    c.moveTo(baseX*S,(baseY-22)*S)
    c.quadraticCurveTo((baseX+dir*8)*S,(baseY-24)*S,(baseX+dir*16)*S,(baseY-18)*S)
    c.lineTo((baseX+dir*12)*S,(baseY-9)*S)
    c.quadraticCurveTo((baseX+dir*7)*S,(baseY-13)*S,baseX*S,(baseY-12)*S)
    c.closePath()
    c.fill()

    c.strokeStyle='rgba(255,229,177,.42)'
    c.lineWidth=.3*S
    c.stroke()

    c.fillStyle='rgba(35,22,16,.28)'
    c.beginPath()
    c.ellipse(baseX*S,(baseY+16)*S,9*S,2.5*S,0,0,Math.PI*2)
    c.fill()
  })
  c.restore()
  return true
}


export function duelMotionCueGeometry({
  attacking=false,
  guard=false,
}={}){
  return Object.freeze({
    attackArcs:attacking?Object.freeze([
      Object.freeze({r:23,start:-.58,end:.12}),
      Object.freeze({r:28,start:-.46,end:.2}),
    ]):Object.freeze([]),
    guardBraces:guard?Object.freeze([
      Object.freeze({x1:12,y1:-29,x2:19,y2:-20}),
      Object.freeze({x1:9,y1:-25,x2:17,y2:-15}),
    ]):Object.freeze([]),
    dust:attacking?Object.freeze([
      Object.freeze({x:-8,y:13,rx:7,ry:2.2,alpha:.1}),
      Object.freeze({x:6,y:13,rx:9,ry:2.6,alpha:.08}),
    ]):Object.freeze([]),
  })
}

export function drawDuelMotionCue(r,{
  x,
  y,
  flip=false,
  attacking=false,
  guard=false,
  color='#f0d28a',
}={}){
  if(!attacking&&!guard)return false
  const c=r.ctx,S=r.S
  const detail=duelMotionCueGeometry({attacking,guard})
  c.save()
  c.translate(x*S,y*S)
  c.scale(flip?-1:1,1)

  if(attacking){
    c.lineCap='round'
    detail.attackArcs.forEach((arc,index)=>{
      c.strokeStyle=index===0?'rgba(255,235,174,.48)':'rgba(255,255,236,.24)'
      c.lineWidth=(index===0?.72:.34)*S
      c.beginPath()
      c.arc(4*S,-10*S,arc.r*S,arc.start,arc.end)
      c.stroke()
    })
    for(const dust of detail.dust){
      c.fillStyle=`rgba(209,176,119,${dust.alpha})`
      c.beginPath()
      c.ellipse(dust.x*S,dust.y*S,dust.rx*S,dust.ry*S,0,0,Math.PI*2)
      c.fill()
    }
  }

  if(guard){
    c.strokeStyle=color
    c.lineWidth=.46*S
    for(const brace of detail.guardBraces){
      c.beginPath()
      c.moveTo(brace.x1*S,brace.y1*S)
      c.lineTo(brace.x2*S,brace.y2*S)
      c.stroke()
    }
    c.fillStyle='rgba(255,245,206,.74)'
    for(const [gx,gy] of [[18,-21],[15,-16]]){
      c.beginPath()
      c.arc(gx*S,gy*S,.7*S,0,Math.PI*2)
      c.fill()
    }
  }

  c.restore()
  return true
}


export function siegeForegroundGeometry(width=290,height=105){
  const w=Math.max(160,Number(width)||290)
  const h=Math.max(80,Number(height)||105)
  return Object.freeze({
    horizonY:h*.83,
    foregroundY:h*.96,
    stones:Object.freeze([
      Object.freeze({x:w*.12,y:h*.92,rx:4.2,ry:1.7}),
      Object.freeze({x:w*.31,y:h*.95,rx:3.1,ry:1.3}),
      Object.freeze({x:w*.67,y:h*.94,rx:3.8,ry:1.5}),
      Object.freeze({x:w*.88,y:h*.91,rx:4.5,ry:1.8}),
    ]),
    haze:Object.freeze([
      Object.freeze({x:w*.26,y:h*.86,rx:34,ry:5,alpha:.07}),
      Object.freeze({x:w*.72,y:h*.88,rx:42,ry:6,alpha:.06}),
    ]),
  })
}

export function drawSiegeForegroundDepth(r,{
  x=15,
  y=48,
  width=290,
  height=105,
}={}){
  const c=r.ctx,S=r.S
  const detail=siegeForegroundGeometry(width,height)
  c.save()

  const ground=c.createLinearGradient(0,(y+detail.horizonY)*S,0,(y+height+8)*S)
  ground.addColorStop(0,'rgba(92,66,43,.04)')
  ground.addColorStop(1,'rgba(41,27,19,.34)')
  c.fillStyle=ground
  c.fillRect(x*S,(y+detail.horizonY)*S,width*S,(height-detail.horizonY+8)*S)

  for(const haze of detail.haze){
    c.fillStyle=`rgba(221,191,136,${haze.alpha})`
    c.beginPath()
    c.ellipse((x+haze.x)*S,(y+haze.y)*S,haze.rx*S,haze.ry*S,0,0,Math.PI*2)
    c.fill()
  }

  c.fillStyle='rgba(53,37,25,.72)'
  for(const stone of detail.stones){
    c.beginPath()
    c.ellipse((x+stone.x)*S,(y+stone.y)*S,stone.rx*S,stone.ry*S,-.12,0,Math.PI*2)
    c.fill()
    c.strokeStyle='rgba(229,194,139,.2)'
    c.lineWidth=.22*S
    c.stroke()
  }

  c.restore()
  return true
}


export function duelHitSparkGeometry(intensity=1){
  const strength=Math.max(.2,Math.min(1,Number(intensity)||1))
  return Object.freeze({
    ringRadius:6+strength*5,
    ringAlpha:.18+strength*.22,
    rays:Object.freeze(Array.from({length:8},(_,index)=>{
      const angle=(Math.PI*2*index)/8
      const inner=3.5+strength*1.5
      const outer=9+strength*6+(index%2)*1.6
      return Object.freeze({
        x1:Math.cos(angle)*inner,
        y1:Math.sin(angle)*inner,
        x2:Math.cos(angle)*outer,
        y2:Math.sin(angle)*outer,
      })
    })),
  })
}

export function drawDuelHitSpark(r,{
  x,
  y,
  intensity=1,
  color='#fff1b8',
}={}){
  const c=r.ctx,S=r.S
  const detail=duelHitSparkGeometry(intensity)
  c.save()
  c.translate(x*S,y*S)

  c.strokeStyle=color
  c.lineCap='round'
  for(const [index,ray] of detail.rays.entries()){
    c.globalAlpha=index%2===0?.72:.42
    c.lineWidth=(index%2===0?.7:.38)*S
    c.beginPath()
    c.moveTo(ray.x1*S,ray.y1*S)
    c.lineTo(ray.x2*S,ray.y2*S)
    c.stroke()
  }

  c.globalAlpha=detail.ringAlpha
  c.lineWidth=.8*S
  c.beginPath()
  c.arc(0,0,detail.ringRadius*S,0,Math.PI*2)
  c.stroke()
  c.globalAlpha=1

  const glow=c.createRadialGradient(0,0,0,0,0,detail.ringRadius*S)
  glow.addColorStop(0,'rgba(255,248,210,.52)')
  glow.addColorStop(1,'rgba(255,226,160,0)')
  c.fillStyle=glow
  c.beginPath()
  c.arc(0,0,detail.ringRadius*S,0,Math.PI*2)
  c.fill()

  c.restore()
  return true
}
