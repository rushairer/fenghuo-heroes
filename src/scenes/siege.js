import { COLORS } from '../game/constants.js'
import { CITY_BY_ID, FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
const OPTIONS=['攻城','一騎討ち','退卻']
export class SiegeScene{
  constructor(app){this.app=app;this.index=1;this.conflict=app.store.pendingConflict;if(!this.conflict)app.go('strategy')}
  update(_dt,input){const key=input.consume();if(!key)return;const b=mdButton(key);if(b==='HD'){this.app.toggleHd();return}if(b==='UP'){this.index=(this.index+2)%3;this.app.audio.move()}if(b==='DOWN'){this.index=(this.index+1)%3;this.app.audio.move()}if(b==='B'){this.retreat();return}if(b==='A'||b==='C'||b==='START'){if(this.index===0)this.assault();if(this.index===1){this.app.audio.confirm();this.app.go('duel')}if(this.index===2)this.retreat()}}
  assault(){const c=this.conflict;const atk=c.attackerTroops,def=c.defenderTroops;const win=atk*1.12>=def;this.app.audio.confirm();this.app.store.resolveConflict(win);this.app.go('strategy')}
  retreat(){this.app.audio.cancel();this.app.store.resolveConflict(false);this.app.go('strategy')}
  draw(){const r=this.app.r,c=r.ctx;r.clear('#160d08');r.ornateFrame(3,3,314,218);const city=CITY_BY_ID[this.conflict?.target];r.shadowText(`${city?.name??''} 攻城`,160,18,14,'#f2d174','center');r.fillRect(15,48,290,105,'#573a22');r.fillRect(15,118,290,35,'#75613a');for(let x=40;x<290;x+=36){r.fillRect(x,76,22,42,'#84735a');r.fillRect(x+4,67,14,9,'#443629')}r.fillRect(115,91,90,62,'#3d2d22');r.fillRect(139,110,42,43,'#18120e');c.fillStyle='rgba(0,0,0,.25)';for(let i=0;i<12;i++)c.fillRect((18+i*27)*r.S,(130+(i%3)*4)*r.S,15*r.S,18*r.S);const af=FACTION_BY_ID[this.conflict?.attacker],df=FACTION_BY_ID[this.conflict?.defender];r.panel(30,157,260,50,'#030303','#7e5315');r.text(`${af?.label??''} ${this.conflict?.attackerTroops??0}`,45,164,7,af?.color??'#fff');r.text(`${df?.label??''} ${this.conflict?.defenderTroops??0}`,275,164,7,df?.color??'#fff','right');OPTIONS.forEach((v,i)=>r.text(`${i===this.index?'▶':'　'}${v}`,160,179+i*9,7.5,i===this.index?COLORS.cyan:'#ddd0ad','center'));r.scanlines(.02)}
}
