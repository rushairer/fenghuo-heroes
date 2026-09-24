// Presentation-only strategic geography derived from visual composition references.
// This module is deliberately NOT canonical map evidence. It may be replaced wholesale
// when direct Chinese-ROM coordinate capture opens the canonical migration gate.

export const STRATEGY_PRESENTATION_GEOGRAPHY=Object.freeze({
  canonical:false,
  status:'clean-room-reference-calibration',
  evidenceBoundary:'composition-only',
})

const MOUNTAIN_BELTS=Object.freeze([
  Object.freeze({x1:18,y1:42,x2:618,y2:104,count:21,wave:22,phase:.2}),
  Object.freeze({x1:-8,y1:170,x2:622,y2:226,count:20,wave:28,phase:1.15}),
  Object.freeze({x1:8,y1:286,x2:628,y2:360,count:21,wave:24,phase:2.1}),
  Object.freeze({x1:34,y1:402,x2:604,y2:430,count:16,wave:18,phase:.72}),
])

const HILL_BELTS=Object.freeze([
  Object.freeze({x1:500,y1:92,x2:628,y2:188,count:6,wave:16,phase:.4}),
  Object.freeze({x1:26,y1:206,x2:210,y2:356,count:7,wave:18,phase:1.6}),
  Object.freeze({x1:360,y1:270,x2:618,y2:414,count:7,wave:20,phase:2.4}),
])

function sampleBelts(belts,{baseScale=1,scaleVariance=.12,variantOffset=0}={}){
  const out=[]
  let index=0
  for(const belt of belts){
    const count=Math.max(2,belt.count)
    for(let i=0;i<count;i++){
      const t=i/(count-1)
      const baseX=belt.x1+(belt.x2-belt.x1)*t
      const baseY=belt.y1+(belt.y2-belt.y1)*t
      const wave=Math.sin(t*Math.PI*2+belt.phase)*belt.wave
      const cross=Math.cos(t*Math.PI*3+belt.phase*.7)*belt.wave*.38
      const x=Math.round((baseX+cross)*100)/100
      const y=Math.round((baseY+wave)*100)/100
      const scale=Math.round((baseScale+(((index%5)-2)/2)*scaleVariance)*1000)/1000
      out.push(Object.freeze({x,y,scale,variant:index+variantOffset}))
      index++
    }
  }
  return Object.freeze(out)
}

export const PRESENTATION_MOUNTAIN_RANGES=sampleBelts(MOUNTAIN_BELTS,{
  baseScale:1,
  scaleVariance:.09,
})

export const PRESENTATION_HILL_CLUSTERS=sampleBelts(HILL_BELTS,{
  baseScale:.92,
  scaleVariance:.08,
  variantOffset:91,
})


export function presentationFeatureCounts({
  x=0,
  y=0,
  width=640,
  height=448,
}={}){
  const minX=Number(x)||0
  const minY=Number(y)||0
  const maxX=minX+Math.max(0,Number(width)||0)
  const maxY=minY+Math.max(0,Number(height)||0)
  const inside=(item)=>item.x>=minX&&item.x<=maxX&&item.y>=minY&&item.y<=maxY
  return Object.freeze({
    mountains:PRESENTATION_MOUNTAIN_RANGES.filter(inside).length,
    hills:PRESENTATION_HILL_CLUSTERS.filter(inside).length,
  })
}

export function presentationCoverageCells({
  columns=4,
  rows=3,
  width=640,
  height=448,
}={}){
  const cols=Math.max(1,Math.floor(Number(columns)||1))
  const rowCount=Math.max(1,Math.floor(Number(rows)||1))
  const w=Math.max(1,Number(width)||640)
  const h=Math.max(1,Number(height)||448)
  const cellW=w/cols
  const cellH=h/rowCount
  const cells=[]
  for(let row=0;row<rowCount;row++){
    for(let col=0;col<cols;col++){
      const bounds={x:col*cellW,y:row*cellH,width:cellW,height:cellH}
      cells.push(Object.freeze({
        row,
        col,
        ...presentationFeatureCounts(bounds),
      }))
    }
  }
  return Object.freeze(cells)
}
