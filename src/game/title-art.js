// Clean-room title artwork inspired only by the observed composition of the
// original Mega Drive title screen. It deliberately redraws the five-warrior
// arrangement with new vector geometry instead of copying ROM pixels.

function path(ctx, S, points, fill, stroke = '#32120f', lineWidth = 0.9) {
  ctx.beginPath()
  points.forEach(([x, y], index) => index ? ctx.lineTo(x * S, y * S) : ctx.moveTo(x * S, y * S))
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lineWidth * S
    ctx.stroke()
  }
}

function ellipse(ctx, S, x, y, rx, ry, fill, stroke = '#32120f', width = 0.8, rotation = 0) {
  ctx.beginPath()
  ctx.ellipse(x * S, y * S, rx * S, ry * S, rotation, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = width * S
    ctx.stroke()
  }
}

function line(ctx, S, x1, y1, x2, y2, color = '#3a1712', width = 1) {
  ctx.strokeStyle = color
  ctx.lineWidth = width * S
  ctx.beginPath()
  ctx.moveTo(x1 * S, y1 * S)
  ctx.lineTo(x2 * S, y2 * S)
  ctx.stroke()
}

function faceDetails(ctx, S, { x, y, scale = 1, flip = false, beard = 'short', brow = 0 }) {
  ctx.save()
  ctx.translate(x * S, y * S)
  ctx.scale(flip ? -scale : scale, scale)

  // eyes / brows
  line(ctx, S, -8, -4 - brow, -1, -5, '#2a110e', 1.3)
  line(ctx, S, 3, -5, 9, -4 - brow, '#2a110e', 1.3)
  ellipse(ctx, S, -4, -2.5, 1.1, .75, '#15100e', null)
  ellipse(ctx, S, 5.5, -2.5, 1.1, .75, '#15100e', null)

  // nose / mouth
  line(ctx, S, 1, -1, 0, 6, '#783e30', .8)
  line(ctx, S, -3, 8, 5, 8, '#4a1b17', .9)

  if (beard === 'goatee') {
    path(ctx, S, [[-2,8],[5,8],[7,20],[2,27],[-2,18]], '#2b1713', null)
    path(ctx, S, [[-6,6],[-1,8],[-4,15],[-10,11]], '#2b1713', null)
    path(ctx, S, [[6,7],[10,5],[13,11],[7,15]], '#2b1713', null)
  } else if (beard === 'long') {
    path(ctx, S, [[-8,7],[9,7],[12,18],[8,38],[1,51],[-6,39],[-10,18]], '#241411', null)
    line(ctx, S, -3, 11, -1, 42, '#4d2d22', .7)
    line(ctx, S, 3, 11, 4, 43, '#4d2d22', .7)
  } else if (beard === 'full') {
    path(ctx, S, [[-12,3],[13,3],[16,13],[10,25],[1,30],[-10,23],[-16,12]], '#281713', null)
    line(ctx, S, -8, 8, -3, 24, '#503024', .8)
    line(ctx, S, 6, 7, 3, 26, '#503024', .8)
  } else {
    path(ctx, S, [[-7,8],[8,8],[6,17],[1,21],[-5,17]], '#2d1814', null)
  }

  ctx.restore()
}

function drawRearGeneral(r) {
  const c = r.ctx, S = r.S
  // broad ceremonial hat and shoulder silhouette behind the center figures
  path(c, S, [[56,10],[111,8],[127,32],[119,75],[69,78],[48,45]], '#5a1716', '#34100f', 1.2)
  path(c, S, [[50,11],[120,10],[132,19],[123,27],[47,27],[39,20]], '#7d2a1f', '#34100f', 1)
  path(c, S, [[66,29],[105,28],[112,73],[58,75]], '#e3a36f', '#632d24', .9)
  path(c, S, [[68,31],[103,30],[98,66],[62,68]], '#c78058', null)
  // barely visible stern face
  line(c, S, 76,48,84,47,'#421913',1.2)
  line(c, S, 91,47,99,48,'#421913',1.2)
  line(c, S, 88,50,86,59,'#7b4030',.8)
}

