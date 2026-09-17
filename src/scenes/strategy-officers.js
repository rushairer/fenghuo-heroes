import { COLORS, SERIF } from '../game/constants.js'
import { CITY_BY_ID, FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { openingOfficerListForCity, officerStatusProjection } from '../game/officer-roster.js'
import { StrategyScene as InfoStrategyScene } from './strategy-info.js'

const OFFICER_PAGE_SIZE=8

export class StrategyScene extends InfoStrategyScene {
  constructor(app) {
    super(app)
    this.officerListCity=null
    this.officerListCursor=0
    this.officerStatusRow=null
  }

  update(dt,input) {
    if(this.view==='officer-list')return this.updateOfficerList(input)
    if(this.view==='officer-status')return this.updateOfficerStatus(input)
    return super.update(dt,input)
  }

  updateCityStatus(b) {
    if(this.stage!=='survey')return super.updateCityStatus(b)
    if(b==='B'){
      this.view='map'
      this.app.audio.cancel()
      return
    }
    // The original manual assigns C to the country -> officer-list drilldown.
    // A is deliberately left unused here rather than being treated as another
    // confirmation button.
    if(b==='C')this.openOfficerList(this.targetCity)
  }

  openOfficerList(cityId) {
    this.officerListCity=cityId
    this.officerListCursor=0
    this.officerStatusRow=null
    this.view='officer-list'
    this.app.audio.confirm()
  }

  officerListProjection() {
    return openingOfficerListForCity(this.app.store,this.officerListCity)
  }

  updateOfficerList(input) {
    const key=input.consume()
    if(!key)return
    const b=mdButton(key)
    if(b==='HD')return this.app.toggleHd()
    const projection=this.officerListProjection()
    const rows=projection.rows
    if(b==='B'){
      this.view='city-status'
      this.app.audio.cancel()
      return
    }
    if(b==='UP'&&rows.length){
      this.officerListCursor=(this.officerListCursor-1+rows.length)%rows.length
      this.app.audio.move()
      return
    }
    if(b==='DOWN'&&rows.length){
      this.officerListCursor=(this.officerListCursor+1)%rows.length
      this.app.audio.move()
      return
    }
    if(b!=='C')return
    const row=rows[this.officerListCursor]
    if(!row){this.app.audio.alert();return}
    this.officerStatusRow=officerStatusProjection(row)
    this.view='officer-status'
    this.app.audio.confirm()
  }

  updateOfficerStatus(input) {
    const key=input.consume()
    if(!key)return
    const b=mdButton(key)
    if(b==='HD')return this.app.toggleHd()
    if(b==='B'){
      this.view='officer-list'
      this.app.audio.cancel()
    }
  }

  draw() {
    super.draw()
    if(this.view==='officer-list')this.drawOfficerList()
    if(this.view==='officer-status')this.drawOfficerStatus()
  }

  drawCityStatus() {
    const r=this.app.r
    const city=CITY_BY_ID[this.targetCity]
    const rt=this.app.store.state.cities[this.targetCity]
    const f=FACTION_BY_ID[rt?.owner]??FACTION_BY_ID.neutral
    r.panel(54,38,212,126,'#020202','#b07118',this.app.assets?.get('ui.panels.large'))
    r.text(city?.name??'',160,48,15,'#f0d477','center','top',SERIF,'700')
    r.text(f?.label??'',160,70,8,f?.color??'#fff','center')
    const rows=[['兵力',rt?.troops],['金',rt?.gold],['米',rt?.food],['產值',rt?.development],['統治',rt?.rule],['防衛',rt?.defense],['訓練',rt?.training]]
    rows.forEach(([label,value],i)=>{
      const col=i<4?0:1,row=col===0?i:i-4
      r.text(label,75+col*101,91+row*15,7,'#9e947e')
      r.text(value??'—',139+col*101,91+row*15,7,'#eee2c3','right')
    })
    const footer=this.stage==='command'?'C 繼續選命令　B 返回':'C 武將一覽　B 返回'
    r.text(footer,160,148,6,'#847b69','center')
  }

  drawOfficerList() {
    const r=this.app.r
    const projection=this.officerListProjection()
    const city=CITY_BY_ID[this.officerListCity]
    const faction=FACTION_BY_ID[projection.factionId]??FACTION_BY_ID.neutral
    const rows=projection.rows
    r.panel(46,27,228,164,'#020202','#b07118',this.app.assets?.get('ui.panels.large'))
    r.text(`${city?.name??'—'} · 武將一覽`,160,36,10,'#efd27d','center','top',SERIF,'700')
    r.text(faction?.label??'',160,52,7,faction?.color??'#ddd','center')
    r.text('暫顯勢力開局名冊 · 城市配屬未校準',160,63,5.5,'#918978','center')
    r.line(60,73,260,73,'#72501b',.7)

    if(!rows.length){
      r.text('此城市的可驗證武將資料尚未建立',160,105,8,'#d9cba8','center')
      r.text('不以歷史資料或其他遊戲資料補造',160,122,6,'#928a79','center')
    }else{
      const maxStart=Math.max(0,rows.length-OFFICER_PAGE_SIZE)
      const start=Math.min(maxStart,Math.max(0,this.officerListCursor-3))
      const visible=rows.slice(start,start+OFFICER_PAGE_SIZE)
      const pointer=this.app.assets?.get('ui.cursors.pointer')
      visible.forEach((row,index)=>{
        const absolute=start+index
        const y=80+index*12
        const active=absolute===this.officerListCursor
        if(active){
          if(!pointer||!r.drawImageCentered(pointer,75,y+4,10,10))r.text('▶',70,y,7,COLORS.cyan)
        }
        r.text(row.role==='君主'?'君':'將',89,y,6.5,row.role==='君主'?'#efd27d':'#8f8674')
        r.text(row.name,111,y,8,active?COLORS.cyan:'#e8dfc8')
      })
    }
    r.text('↑↓ 選擇　C 武將狀態　B 返回',160,178,6,'#887f6d','center')
  }

  drawOfficerStatus() {
    const r=this.app.r
    const row=this.officerStatusRow
    r.panel(55,31,210,158,'#020202','#b07118',this.app.assets?.get('ui.panels.large'))
    if(!row){
      r.text('武將資料尚未建立',160,89,9,'#d9cba8','center')
      r.text('B 返回',160,174,6,'#887f6d','center')
      return
    }
    r.text(row.name,160,42,15,'#efd27d','center','top',SERIF,'700')
    r.text(row.role,160,65,7,row.role==='君主'?COLORS.cyan:'#d9cba8','center')
    const fields=[['等級',row.level],['武力',row.force],['知力',row.intelligence],['德',row.virtue],['忠誠',row.loyalty]]
    fields.forEach(([label,value],index)=>{
      const y=84+index*15
      r.text(label,92,y,7,'#9e947e')
      r.text(value??'未校準',219,y,7,value==null?'#8f8674':'#eee2c3','right')
    })
    r.text('姓名／身份来自已验证开局名册；属性等待中文版实机校准',160,163,5.2,'#8c8474','center')
    r.text('B 返回武將一覽',160,176,6,'#887f6d','center')
  }
}
