import { AudioBus } from './game/audio.js'
import { Input } from './game/input.js'
import { shouldBlockTitleNavigation } from './game/parity.js'
import { makeRenderer } from './game/render.js'
import { GameStore } from './game/store.js'
import { DuelScene } from './scenes/duel.js'
import { PlayerCountScene } from './scenes/player-count.js'
import { SetupScene } from './scenes/setup.js'
import { SiegeScene } from './scenes/siege.js'
import { StrategyScene } from './scenes/strategy-info.js'
import { TitleScene } from './scenes/title.js'
class App{
  constructor(canvas){this.canvas=canvas;this.r=makeRenderer(canvas);this.store=new GameStore(window.localStorage);this.audio=new AudioBus();this.input=new Input(window);this.scene=null;this.last=performance.now();this.hd=true;this.playerCount=1;this.frame=this.frame.bind(this);const forced=new URLSearchParams(location.search).get('scene');if(forced==='players')this.go('players');else if(forced==='setup')this.go('setup');else if(forced==='strategy'){this.store.newGame({scenarioYear:189,humanFactions:['liu']});this.go('strategy')}else this.go('title');requestAnimationFrame(this.frame);canvas.addEventListener('pointerdown',()=>canvas.focus());canvas.focus()}
  go(name,{force=false}={}){const fromStrategy=this.scene instanceof StrategyScene;if(name==='title'&&shouldBlockTitleNavigation({hasGame:this.store.hasGame(),fromStrategy,force}))return false;const scenes={title:TitleScene,players:PlayerCountScene,setup:SetupScene,strategy:StrategyScene,siege:SiegeScene,duel:DuelScene};const Scene=scenes[name];if(!Scene)throw new Error(`Unknown scene ${name}`);this.scene=new Scene(this);return true}
  toggleHd(){this.hd=!this.hd;this.canvas.classList.toggle('pixel-preview',!this.hd);this.audio.move()}
  frame(now){const dt=Math.min(50,now-this.last);this.last=now;this.scene?.update?.(dt,this.input);this.scene?.draw?.();requestAnimationFrame(this.frame)}
}
const canvas=document.querySelector('#game');if(!(canvas instanceof HTMLCanvasElement))throw new Error('Game canvas missing');new App(canvas)
