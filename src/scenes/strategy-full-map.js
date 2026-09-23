import { SERIF } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import { FULL_MAP_BOUNDS, fullMapPoint } from '../game/full-map.js'
import { mdButton } from '../game/input.js'
import { TARGET_INSPECTION_PALETTE, drawFullMapCitySymbol, drawFullMapVillageSymbol, drawTargetMapCursor, drawVectorMountain } from '../game/map-art.js'
import { createTerrainGrain, drawTerrainEtching, drawTerrainGrain } from '../game/terrain-art.js'
import { WORLD_TERRAIN_RELIEF, drawProjectedTerrainRelief } from '../game/terrain-relief.js'
import { WORLD_H, WORLD_W, cityWorldPoint } from '../game/world.js'
import { drawProjectedRiver } from '../game/world-art.js'
import { StrategyScene as OfficerStrategyScene } from './strategy-officers.js'

const FULL_MAP_GRAIN=createTerrainGrain({width:194,height:112,count:360,seed:0x21500189})

export class StrategyScene extends OfficerStrategyScene {
  update(dt,input) {
    if(this.view==='info'&&this.infoTab===1)return this.updateFullMap(input)
    return super.update(dt,input)
  }

  updateFullMap(input) {
    const key=input.consume()
    if(!key)return
    const b=mdButton(key)
    if(b==='HD')return this.app.toggleHd()
    if(b==='START'||b==='B'){
      this.view='map'
      this.app.audio.cancel()
    }
    // A/C and the d-pad remain intentionally unused here until exact original
    // full-map cursor behavior is verified. This screen is no longer a tab bar.
  }

  drawInfo() {
    if(this.infoTab===1)return this.drawFullMap()
    return super.drawInfo()
  }

  drawFullMap() {
    const r=this.app.r
    const c=r.ctx
    const S=r.S
    const state=this.app.store.state
    const bounds=FULL_MAP_BOUNDS
    r.panel(18,18,284,174,'#020202','#b07118',this.app.assets?.getNineSlice('ui.panels.large',{sourceSlice:32,destEdge:6}))
    r.text('全體地圖',160,27,11,'#efd27d','center','top',SERIF,'700')
    r.line(28,44,292,44,'#72501b',.7)

    r.fillRect(bounds.x,bounds.y,bounds.w,bounds.h,'#aa8050')
    drawTerrainGrain(r,FULL_MAP_GRAIN,{
      project:(dot)=>({x:bounds.x+dot.x,y:bounds.y+dot.y}),
      alpha:.62,
    })
    drawTerrainEtching(r,FULL_MAP_GRAIN,{
      project:(dot)=>({x:bounds.x+dot.x,y:bounds.y+dot.y}),
      alpha:.14,
      stride:7,
    })
    drawProjectedTerrainRelief(r,WORLD_TERRAIN_RELIEF,{
      project:(point)=>fullMapPoint(point,bounds),
      scaleX:bounds.w/WORLD_W,
      scaleY:bounds.h/WORLD_H,
      clip:bounds,
    })
    r.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h,'#2d1b0e',1)

    this.drawFullMapRiver(bounds)

    c.save()
    c.beginPath()
    c.rect(bounds.x*S,bounds.y*S,bounds.w*S,bounds.h*S)
    c.clip()

    for(const city of this.mapCities()){
      const point=fullMapPoint(cityWorldPoint(city),bounds)
      const runtime=state.cities[city.id]
      const faction=FACTION_BY_ID[runtime?.owner]??FACTION_BY_ID.neutral
      drawFullMapCitySymbol(r,point.x,point.y,faction.color,4.2,{flagColor:TARGET_INSPECTION_PALETTE.flag,flagHighlight:TARGET_INSPECTION_PALETTE.flagHighlight})
    }

    for(const village of this.app.store.mapProfile?.villages??[]){
      const point=fullMapPoint(village,bounds)
      drawFullMapVillageSymbol(r,point.x,point.y,3.6,TARGET_INSPECTION_PALETTE)
    }

    const cursor=fullMapPoint(state.cursor,bounds)
    drawTargetMapCursor(r,cursor.x,cursor.y,{width:9,height:9,scale:.82})
    c.restore()

    const legendX=235
    r.text(`${state.year}年 ${state.month}月`,legendX,51,7,'#e6d7b7')
    r.text('地圖符號',legendX,68,6,'#9e947e')
    drawFullMapCitySymbol(r,244,89,FACTION_BY_ID.neutral.color,7,{flagColor:TARGET_INSPECTION_PALETTE.flag,flagHighlight:TARGET_INSPECTION_PALETTE.flagHighlight})
    r.text('城',258,84,7,'#e8dfc8')

    drawFullMapVillageSymbol(r,244,111,5.6,TARGET_INSPECTION_PALETTE)
    r.text('村',258,107,7,'#e8dfc8')

    drawVectorMountain(r,244,137,0,.72,TARGET_INSPECTION_PALETTE)
    r.text('山',258,131,7,'#e8dfc8')
    r.text('村庄位置待實機校準',264,151,5,'#837a69','center')
    r.text('START / B 返回',160,178,6,'#887f6d','center')
  }

  drawFullMapRiver(bounds) {
    return drawProjectedRiver(this.app.r,{
      project:(point)=>fullMapPoint(point,bounds),
      clip:bounds,
      outer:'#6f5837',
      inner:'#064ac0',
    })
  }

}
