import { COLORS, SERIF } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { drawStrategyPanel } from '../game/ui-art.js'
import { dailyFoodFor, queueMarch, rerouteArmy } from '../game/march.js'
import { foodForDays, maxFoodDaysForStock } from '../game/parity.js'
import { cityWorldPoint } from '../game/world.js'
import { StrategyScene as MarchStrategyScene } from './strategy-march.js'

const ROUTE_STEP = 8

export class StrategyScene extends MarchStrategyScene {
  constructor(app) {
    super(app)
    this.marchFoodDays = 0
    this.routePromptReturnView = 'march-compose'
    this.officerCursor = 0
    this.selectedOfficerNames = []
  }

  update(dt, input) {
    if (this.view === 'march-officers') return this.updateMarchOfficers(input)
    if (this.view !== 'march-route-prompt') return super.update(dt, input)
    const key = input.consume()
    if (!key) return
    const b = mdButton(key)
    if (b === 'HD') return this.app.toggleHd()
    if (b === 'B') {
      this.view = this.routePromptReturnView
      this.app.audio.cancel()
      return
    }
    if (b === 'A' || b === 'C' || b === 'START') {
      this.view = 'march-route'
      this.app.audio.confirm()
    }
  }

  // B is a cancel/back button only. On the root strategy map it must never
  // abandon the current game or jump back to the title screen.
  updateMap(b) {
    if (b === 'B') {
      this.app.audio.cancel()
      return
    }
    return super.updateMap(b)
  }

  availableOfficerNames() {
    const store = this.app.store
    const roster = store.state.openingRosters?.[store.humanFaction]
    if (roster) return [roster.ruler, ...(roster.officers ?? [])].filter(Boolean)
    const fallbackRuler = FACTION_BY_ID[store.humanFaction]?.ruler
    return fallbackRuler ? [fallbackRuler] : []
  }

  officerCount() {
    return Math.max(1, this.selectedOfficerNames.length)
  }

  beginMarchCompose(cityId) {
    super.beginMarchCompose(cityId)
    const city = this.app.store.state.cities[cityId]
    const available = this.availableOfficerNames()
    this.officerCursor = 0
    this.selectedOfficerNames = available.length ? [available[0]] : []
    const count = this.officerCount()
    const daily = dailyFoodFor(this.marchTroops, count)
    this.marchFoodDays = Math.min(
      maxFoodDaysForStock(this.marchTroops, count, city?.food ?? 0),
      Math.max(0, Math.floor((this.marchFood ?? 0) / Math.max(1, daily))),
    )
    this.marchFood = foodForDays(this.marchTroops, count, this.marchFoodDays)
  }

  updateMarchCompose(b) {
    const city = this.app.store.state.cities[this.marchFrom]
    if (!city) {
      this.view = 'map'
      return
    }
    if (b === 'UP') {
      this.composeFocus = (this.composeFocus + 4) % 5
      this.app.audio.move()
    }
    if (b === 'DOWN') {
      this.composeFocus = (this.composeFocus + 1) % 5
      this.app.audio.move()
    }
    if ((b === 'A' || b === 'C' || b === 'START') && this.composeFocus === 0) {
      this.view = 'march-officers'
      this.officerCursor = 0
      this.app.audio.confirm()
      return
    }
    if (b === 'LEFT' || b === 'RIGHT') {
      const delta = b === 'RIGHT' ? 1 : -1
      const count = this.officerCount()
      if (this.composeFocus === 1) {
        this.marchTroops = Math.max(100, Math.min(city.troops - 100, this.marchTroops + delta * 100))
        const maxDays = maxFoodDaysForStock(this.marchTroops, count, city.food)
        this.marchFoodDays = Math.min(this.marchFoodDays, maxDays)
      }
      if (this.composeFocus === 2) this.marchGold = Math.max(0, Math.min(city.gold, this.marchGold + delta * 50))
      if (this.composeFocus === 3) {
        const maxDays = maxFoodDaysForStock(this.marchTroops, count, city.food)
        this.marchFoodDays = Math.max(0, Math.min(maxDays, this.marchFoodDays + delta))
      }
      this.marchFood = foodForDays(this.marchTroops, count, this.marchFoodDays)
      this.app.audio.move()
    }
    if (b === 'B') {
      this.view = 'map'
      this.app.audio.cancel()
      return
    }
    if ((b === 'C' || b === 'A' || b === 'START') && this.composeFocus === 4) this.beginNewMarchRoute()
  }

