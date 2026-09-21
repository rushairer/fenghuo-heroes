export const MAP_ART_PALETTE=Object.freeze({
  mountainDark:'#493126',
  mountainMid:'#6f4b33',
  mountainLight:'#b78352',
  mountainDust:'#d1a06a',
  forestDark:'#2e3f1c',
  forestMid:'#4d6b28',
  forestLight:'#78913c',
  trunk:'#493522',
  fortDark:'#2b1d15',
  fortStone:'#84684a',
  fortLight:'#c19a67',
  roof:'#59402d',
  villageWall:'#9a7751',
  villageRoof:'#5a3926',
})

export function mountainVariant(index=0){
  const i=Math.abs(Math.floor(Number(index)||0))
  return Object.freeze({
    mainHeight:15+(i%4),
    leftHeight:10+((i*3)%5),
    rightHeight:9+((i*5)%4),
    lean:(i%3)-1,
  })
}

export function forestLayout(index=0){
  const i=Math.abs(Math.floor(Number(index)||0))
  const phase=(i%5)-2
  return Object.freeze([
    Object.freeze({x:-7,y:1,size:3.4}),
    Object.freeze({x:-3,y:-3+phase*.25,size:4.4}),
    Object.freeze({x:2,y:-1,size:5.1}),
    Object.freeze({x:7,y:0-phase*.2,size:3.9}),
    Object.freeze({x:10,y:-3,size:2.7}),
    Object.freeze({x:-10,y:-2,size:2.5}),
  ])
}

function pathFill(ctx,points,S,fill){
  ctx.fillStyle=fill
  ctx.beginPath()
  points.forEach(([x,y],index)=>{
    if(index===0)ctx.moveTo(x*S,y*S)
    else ctx.lineTo(x*S,y*S)
  })
  ctx.closePath()
  ctx.fill()
}

export function drawVectorMountain(r,x,y,index=0,scale=1){
  const c=r.ctx,S=r.S*scale,v=mountainVariant(index)
  c.save()
  c.translate(x*r.S,y*r.S)
  c.lineJoin='round'

  const peak=(dx,base,width,height)=>{
    const lean=v.lean*.7
    pathFill(c,[
      [dx-width/2,base],
      [dx+lean,base-height],
      [dx+width/2,base],
    ],S,MAP_ART_PALETTE.mountainDark)
    pathFill(c,[
      [dx+lean,base-height],
      [dx+width*.08,base-height*.48],
      [dx+width*.38,base],
      [dx+width*.06,base-height*.18],
    ],S,MAP_ART_PALETTE.mountainLight)
    c.strokeStyle=MAP_ART_PALETTE.mountainMid
    c.lineWidth=.45*S
    c.beginPath()
    c.moveTo((dx-width*.35)*S,(base-height*.18)*S)
    c.quadraticCurveTo((dx-width*.08)*S,(base-height*.46)*S,(dx+lean)*S,(base-height)*S)
    c.stroke()
  }

  peak(-6,6,12,v.leftHeight)
  peak(2,7,17,v.mainHeight)
  peak(10,6,11,v.rightHeight)

  c.globalAlpha=.5
  c.fillStyle=MAP_ART_PALETTE.mountainDust
  c.beginPath()
  c.ellipse(2*S,6.4*S,13*S,1.6*S,0,0,Math.PI*2)
  c.fill()
  c.restore()
  return true
}

export function drawVectorForest(r,x,y,index=0,scale=1){
  const c=r.ctx,S=r.S*scale
  c.save()
  c.translate(x*r.S,y*r.S)
  for(const tree of forestLayout(index)){
    c.fillStyle=MAP_ART_PALETTE.trunk
    c.fillRect((tree.x-.55)*S,(tree.y+tree.size*.45)*S,1.1*S,3.2*S)

    c.fillStyle=MAP_ART_PALETTE.forestDark
    c.beginPath()
    c.arc(tree.x*S,(tree.y+.8)*S,tree.size*S,0,Math.PI*2)
    c.fill()

    c.fillStyle=MAP_ART_PALETTE.forestMid
    c.beginPath()
    c.arc((tree.x-.8)*S,(tree.y-.5)*S,(tree.size*.72)*S,0,Math.PI*2)
    c.fill()

    c.fillStyle=MAP_ART_PALETTE.forestLight
    c.globalAlpha=.72
    c.beginPath()
    c.arc((tree.x-1.5)*S,(tree.y-1.5)*S,(tree.size*.3)*S,0,Math.PI*2)
    c.fill()
    c.globalAlpha=1
  }
  c.restore()
  return true
}

