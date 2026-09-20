import { COLORS, FONT, HD_H, HD_MAX_SCALE, HD_SCALE, HD_W, LOGICAL_H, LOGICAL_W, SERIF } from './constants.js'

export function renderScaleFor({
  cssWidth = LOGICAL_W,
  cssHeight = LOGICAL_H,
  dpr = 1,
  minScale = HD_SCALE,
  maxScale = HD_MAX_SCALE,
} = {}) {
  const min = Math.max(1, Math.floor(Number(minScale) || HD_SCALE))
  const max = Math.max(min, Math.floor(Number(maxScale) || HD_MAX_SCALE))
  const width = Number(cssWidth)
  const height = Number(cssHeight)
  const density = Number(dpr)
  const cssScale = Math.max(
    Number.isFinite(width) && width > 0 ? width / LOGICAL_W : 1,
    Number.isFinite(height) && height > 0 ? height / LOGICAL_H : 1,
  )
  const safeDpr = Number.isFinite(density) && density > 0 ? Math.min(3, Math.max(1, density)) : 1
  return Math.max(min, Math.min(max, Math.ceil(cssScale * safeDpr)))
}

export function makeRenderer(canvas) {
  let S = HD_SCALE
  let pixelW = HD_W
  let pixelH = HD_H
  canvas.width = pixelW
  canvas.height = pixelH

  const ctx = canvas.getContext('2d', { alpha:false })

  function resetContextQuality() {
    ctx.imageSmoothingEnabled = true
    if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'
  }

  resetContextQuality()

  function applyScale(scale) {
    const next = Math.max(1, Math.min(HD_MAX_SCALE, Math.round(Number(scale) || HD_SCALE)))
    const nextW = LOGICAL_W * next
    const nextH = LOGICAL_H * next
    if (next === S && canvas.width === nextW && canvas.height === nextH) return false
    S = next
    pixelW = nextW
    pixelH = nextH
    canvas.width = pixelW
    canvas.height = pixelH
    resetContextQuality()
    return true
  }

  function syncResolution({
    cssWidth = canvas.clientWidth,
    cssHeight = canvas.clientHeight,
    dpr = globalThis.devicePixelRatio ?? 1,
    pixelPreview = false,
  } = {}) {
    if (pixelPreview) return applyScale(1)
    return applyScale(renderScaleFor({ cssWidth, cssHeight, dpr }))
  }

  const X=(v)=>Math.round(v*S), Y=(v)=>Math.round(v*S)

  function clear(color=COLORS.black){ ctx.fillStyle=color; ctx.fillRect(0,0,pixelW,pixelH) }
  function fillRect(x,y,w,h,color){ ctx.fillStyle=color; ctx.fillRect(X(x),Y(y),X(w),Y(h)) }
  function strokeRect(x,y,w,h,color=COLORS.gold,width=1){ ctx.strokeStyle=color; ctx.lineWidth=Math.max(1,X(width)); ctx.strokeRect(X(x)+ctx.lineWidth/2,Y(y)+ctx.lineWidth/2,X(w)-ctx.lineWidth,Y(h)-ctx.lineWidth) }
  function line(x1,y1,x2,y2,color=COLORS.gold,width=1,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=Math.max(1,X(width));ctx.beginPath();ctx.moveTo(X(x1),Y(y1));ctx.lineTo(X(x2),Y(y2));ctx.stroke();ctx.restore()}
  function text(value,x,y,size=8,color=COLORS.white,align='left',baseline='top',family=FONT,weight='500'){ctx.font=`${weight} ${Math.round(size*S)}px ${family}`;ctx.textAlign=align;ctx.textBaseline=baseline;ctx.fillStyle=color;ctx.fillText(String(value),X(x),Y(y))}
  function shadowText(value,x,y,size=8,color=COLORS.white,align='left',baseline='top',family=SERIF,weight='700'){text(value,x+.75,y+.75,size,'#000',align,baseline,family,weight);text(value,x,y,size,color,align,baseline,family,weight)}
  function imageSize(image){return {w:image?.naturalWidth??image?.width??0,h:image?.naturalHeight??image?.height??0}}
  function drawImageStretch(image,x,y,w,h,alpha=1,flipX=false){
    const size=imageSize(image)
    if(!size.w||!size.h)return false
    const dx=X(x),dy=Y(y),dw=X(w),dh=Y(h)
    ctx.save()
    ctx.globalAlpha=alpha
    ctx.imageSmoothingEnabled=true
    if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high'
    if(flipX){
      ctx.translate(dx+dw,dy)
      ctx.scale(-1,1)
      ctx.drawImage(image,0,0,dw,dh)
    }else{
      ctx.drawImage(image,dx,dy,dw,dh)
    }
    ctx.restore()
    return true
  }
  function drawImageCentered(image,cx,cy,w,h,alpha=1,flipX=false){return drawImageStretch(image,cx-w/2,cy-h/2,w,h,alpha,flipX)}
  function drawImageCover(image,x=0,y=0,w=LOGICAL_W,h=LOGICAL_H,alpha=1){
    const {w:iw,h:ih}=imageSize(image)
    if(!iw||!ih)return false
    const targetW=X(w),targetH=Y(h),targetRatio=targetW/targetH,imageRatio=iw/ih
    let sx=0,sy=0,sw=iw,sh=ih
    if(imageRatio>targetRatio){sw=ih*targetRatio;sx=(iw-sw)/2}else{sh=iw/targetRatio;sy=(ih-sh)/2}
    ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high';ctx.drawImage(image,sx,sy,sw,sh,X(x),Y(y),targetW,targetH);ctx.restore();return true
  }
  function drawImageTiled(image,x,y,w,h,tileW=64,tileH=64,worldOffsetX=0,worldOffsetY=0,alpha=1){
    const {w:iw,h:ih}=imageSize(image)
    if(!iw||!ih||tileW<=0||tileH<=0)return false
    const mod=(value,base)=>((value%base)+base)%base
    const firstX=x-mod(worldOffsetX,tileW)
    const firstY=y-mod(worldOffsetY,tileH)
    ctx.save()
    ctx.globalAlpha=alpha
    ctx.imageSmoothingEnabled=true
    if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high'
    ctx.beginPath();ctx.rect(X(x),Y(y),X(w),Y(h));ctx.clip()
    for(let yy=firstY;yy<y+h;yy+=tileH){
      for(let xx=firstX;xx<x+w;xx+=tileW){
        ctx.drawImage(image,0,0,iw,ih,X(xx),Y(yy),X(tileW),Y(tileH))
      }
    }
    ctx.restore()
    return true
  }
  function drawNineSlice(image,x,y,w,h,sourceSlice=32,destEdge=6,alpha=1){
    const {w:iw,h:ih}=imageSize(image)
    if(!iw||!ih)return false
    const s=Math.max(1,Math.min(sourceSlice,Math.floor(iw/3),Math.floor(ih/3)))
    const dx=X(x),dy=Y(y),dw=X(w),dh=Y(h)
    const e=Math.max(1,Math.min(X(destEdge),Math.floor(dw/3),Math.floor(dh/3)))
    const sx=[0,s,iw-s], sy=[0,s,ih-s], sw=[s,iw-2*s,s], sh=[s,ih-2*s,s]
    const tx=[dx,dx+e,dx+dw-e], ty=[dy,dy+e,dy+dh-e], tw=[e,dw-2*e,e], th=[e,dh-2*e,e]
    ctx.save();ctx.globalAlpha=alpha;ctx.imageSmoothingEnabled=true;if('imageSmoothingQuality' in ctx)ctx.imageSmoothingQuality='high'
    for(let row=0;row<3;row++)for(let col=0;col<3;col++)ctx.drawImage(image,sx[col],sy[row],sw[col],sh[row],tx[col],ty[row],tw[col],th[row])
    ctx.restore();return true
  }
  function panel(x,y,w,h,fill=COLORS.panel,border=COLORS.gold2,image=null){if(image&&drawNineSlice(image,x,y,w,h))return true;fillRect(x,y,w,h,fill);strokeRect(x,y,w,h,border,1);strokeRect(x+2,y+2,w-4,h-4,'#3a2408',.5);return false}
  function ornateFrame(x,y,w,h,image=null){if(image&&drawNineSlice(image,x,y,w,h,32,7))return true;fillRect(x,y,w,h,COLORS.black);strokeRect(x,y,w,h,COLORS.gold,2);strokeRect(x+3,y+3,w-6,h-6,COLORS.red,3);strokeRect(x+6,y+6,w-12,h-12,COLORS.gold2,1);ctx.save();ctx.strokeStyle=COLORS.gold;ctx.lineWidth=X(.75);const step=10;for(let xx=x+8;xx<x+w-8;xx+=step){ctx.beginPath();ctx.moveTo(X(xx),Y(y+4));ctx.quadraticCurveTo(X(xx+2.5),Y(y+1.4),X(xx+5),Y(y+4));ctx.quadraticCurveTo(X(xx+7.5),Y(y+6.6),X(xx+10),Y(y+4));ctx.stroke();ctx.beginPath();ctx.moveTo(X(xx),Y(y+h-4));ctx.quadraticCurveTo(X(xx+2.5),Y(y+h-6.6),X(xx+5),Y(y+h-4));ctx.quadraticCurveTo(X(xx+7.5),Y(y+h-1.4),X(xx+10),Y(y+h-4));ctx.stroke()}ctx.restore();return false}
  function selector(x,y,w,h,active=true){strokeRect(x,y,w,h,active?COLORS.cyan:COLORS.gold2,active?1.5:1)}
  function wrapText(value,x,y,maxWidth,lineHeight=10,size=8,color=COLORS.white,align='left',family=FONT){const chars=[...String(value)];let lineText='';let yy=y;ctx.font=`500 ${Math.round(size*S)}px ${family}`;for(const ch of chars){const next=lineText+ch;if(ctx.measureText(next).width>X(maxWidth)&&lineText){text(lineText,x,yy,size,color,align,'top',family);lineText=ch;yy+=lineHeight}else lineText=next}if(lineText)text(lineText,x,yy,size,color,align,'top',family)}
  function scanlines(alpha=.035){const step=Math.max(2,X(2)),height=Math.max(1,Math.round(S*.5));ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#000';for(let y=step-height;y<pixelH;y+=step)ctx.fillRect(0,y,pixelW,height);ctx.restore()}
  function portraitBust(cx,baseY,scale,tone,flip=false,kind=0){ctx.save();ctx.translate(X(cx),Y(baseY));ctx.scale(flip?-1:1,1);const s=S*scale;ctx.fillStyle=tone;ctx.strokeStyle='#1b0a07';ctx.lineWidth=Math.max(2,s*.7);ctx.beginPath();ctx.ellipse(0,-30*s/S,17*s/S,22*s/S,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#22130c';ctx.beginPath();ctx.moveTo(-17*s/S,-42*s/S);ctx.quadraticCurveTo(0,-58*s/S,19*s/S,-40*s/S);ctx.lineTo(15*s/S,-34*s/S);ctx.quadraticCurveTo(0,-45*s/S,-16*s/S,-34*s/S);ctx.closePath();ctx.fill();if(kind%2===0){ctx.fillStyle='#23120d';ctx.beginPath();ctx.moveTo(-10*s/S,-15*s/S);ctx.quadraticCurveTo(0,8*s/S,11*s/S,-15*s/S);ctx.quadraticCurveTo(7*s/S,18*s/S,0,28*s/S);ctx.quadraticCurveTo(-7*s/S,18*s/S,-10*s/S,-15*s/S);ctx.fill()}ctx.fillStyle=kind%3===0?'#5f1914':'#2f2730';ctx.beginPath();ctx.moveTo(-24*s/S,-7*s/S);ctx.lineTo(24*s/S,-7*s/S);ctx.lineTo(34*s/S,37*s/S);ctx.lineTo(-34*s/S,37*s/S);ctx.closePath();ctx.fill();ctx.restore()}

  return {
    ctx,
    get S(){return S},
    get pixelWidth(){return pixelW},
    get pixelHeight(){return pixelH},
    syncResolution,
    clear,fillRect,strokeRect,line,text,shadowText,panel,ornateFrame,selector,wrapText,scanlines,
    drawImageStretch,drawImageCentered,drawImageCover,drawImageTiled,drawNineSlice,portraitBust,
    W:LOGICAL_W,H:LOGICAL_H,
  }
}
