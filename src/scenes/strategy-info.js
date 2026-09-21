import { COLORS } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import { ensureMarchState } from '../game/march.js'
import { drawMapCursor, drawVectorFlag, drawVectorForest, drawVectorFort, drawVectorMountain, drawVectorVillage } from '../game/map-art.js'
import { openingOfficerRows } from '../game/officer-roster.js'
import { createTerrainGrain, drawTerrainGrain } from '../game/terrain-art.js'
import { WORLD_TERRAIN_RELIEF, drawWorldTerrainRelief } from '../game/terrain-relief.js'
import { mountainStampStyle } from '../game/terrain-style.js'
import { MAP_VIEW_H, MAP_VIEW_W, WORLD_H, WORLD_W, cameraFor, cityWorldPoint, isVisible, toScreen, worldPoint } from '../game/world.js'
import { drawRoadNetwork, drawWorldRiver, uniqueRoadPairs } from '../game/world-art.js'
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
    this.mapSpeckles=createTerrainGrain({width:WORLD_W,height:WORLD_H,count:1500})
    this.mapRelief=WORLD_TERRAIN_RELIEF
    this.profileRoadSegmentsWorld=Object.freeze(
      uniqueRoadPairs(this.mapCities()).map(([from,to])=>Object.freeze({
        a:Object.freeze(cityWorldPoint(this.cityById(from))),
        b:Object.freeze(cityWorldPoint(this.cityById(to))),
      })),
    )
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
      drawTerrainGrain(r,this.mapSpeckles,{
        project:(dot)=>toScreen(dot,camera),
        visible:(point)=>point.x>=0&&point.x<=MAP_VIEW_W&&point.y>=0&&point.y<=MAP_VIEW_H,
      })
    }

    drawWorldTerrainRelief(r,this.mapRelief,{
      camera,
      viewWidth:MAP_VIEW_W,
      viewHeight:MAP_VIEW_H,
    })

    this.drawRiver(camera)

    const roadSegments=this.profileRoadSegmentsWorld
      .map(({a,b})=>({a:toScreen(a,camera),b:toScreen(b,camera)}))
      .filter(({a,b})=>!(
        (a.x<-24&&b.x<-24)||
        (a.x>MAP_VIEW_W+24&&b.x>MAP_VIEW_W+24)||
        (a.y<-24&&b.y<-24)||
        (a.y>MAP_VIEW_H+24&&b.y>MAP_VIEW_H+24)
      ))
    drawRoadNetwork(r,roadSegments)

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

    for(const city of this.mapCities()){
      const wp=cityWorldPoint(city)
      if(!isVisible(wp,camera,18))continue
      const p=toScreen(wp,camera)
      this.drawCity(city,p.x,p.y)
    }

    for(const village of this.app.store.mapProfile?.villages??[]){
      if(!isVisible(village,camera,14))continue
      const p=toScreen(village,camera)
      const image=this.app.assets?.getForDisplay('map.villages.neutral',18,18)
      if(!image||!r.drawImageCentered(image,p.x,p.y,18,18)){
        drawVectorVillage(r,p.x,p.y,.8)
      }
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
    const water=this.app.assets?.getForDisplay('map.terrain.riverA',42,20)
    const pattern=water?this.app.r.ctx.createPattern(water,'repeat'):null
    drawWorldRiver(this.app.r,{camera,pattern})
  }

  drawMountain(x,y,index=0) {
    const r=this.app.r
    const hasMountainB=Boolean(this.app.assets?.isSharpEnough('map.terrain.mountainB',32,32))
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
