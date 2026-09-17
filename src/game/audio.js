export class AudioBus{
  constructor(){this.ctx=null;this.enabled=true}
  ensure(){if(!this.enabled)return null;this.ctx??=new (window.AudioContext||window.webkitAudioContext)();return this.ctx}
  tone(freq=440,duration=.045,type='square',gain=.025){const ctx=this.ensure();if(!ctx)return;const o=ctx.createOscillator();const g=ctx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g).connect(ctx.destination);const t=ctx.currentTime;g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.start(t);o.stop(t+duration)}
  move(){this.tone(520,.025)} confirm(){this.tone(760,.04)} cancel(){this.tone(240,.05)} alert(){this.tone(150,.09,'sawtooth',.018)}
}
