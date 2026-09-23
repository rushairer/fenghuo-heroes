import { COLORS, SERIF } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import { ensureMarchState } from '../game/march.js'
import { TARGET_INSPECTION_PALETTE, drawMapCursor, drawTargetArmyFlag, drawTargetHillCluster, drawTargetInspectionFort, drawTargetMapCursor, drawVectorFlag, drawVectorForest, drawVectorFort, drawVectorMountain, drawVectorVillage } from '../game/map-art.js'
import { openingOfficerRows } from '../game/officer-roster.js'
import { createTerrainGrain, drawTerrainEtching, drawTerrainGrain } from '../game/terrain-art.js'
import { WORLD_TERRAIN_RELIEF, drawWorldTerrainRelief } from '../game/terrain-relief.js'
import { MAP_VIEW_H, MAP_VIEW_W, WORLD_H, WORLD_W, cameraFor, cityWorldPoint, worldPoint } from '../game/world.js'
import { drawWorldRiver } from '../game/world-art.js'
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
const TARGET_PARITY_VIEW_H = 224
const TARGET_PARITY_SCALE = 1.18

function cameraForView(point,viewHeight=MAP_VIEW_H,viewScale=1){
  if(viewHeight===MAP_VIEW_H&&viewScale===1)return cameraFor(point)
  const worldViewWidth=MAP_VIEW_W/viewScale
  const worldViewHeight=viewHeight/viewScale
  return {
    x:Math.max(0,Math.min(WORLD_W-worldViewWidth,Math.round(point.x-worldViewWidth/2))),
    y:Math.max(0,Math.min(WORLD_H-worldViewHeight,Math.round(point.y-worldViewHeight/2))),
  }
}

function projectToView(point,camera,viewScale=1){
  return {
    x:(point.x-camera.x)*viewScale,
    y:(point.y-camera.y)*viewScale,
  }
}

function isVisibleInView(point,camera,viewHeight,padding=16,viewScale=1){
  const p=projectToView(point,camera,viewScale)
  return p.x>=-padding&&p.x<=MAP_VIEW_W+padding&&p.y>=-padding&&p.y<=viewHeight+padding
}

