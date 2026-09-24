import { COLORS, SERIF } from '../game/constants.js'
import { CATEGORY_LABELS, FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { monthlyCommandPrompt } from '../game/chinese-copy-parity.js'
import { CHINESE_COPY_GAPS } from '../game/chinese-copy-gaps.js'
import { TARGET_INSPECTION_PALETTE, drawTargetHillCluster, drawTargetInspectionFort, drawTargetMapCursor, drawTargetMountainRange } from '../game/map-art.js'
import { inspectionCommandItems, inspectionCommandPath, isInspectionConfirmButton } from '../game/inspection-command-parity.js'
import { adjustTaxRate } from '../game/tax-parity.js'
import { PRESENTATION_HILL_CLUSTERS, PRESENTATION_MOUNTAIN_RANGES } from '../game/strategy-map-presentation.js'
import { drawStrategyPanel, drawStrategyTextWindow } from '../game/ui-art.js'
import { TRANSPORT_LOAD_OPTIONS, transportEligibleDestinations, transportLoadStatus, transportTargetStatus } from '../game/transport-parity.js'
import { MAP_VIEW_H, MAP_VIEW_W, cameraFor, cityWorldPoint, isVisible, toScreen } from '../game/world.js'
import { drawWorldRiver } from '../game/world-art.js'

const CATEGORIES=['domestic','diplomacy','military']
const cursorStep=8
export class StrategyScene{
  constructor(app){this.app=app;if(!app.store.hasGame()&&!app.store.load()){app.go('title');return}this.view='map';this.stage=app.store.mode==='inspection'?'survey':'march';this.menuIndex=0;this.category=app.store.inspectionCategoryForActive()??'domestic';this.message='';this.targetCity=null;this.infoTab=0;this.marchFrom=null;this.saveIndex=0;this.commandSubmenu=[];this.infoReturnView='map';this.infoCommandBrowse=false;this.taxRateDraft=0;this.taxRateOriginal=null;this.transportSource=null;this.transportDestination=null;this.transportHint='';this.transportLoadIndex=0;this.snapCursorToOwnedCity()}
  update(_dt,input){const key=input.consume();if(!key||!this.app.store.hasGame())return;const b=mdButton(key);if(b==='HD')return this.app.toggleHd();if(this.view==='message')return this.updateMessage(b);if(this.view==='category')return this.updateCategory(b);if(this.view==='target')return this.updateTarget(b);if(this.view==='commands')return this.updateCommands(b);if(this.view==='tax-rate')return this.updateTaxRate(b);if(this.view==='transport-target')return this.updateTransportTarget(b);if(this.view==='transport-load')return this.updateTransportLoad(b);if(this.view==='info')return this.updateInfo(b);if(this.view==='city-status')return this.updateCityStatus(b);if(this.view==='save')return this.updateSave(b);this.updateMap(b)}
  mapCities(){return this.app.store.mapProfile.cities}
  cityById(id){return this.app.store.mapProfile?.cityById?.[id]??null}
  moveCursor(dx,dy){const s=this.app.store.state;this.app.store.setCursor(s.cursor.x+dx*cursorStep,s.cursor.y+dy*cursorStep);this.app.audio.move()}
  updateMap(b){const store=this.app.store,s=store.state;if(b==='LEFT')this.moveCursor(-1,0);if(b==='RIGHT')this.moveCursor(1,0);if(b==='UP')this.moveCursor(0,-1);if(b==='DOWN')this.moveCursor(0,1);if(b==='B'){this.app.audio.cancel();return}if(this.stage==='survey'){if(b==='A'){this.infoTab=0;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='START'){this.infoTab=1;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='C'){const city=store.cityAt(s.cursor.x,s.cursor.y,12);if(city){this.targetCity=city.id;this.view='city-status';this.app.audio.confirm()}else{this.stage='command';this.openCategory()}}return}if(this.stage==='command'){if(b==='A'){this.infoTab=0;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='START'){this.requestFinishTurn();return}if(b==='C'){const city=store.cityAt(s.cursor.x,s.cursor.y,12),locked=store.inspectionCategoryForActive();if(!city){this.openCategory()}else if(!locked){this.message=CHINESE_COPY_GAPS.commandEntryHint.text();this.view='message';this.app.audio.alert()}else if(s.cities[city.id].owner!==store.humanFaction){this.message=CHINESE_COPY_GAPS.foreignCityCommandRejected.text();this.view='message';this.app.audio.alert()}else{this.category=locked;this.targetCity=city.id;this.view='commands';this.menuIndex=0;this.app.audio.confirm()}}return}if(this.stage==='march'){if(b==='A'){this.infoTab=1;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='START'){this.requestFinishTurn();return}if(b==='C'){this.message=CHINESE_COPY_GAPS.retiredAdjacentMarchHint.text();this.view='message';this.app.audio.alert();return}}}
  openCategory(){const locked=this.app.store.inspectionCategoryForActive();this.menuIndex=Math.max(0,CATEGORIES.indexOf(locked??this.category));this.view='category';this.app.audio.confirm()}
  updateMessage(b){if(['A','B','C','START'].includes(b)){this.view='map';this.app.audio.confirm()}}
  updateCategory(b){if(b==='UP'){this.menuIndex=(this.menuIndex+2)%3;this.app.audio.move()}if(b==='DOWN'){this.menuIndex=(this.menuIndex+1)%3;this.app.audio.move()}if(b==='B'){this.view='map';this.app.audio.cancel();return}if(isInspectionConfirmButton(b)){const next=CATEGORIES[this.menuIndex];if(!this.app.store.lockInspectionCategory(next)){const locked=this.app.store.inspectionCategoryForActive();this.message=CHINESE_COPY_GAPS.commandCategoryLocked.text(CATEGORY_LABELS[locked]);this.view='message';this.app.audio.alert();return}this.category=next;this.view='target';this.app.audio.confirm()}}
  updateTarget(b){if(b==='LEFT')this.moveCursor(-1,0);if(b==='RIGHT')this.moveCursor(1,0);if(b==='UP')this.moveCursor(0,-1);if(b==='DOWN')this.moveCursor(0,1);if(b==='B'){this.view='map';this.app.audio.cancel();return}if(isInspectionConfirmButton(b)){const s=this.app.store.state,city=this.app.store.cityAt(s.cursor.x,s.cursor.y,12);if(!city||s.cities[city.id].owner!==this.app.store.humanFaction){this.message=CHINESE_COPY_GAPS.ownCityRequired.text();this.view='message';this.app.audio.alert();return}this.targetCity=city.id;this.view='city-status';this.message=CHINESE_COPY_GAPS.confirmCategoryAtCity.text(city.name,CATEGORY_LABELS[this.category]);this.app.audio.confirm()}}
  updateCityStatus(b){if(b==='B'){this.view=this.stage==='survey'?'map':'target';this.app.audio.cancel();return}if(isInspectionConfirmButton(b)&&this.stage==='command'&&this.targetCity){this.commandSubmenu=[];this.view='commands';this.menuIndex=0;this.app.audio.confirm()}}
  updateCommands(b){
    const items=inspectionCommandItems(this.category,this.commandSubmenu)
    if(!items.length){this.commandSubmenu=[];this.view='target';this.menuIndex=0;return}
    if(b==='UP'){this.menuIndex=(this.menuIndex-1+items.length)%items.length;this.app.audio.move();return}
    if(b==='DOWN'){this.menuIndex=(this.menuIndex+1)%items.length;this.app.audio.move();return}
    if(b==='B'){
      if(this.commandSubmenu.length){
        const submenuId=this.commandSubmenu[this.commandSubmenu.length-1]
        const parentPath=this.commandSubmenu.slice(0,-1)
        const parent=inspectionCommandItems(this.category,parentPath)
        this.commandSubmenu=parentPath
        this.menuIndex=Math.max(0,parent.findIndex((item)=>item.id===submenuId))
      }else{
        this.view='target'
        this.menuIndex=0
      }
      this.app.audio.cancel()
      return
    }
    if(!isInspectionConfirmButton(b))return
    const item=items[this.menuIndex]
    if(!item)return
    if(item.kind==='submenu'){
      this.commandSubmenu=[...this.commandSubmenu,item.id]
      this.menuIndex=0
      this.app.audio.confirm()
      return
    }
    if(item.kind==='end'){
      this.commandSubmenu=[]
      this.requestFinishTurn()
      return
    }
    if(item.kind==='browser'){
      this.commandSubmenu=[]
      this.infoTab=0
      this.infoReturnView='commands'
      this.infoCommandBrowse=true
      this.syncCountryOverviewCursorToMap?.()
      this.view='info'
      this.app.audio.confirm()
      return
    }
    if(item.kind==='configuration'&&item.id==='tax'){
      this.commandSubmenu=[]
      this.beginTaxRateConfiguration()
      return
    }
    if(item.kind==='workflow'&&item.id==='transport'){
      this.commandSubmenu=[]
      this.beginTransportTargeting()
      return
    }
    this.message=this.app.store.executeInspection(item.id,this.targetCity)
    this.commandSubmenu=[]
    this.view='message'
    this.app.audio.confirm()
  }
  beginTaxRateConfiguration(){
    const city=this.app.store.state.cities[this.targetCity]
    this.taxRateOriginal=Number.isInteger(city?.taxRate)?city.taxRate:null
    this.taxRateDraft=this.taxRateOriginal??0
    this.view='tax-rate'
    this.app.audio.confirm()
  }
  updateTaxRate(b){
    if(b==='B'){
      this.view='commands'
      this.taxRateDraft=this.taxRateOriginal??0
      this.app.audio.cancel()
      return
    }
    if(b==='LEFT'||b==='RIGHT'){
      this.taxRateDraft=adjustTaxRate(this.taxRateDraft,b==='RIGHT'?1:-1)
      this.app.audio.move()
      return
    }
    if(!isInspectionConfirmButton(b))return
    try{
      this.app.store.setTaxRate(this.targetCity,this.taxRateDraft)
      this.taxRateOriginal=this.taxRateDraft
      this.view='commands'
      this.app.audio.confirm()
    }catch(error){
      this.message=error instanceof Error?error.message:'稅率設定失敗。'
      this.view='message'
      this.app.audio.alert()
    }
  }
  beginTransportTargeting(){
    const destinations=transportEligibleDestinations(this.app.store,this.targetCity)
    if(!destinations.length){
      this.message='運輸至少需要另一座本國城市；目前沒有可選目的地。'
      this.view='message'
      this.app.audio.alert()
      return
    }
    this.transportSource=this.targetCity
    this.transportDestination=null
    this.transportLoadIndex=0
    this.transportHint='選擇另一座本國城市。'
    const source=this.cityById(this.transportSource)
    if(source){
      const point=cityWorldPoint(source)
      this.app.store.setCursor(point.x,point.y)
    }
    this.view='transport-target'
    this.app.audio.confirm()
  }
  updateTransportTarget(b){
    if(b==='LEFT')this.moveCursor(-1,0)
    if(b==='RIGHT')this.moveCursor(1,0)
    if(b==='UP')this.moveCursor(0,-1)
    if(b==='DOWN')this.moveCursor(0,1)
    if(b==='B'){
      this.view='commands'
      this.transportDestination=null
      this.transportHint=''
      this.app.audio.cancel()
      return
    }
    if(!isInspectionConfirmButton(b))return
    const state=this.app.store.state
    const city=this.app.store.cityAt(state.cursor.x,state.cursor.y,12)
    const status=transportTargetStatus(this.app.store,this.transportSource,city?.id)
    if(!status.ok){
      this.transportHint=status.reason
      this.app.audio.alert()
      return
    }
    this.transportDestination=city.id
    this.transportLoadIndex=0
    this.transportHint=''
    this.view='transport-load'
    this.app.audio.confirm()
  }
  updateTransportLoad(b){
    const options=TRANSPORT_LOAD_OPTIONS
    if(b==='UP'||b==='LEFT'){
      this.transportLoadIndex=(this.transportLoadIndex-1+options.length)%options.length
      this.transportHint=''
      this.app.audio.move()
      return
    }
    if(b==='DOWN'||b==='RIGHT'){
      this.transportLoadIndex=(this.transportLoadIndex+1)%options.length
      this.transportHint=''
      this.app.audio.move()
      return
    }
    if(b==='B'){
      this.view='transport-target'
      this.transportHint='選擇另一座本國城市。'
      this.app.audio.cancel()
      return
    }
    if(!isInspectionConfirmButton(b))return
    const option=options[this.transportLoadIndex]
    const status=transportLoadStatus(this.app.store,this.transportSource,option?.id)
    if(!status.ok){
      this.transportHint=status.reason
      this.app.audio.alert()
      return
    }
    const from=this.cityById(this.transportSource)?.name??this.transportSource
    const to=this.cityById(this.transportDestination)?.name??this.transportDestination
    this.message=`運輸：${from} → ${to}，${option.label}。原作裝載檔位已校準；運輸隊移動與截獲時序尚未校準，本次不扣除資源。`
    this.view='message'
    this.app.audio.confirm()
  }
  updateInfo(b){if(b==='LEFT'){this.infoTab=(this.infoTab+2)%3;this.app.audio.move()}if(b==='RIGHT'){this.infoTab=(this.infoTab+1)%3;this.app.audio.move()}if(b==='B'||b==='A'||b==='C'){this.view='map';this.app.audio.cancel()}}
  requestFinishTurn(){if(this.app.store.mode==='inspection'&&this.app.store.isLastHumanTurn){this.saveIndex=0;this.view='save';this.app.audio.confirm();return}this.finishTurn()}
  updateSave(b){if(['LEFT','RIGHT','UP','DOWN'].includes(b)){this.saveIndex=1-this.saveIndex;this.app.audio.move()}if(b==='B'){this.view='map';this.app.audio.cancel();return}if(b==='A'||b==='C'||b==='START'){if(this.saveIndex===0)this.app.store.save();this.finishTurn()}}
  finishTurn(){this.app.store.finishCurrentTurn();this.app.audio.confirm();this.resetForActiveTurn()}
  resetForActiveTurn(){this.view='map';this.stage=this.app.store.mode==='inspection'?'survey':'march';this.category=this.app.store.inspectionCategoryForActive()??'domestic';this.menuIndex=0;this.commandSubmenu=[];this.infoReturnView='map';this.infoCommandBrowse=false;this.taxRateDraft=0;this.taxRateOriginal=null;this.transportSource=null;this.transportDestination=null;this.transportHint='';this.transportLoadIndex=0;this.targetCity=null;this.marchFrom=null;this.snapCursorToOwnedCity()}
  snapCursorToOwnedCity(){const store=this.app.store,city=this.mapCities().find((c)=>store.state.cities[c.id].owner===store.humanFaction);if(city){const p=cityWorldPoint(city);store.setCursor(p.x,p.y)}}
  draw(){if(!this.app.store.hasGame())return;const r=this.app.r;r.clear('#8f6f43');this.drawWorld();this.drawDialog();if(this.view==='category')this.drawCategory();if(this.view==='target')this.drawTargetHint();if(this.view==='commands')this.drawCommands();if(this.view==='tax-rate')this.drawTaxRate();if(this.view==='transport-target')this.drawTransportTargetHint();if(this.view==='transport-load')this.drawTransportLoad();if(this.view==='message')this.drawMessage();if(this.view==='info')this.drawInfo();if(this.view==='city-status')this.drawCityStatus();if(this.view==='save')this.drawSave();r.scanlines(.018)}
  drawWorld(){const r=this.app.r,state=this.app.store.state,camera=cameraFor(state.cursor);r.fillRect(0,0,MAP_VIEW_W,MAP_VIEW_H,'#aa8050');for(const feature of PRESENTATION_MOUNTAIN_RANGES){if(!isVisible(feature,camera,34))continue;const p=toScreen(feature,camera);this.drawMountain(p.x,p.y,feature.variant,feature.scale)}for(const feature of PRESENTATION_HILL_CLUSTERS){if(!isVisible(feature,camera,22))continue;const p=toScreen(feature,camera);this.drawForest(p.x,p.y,feature.variant,feature.scale)}drawWorldRiver(r,{camera,widthScale:1.34});for(const city of this.mapCities()){const wp=cityWorldPoint(city);if(!isVisible(wp,camera,20))continue;const sp=toScreen(wp,camera);this.drawCity(city,sp.x,sp.y)}const cursor=toScreen(state.cursor,camera);drawTargetMapCursor(r,cursor.x,cursor.y,{width:16,height:16,scale:.92})}
  drawMountain(x,y,index=0,scale=1){drawTargetMountainRange(this.app.r,x,y,index,1.02*scale)}
  drawForest(x,y,index=0,scale=1){drawTargetHillCluster(this.app.r,x,y,index,.9*scale)}
  drawCity(city,x,y){const rt=this.app.store.state.cities[city.id],f=FACTION_BY_ID[rt.owner]??FACTION_BY_ID.neutral;drawTargetInspectionFort(this.app.r,x,y,f.color,.88)}
  drawDialog(){const r=this.app.r,s=this.app.store.state,p=s.cursor,city=this.app.store.cityAt(p.x,p.y,12),ruler=FACTION_BY_ID[this.app.store.humanFaction]?.ruler??'';let line1='',line2='';if(this.stage==='survey'){line1=city?`${city.name}的情況。按 C 查看國力。`:'狀況視察：移動方框查看各地。';line2='A 統治國一覽　START 全體地圖　空白處 C 進入本月命令'}else if(this.stage==='command'){const locked=this.app.store.inspectionCategoryForActive();line1=locked?`${ruler}，本月執行「${CATEGORY_LABELS[locked]}」。`:monthlyCommandPrompt(ruler);line2=locked?'把方框移到本國城池按 C　START 結束本月':'把方框移到空白處按 C 決定 內政／外交／軍備'}else{line1=city?`行軍：${city.name}`:'行軍：選擇出發城。';line2='本國城池按 C 編成行軍　START 結束本月'}const box=drawStrategyTextWindow(r,0,MAP_VIEW_H,MAP_VIEW_W,224-MAP_VIEW_H);r.text(line1,box.textX,box.primaryTextY,9,'#171717','left','top',SERIF,'600');r.text(line2,box.textX,box.secondaryTextY,6.5,'#423d37')}
  drawCategory(){const r=this.app.r,ruler=FACTION_BY_ID[this.app.store.humanFaction]?.ruler??'';drawStrategyPanel(r,78,54,164,91,'#000','#a86d14');r.text(monthlyCommandPrompt(ruler),160,64,9,'#f0e2bd','center','top',SERIF,'600');CATEGORIES.forEach((k,i)=>r.text(`${i===this.menuIndex?'▶':'　'}${CATEGORY_LABELS[k]}`,122,88+i*16,10,i===this.menuIndex?COLORS.cyan:'#e9e0c8'))}
  drawTargetHint(){const r=this.app.r;drawStrategyPanel(r,72,184,176,31,'#000','#9b6514');r.text(`${CATEGORY_LABELS[this.category]}：選擇本國城池`,160,192,8,COLORS.cyan,'center');r.text('C 決定　B 返回',160,205,6,'#9c927f','center')}
  drawCityStatus(){const r=this.app.r,city=this.cityById(this.targetCity),rt=this.app.store.state.cities[this.targetCity],f=FACTION_BY_ID[rt?.owner]??FACTION_BY_ID.neutral;drawStrategyPanel(r,54,38,212,126,'#020202','#b07118');r.text(city?.name??'',160,48,15,'#f0d477','center','top',SERIF,'700');r.text(f?.label??'',160,70,8,f?.color??'#fff','center');const rows=[['兵力',rt?.troops],['金',rt?.gold],['米',rt?.food],['產值',rt?.development],['統治',rt?.rule],['防衛',rt?.defense],['訓練',rt?.training]];rows.forEach(([label,value],i)=>{const col=i<4?0:1,row=col===0?i:i-4;r.text(label,75+col*101,91+row*15,7,'#9e947e');r.text(value??'—',139+col*101,91+row*15,7,'#eee2c3','right')});r.text(this.stage==='command'?'C 繼續選命令　B 返回':'B/C 返回',160,148,6,'#847b69','center')}
  drawCommands(){
    const r=this.app.r
    const items=inspectionCommandItems(this.category,this.commandSubmenu)
    const path=inspectionCommandPath(this.category,this.commandSubmenu).join(' · ')
    const h=35+items.length*14
    const y=Math.max(22,105-h/2)
    drawStrategyPanel(r,88,y,144,h,'#000','#9b6514')
    r.text(`${this.cityById(this.targetCity)?.name??''} · ${path}`,160,y+8,7.5,'#e8cc73','center')
    items.forEach((item,i)=>{
      const active=i===this.menuIndex
      const rowY=y+24+i*14
      if(active)r.text('▶',102,rowY,7,COLORS.cyan)
      r.text(item.label,119,rowY,8,active?COLORS.cyan:'#e8dfc8')
      if(item.kind==='submenu')r.text('›',213,rowY,8,active?COLORS.cyan:'#9c927f','right')
    })
  }
  drawTaxRate(){
    const r=this.app.r
    const city=this.cityById(this.targetCity)
    drawStrategyPanel(r,84,66,152,91,'#000','#9b6514')
    r.text(`${city?.name??'—'} · 稅率`,160,77,10,'#efd27d','center','top',SERIF,'700')
    r.text(`${this.taxRateDraft}%`,160,103,20,COLORS.cyan,'center','top',SERIF,'700')
    const previous=this.taxRateOriginal==null?'未設定':`${this.taxRateOriginal}%`
    r.text(`目前：${previous}`,160,130,6,'#9c927f','center')
    r.text('← → 調整　C 決定　B 取消',160,143,6,'#b9ad91','center')
  }
  drawTransportTargetHint(){
    const r=this.app.r
    const source=this.cityById(this.transportSource)
    drawStrategyPanel(r,52,181,216,37,'#000','#9b6514')
    r.text(`運輸：${source?.name??'—'} → 選擇本國城`,160,189,7.5,COLORS.cyan,'center')
    r.text(this.transportHint||'C 決定　B 返回',160,203,6,'#b5a88b','center')
  }
  drawTransportLoad(){
    const r=this.app.r
    const source=this.cityById(this.transportSource)
    const destination=this.cityById(this.transportDestination)
    const runtime=this.app.store.state.cities[this.transportSource]
    drawStrategyPanel(r,75,47,170,128,'#000','#9b6514')
    r.text(`${source?.name??'—'} → ${destination?.name??'—'}`,160,58,9,'#efd27d','center','top',SERIF,'700')
    r.text(`所持　金${runtime?.gold??0}　米${runtime?.food??0}`,160,75,6.5,'#a99d82','center')
    TRANSPORT_LOAD_OPTIONS.forEach((option,index)=>{
      const active=index===this.transportLoadIndex
      const available=transportLoadStatus(this.app.store,this.transportSource,option.id).ok
      const color=active?COLORS.cyan:available?'#e8dfc8':'#625d54'
      r.text(`${active?'▶':'　'}${option.label}`,105,94+index*19,8,color)
      if(!available)r.text('不足',218,94+index*19,6,'#7b6155','right')
    })
    r.text(this.transportHint||'↑↓ 選擇　C 決定　B 返回',160,157,6,'#b5a88b','center')
  }
  drawMessage(){const r=this.app.r;drawStrategyPanel(r,40,77,240,65,'#000','#b07118');r.wrapText(this.message,160,90,208,11,8,'#f0e4c5','center');r.text('A / B / C 關閉',160,126,6,'#8a806e','center')}
  drawInfo(){
    const r=this.app.r,s=this.app.store.state
    drawStrategyPanel(r,18,20,284,170,'#020202','#b07118')
    const tabs=['統治國一覽','全體地圖','武將狀態']
    tabs.forEach((title,index)=>r.text(title,66+index*94,30,8,index===this.infoTab?COLORS.cyan:'#777','center'))
    r.line(28,45,292,45,'#7b4e12',1)
    if(this.infoTab===0){
      const list=this.mapCities().filter((city)=>s.cities[city.id].owner===this.app.store.humanFaction).slice(0,15)
      list.forEach((city,index)=>{
        const runtime=s.cities[city.id],col=index>=8?1:0,row=index%8
        r.text(`${city.name} 兵${runtime.troops}`,34+col*133,56+row*14,7,'#e8dfc8')
      })
    }else{
      r.text('此頁由專用 parity renderer 提供',160,96,7,'#9e9582','center')
    }
    r.text('← → 切換　A/B/C 返回',160,176,6,'#887f6d','center')
  }
  drawSave(){const r=this.app.r;drawStrategyPanel(r,79,73,162,76,'#000','#b07118');r.text('是否保存遊戲？',160,84,10,'#eee2c3','center','top',SERIF,'600');['是','否'].forEach((v,i)=>r.text(`${i===this.saveIndex?'▶':'　'}${v}`,160,106+i*15,8,i===this.saveIndex?COLORS.cyan:'#d4c8a9','center'))}
}
