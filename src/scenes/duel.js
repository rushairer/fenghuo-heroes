import { drawDuelArena, drawDuelFighter } from '../game/battle-art.js'
import { COLORS, SERIF } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import { DUEL_COMMANDS, DUEL_MODES, autoDuelIntent, cycleDuelMode } from '../game/duel-parity.js'
import { mdButton } from '../game/input.js'

export class DuelScene{
  constructor(app){
    this.app=app
    this.c=app.store.pendingConflict
    if(!this.c){app.go('strategy');return}
    this.px=78;this.ex=242;this.php=100;this.ehp=100
    this.attackCd=0;this.enemyCd=0;this.guard=false
    this.result=null;this.timer=0;this.commandOpen=false;this.commandIndex=0
    this.message='';this.enemyRage=0;this.hitFlash=0
    this.modeSelect=true;this.modeIndex=0;this.autoMode=false;this.autoElapsed=0
  }

  update(dt,input){
    if(this.modeSelect){this.updateModeSelect(input);return}
    if(this.result){this.timer+=dt;if(this.timer>950)this.app.go('siege');return}
    this.attackCd=Math.max(0,this.attackCd-dt)
    this.enemyCd=Math.max(0,this.enemyCd-dt)
    this.enemyRage=Math.max(0,this.enemyRage-dt)
    this.hitFlash=Math.max(0,this.hitFlash-dt)

    if(this.commandOpen){this.updateCommandMenu(input);return}

    if(this.autoMode)this.updateAutoPlayer(dt)
    else this.updateManualPlayer(dt,input)

    this.updateEnemy(dt)
    if(this.ehp<=0)this.finish(true)
    else if(this.php<=0)this.finish(false)
  }

  updateModeSelect(input){
    const key=input.consume();if(!key)return
    const b=mdButton(key)
    if(b==='HD'){this.app.toggleHd();return}
    if(b==='UP'||b==='LEFT'){this.modeIndex=cycleDuelMode(this.modeIndex,-1);this.app.audio.move();return}
    if(b==='DOWN'||b==='RIGHT'){this.modeIndex=cycleDuelMode(this.modeIndex,1);this.app.audio.move();return}
    if(b==='B'){this.app.audio.cancel();this.app.go('siege');return}
    if(b==='A'||b==='C'||b==='START'){
      this.autoMode=DUEL_MODES[this.modeIndex].id==='auto'
      this.modeSelect=false
      this.autoElapsed=0
      this.message=this.autoMode?'自動一騎討ち':'手動一騎討ち'
      this.app.audio.confirm()
    }
  }

  updateCommandMenu(input){
    const key=input.consume();if(!key)return
    const b=mdButton(key)
    if(b==='HD')return this.app.toggleHd()
    if(b==='UP'){this.commandIndex=(this.commandIndex+DUEL_COMMANDS.length-1)%DUEL_COMMANDS.length;this.app.audio.move()}
    if(b==='DOWN'){this.commandIndex=(this.commandIndex+1)%DUEL_COMMANDS.length;this.app.audio.move()}
    if(b==='B'){this.commandOpen=false;this.message='';this.app.audio.cancel()}
    if(b==='C'||b==='A')this.executeCommand()
  }

  updateManualPlayer(dt,input){
    if(input.isDown('ArrowLeft'))this.px=Math.max(28,this.px-.06*dt)
    if(input.isDown('ArrowRight'))this.px=Math.min(this.ex-22,this.px+.06*dt)
    this.guard=input.isDown('c')||input.isDown('C')
    let key=input.consume()
    while(key){
      const b=mdButton(key)
      if(b==='HD')this.app.toggleHd()
      if(b==='A'){
        this.commandOpen=true;this.commandIndex=0;this.message='';this.app.audio.confirm();break
      }
      if(b==='B'&&this.attackCd<=0){
        const stance=input.isDown('ArrowUp')?'high':input.isDown('ArrowDown')?'low':'middle'
        this.attack(stance)
      }
      if((b==='UP'||b==='DOWN')&&(input.isDown('x')||input.isDown('X'))&&this.attackCd<=0)this.attack(b==='UP'?'high':'low')
      key=input.consume()
    }
  }

  updateAutoPlayer(dt){
    this.autoElapsed+=dt
    const distance=this.ex-this.px
    const intent=autoDuelIntent(this.autoElapsed,distance)
    this.guard=intent.guard
    if(intent.move>0)this.px=Math.min(this.ex-22,this.px+.045*dt)
    else if(intent.move<0)this.px=Math.max(28,this.px-.04*dt)
    if(intent.attack&&this.attackCd<=0)this.attack(intent.attack,false)
  }