function drawLeftWarlord(r) {
  const c = r.ctx, S = r.S
  // huge foreground left profile
  path(c, S, [[0,54],[36,42],[69,48],[81,79],[75,126],[59,168],[34,206],[0,213]], '#e0a16e', '#4a1c17', 1.15)
  path(c, S, [[0,53],[32,42],[58,47],[70,59],[48,61],[26,57],[0,70]], '#2e1714', null)
  // ear / cheek shadow
  ellipse(c, S, 55,111,8,13,'#c77b57','#6d3025',.7)
  path(c, S, [[39,117],[67,112],[73,134],[59,164],[42,173],[32,151]], '#ca8058', null)
  // eye + brow + moustache in profile
  line(c, S, 22,87,43,83,'#351411',1.7)
  ellipse(c, S, 35,88,2,1,'#17100f',null)
  line(c, S, 49,95,60,107,'#8b4b35',1)
  path(c, S, [[43,122],[65,119],[72,128],[54,132],[38,129]], '#291512', null)
  path(c, S, [[52,128],[68,130],[64,151],[55,164],[47,147]], '#2a1613', null)
  // robe collar
  path(c, S, [[0,184],[34,166],[61,177],[78,224],[0,224]], '#361715', '#210d0c', 1)
  path(c, S, [[33,174],[48,183],[37,224],[22,224]], '#8d2e22', null)
}

function drawCenterGeneral(r) {
  const c = r.ctx, S = r.S
  // central head-wrap general with very long beard
  path(c, S, [[88,62],[130,54],[155,72],[154,121],[137,143],[104,139],[87,112]], '#db9c70', '#4b1e18', 1)
  path(c, S, [[87,61],[134,53],[157,66],[155,75],[91,76],[81,69]], '#ede0b9', '#5b2b20', .9)
  path(c, S, [[85,71],[92,62],[96,85],[88,98]], '#e6d2a9', '#5b2b20', .7)
  path(c, S, [[150,70],[159,64],[158,97],[151,105]], '#e6d2a9', '#5b2b20', .7)
  faceDetails(c, S, {x:121,y:94,scale:1.02,beard:'long',brow:1})
  path(c, S, [[80,139],[104,128],[139,132],[164,148],[176,224],[65,224]], '#601d1c', '#301111', 1)
  path(c, S, [[101,139],[130,138],[143,224],[90,224]], '#aa3d2e', null)
}

function drawTopRightGeneral(r) {
  const c = r.ctx, S = r.S
  // upper-right profile, lifted chin / broad beard
  path(c, S, [[166,32],[203,21],[237,30],[258,53],[253,82],[229,105],[194,101],[171,77]], '#cd8b60', '#491b17', 1)
  path(c, S, [[164,33],[187,16],[222,17],[239,31],[224,36],[188,35]], '#2a1714', null)
  path(c, S, [[179,22],[222,17],[231,26],[185,31]], '#a44530', '#421813', .8)
  ellipse(c, S, 233,57,7,11,'#b96f4e','#5f2a20',.6)
  faceDetails(c, S, {x:211,y:58,scale:.92,flip:false,beard:'full',brow:-1})
  path(c, S, [[169,89],[197,91],[228,100],[259,121],[270,163],[182,157]], '#32181a', '#1f0e0f', 1)
  path(c, S, [[204,96],[229,102],[247,146],[218,138]], '#73251f', null)
}