  updateMarchOfficers(input) {
    const key = input.consume()
    if (!key) return
    const b = mdButton(key)
    if (b === 'HD') return this.app.toggleHd()
    const available = this.availableOfficerNames()
    if (!available.length) {
      this.view = 'march-compose'
      return
    }
    if (b === 'UP') {
      this.officerCursor = (this.officerCursor - 1 + available.length) % available.length
      this.app.audio.move()
    }
    if (b === 'DOWN') {
      this.officerCursor = (this.officerCursor + 1) % available.length
      this.app.audio.move()
    }
    if (b === 'B' || b === 'START') {
      this.view = 'march-compose'
      this.app.audio.cancel()
      return
    }
    if (b !== 'A' && b !== 'C') return

    const name = available[this.officerCursor]
    const index = this.selectedOfficerNames.indexOf(name)
    if (index >= 0) {
      if (this.selectedOfficerNames.length === 1) {
        this.app.audio.alert()
        return
      }
      this.selectedOfficerNames.splice(index, 1)
    } else {
      this.selectedOfficerNames.push(name)
    }

    const city = this.app.store.state.cities[this.marchFrom]
    const count = this.officerCount()
    const maxDays = maxFoodDaysForStock(this.marchTroops, count, city?.food ?? 0)
    this.marchFoodDays = Math.min(this.marchFoodDays, maxDays)
    this.marchFood = foodForDays(this.marchTroops, count, this.marchFoodDays)
    this.app.audio.confirm()
  }

  beginNewMarchRoute() {
    const point = cityWorldPoint(this.app.store.mapProfile?.cityById?.[this.marchFrom])
    this.marchRoute = [{ ...point }]
    this.app.store.setCursor(point.x, point.y)
    this.routePromptReturnView = 'march-compose'
    this.view = 'march-route-prompt'
    this.app.audio.confirm()
  }

  beginArmyRoute(army) {
    this.marchArmyId = army.id
    this.marchFrom = army.from
    this.marchRoute = [{ x: army.x, y: army.y }]
    this.app.store.setCursor(army.x, army.y)
    this.routePromptReturnView = 'army-menu'
    this.view = 'march-route-prompt'
    this.app.audio.confirm()
  }

