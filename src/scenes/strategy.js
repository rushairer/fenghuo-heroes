import { COLORS, SERIF } from '../game/constants.js'
import { CATEGORY_LABELS, CITIES, CITY_BY_ID, FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { inspectionCommandItems, inspectionCommandPath, isInspectionConfirmButton } from '../game/inspection-command-parity.js'
import { MAP_VIEW_H, MAP_VIEW_W, WORLD_H, WORLD_W, cameraFor, cityWorldPoint, isVisible, toScreen, worldPoint } from '../game/world.js'

const CATEGORIES=['domestic','diplomacy','military']
const cursorStep=8
export class StrategyScene{
  constructor(app){this.app=app;if(!app.store.hasGame()&&!app.store.load()){app.go('title');return}this.view='map';this.stage=app.store.mode==='inspection'?'survey':'march';this.menuIndex=0;this.category=app.store.inspectionCategoryForActive()??'domestic';this.message='';this.targetCity=null;this.infoTab=0;this.marchFrom=null;this.marchTargets=[];this.marchIndex=0;this.saveIndex=0;this.commandSubmenu=null;this.infoReturnView='map';this.infoCommandBrowse=false;this.snapCursorToOwnedCity()}
  update(_dt,input){const key=input.consume();if(!key||!this.app.store.hasGame())return;const b=mdButton(key);if(b==='HD')return this.app.toggleHd();if(this.view==='message')return this.updateMessage(b);if(this.view==='category')return this.updateCategory(b);if(this.view==='target')return this.updateTarget(b);if(this.view==='commands')return this.updateCommands(b);if(this.view==='march-dest')return this.updateMarchDest(b);if(this.view==='info')return this.updateInfo(b);if(this.view==='city-status')return this.updateCityStatus(b);if(this.view==='save')return this.updateSave(b);this.updateMap(b)}
  moveCursor(dx,dy){const s=this.app.store.state;this.app.store.setCursor(s.cursor.x+dx*cursorStep,s.cursor.y+dy*cursorStep);this.app.audio.move()}
  updateMap(b){const store=this.app.store,s=store.state;if(b==='LEFT')this.moveCursor(-1,0);if(b==='RIGHT')this.moveCursor(1,0);if(b==='UP')this.moveCursor(0,-1);if(b==='DOWN')this.moveCursor(0,1);if(b==='B'){this.app.audio.cancel();return}if(this.stage==='survey'){if(b==='A'){this.infoTab=0;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='START'){this.infoTab=1;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='C'){const city=store.cityAt(s.cursor.x,s.cursor.y,12);if(city){this.targetCity=city.id;this.view='city-status';this.app.audio.confirm()}else{this.stage='command';this.openCategory()}}return}if(this.stage==='command'){if(b==='A'){this.infoTab=0;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='START'){this.requestFinishTurn();return}if(b==='C'){const city=store.cityAt(s.cursor.x,s.cursor.y,12),locked=store.inspectionCategoryForActive();if(!city){this.openCategory()}else if(!locked){this.message='先把方框移到地图空白处按 C，决定本月是内政、外交还是军备。';this.view='message';this.app.audio.alert()}else if(s.cities[city.id].owner!==store.humanFaction){this.message='只能向本国城池下令。';this.view='message';this.app.audio.alert()}else{this.category=locked;this.targetCity=city.id;this.view='commands';this.menuIndex=0;this.app.audio.confirm()}}return}if(this.stage==='march'){if(b==='A'){this.infoTab=1;this.infoReturnView='map';this.infoCommandBrowse=false;this.view='info';this.app.audio.confirm();return}if(b==='START'){this.requestFinishTurn();return}if(b==='C'){const city=store.cityAt(s.cursor.x,s.cursor.y,12);if(!city||s.cities[city.id].owner!==store.humanFaction){this.message='行军时请把方框移到本国城池后按 C。';this.view='message';this.app.audio.alert()}else{this.marchFrom=city.id;this.marchTargets=[...city.neighbors];this.marchIndex=0;this.view='march-dest';this.app.audio.confirm()}}}}
  openCategory(){const locked=this.app.store.inspectionCategoryForActive();this.menuIndex=Math.max(0,CATEGORIES.indexOf(locked??this.category));this.view='category';this.app.audio.confirm()}
  updateMessage(b){if(['A','B','C','START'].includes(b)){this.view='map';this.app.audio.confirm()}}
  updateCategory(b){if(b==='UP'){this.menuIndex=(this.menuIndex+2)%3;this.app.audio.move()}if(b==='DOWN'){this.menuIndex=(this.menuIndex+1)%3;this.app.audio.move()}if(b==='B'){this.view='map';this.app.audio.cancel();return}if(isInspectionConfirmButton(b)){const next=CATEGORIES[this.menuIndex];if(!this.app.store.lockInspectionCategory(next)){const locked=this.app.store.inspectionCategoryForActive();this.message=`本月已经决定执行「${CATEGORY_LABELS[locked]}」，不能再改成其他类别。`;this.view='message';this.app.audio.alert();return}this.category=next;this.view='target';this.app.audio.confirm()}}
  updateTarget(b){if(b==='LEFT')this.moveCursor(-1,0);if(b==='RIGHT')this.moveCursor(1,0);if(b==='UP')this.moveCursor(0,-1);if(b==='DOWN')this.moveCursor(0,1);if(b==='B'){this.view='map';this.app.audio.cancel();return}if(isInspectionConfirmButton(b)){const s=this.app.store.state,city=this.app.store.cityAt(s.cursor.x,s.cursor.y,12);if(!city||s.cities[city.id].owner!==this.app.store.humanFaction){this.message='请选择本国城池。';this.view='message';this.app.audio.alert();return}this.targetCity=city.id;this.view='city-status';this.message=`确定在「${city.name}」执行${CATEGORY_LABELS[this.category]}？`;this.app.audio.confirm()}}
  updateCityStatus(b){if(b==='B'){this.view=this.stage==='survey'?'map':'target';this.app.audio.cancel();return}if(isInspectionConfirmButton(b)&&this.stage==='command'&&this.targetCity){this.commandSubmenu=null;this.view='commands';this.menuIndex=0;this.app.audio.confirm()}}
  updateCommands(b){
    const items=inspectionCommandItems(this.category,this.commandSubmenu)
    if(!items.length){this.commandSubmenu=null;this.view='target';this.menuIndex=0;return}
    if(b==='UP'){this.menuIndex=(this.menuIndex-1+items.length)%items.length;this.app.audio.move();return}
    if(b==='DOWN'){this.menuIndex=(this.menuIndex+1)%items.length;this.app.audio.move();return}
    if(b==='B'){
      if(this.commandSubmenu){
        const submenuId=this.commandSubmenu
        this.commandSubmenu=null
        const parent=inspectionCommandItems(this.category)
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
      this.commandSubmenu=item.id
      this.menuIndex=0
      this.app.audio.confirm()
      return
    }
    if(item.kind==='end'){
      this.commandSubmenu=null
      this.requestFinishTurn()
      return
    }
    if(item.kind==='browser'){
      this.commandSubmenu=null
      this.infoTab=0
      this.infoReturnView='commands'
      this.infoCommandBrowse=true
      this.syncCountryOverviewCursorToMap?.()
      this.view='info'
      this.app.audio.confirm()
      return
    }
    this.message=this.app.store.executeInspection(item.id,this.targetCity)
    this.commandSubmenu=null
    this.view='message'
    this.app.audio.confirm()
  }
  updateMarchDest(b){if(!this.marchTargets.length){this.view='map';return}if(b==='LEFT'||b==='UP'){this.marchIndex=(this.marchIndex-1+this.marchTargets.length)%this.marchTargets.length;this.app.audio.move()}if(b==='RIGHT'||b==='DOWN'){this.marchIndex=(this.marchIndex+1)%this.marchTargets.length;this.app.audio.move()}if(b==='B'){this.view='map';this.app.audio.cancel();return}if(b==='A'||b==='C'){const target=this.marchTargets[this.marchIndex];try{const conflict=this.app.store.planMarch(this.marchFrom,target);this.app.audio.confirm();if(conflict)this.app.go('siege');else this.resetForActiveTurn()}catch(error){this.message=error instanceof Error?error.message:'行军失败';this.view='message';this.app.audio.alert()}}}
  updateInfo(b){if(b==='LEFT'){this.infoTab=(this.infoTab+2)%3;this.app.audio.move()}if(b==='RIGHT'){this.infoTab=(this.infoTab+1)%3;this.app.audio.move()}if(b==='B'||b==='A'||b==='C'){this.view='map';this.app.audio.cancel()}}
  requestFinishTurn(){if(this.app.store.mode==='inspection'&&this.app.store.isLastHumanTurn){this.saveIndex=0;this.view='save';this.app.audio.confirm();return}this.finishTurn()}
  updateSave(b){if(['LEFT','RIGHT','UP','DOWN'].includes(b)){this.saveIndex=1-this.saveIndex;this.app.audio.move()}if(b==='B'){this.view='map';this.app.audio.cancel();return}if(b==='A'||b==='C'||b==='START'){if(this.saveIndex===0)this.app.store.save();this.finishTurn()}}
  finishTurn(){this.app.store.finishCurrentTurn();this.app.audio.confirm();this.resetForActiveTurn()}
  resetForActiveTurn(){this.view='map';this.stage=this.app.store.mode==='inspection'?'survey':'march';this.category=this.app.store.inspectionCategoryForActive()??'domestic';this.menuIndex=0;this.commandSubmenu=null;this.infoReturnView='map';this.infoCommandBrowse=false;this.targetCity=null;this.marchFrom=null;this.marchTargets=[];this.marchIndex=0;this.snapCursorToOwnedCity()}
  snapCursorToOwnedCity(){const store=this.app.store,city=CITIES.find((c)=>store.state.cities[c.id].owner===store.humanFaction);if(city){const p=cityWorldPoint(city);store.setCursor(p.x,p.y)}}
  draw(){if(!this.app.store.hasGame())return;const r=this.app.r;r.clear('#8f6f43');this.drawWorld();this.drawDialog();if(this.view==='category')this.drawCategory();if(this.view==='target')this.drawTargetHint();if(this.view==='commands')this.drawCommands();if(this.view==='march-dest')this.drawMarch();if(this.view==='message')this.drawMessage();if(this.view==='info')this.drawInfo();if(this.view==='city-status')this.drawCityStatus();if(this.view==='save')this.drawSave();r.scanlines(.018)}
  drawWorld(){const r=this.app.r,c=r.ctx,state=this.app.store.state,camera=cameraFor(state.cursor);r.fillRect(0,0,MAP_VIEW_W,MAP_VIEW_H,'#a98654');const grid=32;for(let wx=Math.floor(camera.x/grid)*grid;wx<=camera.x+MAP_VIEW_W;wx+=grid){const x=wx-camera.x;r.line(x,0,x,MAP_VIEW_H,'#85663e',.3,.18)}for(let wy=Math.floor(camera.y/grid)*grid;wy<=camera.y+MAP_VIEW_H;wy+=grid){const y=wy-camera.y;r.line(0,y,MAP_VIEW_W,y,'#c09b65',.3,.16)}c.save();c.translate(-camera.x*r.S,-camera.y*r.S);c.strokeStyle='#0639b8';c.lineWidth=18*r.S;c.lineCap='round';c.beginPath();c.moveTo(236*r.S,16*r.S);c.bezierCurveTo(250*r.S,74*r.S,322*r.S,105*r.S,365*r.S,170*r.S);c.bezierCurveTo(402*r.S,231*r.S,492*r.S,265*r.S,640*r.S,316*r.S);c.stroke();c.strokeStyle='#0b55d8';c.lineWidth=10*r.S;c.stroke();c.restore();const mountains=[[31,42],[48,31],[63,55],[87,44],[108,65],[136,39],[160,49],[199,41],[230,59],[267,50],[286,83],[78,94],[115,105],[57,133],[134,143],[222,120],[245,137],[98,176],[170,185],[270,177]];for(const ref of mountains){const wp=worldPoint({x:ref[0],y:ref[1]});if(isVisible(wp,camera,12)){const sp=toScreen(wp,camera);this.drawMountain(sp.x,sp.y)}}const forests=[[270,109],[287,119],[226,153],[187,156],[41,113],[67,155],[112,189],[248,191],[181,118],[25,188]];for(const ref of forests){const wp=worldPoint({x:ref[0],y:ref[1]});if(isVisible(wp,camera,12)){const sp=toScreen(wp,camera);this.drawForest(sp.x,sp.y)}}const seen=new Set();for(const city of CITIES){const aw=cityWorldPoint(city);for(const n of city.neighbors){const k=[city.id,n].sort().join(':');if(seen.has(k))continue;seen.add(k);const bw=cityWorldPoint(CITY_BY_ID[n]),a=toScreen(aw,camera),b=toScreen(bw,camera);if((a.x<-24&&b.x<-24)||(a.x>MAP_VIEW_W+24&&b.x>MAP_VIEW_W+24)||(a.y<-24&&b.y<-24)||(a.y>MAP_VIEW_H+24&&b.y>MAP_VIEW_H+24))continue;r.line(a.x,a.y,b.x,b.y,'#6b542f',.55,.42)}}if(this.view==='march-dest'){const ad=CITY_BY_ID[this.marchFrom],bd=CITY_BY_ID[this.marchTargets[this.marchIndex]];if(ad&&bd){const a=toScreen(cityWorldPoint(ad),camera),b=toScreen(cityWorldPoint(bd),camera);r.line(a.x,a.y,b.x,b.y,'#fff08a',1.4,1);r.strokeRect(b.x-6,b.y-6,12,12,'#fff08a',1)}}for(const city of CITIES){const wp=cityWorldPoint(city);if(!isVisible(wp,camera,12))continue;const sp=toScreen(wp,camera);this.drawCity(city,sp.x,sp.y)}const cursor=toScreen(state.cursor,camera);r.strokeRect(cursor.x-7,cursor.y-5,14,10,'#fff5a4',1.2);r.strokeRect(cursor.x-5,cursor.y-3,10,6,'#3c2510',.45);const f=FACTION_BY_ID[this.app.store.humanFaction];r.fillRect(4,4,106,16,'rgba(0,0,0,.76)');r.text(`${state.year}年 ${state.month}月`,8,8,7,'#f3e2b1');r.text(this.stage==='survey'?'視察':this.stage==='command'?'命令':'行軍',106,8,7,this.stage==='march'?'#ffb064':COLORS.cyan,'right');r.fillRect(232,4,84,16,'rgba(0,0,0,.76)');r.text(f?.ruler??'',312,8,7,f?.color??'#fff','right')}
  drawMountain(x,y){const c=this.app.r.ctx,S=this.app.r.S;c.fillStyle='#6f4b31';c.beginPath();c.moveTo((x-7)*S,(y+5)*S);c.lineTo(x*S,(y-6)*S);c.lineTo((x+7)*S,(y+5)*S);c.closePath();c.fill();c.fillStyle='#b68a5b';c.beginPath();c.moveTo((x-1)*S,(y-4)*S);c.lineTo((x+2)*S,(y+1)*S);c.lineTo((x+6)*S,(y+4)*S);c.lineTo((x+1)*S,(y+2)*S);c.closePath();c.fill()}
  drawForest(x,y){const r=this.app.r;r.fillRect(x-5,y-1,2,6,'#3d5320');r.fillRect(x,y-3,2,8,'#344b1d');r.fillRect(x+5,y,2,5,'#415b23');r.fillRect(x-7,y-6,7,7,'#5f7d29');r.fillRect(x-2,y-9,8,9,'#4c7024');r.fillRect(x+3,y-5,7,7,'#597928')}
  drawCity(city,x,y){const r=this.app.r,rt=this.app.store.state.cities[city.id],f=FACTION_BY_ID[rt.owner]??FACTION_BY_ID.neutral;r.fillRect(x-4,y-2,9,5,'#4f3320');r.fillRect(x-3,y-4,7,3,'#b48b58');r.fillRect(x-1,y-8,1,5,'#24160d');r.fillRect(x,y-8,7,4,f.color);r.strokeRect(x-4,y-4,9,7,'#20130c',.45)}
  drawDialog(){const r=this.app.r;r.fillRect(0,176,320,48,'#dedede');r.line(0,176,320,176,'#2b2018',2);r.line(0,179,320,179,'#8b6d45',1);const s=this.app.store.state,p=s.cursor,city=this.app.store.cityAt(p.x,p.y,12),ruler=FACTION_BY_ID[this.app.store.humanFaction]?.ruler??'';let line1='',line2='';if(this.stage==='survey'){line1=city?`${city.name}的情況。按 C 查看國力。`:'狀況視察：移動方框查看各地。';line2='A 統治國一覽　START 全體地圖　空白處 C 進入本月命令'}else if(this.stage==='command'){const locked=this.app.store.inspectionCategoryForActive();line1=locked?`${ruler}，本月執行「${CATEGORY_LABELS[locked]}」。`:`${ruler}，本月想搞什麼？`;line2=locked?'把方框移到本國城池按 C　START 結束本月':'把方框移到空白處按 C 決定 內政／外交／軍備'}else{line1=city?`行軍：${city.name}`:'行軍：選擇出發城。';line2='本國城池按 C 編成行軍　START 結束本月'}r.text(line1,12,187,9,'#171717','left','top',SERIF,'600');r.text(line2,12,207,6.5,'#423d37')}
  drawCategory(){const r=this.app.r,ruler=FACTION_BY_ID[this.app.store.humanFaction]?.ruler??'';r.panel(78,54,164,91,'#000','#a86d14');r.text(`${ruler}，本月想搞什麼？`,160,64,9,'#f0e2bd','center','top',SERIF,'600');CATEGORIES.forEach((k,i)=>r.text(`${i===this.menuIndex?'▶':'　'}${CATEGORY_LABELS[k]}`,122,88+i*16,10,i===this.menuIndex?COLORS.cyan:'#e9e0c8'))}
  drawTargetHint(){const r=this.app.r;r.panel(72,184,176,31,'#000','#9b6514');r.text(`${CATEGORY_LABELS[this.category]}：選擇本國城池`,160,192,8,COLORS.cyan,'center');r.text('C 決定　B 返回',160,205,6,'#9c927f','center')}
  drawCityStatus(){const r=this.app.r,city=CITY_BY_ID[this.targetCity],rt=this.app.store.state.cities[this.targetCity],f=FACTION_BY_ID[rt?.owner]??FACTION_BY_ID.neutral;r.panel(54,38,212,126,'#020202','#b07118');r.text(city?.name??'',160,48,15,'#f0d477','center','top',SERIF,'700');r.text(f?.label??'',160,70,8,f?.color??'#fff','center');const rows=[['兵力',rt?.troops],['金',rt?.gold],['米',rt?.food],['產值',rt?.development],['統治',rt?.rule],['防衛',rt?.defense],['訓練',rt?.training]];rows.forEach(([label,value],i)=>{const col=i<4?0:1,row=col===0?i:i-4;r.text(label,75+col*101,91+row*15,7,'#9e947e');r.text(value??'—',139+col*101,91+row*15,7,'#eee2c3','right')});r.text(this.stage==='command'?'C 繼續選命令　B 返回':'B/C 返回',160,148,6,'#847b69','center')}
  drawCommands(){
    const r=this.app.r
    const items=inspectionCommandItems(this.category,this.commandSubmenu)
    const path=inspectionCommandPath(this.category,this.commandSubmenu).join(' · ')
    const h=35+items.length*14
    const y=Math.max(22,105-h/2)
    const pointer=this.app.assets?.get('ui.cursors.pointer')
    r.panel(88,y,144,h,'#000','#9b6514',this.app.assets?.get('ui.panels.small'))
    r.text(`${CITY_BY_ID[this.targetCity]?.name??''} · ${path}`,160,y+8,7.5,'#e8cc73','center')
    items.forEach((item,i)=>{
      const active=i===this.menuIndex
      const rowY=y+24+i*14
      if(active){
        if(!pointer||!r.drawImageCentered(pointer,107,rowY+4,9,9))r.text('▶',102,rowY,7,COLORS.cyan)
      }
      r.text(item.label,119,rowY,8,active?COLORS.cyan:'#e8dfc8')
      if(item.kind==='submenu')r.text('›',213,rowY,8,active?COLORS.cyan:'#9c927f','right')
    })
  }
  drawMarch(){const r=this.app.r,target=CITY_BY_ID[this.marchTargets[this.marchIndex]];r.panel(70,184,180,31,'#000','#9b6514');r.text(`目的地：${target?.name??'—'}　← →`,160,192,8,COLORS.cyan,'center');r.text('C 決定順路　B 返回',160,205,6,'#9c927f','center')}
  drawMessage(){const r=this.app.r;r.panel(40,77,240,65,'#000','#b07118');r.wrapText(this.message,160,90,208,11,8,'#f0e4c5','center');r.text('A / B / C 關閉',160,126,6,'#8a806e','center')}
  drawInfo(){const r=this.app.r,s=this.app.store.state;r.panel(18,20,284,170,'#020202','#b07118');const tabs=['統治國一覽','全體地圖','武將狀態'];tabs.forEach((t,i)=>r.text(t,66+i*94,30,8,i===this.infoTab?COLORS.cyan:'#777','center'));r.line(28,45,292,45,'#7b4e12',1);if(this.infoTab===0){const list=CITIES.filter((c)=>s.cities[c.id].owner===this.app.store.humanFaction).slice(0,15);list.forEach((city,i)=>{const rt=s.cities[city.id],col=i>=8?1:0,row=i%8;r.text(`${city.name} 兵${rt.troops}`,34+col*133,56+row*14,7,'#e8dfc8')})}else if(this.infoTab===1){r.fillRect(46,55,228,105,'#9a7849');for(const city of CITIES){const f=FACTION_BY_ID[s.cities[city.id].owner]??FACTION_BY_ID.neutral,wp=cityWorldPoint(city),x=51+(wp.x/WORLD_W)*218,y=59+(wp.y/WORLD_H)*96;r.fillRect(x-1.5,y-1.5,3,3,f.color)}r.text(`全國 40 城　我方 ${CITIES.filter((c)=>s.cities[c.id].owner===this.app.store.humanFaction).length} 城`,160,168,7,'#d9cba8','center')}else{r.text('武將資料：姓名／等級／武力／知力／德／忠誠',160,78,7,'#e8dfc8','center');r.text('武將表仍在按中文版實機資料逐項建立',160,102,7,'#9e9582','center')}r.text('← → 切換　A/B/C 返回',160,176,6,'#887f6d','center')}
  drawSave(){const r=this.app.r;r.panel(79,73,162,76,'#000','#b07118');r.text('是否保存遊戲？',160,84,10,'#eee2c3','center','top',SERIF,'600');['是','否'].forEach((v,i)=>r.text(`${i===this.saveIndex?'▶':'　'}${v}`,160,106+i*15,8,i===this.saveIndex?COLORS.cyan:'#d4c8a9','center'))}
}
