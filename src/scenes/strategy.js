import { COLORS } from '../game/constants.js'
import { CATEGORY_LABELS, CITIES, CITY_BY_ID, COMMANDS, FACTION_BY_ID } from '../game/data.js'

const CATEGORIES = ['domestic', 'diplomacy', 'military']

export class StrategyScene {
  constructor(app) {
    this.app = app
    if (!app.store.hasGame() && !app.store.load()) { app.go('title'); return }
    const index = CITIES.findIndex((city) => city.id === app.store.state.activeCity)
    this.cityIndex = index >= 0 ? index : 0; this.view = 'map'; this.menuIndex = 0; this.category = 'domestic'; this.message = ''; this.marchTargets = []
  }
  update(_dt, input) {
    const key = input.consume(); if (!key || !this.app.store.hasGame()) return
    const normalized = key.length === 1 ? key.toLowerCase() : key
    if (this.view === 'message') { if (['z','x','Enter','Escape'].includes(normalized)) { this.view = 'map'; this.menuIndex = 0 } return }
    if (this.view === 'category') {
      if (normalized === 'ArrowUp') this.moveMenu(-1, CATEGORIES.length); else if (normalized === 'ArrowDown') this.moveMenu(1, CATEGORIES.length)
      else if (normalized === 'z' || normalized === 'Enter') { this.category = CATEGORIES[this.menuIndex]; this.view = 'commands'; this.menuIndex = 0 }
      else if (normalized === 'x' || normalized === 'Escape') this.back(); return
    }
    if (this.view === 'commands') {
      const items = COMMANDS[this.category]
      if (normalized === 'ArrowUp') this.moveMenu(-1, items.length); else if (normalized === 'ArrowDown') this.moveMenu(1, items.length)
      else if (normalized === 'z' || normalized === 'Enter') this.executeCommand(); else if (normalized === 'x' || normalized === 'Escape') { this.view = 'category'; this.menuIndex = 0 } return
    }
    if (this.view === 'marchTarget') {
      if (normalized === 'ArrowLeft' || normalized === 'ArrowUp') this.moveMenu(-1, this.marchTargets.length); else if (normalized === 'ArrowRight' || normalized === 'ArrowDown') this.moveMenu(1, this.marchTargets.length)
      else if (normalized === 'z' || normalized === 'Enter') this.confirmMarch(); else if (normalized === 'x' || normalized === 'Escape') this.back(); return
    }
    if (normalized === 'ArrowLeft' || normalized === 'ArrowUp') this.moveCity(-1); else if (normalized === 'ArrowRight' || normalized === 'ArrowDown') this.moveCity(1)
    else if (normalized === 'z' || normalized === 'Enter') this.confirmMap(); else if (normalized === 'c') { this.app.store.advanceMonth(); this.ensureOwnedSelection() }
    else if (normalized === 'x' || normalized === 'Escape') { this.app.store.save(); this.app.go('title') }
  }
  moveCity(delta) { this.cityIndex = (this.cityIndex + delta + CITIES.length) % CITIES.length; this.app.store.setActiveCity(CITIES[this.cityIndex].id) }
  moveMenu(delta, count) { if (count) this.menuIndex = (this.menuIndex + delta + count) % count }
  back() { this.view = 'map'; this.menuIndex = 0 }
  showMessage(message) { this.message = message; this.view = 'message' }
  confirmMap() {
    const city = CITIES[this.cityIndex]; const runtime = this.app.store.state.cities[city.id]
    if (runtime.owner !== this.app.store.state.humanFaction) return this.showMessage('此城不属于本势力。')
    if (this.app.store.mode === 'inspection') { this.view = 'category'; this.menuIndex = 0 } else { this.marchTargets = [...city.neighbors]; this.view = 'marchTarget'; this.menuIndex = 0 }
  }
  executeCommand() { const city = CITIES[this.cityIndex]; const item = COMMANDS[this.category][this.menuIndex]; if (item) this.showMessage(this.app.store.executeInspection(item[0], city.id)) }
  confirmMarch() {
    const source = CITIES[this.cityIndex]; const target = this.marchTargets[this.menuIndex]; if (!target) return
    try { const conflict = this.app.store.planMarch(source.id, target); if (conflict) this.app.go('duel'); else { this.back(); this.ensureOwnedSelection() } }
    catch (error) { this.showMessage(error instanceof Error ? error.message : '行军失败。') }
  }
  ensureOwnedSelection() {
    const selected = CITIES[this.cityIndex]
    if (selected && this.app.store.state.cities[selected.id].owner === this.app.store.state.humanFaction) return
    const next = CITIES.findIndex((city) => this.app.store.state.cities[city.id].owner === this.app.store.state.humanFaction); this.cityIndex = Math.max(0, next)
  }
  draw() {
    if (!this.app.store.hasGame()) return
    const r = this.app.r; r.clear(COLORS.black); this.drawHeader(); this.drawMap(); this.drawIntel(); this.drawFooter()
    if (this.view === 'category') this.drawCategoryMenu(); if (this.view === 'commands') this.drawCommandMenu(); if (this.view === 'marchTarget') this.drawMarchMenu(); if (this.view === 'message') this.drawMessage(); r.scanlines(0.06)
  }
  drawHeader() {
    const r = this.app.r; const state = this.app.store.state; const faction = FACTION_BY_ID[state.humanFaction]
    r.panel(4,3,312,19,COLORS.ink); r.text(`${state.year}年 ${state.month}月`,9,8,8,'#e9d697'); r.text(this.app.store.mode === 'inspection' ? '视察情况' : '行 军',111,8,8,this.app.store.mode === 'inspection' ? '#9fd090' : '#e0a070'); r.text(faction.label,309,8,8,faction.color,'right')
  }
  drawMap() {
    const r = this.app.r; const c = r.ctx; r.panel(4,24,226,150,'#131820'); c.fillStyle = COLORS.mapWater; c.fillRect(8,28,218,142); c.fillStyle = COLORS.mapLand
    c.beginPath(); c.moveTo(18,57); c.lineTo(66,32); c.lineTo(122,38); c.lineTo(184,31); c.lineTo(220,55); c.lineTo(212,103); c.lineTo(222,151); c.lineTo(176,167); c.lineTo(120,158); c.lineTo(70,169); c.lineTo(25,142); c.lineTo(12,96); c.closePath(); c.fill()
    c.strokeStyle = COLORS.mapRoad; c.globalAlpha = .46; c.lineWidth = 1; const edges = new Set()
    for (const city of CITIES) for (const neighborId of city.neighbors) { const edge = [city.id,neighborId].sort().join(':'); if (edges.has(edge)) continue; edges.add(edge); const neighbor = CITY_BY_ID[neighborId]; c.beginPath(); c.moveTo(city.x,city.y); c.lineTo(neighbor.x,neighbor.y); c.stroke() }
    c.globalAlpha = 1
    if (this.view === 'marchTarget') { const source = CITIES[this.cityIndex]; const target = CITY_BY_ID[this.marchTargets[this.menuIndex]]; if (source && target) { c.strokeStyle='#ffe08a'; c.lineWidth=2; c.beginPath(); c.moveTo(source.x,source.y); c.lineTo(target.x,target.y); c.stroke(); c.strokeRect(target.x-6,target.y-6,12,12) } }
    CITIES.forEach((city,index) => { const runtime=this.app.store.state.cities[city.id]; const faction=FACTION_BY_ID[runtime.owner]; const selected=index===this.cityIndex; c.fillStyle=faction.color; const size=selected?9:7; c.fillRect(city.x-Math.floor(size/2),city.y-Math.floor(size/2),size,size); c.strokeStyle=selected?'#ffe08a':'#080808'; c.lineWidth=selected?2:1; c.strokeRect(city.x-Math.floor(size/2)-.5,city.y-Math.floor(size/2)-.5,size+1,size+1); r.text(city.name,city.x,city.y+6,6,selected?'#ffe08a':'#e6dcc0','center') })
  }
  drawIntel() {
    const r=this.app.r; const city=CITIES[this.cityIndex]; const runtime=this.app.store.state.cities[city.id]; const faction=FACTION_BY_ID[runtime.owner]
    r.panel(232,24,84,150,COLORS.panel); r.shadowText(city.name,274,34,12,'#f0d27b','center'); r.text(faction.label,239,53,7,faction.color); r.text(`兵 ${runtime.troops}`,239,69,7,'#d8ccb0'); r.text(`金 ${runtime.gold}`,239,82,7,'#d8ccb0'); r.text(`粮 ${runtime.food}`,239,95,7,'#d8ccb0'); r.text(`开发 ${runtime.development}`,239,108,7,'#aaa087'); r.text(`民心 ${runtime.morale}`,239,121,7,'#aaa087'); r.text(`城防 ${runtime.defense}`,239,134,7,'#aaa087'); r.wrapText(city.neighbors.map((id)=>CITY_BY_ID[id].name).join('·'),239,150,70,8,6,'#756e60')
  }
  drawFooter() {
    const r=this.app.r; r.panel(4,176,312,44,COLORS.ink); r.text(this.app.store.state.log[0]??'',10,183,7,'#b9ad91')
    const hint=this.view==='map'?(this.app.store.mode==='inspection'?'方向键选城  Z视察  C结束本月  X标题':'方向键选城  Z选择行军路线  C结束本月  X标题'):'方向键选择  Z确定  X返回'; r.text(hint,10,204,7,'#746d5e')
  }
  drawCategoryMenu() { const r=this.app.r; r.panel(91,59,138,88,'#101018'); r.text('本月想做什么？',160,66,8,'#d7caa6','center'); CATEGORIES.forEach((category,index)=>r.text(`${index===this.menuIndex?'▶':' '} ${CATEGORY_LABELS[category]}`,111,87+index*17,9,index===this.menuIndex?'#ffe08a':'#c5b899')) }
  drawCommandMenu() { const r=this.app.r; const items=COMMANDS[this.category]; r.panel(101,45,118,34+items.length*15,'#101018'); r.text(CATEGORY_LABELS[this.category],160,53,9,'#e4cd7d','center'); items.forEach((item,index)=>r.text(`${index===this.menuIndex?'▶':' '} ${item[1]}`,119,70+index*15,8,index===this.menuIndex?'#ffe08a':'#c5b899')) }
  drawMarchMenu() { const r=this.app.r; const source=CITIES[this.cityIndex]; const target=CITY_BY_ID[this.marchTargets[this.menuIndex]]; r.panel(67,67,186,65,'#101018'); r.text(`从 ${source.name} 行军`,160,76,9,'#e4cd7d','center'); r.text(target?`▶ ${target.name}`:'无可用路线',160,95,11,'#ffe08a','center'); r.text('← → 切换相邻城池',160,114,7,'#7f7767','center') }
  drawMessage() { const r=this.app.r; r.panel(40,76,240,64,'#0d0d13'); r.wrapText(this.message,160,88,212,10,8,'#e9ddbd','center'); r.text('Z / X 关闭',160,124,7,'#756e60','center') }
}
