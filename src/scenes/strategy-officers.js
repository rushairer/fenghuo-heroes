import { COLORS, SERIF } from '../game/constants.js'
import { COUNTRY_OVERVIEW_PAGE_SIZE, countryOverviewRows, countryOverviewWindow, moveCountryOverviewCursor } from '../game/country-overview.js'
import { CITY_BY_ID, FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { OFFICER_STATUS_FIELDS, openingOfficerListForCity, officerStatusProjection } from '../game/officer-roster.js'
import { StrategyScene as InfoStrategyScene } from './strategy-info.js'

const OFFICER_PAGE_SIZE=8

export class StrategyScene extends InfoStrategyScene {
  constructor(app) {
    super(app)
    this.officerListCity=null
    this.officerListCursor=0
    this.officerStatusRow=null
    this.countryOverviewCursor=0
    this.cityStatusReturnView='map'
  }

  update(dt,input) {
    if(this.view==='officer-list')return this.updateOfficerList(input)
    if(this.view==='officer-status')return this.updateOfficerStatus(input)
    if(this.view==='info'&&this.infoTab===0)return this.updateCountryOverview(input)
    return super.update(dt,input)
  }

  updateMap(b) {
    if(b==='A')this.syncCountryOverviewCursorToMap()
    if(this.stage==='survey'&&b==='C'){
      const state=this.app.store.state
      if(this.app.store.cityAt(state.cursor.x,state.cursor.y,12))this.cityStatusReturnView='map'
    }
    return super.updateMap(b)
  }

  syncCountryOverviewCursorToMap() {
    const state=this.app.store.state
    const current=this.app.store.cityAt(state.cursor.x,state.cursor.y,12)
    if(!current)return
    const rows=countryOverviewRows(this.app.store,{revealAll:this.infoCommandBrowse})
    const index=rows.findIndex((row)=>row.cityId===current.id)
    if(index>=0)this.countryOverviewCursor=index
  }

  updateCountryOverview(input) {
    const key=input.consume()
    if(!key)return
    const b=mdButton(key)
    if(b==='HD')return this.app.toggleHd()
    const rows=countryOverviewRows(this.app.store,{revealAll:this.infoCommandBrowse})
    if(b==='UP'&&rows.length){
      this.countryOverviewCursor=moveCountryOverviewCursor(this.countryOverviewCursor,-1,rows.length)
      this.app.audio.move()
      return
    }
    if(b==='DOWN'&&rows.length){
      this.countryOverviewCursor=moveCountryOverviewCursor(this.countryOverviewCursor,1,rows.length)
      this.app.audio.move()
      return
    }
    if(b==='B'){
      const returnView=this.infoReturnView??'map'
      this.view=returnView
      if(returnView==='commands'){
        this.infoReturnView='map'
        this.infoCommandBrowse=false
      }
      this.app.audio.cancel()
      return
    }
    // Manual evidence assigns selection to C on this list. A is intentionally
    // left unused rather than acting as a modern secondary confirm button.
    if(b!=='C')return
    // The documented 情報 command is a repeatable status browser even during
    // the command phase. Ordinary command-phase overview access remains read-only.
    if(this.stage!=='survey'&&!this.infoCommandBrowse){this.app.audio.alert();return}
    const row=rows[this.countryOverviewCursor]
    if(!row){this.app.audio.alert();return}
    this.targetCity=row.cityId
    this.cityStatusReturnView='info'
    this.view='city-status'
    this.app.audio.confirm()
  }

  updateCityStatus(b) {
    const browseOnly=this.stage==='survey'||this.infoCommandBrowse
    if(!browseOnly)return super.updateCityStatus(b)
    if(b==='B'){
      this.view=this.cityStatusReturnView==='info'?'info':'map'
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

  drawInfo() {
    if(this.infoTab===0)return this.drawCountryOverview()
    return super.drawInfo()
  }

  drawCountryOverview() {
    const r=this.app.r
    const rows=countryOverviewRows(this.app.store,{revealAll:this.infoCommandBrowse})
    const page=countryOverviewWindow(rows,this.countryOverviewCursor,COUNTRY_OVERVIEW_PAGE_SIZE)
    const pointer=this.app.assets?.getForDisplay('ui.cursors.pointer',10,10)
    r.panel(24,18,272,174,'#020202','#b07118',this.app.assets?.get('ui.panels.large'))
    r.text('統治國一覽',160,27,11,'#efd27d','center','top',SERIF,'700')
    r.line(37,44,283,44,'#72501b',.7)
    r.text('國',51,50,6,'#8f8674')
    r.text('產值',149,50,5.7,'#8f8674','right')
    r.text('將',180,50,5.7,'#8f8674','right')
    r.text('統治',220,50,5.7,'#8f8674','right')
    r.text('稅率',261,50,5.7,'#8f8674','right')
    page.rows.forEach((row,index)=>{
      const absolute=page.start+index
      const active=absolute===this.countryOverviewCursor
      const y=61+index*10.8
      if(active){
        if(!pointer||!r.drawImageCentered(pointer,39,y+4,8,8))r.text('▶',34,y,6.5,COLORS.cyan)
      }
      const faction=FACTION_BY_ID[row.owner]??FACTION_BY_ID.neutral
      const color=active?COLORS.cyan:'#e8dfc8'
      r.text(String(row.number).padStart(2,'0'),48,y,6,color)
      r.text(row.name,70,y,7.2,active?COLORS.cyan:(faction?.color??color))
      r.text(row.industry??'—',149,y,6.5,color,'right')
      r.text(row.officerCount??'—',180,y,6.5,color,'right')
      r.text(row.rule??'—',220,y,6.5,color,'right')
      r.text(row.taxRate==null?'—':`${row.taxRate}%`,261,y,6.5,color,'right')
    })
    const footer=(this.stage==='survey'||this.infoCommandBrowse)?'↑↓ 捲動　C 國狀態　B 返回':'↑↓ 捲動　B 返回'
    r.text(footer,160,178,6,'#887f6d','center')
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
    const footer=(this.stage==='command'&&!this.infoCommandBrowse)?'C 繼續選命令　B 返回':'C 武將一覽　B 返回'
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
      const pointer=this.app.assets?.getForDisplay('ui.cursors.pointer',10,10)
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
    r.panel(34,26,252,166,'#020202','#b07118',this.app.assets?.get('ui.panels.large'))
    if(!row){
      r.text('武將資料尚未建立',160,89,9,'#d9cba8','center')
      r.text('B 返回',160,178,6,'#887f6d','center')
      return
    }
    r.text(row.name,160,36,15,'#efd27d','center','top',SERIF,'700')
    r.text(row.role,160,56,7,row.role==='君主'?COLORS.cyan:'#d9cba8','center')
    r.line(47,68,273,68,'#72501b',.7)

    const columns=[OFFICER_STATUS_FIELDS.slice(0,8),OFFICER_STATUS_FIELDS.slice(8)]
    columns.forEach((fields,col)=>{
      const labelX=49+col*121
      const valueX=151+col*121
      fields.forEach((field,index)=>{
        const y=75+index*10.5
        const value=row[field.id]
        r.text(field.label,labelX,y,6.1,'#9e947e')
        r.text(value??'—',valueX,y,6.5,value==null?'#8f8674':'#eee2c3','right')
      })
    })

    r.text('原版欄位已核對 · 中文版數值未校準',160,163,5.2,'#8c8474','center')
    r.text('B 返回武將一覽',160,178,6,'#887f6d','center')
  }
}
