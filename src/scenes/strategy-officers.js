import { COLORS, SERIF } from '../game/constants.js'
import { COUNTRY_OVERVIEW_PAGE_SIZE, countryOverviewRows, countryOverviewWindow, moveCountryOverviewCursor } from '../game/country-overview.js'
import { FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { drawStrategyPanel } from '../game/ui-art.js'
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
      return this.closeInfo()
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
    drawStrategyPanel(r,24,18,272,174,'#020202','#b07118')
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
      if(active)r.text('▶',34,y,6.5,COLORS.cyan)
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
    const city=this.app.store.mapProfile?.cityById?.[this.targetCity]
    const rt=this.app.store.state.cities[this.targetCity]
    const f=FACTION_BY_ID[rt?.owner]??FACTION_BY_ID.neutral
    drawStrategyPanel(r,54,38,212,126,'#020202','#b07118')
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
    const city=this.app.store.mapProfile?.cityById?.[this.officerListCity]
    const faction=FACTION_BY_ID[projection.factionId]??FACTION_BY_ID.neutral
    const rows=projection.rows
    drawStrategyPanel(r,46,27,228,164,'#020202','#b07118')
    r.text(`${city?.name??'—'} · 武將一覽`,160,36,10,'#efd27d','center','top',SERIF,'700')
    r.text(faction?.label??'',160,52,7,faction?.color??'#ddd','center')
    r.text(projection.cityAssignmentVerified?'開局城市配屬已由證據校準':'暫顯勢力開局名冊 · 城市配屬未校準',160,63,5.5,'#918978','center')
    r.line(60,73,260,73,'#72501b',.7)

    if(!rows.length){
      r.text('此城市的可驗證武將資料尚未建立',160,105,8,'#d9cba8','center')
      r.text('不以歷史資料或其他遊戲資料補造',160,122,6,'#928a79','center')
    }else{
      const maxStart=Math.max(0,rows.length-OFFICER_PAGE_SIZE)
      const start=Math.min(maxStart,Math.max(0,this.officerListCursor-3))
      const visible=rows.slice(start,start+OFFICER_PAGE_SIZE)
      visible.forEach((row,index)=>{
        const absolute=start+index
        const y=80+index*12
        const active=absolute===this.officerListCursor
        if(active)r.text('▶',70,y,7,COLORS.cyan)
        r.text(row.role==='君主'?'君':'將',89,y,6.5,row.role==='君主'?'#efd27d':'#8f8674')
        r.text(row.name,111,y,8,active?COLORS.cyan:'#e8dfc8')
      })
    }
    r.text('↑↓ 選擇　C 武將狀態　B 返回',160,178,6,'#887f6d','center')
  }

  drawOfficerStatus() {
    const r=this.app.r
    const row=this.officerStatusRow
    // Chinese-release screenshots (劉備 and 關羽): full-screen light panel,
    // upper portrait/header and three independently ruled lower columns.
    // Coordinates are an approximate 320x224 projection of the published
    // 640px-wide captures, not a calibrated native-frame crop.
    r.clear('#000')
    r.fillRect(8,4,304,212,'#d7d7d7')
    r.strokeRect(8,4,304,212,'#20c9e8',1)
    r.strokeRect(10,6,300,208,'#fff',1)
    if(!row){
      r.text('武將資料尚未建立',160,96,10,'#111','center')
      return
    }
    const ink='#111'
    const label=(id)=>OFFICER_STATUS_FIELDS.find(field=>field.id===id).label
    const field=(id,x,y,valueX,value=row[id])=>{
      r.text(label(id),x,y,11,ink)
      r.text(value??'—',valueX,y,11,ink,'right')
    }
    // Leave the portrait slot empty until a matching HD redraw is accepted.
    r.fillRect(16,12,48,64,'#b9b9b9')
    r.strokeRect(16,12,48,64,'#fff',1)
    r.text(row.name,72,12,14,ink)
    field('level',144,12,222)
    field('rank',144,36,302,row.role==='君主'?'君主':row.rank)
    field('civilExperience',136,60,219)
    field('militaryExperience',224,60,303)
    r.line(11,94,309,94,ink,1)
    r.line(108,94,108,214,ink,1)
    r.line(204,94,204,214,ink,1)
    field('stamina',15,98,103)
    // The capture shows two numeric slots for stamina and attack, and a
    // multi-line weapon list. Secondary values have no calibrated semantics.
    r.line(71,116,103,116,ink,.5)
    r.text('—',103,120,11,ink,'right')
    field('force',15,144,103)
    field('intelligence',15,168,103)
    field('virtue',15,192,103)
    for(const [i,id] of ['loyalty','command','mobility','troops','morale'].entries()){
      field(id,112,98+i*23.5,200)
    }
    field('attack',208,98,304)
    r.text('—',304,122,11,ink,'right')
    field('weapon',208,146,304)
    r.text('—',304,170,11,ink,'right')
    r.text('—',304,194,11,ink,'right')
    // Non-original diagnostics remain outside the measured content area.
    r.text('數值／畫像未校準　B 返回',160,218,4.5,'#d7d7d7','center')
  }
}