  updateEnemy(dt){
    const d=this.ex-this.px,rage=this.enemyRage>0?1.65:1
    if(d>40)this.ex-=.024*rage*dt
    else if(d<27)this.ex+=.034*dt
    this.ex=Math.max(this.px+22,Math.min(292,this.ex))
    if(d<43&&this.enemyCd<=0){
      this.enemyCd=this.enemyRage>0?430:720
      const dmg=this.guard?2:this.enemyRage>0?12:8
      this.php=Math.max(0,this.php-dmg)
      this.hitFlash=130
      this.app.audio.alert()
    }
  }

  attack(stance,withSound=true){
    this.attackCd=330
    const d=this.ex-this.px,reach=stance==='middle'?47:43,damage=stance==='middle'?11:14
    this.message=stance==='high'?'上段！':stance==='low'?'下段！':'中段！'
    if(withSound)this.app.audio.confirm()
    if(d<reach){this.ehp=Math.max(0,this.ehp-damage);this.hitFlash=120}
  }

  executeCommand(){
    const command=DUEL_COMMANDS[this.commandIndex]
    this.commandOpen=false;this.app.audio.confirm()
    if(command==='說得'){
      if(this.ehp<=35){this.message='說得成功！敵將停止戰鬥。';this.finish(true)}
      else{this.message='說得失敗！敵將被激怒。';this.enemyRage=2200}
      return
    }
    if(command==='罵聲'){this.message='敵將大怒！動作加快。';this.enemyRage=2600;return}
    if(command==='投降'){this.message='我方投降。';this.finish(false);return}
    this.message='我方退卻。';this.finish(false)
  }

  finish(win){
    if(this.result)return
    this.result=win?'勝':'敗'
    this.message='一騎討ち的戰略結果尚未校準；本次不修改城池、兵力或行軍狀態。'
  }

  draw(){
    const r=this.app.r,c=r.ctx
    const smallPanel=this.app.assets?.getNineSlice('ui.panels.small',{sourceSlice:32,destEdge:6})
    r.clear('#221510')
    drawDuelArena(r,{x:0,y:38,width:320,height:152})
    r.panel(6,5,308,31,'#050505','#7c5014',smallPanel)
    r.text(`${this.app.store.mapProfile?.cityById?.[this.c?.target]?.name??''} · 一騎討ち`,160,9,10,'#f1d477','center','top',SERIF,'700')
    r.text(`我方 ${String(this.php).padStart(3)}      敵方 ${String(this.ehp).padStart(3)}`,160,24,6.5,'#e8dec4','center')
    const af=FACTION_BY_ID[this.c?.attacker],df=FACTION_BY_ID[this.c?.defender]
    drawDuelFighter(r,{
      x:this.px,y:160,color:af?.color??'#587cc7',flip:false,
      guard:this.guard,attacking:this.attackCd>160,
    })
    drawDuelFighter(r,{
      x:this.ex,y:160,color:df?.color??'#b75f52',flip:true,
      guard:false,attacking:this.enemyCd>500,
    })
    if(this.hitFlash>0){c.save();c.globalAlpha=Math.min(.35,this.hitFlash/300);c.fillStyle='#fff2bf';c.fillRect(0,0,320*r.S,224*r.S);c.restore()}
    r.fillRect(0,190,320,34,'rgba(10,8,6,.82)')
    r.text(this.autoMode&&!this.modeSelect?'自動一騎討ち中':'← → 移動　B+↑/↓ 上下段攻擊　B 中段　C 防禦　A 命令',160,197,6.2,'#eadbb9','center')
    if(this.message)r.text(this.message,160,211,6.5,this.enemyRage>0?'#ff9d72':'#cfc19f','center')
    if(this.commandOpen){r.panel(108,61,104,88,'#000','#a96e16',smallPanel);r.text('命令',160,69,9,'#f0d57f','center');DUEL_COMMANDS.forEach((cmd,i)=>r.text(`${i===this.commandIndex?'▶':'　'}${cmd}`,126,88+i*14,8,i===this.commandIndex?COLORS.cyan:'#ddd0ad'))}
    if(this.modeSelect)this.drawModeSelect()
    if(this.result)r.shadowText(this.result,160,102,34,this.result==='勝'?'#ffe36a':'#da6558','center','middle')
    r.scanlines(.018)
  }

  drawModeSelect(){
    const r=this.app.r
    const smallPanel=this.app.assets?.getNineSlice('ui.panels.small',{sourceSlice:32,destEdge:6})
    r.panel(94,66,132,85,'#000','#a96e16',smallPanel)
    r.text('一騎討ち',160,75,10,'#f0d57f','center','top',SERIF,'700')
    DUEL_MODES.forEach((mode,i)=>r.text(`${i===this.modeIndex?'▶':'　'}${mode.label}`,126,98+i*19,9,i===this.modeIndex?COLORS.cyan:'#ddd0ad'))
    r.text('C / A 決定　B 返回',160,139,6,'#918775','center')
  }

}
