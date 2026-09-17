import { GameStore } from './game/store.js'
import { Input } from './game/input.js'
import { makeRenderer } from './game/render.js'
import { DuelScene } from './scenes/duel.js'
import { FactionScene } from './scenes/faction.js'
import { ScenarioScene } from './scenes/scenario.js'
import { StrategyScene } from './scenes/strategy.js'
import { TitleScene } from './scenes/title.js'

class App {
  constructor(canvas) {
    this.canvas = canvas
    this.r = makeRenderer(canvas)
    this.store = new GameStore(window.localStorage)
    this.input = new Input(window)
    this.scene = null
    this.lastTime = performance.now()
    this.go('title')
    this.frame = this.frame.bind(this)
    requestAnimationFrame(this.frame)
    canvas.addEventListener('pointerdown', () => canvas.focus())
    canvas.focus()
  }

  go(name, data = {}) {
    const scenes = { title: TitleScene, scenario: ScenarioScene, faction: FactionScene, strategy: StrategyScene, duel: DuelScene }
    const Scene = scenes[name]
    if (!Scene) throw new Error(`Unknown scene: ${name}`)
    this.scene = new Scene(this, data)
  }

  frame(now) {
    const dt = Math.min(50, now - this.lastTime)
    this.lastTime = now
    this.scene?.update?.(dt, this.input)
    this.scene?.draw?.()
    requestAnimationFrame(this.frame)
  }
}

const canvas = document.querySelector('#game')
if (!(canvas instanceof HTMLCanvasElement)) throw new Error('Game canvas not found')
new App(canvas)
