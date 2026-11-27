// Reference-derived presentation only. These are approximate logical dimensions
// from the external Chinese battle still, not original tactical grid cells.
export const BATTLE_MAP_PRESENTATION=Object.freeze({
  markerWidth:16,markerHeight:17,dayWidth:30,dayHeight:10,dayX:282,dayY:6,
})

export function drawBattleMapMarker(r,{x,y,color,label}){
  const {markerWidth:w,markerHeight:h}=BATTLE_MAP_PRESENTATION
  const left=x-w/2,top=y-h/2
  r.fillRect(left,top,w,h,'#15140f')
  r.fillRect(left+1,top+1,w-2,h-2,'#eee9d9')
  r.fillRect(left+2,top+2,w-4,7,'#171610')
  // Recessed right edge of the pennant; original clean-room vector strokes.
  r.fillRect(left+3,top+3,w-6,5,color)
  r.fillRect(left+w-6,top+4,2,3,'#171610')
  r.line(left+1,top+10,left+w-1,top+10,'#171610',.7)
  r.text(label,left+w/2,top+10.5,6,'#171610','center')
}

export function drawBattleMapDay(r,day){
  const {dayX:x,dayY:y,dayWidth:w,dayHeight:h}=BATTLE_MAP_PRESENTATION
  r.fillRect(x,y,w,h,'#101010')
  r.text('第'+day+'日',x+w/2,y+1,7,'#fff','center')
}