export function fortDetailGeometry(){
  return Object.freeze({
    stoneRows:Object.freeze([-5.4,-2.1,1.2,4.2]),
    verticalJoints:Object.freeze([
      Object.freeze({x:-5.2,y1:-5.4,y2:-2.1}),
      Object.freeze({x:3.8,y1:-5.4,y2:-2.1}),
      Object.freeze({x:-2.4,y1:-2.1,y2:1.2}),
      Object.freeze({x:5.1,y1:-2.1,y2:1.2}),
      Object.freeze({x:-6.1,y1:1.2,y2:4.2}),
      Object.freeze({x:4.6,y1:1.2,y2:4.2}),
    ]),
    roofRidges:Object.freeze([-5.5,0,5.5]),
  })
}

export function flagFoldGuides(){
  return Object.freeze([
    Object.freeze({x1:3.2,y1:-7.2,x2:10.2,y2:-5.9}),
    Object.freeze({x1:3.5,y1:-5.9,x2:9.4,y2:-4.2}),
  ])
}

export function drawVectorFort(r,x,y,color='#888',scale=1){
  const c=r.ctx,S=r.S*scale
  c.save()
  c.translate(x*r.S,y*r.S)

  c.fillStyle=MAP_ART_PALETTE.fortDark
  c.fillRect(-9*S,-3*S,18*S,9*S)

  c.fillStyle=MAP_ART_PALETTE.fortStone
  c.fillRect(-7*S,-7*S,14*S,5*S)
  c.fillRect(-8*S,-9*S,4*S,3*S)
  c.fillRect(-2*S,-10*S,4*S,4*S)
  c.fillRect(4*S,-9*S,4*S,3*S)

  c.fillStyle=MAP_ART_PALETTE.fortLight
  c.fillRect(-5.8*S,-6*S,11.6*S,1.4*S)

  c.fillStyle='#21150f'
  c.fillRect(-2*S,1*S,4*S,5*S)

  c.strokeStyle='#1d130e'
  c.lineWidth=.55*S
  c.strokeRect(-9*S,-9*S,18*S,15*S)

  const detail=fortDetailGeometry()
  c.strokeStyle='rgba(50,34,25,.48)'
  c.lineWidth=.28*S
  for(const yRow of detail.stoneRows){
    c.beginPath()
    c.moveTo(-8.2*S,yRow*S)
    c.lineTo(8.2*S,yRow*S)
    c.stroke()
  }
  for(const joint of detail.verticalJoints){
    c.beginPath()
    c.moveTo(joint.x*S,joint.y1*S)
    c.lineTo(joint.x*S,joint.y2*S)
    c.stroke()
  }
  c.strokeStyle='rgba(236,204,151,.55)'
  c.lineWidth=.3*S
  for(const ridge of detail.roofRidges){
    c.beginPath()
    c.moveTo((ridge-1.6)*S,-8.3*S)
    c.lineTo(ridge*S,-9.7*S)
    c.lineTo((ridge+1.6)*S,-8.3*S)
    c.stroke()
  }

  c.fillStyle='#2b1a13'
  c.fillRect(4*S,-16*S,1.1*S,9*S)
  c.fillStyle=color
  c.beginPath()
  c.moveTo(5*S,-16*S)
  c.quadraticCurveTo(11*S,-15*S,13*S,-13*S)
  c.lineTo(11*S,-9*S)
  c.quadraticCurveTo(8*S,-11*S,5*S,-10.5*S)
  c.closePath()
  c.fill()
  c.restore()
  return true
}

export function drawVectorVillage(r,x,y,scale=1){
  const c=r.ctx,S=r.S*scale
  c.save()
  c.translate(x*r.S,y*r.S)

  const house=(dx,dy,w,h)=>{
    c.fillStyle=MAP_ART_PALETTE.villageWall
    c.fillRect((dx-w/2)*S,dy*S,w*S,h*S)
    c.fillStyle=MAP_ART_PALETTE.villageRoof
    c.beginPath()
    c.moveTo((dx-w*.65)*S,dy*S)
    c.lineTo(dx*S,(dy-4)*S)
    c.lineTo((dx+w*.65)*S,dy*S)
    c.closePath()
    c.fill()
  }
  house(-5,0,7,5)
  house(4,-2,8,6)
  house(0,5,6,4)
  c.restore()
  return true
}


export function flagGeometry({
  width=16,
  height=16,
  selected=false,
  starving=false,
}={}){
  const w=Math.max(8,Number(width)||16)
  const h=Math.max(8,Number(height)||16)
  return Object.freeze({
    poleX:1,
    poleTop:-h*.48,
    poleBottom:h*.3,
    flagRight:w*.48,
    flagTop:-h*.45,
    flagBottom:-h*.08,
    border:selected||starving,
  })
}