function drawFrontRightGeneral(r) {
  const c = r.ctx, S = r.S
  // largest foreground face; strong diagonal overlap like the original poster
  path(c, S, [[172,109],[215,91],[274,100],[320,129],[320,224],[177,224],[158,170]], '#e1a374', '#4c1d17', 1.1)
  // scholar/court cap
  path(c, S, [[182,108],[222,86],[277,94],[293,108],[270,119],[204,118]], '#5d211b', '#32100f', 1)
  path(c, S, [[190,99],[212,83],[268,88],[283,97],[274,105],[200,108]], '#9b4936', null)
  // face shadows / strong brows
  path(c, S, [[172,137],[207,121],[260,126],[286,158],[270,197],[230,216],[187,191]], '#d38c62', null)
  line(c, S, 196,143,218,139,'#321311',1.7)
  line(c, S, 240,139,261,143,'#321311',1.7)
  ellipse(c, S, 210,145,2,1,'#16100e',null)
  ellipse(c, S, 249,145,2,1,'#16100e',null)
  line(c, S, 229,149,226,164,'#804333',1)
  line(c, S, 217,174,242,174,'#4c1a16',1)
  // moustache and narrow goatee
  path(c, S, [[213,169],[228,172],[221,181],[207,177]], '#251411', null)
  path(c, S, [[240,171],[255,168],[259,176],[244,181]], '#251411', null)
  path(c, S, [[226,177],[242,177],[241,203],[234,220],[228,201]], '#261411', null)
  // robe shoulder foreground
  path(c, S, [[161,194],[188,184],[228,210],[260,195],[320,182],[320,224],[159,224]], '#35171a', '#210d0f', 1)
  path(c, S, [[181,194],[208,207],[196,224],[171,224]], '#842b23', null)
}

function drawBrocadeStrip(r) {
  const c=r.ctx, S=r.S
  c.fillStyle='#211317';c.fillRect(306*S,0,14*S,224*S)
  const gold=c.createLinearGradient(307*S,0,309*S,0)
  gold.addColorStop(0,'#6f4515')
  gold.addColorStop(.45,'#e5b84d')
  gold.addColorStop(1,'#8a5b1e')
  c.fillStyle=gold;c.fillRect(307*S,0,2*S,224*S)
  const blue=c.createLinearGradient(310*S,0,317*S,0)
  blue.addColorStop(0,'#0d245d')
  blue.addColorStop(.5,'#1f4cab')
  blue.addColorStop(1,'#102765')
  c.fillStyle=blue;c.fillRect(310*S,0,7*S,224*S)
  c.strokeStyle='#e6b243';c.lineWidth=.72*S
  for(let y=-8;y<232;y+=16){
    c.beginPath();c.moveTo(310*S,(y+8)*S);c.lineTo(313.5*S,(y+2)*S);c.lineTo(317*S,(y+8)*S);c.lineTo(313.5*S,(y+14)*S);c.closePath();c.stroke()
    c.fillStyle='#d4a13b'
    c.beginPath();c.arc(313.5*S,(y+8)*S,.72*S,0,Math.PI*2);c.fill()
    c.strokeStyle='rgba(245,213,124,.55)'
    c.lineWidth=.28*S
    c.beginPath();c.moveTo(311*S,(y+8)*S);c.lineTo(316*S,(y+8)*S);c.stroke()
    c.strokeStyle='#e6b243';c.lineWidth=.72*S
  }
  c.fillStyle='#6d171b';c.fillRect(318*S,0,2*S,224*S)
  c.fillStyle='rgba(255,221,139,.22)';c.fillRect(308.6*S,0,.35*S,224*S)
}

export function drawTitleComposition(r) {
  const c=r.ctx, S=r.S
  const gradient=c.createLinearGradient(0,0,0,224*S)
  gradient.addColorStop(0,'#d4767d')
  gradient.addColorStop(.56,'#c66d73')
  gradient.addColorStop(1,'#b65c65')
  c.fillStyle=gradient
  c.fillRect(0,0,320*S,224*S)

  // Fine horizontal weave visible in archived captures. Keep it geometric so
  // the detail remains crisp at 6–10× instead of baking another low-res raster.
  c.save()
  for(let y=4;y<224;y+=2){
    const strong=y%6===0
    c.globalAlpha=strong?.105:.052
    c.strokeStyle=strong?'#f5b7b6':'#8f4650'
    c.lineWidth=(strong?.28:.18)*S
    c.beginPath();c.moveTo(0,y*S);c.lineTo(306*S,y*S);c.stroke()
  }
  c.restore()

  drawRearGeneral(r)
  drawTopRightGeneral(r)
  drawCenterGeneral(r)
  drawLeftWarlord(r)
  drawFrontRightGeneral(r)
  drawBrocadeStrip(r)
}
