import { COLORS, SERIF } from '../game/constants.js'
import { CITY_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { dailyFoodFor } from '../game/march.js'
import { MAX_FOOD_DAYS, foodForDays, maxFoodDaysForStock } from '../game/parity.js'
import { cityWorldPoint } from '../game/world.js'
import { StrategyScene as MarchStrategyScene } from './strategy-march.js'

export class StrategyScene extends MarchStrategyScene {
  constructor(app) {
    super(app)
    this.marchFoodDays = 0
    this.routePromptReturnView = 'march-compose'
  }

  update(dt, input) {
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

  beginMarchCompose(cityId) {
    super.beginMarchCompose(cityId)
    const city = this.app.store.state.cities[cityId]
    const daily = dailyFoodFor(this.marchTroops, 1)
    this.marchFoodDays = Math.min(
      maxFoodDaysForStock(this.marchTroops, 1, city?.food ?? 0),
      Math.max(0, Math.floor((this.marchFood ?? 0) / Math.max(1, daily))),
    )
    this.marchFood = foodForDays(this.marchTroops, 1, this.marchFoodDays)
  }

  updateMarchCompose(b) {
    const city = this.app.store.state.cities[this.marchFrom]
    if (!city) {
      this.view = 'map'
      return
    }
    if (b === 'UP') {
      this.composeFocus = (this.composeFocus + 3) % 4
      this.app.audio.move()
    }
    if (b === 'DOWN') {
      this.composeFocus = (this.composeFocus + 1) % 4
      this.app.audio.move()
    }
    if (b === 'LEFT' || b === 'RIGHT') {
      const d = b === 'RIGHT' ? 1 : -1
      if (this.composeFocus === 0) {
        this.marchTroops = Math.max(100, Math.min(city.troops - 100, this.marchTroops + d * 100))
        const maxDays = maxFoodDaysForStock(this.marchTroops, 1, city.food)
        this.marchFoodDays = Math.min(this.marchFoodDays, maxDays)
      }
      if (this.composeFocus === 1) this.marchGold = Math.max(0, Math.min(city.gold, this.marchGold + d * 50))
      if (this.composeFocus === 2) {
        const maxDays = maxFoodDaysForStock(this.marchTroops, 1, city.food)
        this.marchFoodDays = Math.max(0, Math.min(maxDays, this.marchFoodDays + d))
      }
      this.marchFood = foodForDays(this.marchTroops, 1, this.marchFoodDays)
      this.app.audio.move()
    }
    if (b === 'B') {
      this.view = 'map'
      this.app.audio.cancel()
      return
    }
    if ((b === 'C' || b === 'A' || b === 'START') && this.composeFocus === 3) this.beginNewMarchRoute()
  }

  beginNewMarchRoute() {
    const point = cityWorldPoint(CITY_BY_ID[this.marchFrom])
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

  draw() {
    super.draw()
    if (this.view === 'march-route-prompt') this.drawMarchRoutePrompt()
  }

  drawMarchCompose() {
    const r = this.app.r
    const city = CITY_BY_ID[this.marchFrom]
    const daily = dailyFoodFor(this.marchTroops, 1)
    const food = foodForDays(this.marchTroops, 1, this.marchFoodDays)
    r.panel(68, 38, 184, 136, '#000', '#9b6514')
    r.text(`${city?.name ?? ''} 出陣`, 160, 47, 11, '#efd27d', 'center', 'top', SERIF, '700')
    const rows = [
      ['兵力', this.marchTroops],
      ['軍資金', this.marchGold],
      ['兵糧日數', `${this.marchFoodDays}日`],
      ['路線', '指定'],
    ]
    rows.forEach(([label, value], i) => {
      r.text(`${i === this.composeFocus ? '▶' : '　'}${label}`, 91, 70 + i * 20, 8, i === this.composeFocus ? COLORS.cyan : '#ddd0ad')
      r.text(value, 229, 70 + i * 20, 8, i === this.composeFocus ? COLORS.cyan : '#eee0bd', 'right')
    })
    r.text('武將選擇：名冊校準後接入', 160, 150, 6, '#8e846f', 'center')
    r.text(`1日 ${daily}米 × ${this.marchFoodDays}日 = ${food}米`, 160, 161, 6, '#a99d82', 'center')
  }

  drawMarchRoutePrompt() {
    const r = this.app.r
    r.panel(54, 73, 212, 77, '#000', '#b07118')
    r.text('目的地までの順路を', 160, 86, 10, '#f0dfad', 'center', 'top', SERIF, '700')
    r.text('お決め下さい', 160, 104, 12, COLORS.cyan, 'center', 'top', SERIF, '700')
    r.text('C / A：開始指定　B：取消', 160, 132, 6.5, '#9c927f', 'center')
  }
}