export function drawVectorFlag(r,x,y,color,{
  selected=false,
  starving=false,
  scale=1,
}={}){
  const c=r.ctx,S=r.S*scale
  const g=flagGeometry({selected,starving})
  c.save()
  c.translate(x*r.S,y*r.S)

  c.fillStyle='rgba(24,15,10,.34)'
  c.beginPath()
  c.ellipse(1*S,5*S,7*S,2.2*S,0,0,Math.PI*2)
  c.fill()

  c.strokeStyle='#3a2418'
  c.lineWidth=1.1*S
  c.beginPath()
  c.moveTo(g.poleX*S,g.poleTop*S)
  c.lineTo(g.poleX*S,g.poleBottom*S)
  c.stroke()

  const cloth=c.createLinearGradient(2*S,-8*S,g.flagRight*S,-2*S)
  cloth.addColorStop(0,color)
  cloth.addColorStop(1,'rgba(38,24,18,.92)')
  c.fillStyle=cloth
  c.beginPath()
  c.moveTo(2*S,g.flagTop*S)
  c.quadraticCurveTo(7*S,-8*S,g.flagRight*S,-6*S)
  c.lineTo((g.flagRight-1.5)*S,g.flagBottom*S)
  c.quadraticCurveTo(7*S,-5*S,2*S,-5.5*S)
  c.closePath()
  c.fill()

  c.strokeStyle=starving?'#ff765f':selected?'#4ee8f0':'rgba(28,18,13,.72)'
  c.lineWidth=(starving||selected?1.05:.45)*S
  c.stroke()

  c.strokeStyle='rgba(255,236,190,.36)'
  c.lineWidth=.28*S
  for(const fold of flagFoldGuides()){
    c.beginPath()
    c.moveTo(fold.x1*S,fold.y1*S)
    c.quadraticCurveTo(((fold.x1+fold.x2)/2+.7)*S,((fold.y1+fold.y2)/2-.35)*S,fold.x2*S,fold.y2*S)
    c.stroke()
  }

  if(starving){
    c.fillStyle='#ffd08a'
    c.beginPath()
    c.arc(-3*S,-5*S,2.2*S,0,Math.PI*2)
    c.fill()
  }

  c.restore()
  return true
}

export function fullMapCitySymbolGeometry(size=4){
  const s=Math.max(2,Number(size)||4)
  return Object.freeze({
    outer:s,
    inner:s*.58,
    flagHeight:s*1.9,
  })
}

export function drawFullMapCitySymbol(r,x,y,color,size=4){
  const c=r.ctx,S=r.S,g=fullMapCitySymbolGeometry(size)
  c.save()
  c.translate(x*S,y*S)
  c.fillStyle='#20150f'
  c.beginPath()
  c.arc(0,0,g.outer*S/2,0,Math.PI*2)
  c.fill()
  c.fillStyle=color
  c.beginPath()
  c.arc(0,0,g.inner*S/2,0,Math.PI*2)
  c.fill()
  c.strokeStyle='rgba(255,229,177,.48)'
  c.lineWidth=.35*S
  c.stroke()
  c.restore()
  return true
}

export function drawMapCursor(r,x,y,{
  width=16,
  height=12,
  color='#fff5a4',
  inner='#24180e',
  scale=1,
}={}){
  const c=r.ctx,S=r.S*scale
  c.save()
  c.translate(x*r.S,y*r.S)
  c.strokeStyle=color
  c.lineWidth=1.15*S
  c.beginPath()
  const w=width/2,h=height/2,corner=Math.min(3,w*.35,h*.5)
  c.moveTo(-w+corner,-h)
  c.lineTo(w-corner,-h)
  c.lineTo(w,-h+corner)
  c.lineTo(w,h-corner)
  c.lineTo(w-corner,h)
  c.lineTo(-w+corner,h)
  c.lineTo(-w,h-corner)
  c.lineTo(-w,-h+corner)
  c.closePath()
  c.stroke()
  c.strokeStyle=inner
  c.lineWidth=.42*S
  c.strokeRect((-w+2)*S,(-h+2)*S,(width-4)*S,(height-4)*S)
  c.restore()
  return true
}


export function fullMapVillageSymbolGeometry(size=3.6){
  const s=Math.max(2,Number(size)||3.6)
  return Object.freeze({
    roof:s,
    body:s*.72,
    door:s*.2,
  })
}

export function drawFullMapVillageSymbol(r,x,y,size=3.6){
  const c=r.ctx,S=r.S,g=fullMapVillageSymbolGeometry(size)
  c.save()
  c.translate(x*S,y*S)
  c.fillStyle='#281a12'
  c.beginPath()
  c.moveTo(-g.roof*.62*S,0)
  c.lineTo(0,-g.roof*.72*S)
  c.lineTo(g.roof*.62*S,0)
  c.closePath()
  c.fill()
  c.fillStyle=MAP_ART_PALETTE.villageWall
  c.fillRect(-g.body*.5*S,0,g.body*S,g.body*.72*S)
  c.fillStyle='#3a281c'
  c.fillRect(-g.door*.5*S,g.body*.3*S,g.door*S,g.body*.42*S)
  c.restore()
  return true
}
