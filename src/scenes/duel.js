import { COLORS, H, W } from '../game/constants.js'
import { CITY_BY_ID, FACTION_BY_ID } from '../game/data.js'

export class DuelScene {
  constructor(app) {
    this.app = app; this.playerX = 75; this.enemyX = 245; this.playerHp = 100; this.enemyHp = 100; this.attackCooldown = 0; this.enemyCooldown = 0; this.resultTimer = 0; this.result = null
    this.conflict = app.store.pendingConflict
    if (!this.conflict) app.go('strategy')
  }
  update(dt, input) {
    if (this.result) { this.resultTimer += dt; if (this.resultTimer > 900) this.app.go('strategy'); return }
    this.attackCooldown = Math.max(0,this.attackCooldown-dt); this.enemyCooldown = Math.max(0,this.enemyCooldown-dt)
    if (input.isDown('ArrowLeft')) this.playerX = Math.max(25,this.playerX-.09*dt); if (input.isDown('ArrowRight')) this.playerX = Math.min(this.enemyX-18,this.playerX+.09*dt)
    let key=input.consume(); while(key){ const n=key.length===1?key.toLowerCase():key; if((n==='z'||n==='Enter')&&this.attackCooldown<=0){ this.attackCooldown=320; if(this.enemyX-this.playerX<44)this.enemyHp=Math.max(0,this.enemyHp-12)} key=input.consume() }
    const distance=this.enemyX-this.playerX; if(distance>34)this.enemyX-=.036*dt; if(distance<24)this.enemyX+=.05*dt; this.enemyX=Math.max(this.playerX+18,Math.min(290,this.enemyX))
    if(distance<38&&this.enemyCooldown<=0){this.enemyCooldown=760;this.playerHp=Math.max(0,this.playerHp-8)}
    if(this.enemyHp<=0)this.finish(true);else if(this.playerHp<=0)this.finish(false)
  }
  finish(attackerWon){if(this.result)return;this.result=attackerWon?'胜':'败';this.app.store.resolveConflict(attackerWon)}
  draw(){
    const conflict=this.conflict;const r=this.app.r;const c=r.ctx;r.clear('#17120d');c.fillStyle='#3c2a19';c.fillRect(0,33,W,123);c.fillStyle='#8a6a3c';c.fillRect(0,156,W,68);c.fillStyle='#1d2630'
    c.beginPath();c.moveTo(0,108);c.lineTo(64,61);c.lineTo(122,113);c.fill();c.beginPath();c.moveTo(83,108);c.lineTo(160,52);c.lineTo(224,113);c.fill();c.beginPath();c.moveTo(190,108);c.lineTo(276,63);c.lineTo(320,112);c.fill();c.fillStyle='rgba(21,21,21,.65)';for(let x=0;x<W;x+=11)c.fillRect(x,145+(x%22===0?-3:0),7,11)
    r.panel(4,4,312,29,COLORS.ink);if(conflict){r.shadowText(`${CITY_BY_ID[conflict.target].name} · 单挑`,160,9,10,'#e5cf80','center');r.text(FACTION_BY_ID[conflict.attacker].label,9,22,6,'#b8ad93');r.text(FACTION_BY_ID[conflict.defender].label,311,22,6,'#b8ad93','right');this.drawFighter(this.playerX,151,FACTION_BY_ID[conflict.attacker].color,false);this.drawFighter(this.enemyX,151,FACTION_BY_ID[conflict.defender].color,true)}
    r.text(`我方 ${String(this.playerHp).padStart(3)}     敌方 ${String(this.enemyHp).padStart(3)}`,160,39,7,'#f1e2b8','center');r.text('← → 移动   Z 攻击   保持距离寻找出手机会',160,H-15,7,'#796f5d','center','middle');if(this.result)r.shadowText(this.result,W/2,93,32,this.result==='胜'?'#ffe08a':'#d06a5f','center','middle');r.scanlines(.07)
  }
  drawFighter(x,y,color,flip){const c=this.app.r.ctx;c.fillStyle='#704226';c.fillRect(Math.round(x-15),y+7,30,12);c.strokeStyle='#17100b';c.strokeRect(Math.round(x-15)+.5,y+7.5,29,11);c.fillStyle=color;c.fillRect(Math.round(x-6),y-10,12,18);c.fillStyle='#d7b07e';c.fillRect(Math.round(x-4),y-18,8,8);c.fillStyle='#d9d0b2';const wx=flip?x-29:x+4;c.fillRect(Math.round(wx),y-5,25,2)}
}