export class StrategyScene extends ParityStrategyScene {
  constructor(app) {
    super(app)
    this.mapSpeckles=createTerrainGrain({width:WORLD_W,height:WORLD_H,count:1500})
    this.mapRelief=WORLD_TERRAIN_RELIEF
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

  isTargetParityInspection() {
    return this.stage==='survey'&&this.view==='map'
  }

  drawDialog() {
    if(this.isTargetParityInspection())return
    return super.drawDialog()
  }

  drawInspectionPlaque() {
    const r=this.app.r
    r.fillRect(5,5,80,24,'#1c100b')
    r.strokeRect(5.5,5.5,79,23,'#e0b25e',1)
    r.strokeRect(8,8,74,18,'#6f3d20',.65)
    r.fillRect(9.5,9.5,71,15,'#3b2114')
    r.line(13,22.5,77,22.5,'#9b6631',.45,.72)
    for(const [x,y] of [[7,7],[82,7],[7,26],[82,26]])r.fillRect(x-1,y-1,2,2,'#d3a14d')
    r.text('視察情況',45,10.5,8.5,'#f3d985','center','top',SERIF,'700')
  }

  drawWorld() {
    const r=this.app.r
    const state=this.app.store.state
    const mapFirst=this.isTargetParityInspection()
    const viewHeight=mapFirst?TARGET_PARITY_VIEW_H:MAP_VIEW_H
    const viewScale=mapFirst?TARGET_PARITY_SCALE:1
    const camera=cameraForView(state.cursor,viewHeight,viewScale)

    r.fillRect(0,0,MAP_VIEW_W,viewHeight,mapFirst?'#aa8050':'#a98654')
    drawTerrainGrain(r,this.mapSpeckles,{
      project:(dot)=>projectToView(dot,camera,viewScale),
      visible:(point)=>point.x>=0&&point.x<=MAP_VIEW_W&&point.y>=0&&point.y<=viewHeight,
      alpha:mapFirst?.72:.58,
    })
    drawWorldTerrainRelief(r,this.mapRelief,{camera,viewWidth:MAP_VIEW_W,viewHeight,viewScale})
    if(mapFirst){
      drawTerrainEtching(r,this.mapSpeckles,{
        project:(dot)=>projectToView(dot,camera,viewScale),
        visible:(point)=>point.x>=0&&point.x<=MAP_VIEW_W&&point.y>=0&&point.y<=viewHeight,
        alpha:.18,
        stride:8,
      })
    }

    this.drawRiver(camera,mapFirst?1.28:1,viewScale)

    MOUNTAIN_REFS.forEach((ref,index)=>{
      const wp=worldPoint({x:ref[0],y:ref[1]})
      if(!isVisibleInView(wp,camera,viewHeight,22,viewScale))return
      const p=projectToView(wp,camera,viewScale)
      this.drawMountain(p.x,p.y,index,mapFirst)
    })
    FOREST_REFS.forEach((ref,index)=>{
      const wp=worldPoint({x:ref[0],y:ref[1]})
      if(!isVisibleInView(wp,camera,viewHeight,18,viewScale))return
      const p=projectToView(wp,camera,viewScale)
      this.drawForest(p.x,p.y,index,mapFirst)
    })

    for(const city of this.mapCities()){
      const wp=cityWorldPoint(city)
      if(!isVisibleInView(wp,camera,viewHeight,22,viewScale))continue
      const p=projectToView(wp,camera,viewScale)
      this.drawCity(city,p.x,p.y,mapFirst)
    }

    for(const village of this.app.store.mapProfile?.villages??[]){
      if(!isVisibleInView(village,camera,viewHeight,16,viewScale))continue
      const p=projectToView(village,camera,viewScale)
      drawVectorVillage(r,p.x,p.y,mapFirst?.9:.8)
    }

    for(const army of ensureMarchState(this.app.store)){
      const wp={x:army.x,y:army.y}
      if(!isVisibleInView(wp,camera,viewHeight,16,viewScale))continue
      const p=projectToView(wp,camera,viewScale)
      const faction=FACTION_BY_ID[army.faction]
      const selected=this.marchArmyId===army.id&&ARMY_SELECTED_VIEWS.has(this.view)
      if(mapFirst){
        drawTargetArmyFlag(r,p.x,p.y,faction?.color??'#888',{starving:army.starving,selected,scale:1.04*TARGET_PARITY_SCALE})
      }else{
        this.drawArmyFlag(p.x,p.y,faction?.color??'#888',army.starving,army.faction,selected)
      }
    }

    if(this.view==='march-route'&&this.marchRoute.length>1){
      for(let i=1;i<this.marchRoute.length;i++){
        const a=projectToView(this.marchRoute[i-1],camera,viewScale)
        const b=projectToView(this.marchRoute[i],camera,viewScale)
        r.line(a.x,a.y,b.x,b.y,'#fff0a0',1.15,.95)
      }
    }

    const cursor=projectToView(state.cursor,camera,viewScale)
    if(mapFirst){
      drawTargetMapCursor(r,cursor.x,cursor.y)
      this.drawInspectionPlaque()
    }else{
      drawMapCursor(r,cursor.x,cursor.y)
    }
  }

  drawRiver(camera,widthScale=1,viewScale=1) {
    drawWorldRiver(this.app.r,{camera,widthScale,viewScale})
  }

  drawMountain(x,y,index=0,mapFirst=false) {
    const scale=mapFirst?1.12*TARGET_PARITY_SCALE:1
    drawVectorMountain(
      this.app.r,
      x,
      y,
      index,
      scale,
      mapFirst?TARGET_INSPECTION_PALETTE:undefined,
    )
  }

  drawForest(x,y,index=0,mapFirst=false) {
    if(mapFirst){
      drawTargetHillCluster(this.app.r,x,y,index,1.08*TARGET_PARITY_SCALE)
      return
    }
    drawVectorForest(this.app.r,x,y,index,1)
  }

  drawCity(city,x,y,mapFirst=false) {
    const runtime=this.app.store.state.cities[city.id]
    const faction=FACTION_BY_ID[runtime.owner]??FACTION_BY_ID.neutral
    if(mapFirst){
      drawTargetInspectionFort(this.app.r,x,y,faction.color,1.08*TARGET_PARITY_SCALE)
      return
    }
    drawVectorFort(this.app.r,x,y,faction.color,1)
  }

  drawArmyFlag(x,y,color,starving=false,_factionId=null,selected=false) {
    drawVectorFlag(this.app.r,x,y,color,{selected,starving})
  }
}
