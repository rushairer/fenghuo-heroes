import { COLORS, SERIF } from '../game/constants.js'
import { CITIES, FACTION_BY_ID } from '../game/data.js'
import { FULL_MAP_BOUNDS, fullMapPoint } from '../game/full-map.js'
import { mdButton } from '../game/input.js'
import { drawFullMapCitySymbol, drawMapCursor, drawVectorFort, drawVectorMountain, drawVectorVillage } from '../game/map-art.js'
import { cityWorldPoint } from '../game/world.js'
import { drawProjectedRiver } from '../game/world-art.js'
import { StrategyScene as OfficerStrategyScene } from './strategy-officers.js'

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

    const sand=this.app.assets?.getForDisplay('map.terrain.sandBase',32,32)
    if(!sand||!r.drawImageTiled(sand,bounds.x,bounds.y,bounds.w,bounds.h,32,32,0,0,.94)){
      r.fillRect(bounds.x,bounds.y,bounds.w,bounds.h,'#a98654')
    }
    r.strokeRect(bounds.x,bounds.y,bounds.w,bounds.h,'#2d1b0e',1)

    this.drawFullMapRiver(bounds)

    for(const city of CITIES){
      const point=fullMapPoint(cityWorldPoint(city),bounds)
      const runtime=state.cities[city.id]
      const faction=FACTION_BY_ID[runtime?.owner]??FACTION_BY_ID.neutral
      drawFullMapCitySymbol(r,point.x,point.y,faction.color,4.2)
    }

    const cursor=fullMapPoint(state.cursor,bounds)
    drawMapCursor(r,cursor.x,cursor.y,{width:8,height:8,color:COLORS.cyan,inner:'#1d120c',scale:.75})

    const legendX=235
    r.text(`${state.year}年 ${state.month}月`,legendX,51,7,'#e6d7b7')
    r.text('地圖符號',legendX,68,6,'#9e947e')
    const fort=this.app.assets?.getForDisplay('map.cities.neutral',17,17)
    if(!fort||!r.drawImageCentered(fort,244,88,17,17)){
      drawVectorFort(r,244,91,'#8c8c8c',.72)
    }
    r.text('城',258,84,7,'#e8dfc8')

    const village=this.app.assets?.getForDisplay('map.villages.neutral',17,17)
    if(!village||!r.drawImageCentered(village,244,111,17,17)){
      drawVectorVillage(r,244,111,.78)
    }
    r.text('村',258,107,7,'#e8dfc8')

    const mountain=this.app.assets?.getForDisplay('map.terrain.mountainA',18,14)
    if(!mountain||!r.drawImageCentered(mountain,244,135,18,14)){
      drawVectorMountain(r,244,137,0,.72)
    }
    r.text('山',258,131,7,'#e8dfc8')
    r.text('村庄位置待實機校準',264,151,5,'#837a69','center')
    r.text('START / B 返回',160,178,6,'#887f6d','center')
  }

  drawFullMapRiver(bounds) {
    return drawProjectedRiver(this.app.r,{
      project:(point)=>fullMapPoint(point,bounds),
      clip:bounds,
    })
  }

}
