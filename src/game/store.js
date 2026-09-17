import { CITIES, CITY_BY_ID } from './data.js'
import { ORIGINAL_189_RULERS } from './facts.js'
import { WORLD_H, WORLD_W, cityWorldPoint } from './world.js'

const SAVE_KEY = 'fenghuo-heroes.cleanroom.v4'
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const baseCities = () => Object.fromEntries(CITIES.map((c) => [c.id, {
  id: c.id,
  owner: c.owner,
  gold: 300 + ((c.x * 7 + c.y * 3) % 700),
  food: 500 + ((c.x * 11 + c.y * 5) % 1100),
  troops: 2500 + ((c.x * 73 + c.y * 37) % 9500),
  development: 40 + ((c.x + c.y) % 80),
  rule: 80,
  defense: 40,
  training: 35,
}]))
const openingRosters = (year) => year === 189
  ? Object.fromEntries(ORIGINAL_189_RULERS.map((item) => [item.id, {
      ruler: item.ruler,
      playable: item.playable,
      officers: [...item.officers],
      lowLoyalty: [...item.lowLoyalty],
    }]))
  : {}

export class GameStore {
  constructor(storage = null) { this.storage = storage; this.state = null; this.pendingConflict = null }
  newGame(options = {}) {
    const scenarioYear = Number(options.scenarioYear ?? 189)
    const humans = [...(options.humanFactions ?? ['liu'])]
    const primary = humans[0] ?? 'liu'
    const first = CITIES.find((c) => c.owner === primary)?.id ?? 'xuchang'
    this.state = { scenarioYear, difficulty:options.difficulty??'easy', animation:options.animation??true, textSpeed:options.textSpeed??'normal', year:scenarioYear, month:1, humanFactions:humans, activeHumanIndex:0, activeCity:first, cursor:cityWorldPoint(CITY_BY_ID[first]), inspectionCategories:{}, openingRosters:openingRosters(scenarioYear), cities:baseCities(), log:[`${scenarioYear}年，群雄並起。`,'奇數月視察與命令，偶數月行軍。'] }
    this.pendingConflict = null
    this.save()
    return this.state
  }
  get humanFaction(){this.assertState();return this.state.humanFactions[this.state.activeHumanIndex]}
  get mode(){this.assertState();return this.state.month%2===1?'inspection':'march'}
  get isLastHumanTurn(){this.assertState();return this.state.activeHumanIndex>=this.state.humanFactions.length-1}
  assertState(){if(!this.state)throw new Error('Game not initialized')}
  hasGame(){return Boolean(this.state)}
  addLog(msg){this.assertState();this.state.log.unshift(msg);this.state.log=this.state.log.slice(0,8)}
  cityAt(x,y,tolerance=7){return CITIES.find((c)=>{const p=cityWorldPoint(c);return Math.abs(p.x-x)<=tolerance&&Math.abs(p.y-y)<=tolerance})??null}
  setCursor(x,y){this.assertState();this.state.cursor.x=clamp(x,8,WORLD_W-8);this.state.cursor.y=clamp(y,8,WORLD_H-8)}
  setActiveCity(id){this.assertState();this.state.activeCity=id}
  inspectionCategoryForActive(){this.assertState();return this.state.inspectionCategories?.[this.humanFaction]??null}
  lockInspectionCategory(category){this.assertState();if(this.mode!=='inspection')return false;if(!this.state.inspectionCategories)this.state.inspectionCategories={};const current=this.state.inspectionCategories[this.humanFaction];if(current&&current!==category)return false;this.state.inspectionCategories[this.humanFaction]=category;this.save();return true}
  executeInspection(command,cityId){this.assertState();const city=this.state.cities[cityId];if(!city||city.owner!==this.humanFaction)return'只能向本國城池下令。';let result='';switch(command){case'develop':if(city.gold<80)return'金不足。';city.gold-=80;city.development=clamp(city.development+35,0,999);result='開發完成，產值提高。';break;case'transfer':result='調動：選擇武將與目的城。';break;case'intel':result=`情報 兵${city.troops} 金${city.gold} 米${city.food} 統治${city.rule}`;break;case'welfare':if(city.gold<60)return'金不足。';city.gold-=60;city.rule=clamp(city.rule+12,0,200);result='福利完成，統治力提高。';break;case'appoint':result='任命：等待武將資料表校準。';break;case'tax':city.gold+=120;city.rule=clamp(city.rule-8,0,200);result='調整稅率：金增加，統治力下降。';break;case'educate':if(city.gold<70)return'金不足。';city.gold-=70;city.development=clamp(city.development+15,0,999);result='教育完成。';break;case'transport':result='運輸：等待輸送隊與截糧規則校準。';break;case'ally':result='已派使者提出同盟。';break;case'alienate':result='已派使者執行離間。';break;case'assassinate':result='已派刺客。';break;case'fire':result='火計執行中。';break;case'borrow':city.gold+=300;result='借款成功。';break;case'repay':if(city.gold<200)return'金不足。';city.gold-=200;result='已償還借款。';break;case'recruit':{const n=Math.min(1500,Math.floor(city.food*.55));if(n<200)return'米不足。';city.food-=Math.floor(n*.4);city.troops+=n;result=`徵兵 ${n}`;break}case'weapons':if(city.gold<120)return'金不足。';city.gold-=120;city.training=clamp(city.training+8,0,100);result='購入武器，軍備提高。';break;case'talent':result='人材搜索：等待武將表校準。';break;case'defense':if(city.gold<90)return'金不足。';city.gold-=90;city.defense=clamp(city.defense+10,0,100);result='防衛提高。';break;case'train':if(city.food<100)return'米不足。';city.food-=100;city.training=clamp(city.training+8,0,100);result='訓練完成。';break;default:result='此命令尚未校準。'}this.addLog(result);this.save();return result}
  planMarch(from,target){this.assertState();if(this.mode!=='march')throw new Error('偶數月才能行軍。');const fromDef=CITY_BY_ID[from];if(!fromDef?.neighbors.includes(target))throw new Error('目前路線校準僅支援相鄰地點。');const src=this.state.cities[from],dst=this.state.cities[target];if(src.owner!==this.humanFaction)throw new Error('必須從本國城池出發。');const troops=Math.min(3500,Math.max(800,Math.floor(src.troops*.38)));if(src.troops-troops<800)return null;src.troops-=troops;if(dst.owner===src.owner){dst.troops+=troops;this.addLog(`${CITY_BY_ID[from].name} → ${CITY_BY_ID[target].name} 調兵${troops}`);this.finishCurrentTurn();return null}this.pendingConflict={from,target,attacker:src.owner,defender:dst.owner,attackerTroops:troops,defenderTroops:dst.troops};this.addLog(`${CITY_BY_ID[from].name}軍接近${CITY_BY_ID[target].name}`);this.save();return this.pendingConflict}
  resolveConflict(win){this.assertState();const c=this.pendingConflict;if(!c)return;const src=this.state.cities[c.from],dst=this.state.cities[c.target];if(win){dst.owner=c.attacker;dst.troops=Math.max(600,Math.floor(c.attackerTroops*.68));this.addLog(`${CITY_BY_ID[c.target].name}陷落。`)}else{src.troops+=Math.max(300,Math.floor(c.attackerTroops*.3));dst.troops=Math.max(500,Math.floor(dst.troops*.84));this.addLog(`攻打${CITY_BY_ID[c.target].name}失敗。`)}this.pendingConflict=null;this.finishCurrentTurn()}
  finishCurrentTurn(){this.assertState();const previousMode=this.mode,previousFaction=this.humanFaction;if(!this.isLastHumanTurn){this.state.activeHumanIndex+=1;this.addLog(`${this.state.year}年${this.state.month}月：輪到 ${this.humanFaction}。`);this.save();return{monthAdvanced:false,previousMode,previousFaction,nextFaction:this.humanFaction}}this.state.activeHumanIndex=0;this.state.month+=1;if(this.state.month>12){this.state.month=1;this.state.year+=1}this.state.inspectionCategories={};this.addLog(`${this.state.year}年${this.state.month}月 ${this.mode==='inspection'?'視察情況':'行軍'}`);this.save();return{monthAdvanced:true,previousMode,previousFaction,nextFaction:this.humanFaction}}
  advanceMonth(){this.assertState();this.state.activeHumanIndex=this.state.humanFactions.length-1;return this.finishCurrentTurn()}
  save(){if(this.state&&this.storage?.setItem)this.storage.setItem(SAVE_KEY,JSON.stringify(this.state))}
  load(){if(!this.storage?.getItem)return false;const raw=this.storage.getItem(SAVE_KEY);if(!raw)return false;try{this.state=JSON.parse(raw);if(!this.state.inspectionCategories)this.state.inspectionCategories={};if(!this.state.openingRosters)this.state.openingRosters=openingRosters(this.state.scenarioYear);if(!Number.isInteger(this.state.activeHumanIndex))this.state.activeHumanIndex=0;this.pendingConflict=null;return Boolean(this.state?.cities&&this.state?.humanFactions)}catch{this.storage.removeItem?.(SAVE_KEY);return false}}
  clearSave(){this.state=null;this.pendingConflict=null;this.storage?.removeItem?.(SAVE_KEY)}
}
