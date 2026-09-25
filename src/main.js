import { AssetRegistry } from './game/assets.js'
import { AudioBus } from './game/audio.js'
import { Input } from './game/input.js'
import { shouldBlockTitleNavigation } from './game/parity.js'
import { prepareVisualQaStore } from './game/qa-fixtures.js'
import { applyVisualQaState, initialSceneForVisualQa } from './game/qa-state.js'
import { makeRenderer } from './game/render.js'
import { GameStore } from './game/store.js'
import { DuelScene } from './scenes/duel.js'
import { FieldBattleScene } from './scenes/field-battle.js'
import { PlayerCountScene } from './scenes/player-count.js'
import { SetupScene } from './scenes/setup.js'
import { SiegeScene } from './scenes/siege.js'
import { StrategyScene } from './scenes/strategy-full-map.js'
import { TitleScene } from './scenes/title.js'

class App {
  constructor(canvas) {
    this.canvas=canvas
    this.r=makeRenderer(canvas)
    this.hd=true
    this.r.syncResolution({pixelPreview:!this.hd})
    this.store=new GameStore(window.localStorage)
    this.audio=new AudioBus()
    this.input=new Input(window)
    this.assets=new AssetRegistry()
    this.assetsReady=this.assets.load()
    this.scene=null
    this.last=performance.now()
    this.playerCount=1
    this.frame=this.frame.bind(this)

    const params=new URLSearchParams(location.search)
    const qa=params.get('qa')
    const forced=params.get('scene')
    const initial=forced??initialSceneForVisualQa(qa)

    const qaNeedsGame=['strategy','siege','duel'].includes(initial)
    if(qa&&qaNeedsGame){
      this.store.newGame({scenarioYear:189,humanFactions:['liu']})
      prepareVisualQaStore(this.store,qa)
    }

    if(initial==='players')this.go('players')
    else if(initial==='setup')this.go('setup')
    else if(initial==='strategy')this.go('strategy')
    else if(initial==='siege')this.go('siege')
    else if(initial==='duel')this.go('duel')
    else this.go('title')

    if(qa)applyVisualQaState(this,qa)

    requestAnimationFrame(this.frame)
    canvas.addEventListener('pointerdown',()=>canvas.focus())
    window.addEventListener('resize',()=>this.syncRenderResolution(),{passive:true})
    canvas.focus()
  }

  go(name,{force=false}={}) {
    if(name==='strategy'&&this.store.pendingConflict?.kind==='field')name='field-battle'
    if(name==='strategy'&&this.store.pendingConflict?.kind==='siege')name='siege'
    const fromStrategy=this.scene instanceof StrategyScene
    if(name==='title'&&shouldBlockTitleNavigation({
      hasGame:this.store.hasGame(),
      fromStrategy,
      force,
    }))return false

    const scenes={
      title:TitleScene,
      players:PlayerCountScene,
      setup:SetupScene,
      strategy:StrategyScene,
      siege:SiegeScene,
      duel:DuelScene,
      'field-battle':FieldBattleScene,
    }
    const Scene=scenes[name]
    if(!Scene)throw new Error(`Unknown scene ${name}`)
    this.scene=new Scene(this)
    return true
  }

  syncRenderResolution() {
    this.r.syncResolution({pixelPreview:!this.hd})
  }

  toggleHd() {
    this.hd=!this.hd
    this.canvas.classList.toggle('pixel-preview',!this.hd)
    this.syncRenderResolution()
    this.audio.move()
  }

  frame(now) {
    const dt=Math.min(50,now-this.last)
    this.last=now
    this.scene?.update?.(dt,this.input)
    this.scene?.draw?.()
    requestAnimationFrame(this.frame)
  }
}

const canvas=document.querySelector('#game')
if(!(canvas instanceof HTMLCanvasElement))throw new Error('Game canvas missing')
new App(canvas)
