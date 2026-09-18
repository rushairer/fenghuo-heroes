import { COLORS, SERIF } from '../game/constants.js'
import { CITY_BY_ID, FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { advanceMarchArmies,armyAt,beginSiegeFromArmy,dailyFoodFor,enemyArmyNearArmy,enemyCityNearArmy,ensureMarchState,friendlyArmyStack,marchCommandOptions,queueMarch,rerouteArmy } from '../game/march.js'
import { cameraFor,cityWorldPoint,isVisible,toScreen } from '../game/world.js'
import { StrategyScene as BaseStrategyScene } from './strategy.js'
const routeStep=8
export class StrategyScene extends BaseStrategyScene{
  constructor(app){super(app);if(!app.store.hasGame())return;ensureMarchState(app.store);this.marchArmyId=null;this.marchRoute=[];this.composeFocus=0;this.marchTroops=1000;this.marchFood=300;this.marchGold=100;this.armyMenuIndex=0}
  update(dt,input){if(!['march-compose','march-route','army-menu'].includes(this.view))return super.update(dt,input);const key=input.consume();if(!key)return;const b=mdButton(key);if(b==='HD')return this.app.toggleHd();if(this.view==='march-compose')return this.updateMarchCompose(b);if(this.view==='march-route')return this.updateMarchRoute(b);if(this.view==='army-menu')return this.updateArmyMenu(b)}
  updateMap(b){if(this.stage!=='march')return super.updateMap(b);const store=this.app.store,s=store.state;if(b==='LEFT')this.moveCursor(-1,0);if(b==='RIGHT')this.moveCursor(1,0);if(b==='UP')this.moveCursor(0,-1);if(b==='DOWN')this.moveCursor(0,1);if(b==='B'){this.app.audio.cancel();return}if(b==='A'){this.infoTab=1;this.view='info';this.app.audio.confirm();return}if(b==='START'){this.requestFinishTurn();return}if(b!=='C')return;const army=armyAt(store,s.cursor.x,s.cursor.y,12);if(army){this.marchArmyId=army.id;this.armyMenuIndex=0;this.view='army-menu';this.app.audio.confirm();return}const city=store.cityAt(s.cursor.x,s.cursor.y,12);if(!city||s.cities[city.id].owner!==store.humanFaction){this.message='行軍時請選擇本國城池或己方行軍部隊。';this.view='message';this.app.audio.alert();return}this.beginMarchCompose(city.id)}
  beginMarchCompose(cityId){const city=this.app.store.state.cities[cityId];this.marchFrom=cityId;this.marchArmyId=null;this.composeFocus=0;this.marchTroops=Math.min(3000,Math.max(500,Math.floor(city.troops*.3/100)*100));this.marchGold=Math.min(city.gold,100);this.marchFood=Math.min(city.food,Math.max(100,dailyFoodFor(this.marchTroops,1)*30));this.view='march-compose';this.app.audio.confirm()}
  updateMarchCompose(b){const city=this.app.store.state.cities[this.marchFrom];if(!city){this.view='map';return}if(b==='UP'){this.composeFocus=(this.composeFocus+3)%4;this.app.audio.move()}if(b==='DOWN'){this.composeFocus=(this.composeFocus+1)%4;this.app.audio.move()}if(b==='LEFT'||b==='RIGHT'){const d=b==='RIGHT'?1:-1;if(this.composeFocus===0)this.marchTroops=Math.max(100,Math.min(city.troops-100,this.marchTroops+d*100));if(this.composeFocus===1)this.marchGold=Math.max(0,Math.min(city.gold,this.marchGold+d*50));if(this.composeFocus===2)this.marchFood=Math.max(0,Math.min(city.food,this.marchFood+d*100));this.app.audio.move()}if(b==='B'){this.view='map';this.app.audio.cancel();return}if((b==='C'||b==='A'||b==='START')&&this.composeFocus===3)this.beginNewMarchRoute()}
  beginNewMarchRoute(){const point=cityWorldPoint(CITY_BY_ID[this.marchFrom]);this.marchRoute=[{...point}];this.app.store.setCursor(point.x,point.y);this.view='march-route';this.app.audio.confirm()}
  beginArmyRoute(army){this.marchArmyId=army.id;this.marchFrom=army.from;this.marchRoute=[{x:army.x,y:army.y}];this.app.store.setCursor(army.x,army.y);this.view='march-route';this.app.audio.confirm()}
  updateMarchRoute(b){if(['LEFT','RIGHT','UP','DOWN'].includes(b)){const dx=b==='LEFT'?-1:b==='RIGHT'?1:0,dy=b==='UP'?-1:b==='DOWN'?1:0,s=this.app.store.state;this.app.store.setCursor(s.cursor.x+dx*routeStep,s.cursor.y+dy*routeStep);const p=this.app.store.state.cursor,last=this.marchRoute[this.marchRoute.length-1];if(!last||last.x!==p.x||last.y!==p.y)this.marchRoute.push({x:p.x,y:p.y});this.app.audio.move();return}if(b==='B'){if(this.marchRoute.length>1){this.marchRoute.pop();const p=this.marchRoute[this.marchRoute.length-1];this.app.store.setCursor(p.x,p.y)}else this.view=this.marchArmyId?'army-menu':'march-compose';this.app.audio.cancel();return}if(b!=='C'&&b!=='START')return;if(this.marchRoute.length<2){this.app.audio.alert();return}try{if(this.marchArmyId)rerouteArmy(this.app.store,this.marchArmyId,this.marchRoute);else queueMarch(this.app.store,{from:this.marchFrom,route:this.marchRoute,troops:this.marchTroops,food:this.marchFood,gold:this.marchGold,officerCount:1});this.message='行軍路線已決定。部隊將在本月命令結束後移動。';this.marchArmyId=null;this.marchRoute=[];this.view='message';this.app.audio.confirm()}catch(error){this.message=error instanceof Error?error.message:'行軍命令失敗。';this.view='message';this.app.audio.alert()}}
  armyMenuOptions(army){
    const enemyArmy=enemyArmyNearArmy(this.app.store,army.id)
    const enemyCity=enemyCityNearArmy(this.app.store,army.id)
    return marchCommandOptions({
      canSplit:friendlyArmyStack(this.app.store,army.id).length>=2,
      // Manual: 補給 appears only after entering a village. Runtime village
      // coordinates are still uncalibrated, so this remains false by design.
      inVillage:false,
      enemyArmyAdjacent:Boolean(enemyArmy),
      enemyCityAdjacent:Boolean(enemyCity),
      enemyCityName:enemyCity?.name??'',
    })
  }
  updateArmyMenu(b){
    const army=ensureMarchState(this.app.store).find((item)=>item.id===this.marchArmyId)
    if(!army){this.view='map';return}
    const options=this.armyMenuOptions(army)
    this.armyMenuIndex=Math.max(0,Math.min(this.armyMenuIndex,options.length-1))
    if(b==='UP'){this.armyMenuIndex=(this.armyMenuIndex-1+options.length)%options.length;this.app.audio.move();return}
    if(b==='DOWN'){this.armyMenuIndex=(this.armyMenuIndex+1)%options.length;this.app.audio.move();return}
    if(b==='B'){this.view='map';this.app.audio.cancel();return}
    if(b!=='A'&&b!=='C')return
    const action=options[this.armyMenuIndex].id
    if(action==='move')return this.beginArmyRoute(army)
    if(action==='split'){
      this.message='原作只在兩隊以上共同行軍時顯示「分散」；分配武將、兵與兵糧的界面仍待實機校準。'
      this.view='message'
      this.app.audio.alert()
      return
    }
    if(action==='attack'){
      const target=enemyArmyNearArmy(this.app.store,army.id)
      if(!target){this.app.audio.alert();return}
      this.message='「攻擊」僅在敵行軍部隊鄰接時出現已按原作收口；部隊戰畫面與結算仍待校準，本次不改變兵力。'
      this.view='message'
      this.app.audio.alert()
      return
    }
    if(action==='siege'){
      const target=enemyCityNearArmy(this.app.store,army.id)
      if(!target){this.app.audio.alert();return}
      try{
        beginSiegeFromArmy(this.app.store,army.id,target.id)
        this.app.audio.confirm()
        this.app.go('siege')
      }catch(error){
        this.message=error instanceof Error?error.message:'無法攻城。'
        this.view='message'
        this.app.audio.alert()
      }
      return
    }
    this.view='map'
    this.app.audio.confirm()
  }
  finishTurn(){if(this.app.store.mode==='march'&&this.app.store.isLastHumanTurn)advanceMarchArmies(this.app.store,30);super.finishTurn()}
  resetForActiveTurn(){super.resetForActiveTurn();this.marchArmyId=null;this.marchRoute=[]}
  draw(){super.draw();if(this.view==='march-compose')this.drawMarchCompose();if(this.view==='march-route')this.drawMarchRouteHint();if(this.view==='army-menu')this.drawArmyMenu()}
  drawWorld(){super.drawWorld();const r=this.app.r,camera=cameraFor(this.app.store.state.cursor);for(const army of ensureMarchState(this.app.store)){const wp={x:army.x,y:army.y};if(!isVisible(wp,camera,12))continue;const p=toScreen(wp,camera),f=FACTION_BY_ID[army.faction];r.fillRect(p.x-4,p.y-5,8,8,'#14100d');r.fillRect(p.x-2,p.y-8,9,4,f?.color??'#888');r.strokeRect(p.x-5,p.y-6,10,10,army.starving?'#ff7a5e':'#e8d39a',.6)}if(this.view==='march-route'&&this.marchRoute.length>1){for(let i=1;i<this.marchRoute.length;i++){const a=toScreen(this.marchRoute[i-1],camera),b=toScreen(this.marchRoute[i],camera);r.line(a.x,a.y,b.x,b.y,'#fff08a',1.3,.95)}}}
  drawDialog(){super.drawDialog();if(this.stage!=='march')return;const r=this.app.r,s=this.app.store.state,army=armyAt(this.app.store,s.cursor.x,s.cursor.y,12),city=this.app.store.cityAt(s.cursor.x,s.cursor.y,12);r.fillRect(8,184,304,32,'#dedede');if(army){r.text(`行軍部隊：兵${army.troops} 米${army.food}${army.starving?'（缺糧）':''}`,12,187,9,'#171717','left','top',SERIF,'600');r.text('C：顯示目前可用的部隊命令　START 結束本月',12,207,6.5,'#423d37')}else{r.text(city?`行軍：${city.name}`:'行軍：選擇出發城或部隊。',12,187,9,'#171717','left','top',SERIF,'600');r.text('本國城池按 C 編成出陣　A 全體地圖　START 結束本月',12,207,6.5,'#423d37')}}
  drawMarchCompose(){const r=this.app.r,city=CITY_BY_ID[this.marchFrom],daily=dailyFoodFor(this.marchTroops,1);r.panel(72,42,176,126,'#000','#9b6514');r.text(`${city?.name??''} 出陣`,160,51,11,'#efd27d','center','top',SERIF,'700');const rows=[['兵力',this.marchTroops],['軍資金',this.marchGold],['兵糧',this.marchFood],['路線','指定']];rows.forEach(([label,value],i)=>{r.text(`${i===this.composeFocus?'▶':'　'}${label}`,99,76+i*19,8,i===this.composeFocus?COLORS.cyan:'#ddd0ad');r.text(value,218,76+i*19,8,i===this.composeFocus?COLORS.cyan:'#eee0bd','right')});r.text('武將 1（名冊待校準）',160,145,6,'#8e846f','center');r.text(`1日兵糧 = 兵${this.marchTroops}÷100 + 武將1 = ${daily}`,160,156,6,'#a99d82','center')}
  drawMarchRouteHint(){const r=this.app.r;r.panel(59,184,202,31,'#000','#9b6514');r.text(`路線 ${Math.max(0,this.marchRoute.length-1)} 格　方向鍵延伸`,160,192,7.5,COLORS.cyan,'center');r.text('B 撤回一格　C 決定路線',160,205,6,'#9c927f','center')}
  drawArmyMenu(){
    const r=this.app.r
    const army=ensureMarchState(this.app.store).find((item)=>item.id===this.marchArmyId)
    if(!army)return
    const options=this.armyMenuOptions(army)
    const height=48+options.length*15
    r.panel(104,48,112,height,'#000','#9b6514')
    r.text('行軍',160,56,9,'#efd27d','center')
    options.forEach((option,i)=>r.text(`${i===this.armyMenuIndex?'▶':'　'}${option.label}`,119,76+i*15,8,i===this.armyMenuIndex?COLORS.cyan:'#ddd0ad'))
    r.text(`兵${army.troops} 米${army.food}`,160,48+height-13,6,'#8e846f','center')
  }
}
