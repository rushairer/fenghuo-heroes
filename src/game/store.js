import { CITIES, CITY_BY_ID, MAP_PROFILE } from './data.js'
import { ORIGINAL_189_RULERS } from './original-data.js'
import { isTaxRate } from './tax-parity.js'
import { WORLD_H, WORLD_W, cityWorldPoint } from './world.js'

const SAVE_KEY = 'fenghuo-heroes.cleanroom.v4'
const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const baseCities = (cities) => Object.fromEntries(cities.map((c) => [c.id, {
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
const UNVERIFIED_INSPECTION_EFFECT_MESSAGES = Object.freeze({
  develop:'開發：投入金額、執行武將與產值公式尚未校準，本次不修改數值。',
  welfare:'福利：執行武將、投入金額與統治效果公式尚未校準，本次不修改數值。',
  educate:'教育：對象、投入金額與忠誠／德效果公式尚未校準，本次不修改數值。',
  'appoint-governor':'太守任命：城市配屬與限制條件尚未校準，本次不修改官職。',
  'appoint-strategist':'軍師任命：能力門檻與限制條件尚未校準，本次不修改官職。',
  'appoint-office':'官職任命：文官／武官職表與等級條件尚未校準，本次不修改官職。',
  ally:'同盟：交涉方式、代價與成功判定尚未校準，本次不建立同盟狀態。',
  alienate:'離間：對象條件與成功／忠誠變化公式尚未校準，本次不修改武將狀態。',
  assassinate:'暗殺：對象條件與成功判定尚未校準，本次不修改武將狀態。',
  fire:'火計：目標條件、成功判定與金／米損失公式尚未校準，本次不修改數值。',
  borrow:'借款：已確認需要同盟關係，但借款額與債務規則尚未校準，本次不修改金。',
  repay:'還款：已確認屬同盟債務流程，但償還額與債務規則尚未校準，本次不修改金。',
  recruit:'徵兵：兵源、成本與兵數公式尚未校準，本次不修改兵／金／米。',
  weapons:'武器：品項、價格與能力效果尚未校準，本次不修改數值。',
  defense:'防衛：投入資源與防衛效果公式尚未校準，本次不修改數值。',
  train:'訓練：已確認成本與兵力相關且影響士氣，但精確公式尚未校準，本次不修改數值。',
  'talent-search':'人材／探尋：搜索條件、城市人才池與成功判定尚未校準，本次不新增武將。',
  'talent-persuade':'人材／選拔／說服：目標條件與成功判定尚未校準，本次不修改武將歸屬。',
  'talent-gift':'人材／選拔／貢品：目標條件、金額與成功判定尚未校準，本次不修改金或武將歸屬。',
})

const openingRosters = (year) => year === 189
  ? Object.fromEntries(ORIGINAL_189_RULERS.map((item) => [item.id, {
      ruler: item.ruler,
      officers: [...item.officers],
      zhCommunitySelectable: item.zhCommunitySelectable,
    }]))
  : {}

export class GameStore {
  constructor(storage = null, {mapProfile=MAP_PROFILE} = {}) { this.storage = storage; this.mapProfile = mapProfile; this.state = null; this.pendingConflict = null }
  newGame(options = {}) {
    const scenarioYear = Number(options.scenarioYear ?? 189)
    const humans = [...(options.humanFactions ?? ['liu'])]
    const primary = humans[0] ?? 'liu'
    const cities=this.mapProfile?.cities??CITIES
    const cityById=this.mapProfile?.cityById??CITY_BY_ID
    const firstCity=cities.find((city)=>city.owner===primary)??cities[0]
    if(!firstCity)throw new Error('Runtime map profile contains no cities.')
    const first=firstCity.id
    this.state = { mapProfileId:this.mapProfile.id, scenarioYear, difficulty:options.difficulty??'easy', animation:options.animation??true, textSpeed:options.textSpeed??'normal', year:scenarioYear, month:1, humanFactions:humans, activeHumanIndex:0, activeCity:first, cursor:cityWorldPoint(cityById[first]), inspectionCategories:{}, openingRosters:openingRosters(scenarioYear), cities:baseCities(cities), log:[`${scenarioYear}年，群雄並起。`,'奇數月視察與命令，偶數月行軍。'] }
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
  cityAt(x,y,tolerance=7){return (this.mapProfile?.cities??CITIES).find((c)=>{const p=cityWorldPoint(c);return Math.abs(p.x-x)<=tolerance&&Math.abs(p.y-y)<=tolerance})??null}
  setCursor(x,y){this.assertState();this.state.cursor.x=clamp(x,8,WORLD_W-8);this.state.cursor.y=clamp(y,8,WORLD_H-8)}
  setActiveCity(id){this.assertState();this.state.activeCity=id}
  inspectionCategoryForActive(){this.assertState();return this.state.inspectionCategories?.[this.humanFaction]??null}
  lockInspectionCategory(category){this.assertState();if(this.mode!=='inspection')return false;if(!this.state.inspectionCategories)this.state.inspectionCategories={};const current=this.state.inspectionCategories[this.humanFaction];if(current&&current!==category)return false;this.state.inspectionCategories[this.humanFaction]=category;this.save();return true}
  setTaxRate(cityId,rate){this.assertState();const city=this.state.cities[cityId];if(!city||city.owner!==this.humanFaction)throw new Error('只能設定本國城池稅率。');if(!isTaxRate(rate))throw new RangeError('稅率必須是 0 到 99 的整數。');city.taxRate=rate;this.addLog(`${this.mapProfile?.cityById?.[cityId]?.name??CITY_BY_ID[cityId]?.name??cityId} 稅率設定為 ${rate}%。`);this.save();return rate}
  // Menu hierarchy is evidence-backed in inspection-command-parity.js.
  // Commands whose numerical effect is still unverified must never mutate game
  // state. Each effect is re-enabled only through an evidence-specific module.
  executeInspection(command,cityId){
    this.assertState()
    const city=this.state.cities[cityId]
    if(!city||city.owner!==this.humanFaction)return'只能向本國城池下令。'
    let result=UNVERIFIED_INSPECTION_EFFECT_MESSAGES[command]??''
    if(!result){
      switch(command){
        case'transfer':result='調動：選擇武將與目的城。';break
        case'intel':result='情報請由四十國狀態畫面查看。';break
        case'appoint':result='任命：等待武將城市配屬與官職條件校準。';break
        case'tax':result='稅率請由設定畫面調整。';break
        case'transport':result='運輸：等待己方城市輸送與截糧規則校準。';break
        case'talent':result='人材：等待搜索條件與武將出現規則校準。';break
        default:result='此命令尚未校準。'
      }
    }
    this.addLog(result)
    this.save()
    return result
  }
  planMarch(){
    this.assertState()
    throw new Error('舊版相鄰城市瞬移行軍已退休；請使用自由路線行軍狀態機。')
  }
  resolveConflict(){
    this.assertState()
    throw new Error('舊版通用即時戰鬥結算已退休；戰鬥結果必須由校準後的野戰／攻城狀態機提交。')
  }
  finishCurrentTurn(){this.assertState();const previousMode=this.mode,previousFaction=this.humanFaction;if(!this.isLastHumanTurn){this.state.activeHumanIndex+=1;this.addLog(`${this.state.year}年${this.state.month}月：輪到 ${this.humanFaction}。`);this.save();return{monthAdvanced:false,previousMode,previousFaction,nextFaction:this.humanFaction}}this.state.activeHumanIndex=0;this.state.month+=1;if(this.state.month>12){this.state.month=1;this.state.year+=1}this.state.inspectionCategories={};this.addLog(`${this.state.year}年${this.state.month}月 ${this.mode==='inspection'?'視察情況':'行軍'}`);this.save();return{monthAdvanced:true,previousMode,previousFaction,nextFaction:this.humanFaction}}
  advanceMonth(){this.assertState();this.state.activeHumanIndex=this.state.humanFactions.length-1;return this.finishCurrentTurn()}
  save(){if(this.state&&this.storage?.setItem)this.storage.setItem(SAVE_KEY,JSON.stringify(this.state))}
  load(){
    if(!this.storage?.getItem)return false
    const raw=this.storage.getItem(SAVE_KEY)
    if(!raw)return false
    try{
      const parsed=JSON.parse(raw)
      // Saves created before map-profile tagging are compatible only while the
      // scaffold remains active. Never reinterpret scaffold city IDs as a
      // future canonical profile.
      const savedProfileId=parsed.mapProfileId??(this.mapProfile.id==='runtime-scaffold'?'runtime-scaffold':null)
      if(savedProfileId!==this.mapProfile.id)return false
      parsed.mapProfileId=savedProfileId
      this.state=parsed
      if(!this.state.inspectionCategories)this.state.inspectionCategories={}
      if(!this.state.openingRosters)this.state.openingRosters=openingRosters(this.state.scenarioYear)
      if(!Number.isInteger(this.state.activeHumanIndex))this.state.activeHumanIndex=0
      this.pendingConflict=null
      return Boolean(this.state?.cities&&this.state?.humanFactions)
    }catch{
      this.storage.removeItem?.(SAVE_KEY)
      return false
    }
  }
  clearSave(){this.state=null;this.pendingConflict=null;this.storage?.removeItem?.(SAVE_KEY)}
}
