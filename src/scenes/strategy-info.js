import { COLORS } from '../game/constants.js'
import { CITIES, FACTION_BY_ID } from '../game/data.js'
import { ensureMarchState } from '../game/march.js'
import { drawMapCursor, drawVectorFlag, drawVectorForest, drawVectorFort, drawVectorMountain } from '../game/map-art.js'
import { openingOfficerRows } from '../game/officer-roster.js'
import { mountainStampStyle } from '../game/terrain-style.js'
import { MAP_VIEW_H, MAP_VIEW_W, WORLD_H, WORLD_W, cameraFor, cityWorldPoint, isVisible, toScreen, worldPoint } from '../game/world.js'
import { StrategyScene as ParityStrategyScene } from './strategy-parity.js'

const MOUNTAIN_REFS = Object.freeze([
  [17,35],[29,27],[42,43],[56,28],[72,48],[88,32],[104,52],[119,34],[137,43],[154,31],
  [174,53],[194,39],[213,55],[232,42],[252,56],[275,39],[296,54],[34,79],[58,70],[84,85],
  [108,73],[132,91],[158,76],[185,95],[211,79],[241,98],[274,82],[304,102],[28,126],[54,112],
  [79,139],[105,121],[132,148],[160,128],[190,150],[220,131],[249,155],[282,137],[310,159],[41,174],
  [75,191],[112,174],[149,197],[185,181],[224,201],[259,181],[294,202],
])

const FOREST_REFS = Object.freeze([
  [285,27],[302,36],[266,71],[288,109],[227,151],[188,155],[39,111],[66,154],[113,188],[249,190],[181,117],[26,187],
])

const ARMY_SELECTED_VIEWS = new Set(['army-menu','march-route','march-route-prompt'])

export class StrategyScene extends ParityStrategyScene {
  constructor(app) {
    super(app)
    this.mapSpeckles = this.createMapSpeckles()
  }

  createMapSpeckles() {
    const items=[]
    let seed=0x19910429
    const tones=['#9f7548','#c49a64','#8f693f','#d0aa75']
    for(let i=0;i<1500;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0
      const x=seed%WORLD_W
      seed=(Math.imul(seed,1664525)+1013904223)>>>0
      const y=seed%WORLD_H
      seed=(Math.imul(seed,1664525)+1013904223)>>>0
      items.push(Object.freeze({x,y,tone:tones[seed%tones.length],size:.35+((seed>>>8)%4)*.14}))
    }
    return Object.freeze(items)
  }

  drawInfo() {
    if (this.infoTab !== 2) return super.drawInfo()

    const r = this.app.r
    const rows = openingOfficerRows(this.app.store)
    r.panel(18,20,284,170,'#020202','#b07118',this.app.assets?.getNineSlice('ui.panels.large',{sourceSlice:32,destEdge:6}))
    const tabs=['統治國一覽','全體地圖','武將狀態']
    tabs.forEach((title,index)=>r.text(title,66+index*94,30,8,index===this.infoTab?COLORS.cyan:'#777','center'))
    r.line(28,45,292,45,'#7b4e12',1)

    if (!rows.length) {
      r.text('此劇本的可驗證武將名冊尚未建立',160,82,8,'#d7caa8','center')
      r.text('不以歷史資料或其他遊戲資料補造',160,104,7,'#9e9582','center')
    } else {
      r.text(`${this.app.store.state.scenarioYear}年開局名冊 · ${rows.length}人`,160,53,7,'#d7caa8','center')
      rows.forEach((row,index)=>{
        const col=index>=8?1:0
        const line=index%8
        const x=42+col*133
        const y=67+line*13
        r.text(row.role==='君主'?'君':'將',x,y,6.5,row.role==='君主'?'#efd27d':'#8f8674')
        r.text(row.name,x+18,y,8,row.role==='君主'?COLORS.cyan:'#e8dfc8')
      })
      r.text('等級／武力／知力／德／忠誠仍待中文版實機逐項校準',160,166,6,'#9e9582','center')
    }

    r.text('← → 切換　A/B/C 返回',160,178,6,'#887f6d','center')
  }

