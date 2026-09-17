const BLOCKED=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '])
export class Input{
  constructor(target=window){this.target=target;this.down=new Set();this.queue=[];this.onDown=(e)=>{if(BLOCKED.has(e.key))e.preventDefault();if(!e.repeat)this.queue.push(e.key);this.down.add(e.key)};this.onUp=(e)=>this.down.delete(e.key);target.addEventListener('keydown',this.onDown,{passive:false});target.addEventListener('keyup',this.onUp)}
  consume(){return this.queue.shift()??null}
  isDown(k){return this.down.has(k)}
  destroy(){this.target.removeEventListener('keydown',this.onDown);this.target.removeEventListener('keyup',this.onUp)}
}
export function mdButton(key){if(!key)return null;if(key==='z'||key==='Z')return'A';if(key==='x'||key==='X'||key==='Escape')return'B';if(key==='c'||key==='C')return'C';if(key==='Enter')return'START';if(key.startsWith('Arrow'))return key.slice(5).toUpperCase();if(key==='h'||key==='H')return'HD';return null}