  updateMarchRoute(b) {
    if (['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(b)) {
      const dx = b === 'LEFT' ? -1 : b === 'RIGHT' ? 1 : 0
      const dy = b === 'UP' ? -1 : b === 'DOWN' ? 1 : 0
      const state = this.app.store.state
      this.app.store.setCursor(state.cursor.x + dx * ROUTE_STEP, state.cursor.y + dy * ROUTE_STEP)
      const point = this.app.store.state.cursor
      const last = this.marchRoute[this.marchRoute.length - 1]
      if (!last || last.x !== point.x || last.y !== point.y) this.marchRoute.push({ x:point.x, y:point.y })
      this.app.audio.move()
      return
    }
    if (b === 'B') {
      if (this.marchRoute.length > 1) {
        this.marchRoute.pop()
        const point = this.marchRoute[this.marchRoute.length - 1]
        this.app.store.setCursor(point.x, point.y)
      } else {
        this.view = this.marchArmyId ? 'army-menu' : 'march-compose'
      }
      this.app.audio.cancel()
      return
    }
    if (b !== 'C' && b !== 'START') return
    if (this.marchRoute.length < 2) {
      this.app.audio.alert()
      return
    }
    try {
      if (this.marchArmyId) {
        rerouteArmy(this.app.store, this.marchArmyId, this.marchRoute)
      } else {
        queueMarch(this.app.store, {
          from:this.marchFrom,
          route:this.marchRoute,
          troops:this.marchTroops,
          food:this.marchFood,
          gold:this.marchGold,
          officerCount:this.officerCount(),
          officerNames:[...this.selectedOfficerNames],
        })
      }
      this.message = '行軍路線已決定。部隊將在本月命令結束後移動。'
      this.marchArmyId = null
      this.marchRoute = []
      this.view = 'message'
      this.app.audio.confirm()
    } catch (error) {
      this.message = error instanceof Error ? error.message : '行軍命令失敗。'
      this.view = 'message'
      this.app.audio.alert()
    }
  }

  draw() {
    super.draw()
    if (this.view === 'march-route-prompt') this.drawMarchRoutePrompt()
    if (this.view === 'march-officers') this.drawMarchOfficers()
  }

  drawMarchCompose() {
    const r = this.app.r
    const city = this.app.store.mapProfile?.cityById?.[this.marchFrom]
    const count = this.officerCount()
    const daily = dailyFoodFor(this.marchTroops, count)
    const food = foodForDays(this.marchTroops, count, this.marchFoodDays)
    const officerLabel = this.selectedOfficerNames.length
      ? this.selectedOfficerNames.join('、')
      : '未選擇'
    drawStrategyPanel(r,62, 27, 196, 151, '#000', '#9b6514')
    r.text(`${city?.name ?? ''} 出陣`, 160, 36, 11, '#efd27d', 'center', 'top', SERIF, '700')
    const rows = [
      { label:'武將', value:`${count}人` },
      { label:'兵力', value:this.marchTroops },
      { label:'軍資金', value:this.marchGold },
      { label:'兵糧日數', value:`${this.marchFoodDays}日` },
      { label:'路線', value:'指定' },
    ]
    rows.forEach(({ label, value }, i) => {
      const y = 57 + i * 18
      const focused = i === this.composeFocus
      const color = focused ? COLORS.cyan : '#ddd0ad'
      r.text(focused ? '▶' : '　', 78, y, 8, color)
      r.text(label, 91, y, 8, color)
      r.text(value, 234, y, 8, focused ? COLORS.cyan : '#eee0bd', 'right')
    })
    r.text(officerLabel, 160, 149, 6, '#b8aa8c', 'center')
    r.text(`1日 ${daily}米 × ${this.marchFoodDays}日 = ${food}米`, 160, 162, 6, '#a99d82', 'center')
  }

  drawMarchOfficers() {
    const r = this.app.r
    const available = this.availableOfficerNames()
    const visibleCount = Math.min(8, available.length)
    const maxStart = Math.max(0, available.length - visibleCount)
    const start = Math.max(0, Math.min(maxStart, this.officerCursor - 3))
    drawStrategyPanel(r,68, 26, 184, 153, '#000', '#9b6514')
    r.text('出陣武將', 160, 35, 11, '#efd27d', 'center', 'top', SERIF, '700')
    r.text(`已選 ${this.selectedOfficerNames.length} 人`, 160, 49, 6, '#9f947b', 'center')
    available.slice(start, start + visibleCount).forEach((name, row) => {
      const index = start + row
      const focused = index === this.officerCursor
      const selected = this.selectedOfficerNames.includes(name)
      r.text(`${focused ? '▶' : '　'}${selected ? '●' : '○'} ${name}`, 91, 62 + row * 13, 8, focused ? COLORS.cyan : selected ? '#eee0bd' : '#807766')
    })
    r.text('A/C 選擇　B/START 返回', 160, 164, 6, '#8e846f', 'center')
  }

  drawMarchRoutePrompt() {
    const r = this.app.r
    drawStrategyPanel(r,54, 73, 212, 77, '#000', '#b07118')
    r.text('請決定到目的地的', 160, 86, 10, '#f0dfad', 'center', 'top', SERIF, '700')
    r.text('行軍路線', 160, 104, 12, COLORS.cyan, 'center', 'top', SERIF, '700')
    r.text('C / A：開始指定　B：取消', 160, 132, 6.5, '#9c927f', 'center')
  }
}
