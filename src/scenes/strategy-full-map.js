import { COLORS, SERIF } from '../game/constants.js'
import { CITIES, FACTION_BY_ID } from '../game/data.js'
import { FULL_MAP_BOUNDS, FULL_MAP_RIVER, fullMapPoint } from '../game/full-map.js'
import { mdButton } from '../game/input.js'
import { cityWorldPoint } from '../game/world.js'
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
      r.fillRect(point.x-1.7,point.y-1.7,3.4,3.4,'#1c130d')
      r.fillRect(point.x-1.1,point.y-1.1,2.2,2.2,faction.color)
    }

    const cursor=fullMapPoint(state.cursor,bounds)
    r.strokeRect(cursor.x-3.5,cursor.y-3.5,7,7,COLORS.cyan,.8)

    const legendX=235
    r.text(`${state.year}年 ${state.month}月`,legendX,51,7,'#e6d7b7')
    r.text('地圖符號',legendX,68,6,'#9e947e')
    const fort=this.app.assets?.getForDisplay('map.cities.neutral',17,17)
    if(!fort||!r.drawImageCentered(fort,244,88,17,17)){
      r.fillRect(239,83,10,8,'#8c6b43')
      r.strokeRect(238,82,12,10,'#2a1c13',.5)
    }
    r.text('城',258,84,7,'#e8dfc8')

    const village=this.app.assets?.getForDisplay('map.villages.neutral',17,17)
    if(!village||!r.drawImageCentered(village,244,111,17,17)){
      r.fillRect(239,107,10,6,'#9d8059')
    }
    r.text('村',258,107,7,'#e8dfc8')

    const mountain=this.app.assets?.getForDisplay('map.terrain.mountainA',18,14)
    if(!mountain||!r.drawImageCentered(mountain,244,135,18,14)){
      r.text('▲',244,128,10,'#7b5638','center')
    }
    r.text('山',258,131,7,'#e8dfc8')
    r.text('村庄位置待實機校準',264,151,5,'#837a69','center')
    r.text('START / B 返回',160,178,6,'#887f6d','center')
  }

  drawFullMapRiver(bounds) {
    const r=this.app.r
    const c=r.ctx
    const S=r.S
    const project=(point)=>fullMapPoint(point,bounds)
    const start=project(FULL_MAP_RIVER.start)
    c.save()
    c.beginPath()
    c.rect(bounds.x*S,bounds.y*S,bounds.w*S,bounds.h*S)
    c.clip()
    c.beginPath()
    c.moveTo(start.x*S,start.y*S)
    for(const curve of FULL_MAP_RIVER.curves){
      const [a,b,end]=curve.map(project)
      c.bezierCurveTo(a.x*S,a.y*S,b.x*S,b.y*S,end.x*S,end.y*S)
    }
    c.lineCap='round'
    c.lineJoin='round'
    c.strokeStyle='#644b30'
    c.lineWidth=5*S
    c.stroke()
    c.strokeStyle='#0b55d8'
    c.lineWidth=3.4*S
    c.stroke()
    c.restore()
  }
}
