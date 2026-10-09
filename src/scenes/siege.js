import { COLORS, SERIF } from '../game/constants.js'
import { drawSiegeForegroundDepth, drawSiegeFortress, drawSiegeStandards } from '../game/battle-art.js'
import { BATTLE_SPEEDS, MAX_SQUADS_PER_UNIT, battlePreparation, cycleBattleSpeed } from '../game/battle-prep.js'
import { FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { cancelSiegeFromArmy } from '../game/march.js'
import { ensureSiegeRuntime, queueSiegeAttackIntent, setSiegePhase, setSiegeSpeed } from '../game/siege-runtime.js'

export class SiegeScene{
  constructor(app){
    this.app=app
    this.conflict=app.store.pendingConflict
    if(!this.conflict||this.conflict.kind!=='siege'){app.go('strategy');return}
    this.runtime=ensureSiegeRuntime(this.conflict)
    this.speedIndex=Math.max(0,BATTLE_SPEEDS.findIndex((item)=>item.id===this.runtime.speed))
    this.phase=this.runtime.phase
    this.message=''
    this.pauseConfirm=false
    this.retreatConfirm=false
  }

  saveRuntime(){
    this.runtime=ensureSiegeRuntime(this.conflict)
    this.app.store.save()
  }

  update(_dt,input){
    const key=input.consume()
    if(!key)return
    const b=mdButton(key)
    if(b==='HD'){this.app.toggleHd();return}
    if(key==='p'||key==='P'){
      this.pauseConfirm=!this.pauseConfirm
      this.app.audio.move()
      return
    }
    if(this.pauseConfirm){
      if(b==='B'){this.pauseConfirm=false;this.app.audio.cancel();return}
      if(b==='C'||b==='START'){
        this.saveRuntime()
        this.app.go('title',{force:true})
        this.app.audio.confirm()
      }
      return
    }

    if(this.retreatConfirm){
      if(b==='B'){
        this.retreatConfirm=false
        this.app.audio.cancel()
      }else if(b==='C'||b==='START'){
        this.retreat()
      }
      return
    }

    if(this.message){
      if(['A','B','C','START'].includes(b)){
        this.message=''
        this.app.audio.cancel()
      }
      return
    }

    if(this.phase==='speed'){
      if(b==='UP'||b==='LEFT'){
        this.speedIndex=cycleBattleSpeed(this.speedIndex,-1)
        this.app.audio.move()
        return
      }
      if(b==='DOWN'||b==='RIGHT'){
        this.speedIndex=cycleBattleSpeed(this.speedIndex,1)
        this.app.audio.move()
        return
      }
      if(b==='B'){
        this.requestRetreat()
        return
      }
      if(b==='A'||b==='C'||b==='START'){
        const speed=BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
        setSiegeSpeed(this.conflict,speed)
        setSiegePhase(this.conflict,'formation')
        this.phase='formation'
        this.saveRuntime()
        this.app.audio.confirm()
      }
      return
    }

    if(this.phase==='formation'){
      if(b==='B'){
        setSiegePhase(this.conflict,'speed')
        this.phase='speed'
        this.saveRuntime()
        this.app.audio.cancel()
        return
      }
      if(b==='A'||b==='C'||b==='START'){
        const speed=this.runtime.speed??BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
        battlePreparation(this.conflict,speed)
        setSiegeSpeed(this.conflict,speed)
        setSiegePhase(this.conflict,'siege')
        this.phase='siege'
        this.saveRuntime()
        this.app.audio.confirm()
      }
      return
    }

    if(this.phase==='siege'){
      if(b==='B'){
        this.requestRetreat()
        return
      }
      if(b==='A'||b==='C'||b==='START'){
        const intent=queueSiegeAttackIntent(this.conflict)
        this.message=`第${intent.sequence}次攻城命令已受理；原版确认会降低城防并提高进入城内部队战的概率，但具体下降量和概率尚未校准，本次不修改数值。`
        this.saveRuntime()
        this.app.audio.confirm()
      }
    }
  }

  requestRetreat(){
    this.retreatConfirm=true
    this.app.audio.move()
  }

  retreat(){
    try{
      if(!cancelSiegeFromArmy(this.app.store))throw new Error('攻城資料不再有效。')
      this.retreatConfirm=false
      this.app.audio.confirm()
      this.app.go('strategy')
    }catch(error){
      this.retreatConfirm=false
      this.message=error instanceof Error?error.message:'無法中止攻城。'
      this.app.audio.alert()
    }
  }

  draw(){
    const r=this.app.r,c=r.ctx
    const smallPanel=this.app.assets?.getNineSlice('ui.panels.small',{sourceSlice:32,destEdge:6})
    const largeFrame=this.app.assets?.getNineSlice('ui.frames.large',{sourceSlice:48,destEdge:7})
    r.clear('#160d08')
    r.ornateFrame(3,3,314,218,largeFrame)
    const city=this.app.store.mapProfile?.cityById?.[this.conflict?.target]
    r.shadowText(`${city?.name??''} 攻城準備`,160,18,14,'#f2d174','center')

    const af=FACTION_BY_ID[this.conflict?.attacker]
    const df=FACTION_BY_ID[this.conflict?.defender]
    drawSiegeFortress(r,{x:15,y:48,width:290,height:105})
    drawSiegeForegroundDepth(r,{x:15,y:48,width:290,height:105})
    drawSiegeStandards(r,{
      x:15,
      y:48,
      width:290,
      attackerColor:af?.color??'#587cc7',
      defenderColor:df?.color??'#b75f52',
    })

    r.panel(30,157,260,50,'#030303','#7e5315',smallPanel)
    r.text(`${af?.label??''} ${this.conflict?.attackerTroops??0}`,45,164,7,af?.color??'#fff')
    r.text(`${df?.label??''} ${this.conflict?.defenderTroops??0}`,275,164,7,df?.color??'#fff','right')

    if(this.phase==='speed'){
      r.text('戰鬥速度',160,177,8,'#efd27d','center','top',SERIF,'700')
      BATTLE_SPEEDS.forEach((option,index)=>{
        r.text(`${index===this.speedIndex?'▶':'　'}${option.label}`,160,190+index*10,7.5,index===this.speedIndex?COLORS.cyan:'#ddd0ad','center')
      })
      r.text('C 決定　B 中止確認',160,213,5.8,'#8e846f','center')
    }else if(this.phase==='formation'){
      r.text(`小隊編成　每部隊最多 ${MAX_SQUADS_PER_UNIT} 小隊`,160,180,7.5,COLORS.cyan,'center')
      r.text('原版編成規則仍待逐項校準',160,194,6.5,'#cfc19f','center')
      r.text('C 繼續　B 返回速度選擇',160,208,5.8,'#8e846f','center')
    }else{
      r.text(`攻城命令 ${this.runtime.attackOrders} 次　城防 ${this.runtime.defenseRateSnapshot??'—'}`,160,178,7.5,COLORS.cyan,'center')
      r.text('C / A 攻城　B 中止確認',160,196,6.5,'#cfc19f','center')
      r.text('未校準城防下降量與入城戰概率不做假結算',160,210,5.8,'#8e846f','center')
    }

    if(this.message){
      r.panel(40,75,240,64,'#000','#b07118',smallPanel)
      r.wrapText(this.message,160,88,208,11,7.5,'#f0e4c5','center')
      r.text('A / B / C 關閉',160,124,6,'#8a806e','center')
    }
    if(this.retreatConfirm){
      r.panel(24,65,272,94,'#050505','#9b6514',smallPanel)
      r.text('確定中止攻城？',160,80,10,'#efd27d','center')
      r.wrapText('工程退出：目前無原版退兵損失與追擊公式，退出不結算傷亡。',160,101,240,12,7,'#d8ccb0','center')
      r.text('C / START 確定　B 返回戰場',160,141,6.5,COLORS.cyan,'center')
    }else if(this.pauseConfirm){
      r.panel(33,70,254,78,'#050505','#9b6514',smallPanel)
      r.text('保存目前攻城並返回標題？',160,85,9,'#efd27d','center')
      r.text('C / START 確定　B 取消',160,117,7,COLORS.cyan,'center')
    }else r.text('P：保存並返回標題',160,217,5.5,'#c5b99c','center')
    r.scanlines(.02)
  }
}