  drawWorld() {
    const r=this.app.r
    const c=r.ctx
    const state=this.app.store.state
    const camera=cameraFor(state.cursor)
    const sand=this.app.assets?.getForDisplay('map.terrain.sandBase',64,64)

    if(!sand||!r.drawImageTiled(sand,0,0,MAP_VIEW_W,MAP_VIEW_H,64,64,camera.x,camera.y)){
      r.fillRect(0,0,MAP_VIEW_W,MAP_VIEW_H,'#b48855')
      for(const dot of this.mapSpeckles){
        const p=toScreen(dot,camera)
        if(p.x<0||p.x>MAP_VIEW_W||p.y<0||p.y>MAP_VIEW_H)continue
        c.fillStyle=dot.tone
        c.beginPath()
        c.arc(p.x*r.S,p.y*r.S,dot.size*r.S,0,Math.PI*2)
        c.fill()
      }
    }

    this.drawRiver(camera)

    MOUNTAIN_REFS.forEach((ref,index)=>{
      const wp=worldPoint({x:ref[0],y:ref[1]})
      if(!isVisible(wp,camera,18))return
      const p=toScreen(wp,camera)
      this.drawMountain(p.x,p.y,index)
    })
    FOREST_REFS.forEach((ref,index)=>{
      const wp=worldPoint({x:ref[0],y:ref[1]})
      if(!isVisible(wp,camera,16))return
      const p=toScreen(wp,camera)
      this.drawForest(p.x,p.y,index)
    })

    for(const city of CITIES){
      const wp=cityWorldPoint(city)
      if(!isVisible(wp,camera,18))continue
      const p=toScreen(wp,camera)
      this.drawCity(city,p.x,p.y)
    }

    for(const army of ensureMarchState(this.app.store)){
      const wp={x:army.x,y:army.y}
      if(!isVisible(wp,camera,14))continue
      const p=toScreen(wp,camera)
      const faction=FACTION_BY_ID[army.faction]
      const selected=this.marchArmyId===army.id&&ARMY_SELECTED_VIEWS.has(this.view)
      this.drawArmyFlag(p.x,p.y,faction?.color??'#888',army.starving,army.faction,selected)
    }

    if(this.view==='march-route'&&this.marchRoute.length>1){
      for(let i=1;i<this.marchRoute.length;i++){
        const a=toScreen(this.marchRoute[i-1],camera)
        const b=toScreen(this.marchRoute[i],camera)
        r.line(a.x,a.y,b.x,b.y,'#fff0a0',1.15,.95)
      }
    }

    const cursor=toScreen(state.cursor,camera)
    drawMapCursor(r,cursor.x,cursor.y)
  }

  drawRiver(camera) {
    const r=this.app.r
    const c=r.ctx
    const S=r.S
    const water=this.app.assets?.getForDisplay('map.terrain.riverA',42,20)
    const pattern=water?c.createPattern(water,'repeat'):null
    const drawPath=()=>{
      c.beginPath()
      c.moveTo(205*S,-12*S)
      c.bezierCurveTo(229*S,48*S,287*S,69*S,323*S,126*S)
      c.bezierCurveTo(360*S,184*S,421*S,218*S,473*S,235*S)
      c.bezierCurveTo(526*S,254*S,579*S,278*S,658*S,326*S)
    }
    c.save()
    c.translate(-camera.x*S,-camera.y*S)
    c.lineCap='round'
    c.lineJoin='round'
    drawPath();c.strokeStyle='#6f5837';c.lineWidth=23*S;c.stroke()
    drawPath();c.strokeStyle='#082d92';c.lineWidth=19*S;c.stroke()
    drawPath();c.strokeStyle=pattern??'#064ac0';c.lineWidth=13*S;c.stroke()
    drawPath();c.strokeStyle=pattern?'#b8e7ef':'#0d63d7';c.lineWidth=3*S;c.globalAlpha=pattern?.24:.55;c.stroke()
    c.restore()
  }

  drawMountain(x,y,index=0) {
    const r=this.app.r
    const hasMountainB=Boolean(this.app.assets?.get('map.terrain.mountainB'))
    const style=mountainStampStyle(index,hasMountainB)
    const image=this.app.assets?.getForDisplay(style.assetKey,style.width,style.height)
      ??this.app.assets?.getForDisplay('map.terrain.mountainA',style.width,style.height)
    if(image&&r.drawImageCentered(image,x,y+style.offsetY,style.width,style.height,style.alpha,style.mirror))return
    drawVectorMountain(r,x,y,index)
  }

  drawForest(x,y,index=0) {
    const r=this.app.r
    const image=this.app.assets?.getForDisplay('map.terrain.forestA',22,18)
    if(image&&r.drawImageCentered(image,x,y,22,18,.96))return
    drawVectorForest(r,x,y,index)
  }

  drawCity(city,x,y) {
    const r=this.app.r
    const runtime=this.app.store.state.cities[city.id]
    const faction=FACTION_BY_ID[runtime.owner]??FACTION_BY_ID.neutral
    const image=this.app.assets?.getForDisplay(`map.cities.${runtime.owner}`,24,24)
      ??(runtime.owner==='neutral'?this.app.assets?.getForDisplay('map.cities.neutral',24,24):null)
    if(image&&r.drawImageStretch(image,x-12,y-16,24,24))return
    drawVectorFort(r,x,y,faction.color)
  }

  drawArmyFlag(x,y,color,starving=false,factionId=null,selected=false) {
    const r=this.app.r
    const c=r.ctx
    const S=r.S
    const base=this.app.assets?.getForDisplay(`map.flags.${factionId}`,20,20)
    const selectedFlag=selected?this.app.assets?.getForDisplay('map.flags.selected',20,20):null
    const lowFoodFlag=starving?this.app.assets?.getForDisplay('map.flags.lowFood',20,20):null
    const image=lowFoodFlag??selectedFlag??base
    if(image){
      r.drawImageStretch(image,x-10,y-14,20,20)
      if((starving||selected)&&!lowFoodFlag&&!selectedFlag){
        r.strokeRect(x-11,y-15,22,22,starving?'#ff765f':COLORS.cyan,1)
      }
      return
    }
    drawVectorFlag(r,x,y,color,{selected,starving})
  }
}
