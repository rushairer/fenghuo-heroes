import { COLORS, FONT, HD_H, HD_SCALE, HD_W, LOGICAL_H, LOGICAL_W, SERIF } from './constants.js'

export function makeRenderer(canvas) {
  canvas.width = HD_W
  canvas.height = HD_H
  const ctx = canvas.getContext('2d', { alpha:false })
  ctx.imageSmoothingEnabled = true
  const S = HD_SCALE
  const X=(v)=>Math.round(v*S), Y=(v)=>Math.round(v*S)

  function clear(color=COLORS.black){ ctx.fillStyle=color; ctx.fillRect(0,0,HD_W,HD_H) }
  function fillRect(x,y,w,h,color){ ctx.fillStyle=color; ctx.fillRect(X(x),Y(y),X(w),Y(h)) }
  function strokeRect(x,y,w,h,color=COLORS.gold,width=1){ ctx.strokeStyle=color; ctx.lineWidth=Math.max(1,X(width)); ctx.strokeRect(X(x)+ctx.lineWidth/2,Y(y)+ctx.lineWidth/2,X(w)-ctx.lineWidth,Y(h)-ctx.lineWidth) }
  function line(x1,y1,x2,y2,color=COLORS.gold,width=1,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=X(width);ctx.beginPath();ctx.moveTo(X(x1),Y(y1));ctx.lineTo(X(x2),Y(y2));ctx.stroke();ctx.restore()}
  function text(value,x,y,size=8,color=COLORS.white,align='left',baseline='top',family=FONT,weight='500'){ctx.font=`${weight} ${Math.round(size*S)}px ${family}`;ctx.textAlign=align;ctx.textBaseline=baseline;ctx.fillStyle=color;ctx.fillText(String(value),X(x),Y(y))}
  function shadowText(value,x,y,size=8,color=COLORS.white,align='left',baseline='top',family=SERIF,weight='700'){text(value,x+.75,y+.75,size,'#000',align,baseline,family,weight);text(value,x,y,size,color,align,baseline,family,weight)}
  function panel(x,y,w,h,fill=COLORS.panel,border=COLORS.gold2){fillRect(x,y,w,h,fill);strokeRect(x,y,w,h,border,1);strokeRect(x+2,y+2,w-4,h-4,'#3a2408',.5)}
  function ornateFrame(x,y,w,h){fillRect(x,y,w,h,COLORS.black);strokeRect(x,y,w,h,COLORS.gold,2);strokeRect(x+3,y+3,w-6,h-6,COLORS.red,3);strokeRect(x+6,y+6,w-12,h-12,COLORS.gold2,1);ctx.save();ctx.strokeStyle=COLORS.gold;ctx.lineWidth=X(.75);const step=10;for(let xx=x+8;xx<x+w-8;xx+=step){ctx.beginPath();ctx.moveTo(X(xx),Y(y+4));ctx.quadraticCurveTo(X(xx+2.5),Y(y+1.4),X(xx+5),Y(y+4));ctx.quadraticCurveTo(X(xx+7.5),Y(y+6.6),X(xx+10),Y(y+4));ctx.stroke();ctx.beginPath();ctx.moveTo(X(xx),Y(y+h-4));ctx.quadraticCurveTo(X(xx+2.5),Y(y+h-6.6),X(xx+5),Y(y+h-4));ctx.quadraticCurveTo(X(xx+7.5),Y(y+h-1.4),X(xx+10),Y(y+h-4));ctx.stroke()}ctx.restore()}
  function selector(x,y,w,h,active=true){strokeRect(x,y,w,h,active?COLORS.cyan:COLORS.gold2,active?1.5:1)}
  function wrapText(value,x,y,maxWidth,lineHeight=10,size=8,color=COLORS.white,align='left',family=FONT){const chars=[...String(value)];let lineText='';let yy=y;ctx.font=`500 ${Math.round(size*S)}px ${family}`;for(const ch of chars){const next=lineText+ch;if(ctx.measureText(next).width>X(maxWidth)&&lineText){text(lineText,x,yy,size,color,align,'top',family);lineText=ch;yy+=lineHeight}else lineText=next}if(lineText)text(lineText,x,yy,size,color,align,'top',family)}
  function scanlines(alpha=.035){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#000';for(let y=1;y<HD_H;y+=8)ctx.fillRect(0,y,HD_W,2);ctx.restore()}
  function portraitBust(cx,baseY,scale,tone,flip=false,kind=0){ctx.save();ctx.translate(X(cx),Y(baseY));ctx.scale(flip?-1:1,1);const s=S*scale;ctx.fillStyle=tone;ctx.strokeStyle='#1b0a07';ctx.lineWidth=Math.max(2,s*.7);ctx.beginPath();ctx.ellipse(0,-30*s/S,17*s/S,22*s/S,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#22130c';ctx.beginPath();ctx.moveTo(-17*s/S,-42*s/S);ctx.quadraticCurveTo(0,-58*s/S,19*s/S,-40*s/S);ctx.lineTo(15*s/S,-34*s/S);ctx.quadraticCurveTo(0,-45*s/S,-16*s/S,-34*s/S);ctx.closePath();ctx.fill();if(kind%2===0){ctx.fillStyle='#23120d';ctx.beginPath();ctx.moveTo(-10*s/S,-15*s/S);ctx.quadraticCurveTo(0,8*s/S,11*s/S,-15*s/S);ctx.quadraticCurveTo(7*s/S,18*s/S,0,28*s/S);ctx.quadraticCurveTo(-7*s/S,18*s/S,-10*s/S,-15*s/S);ctx.fill()}ctx.fillStyle=kind%3===0?'#5f1914':'#2f2730';ctx.beginPath();ctx.moveTo(-24*s/S,-7*s/S);ctx.lineTo(24*s/S,-7*s/S);ctx.lineTo(34*s/S,37*s/S);ctx.lineTo(-34*s/S,37*s/S);ctx.closePath();ctx.fill();ctx.restore()}
  return {ctx,S,clear,fillRect,strokeRect,line,text,shadowText,panel,ornateFrame,selector,wrapText,scanlines,portraitBust,W:LOGICAL_W,H:LOGICAL_H}
}
