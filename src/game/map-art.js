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
