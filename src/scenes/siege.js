import { COLORS, SERIF } from '../game/constants.js'
import { drawSiegeForegroundDepth, drawSiegeFortress, drawSiegeStandards } from '../game/battle-art.js'
import { BATTLE_SPEEDS, MAX_SQUADS_PER_UNIT, battlePreparation, cycleBattleSpeed } from '../game/battle-prep.js'
import { FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import {
  BATTLE_SQUAD_TYPES,
  formationRowSquads,
  initialFormationDraft,
  transitionFormationDraft,
} from '../game/battle-formation.js'
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
    if(this.phase==='formation'&&!this.runtime.formationDraft){
      this.runtime.formationDraft=initialFormationDraft(this.conflict,this.runtime.formationPlan)
    }
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
        try{
          this.saveRuntime()
        }catch(error){
          this.pauseConfirm=false
          this.message='保存戰鬥失敗：'+(error instanceof Error?error.message:'存儲無法寫入')
          this.app.audio.alert()
          return
        }
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
        const before=structuredClone(this.conflict.runtime)
        try{
          const speed=BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
          setSiegeSpeed(this.conflict,speed)
          setSiegePhase(this.conflict,'formation')
          this.runtime=ensureSiegeRuntime(this.conflict)
          if(!this.runtime.formationDraft){
            this.runtime.formationDraft=initialFormationDraft(this.conflict,this.runtime.formationPlan)
          }
          this.saveRuntime()
          this.phase='formation'
          this.app.audio.confirm()
        }catch(error){
          this.conflict.runtime=before
          this.runtime=ensureSiegeRuntime(this.conflict)
          this.message='編成準備未保存：'+(error instanceof Error?error.message:'存儲不可用')
          this.app.audio.alert()
        }
      }
      return
    }

    if(this.phase==='formation'){
      this.updateFormation(b)
      return
    }

    if(this.phase==='siege'){
      if(b==='B'){
        this.requestRetreat()
        return
      }
      if(b==='A'||b==='C'||b==='START'){
        const before=structuredClone(this.conflict.runtime)
        let intent
        try{
          intent=queueSiegeAttackIntent(this.conflict)
          this.saveRuntime()
        }catch(error){
          this.conflict.runtime=before
          this.runtime=ensureSiegeRuntime(this.conflict)
          this.message='攻城命令未保存：'+(error instanceof Error?error.message:'存儲不可用')
          this.app.audio.alert()
          return
        }
        this.message=`第${intent.sequence}次攻城命令已受理；原版确认会降低城防并提高进入城内部队战的概率，但具体下降量和概率尚未校准，本次不修改数值。`
        this.app.audio.confirm()
      }
    }
  }

  updateFormation(button){
    if(!this.runtime.formationDraft){
      this.runtime.formationDraft=initialFormationDraft(this.conflict,this.runtime.formationPlan)
    }
    const previous=structuredClone(this.conflict.runtime)
    const previousPhase=this.phase
    try{
      const result=transitionFormationDraft(this.conflict,this.runtime.formationDraft,button)
      if(result.status==='ignored')return
      if(result.status==='limit'){
        this.message='每位武將暫以 15 小隊作為編成上限；武官級與單小隊兵數仍待校準。'
        this.app.audio.alert()
        return
      }
      if(result.status==='back'){
        setSiegePhase(this.conflict,'speed')
      }else if(result.status==='updated'){
        this.conflict.runtime.formationDraft=result.draft
      }else if(result.status==='committed'){
        const speed=this.runtime.speed??BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
        battlePreparation(this.conflict,speed)
        setSiegeSpeed(this.conflict,speed)
        this.conflict.runtime.formationPlan=result.plan
        this.conflict.runtime.formationDraft=null
        setSiegePhase(this.conflict,'siege')
      }
      this.saveRuntime()
      this.phase=this.runtime.phase
      if(result.status==='committed'){
        this.message='編成意向已保存，未校準的武官級、單隊兵數和攻城結果不進行結算。'
      }
      if(result.status==='back'||button==='B')this.app.audio.cancel()
      else this.app.audio.confirm()
    }catch(error){
      this.conflict.runtime=previous
      this.runtime=ensureSiegeRuntime(this.conflict)
      this.phase=previousPhase
      this.message='編成未保存：'+(error instanceof Error?error.message:'存儲不可用')
      this.app.audio.alert()
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
      const draft=this.runtime.formationDraft
      r.panel(29,46,262,108,'#050505','#9b6514',smallPanel)
      r.text('小隊編成・工程預覽',160,53,10,'#efd27d','center')
      if(draft?.phase==='review'){
        r.text('編成核對',160,72,8,COLORS.cyan,'center')
        const totals=draft.rows.map((row)=>`${row.officerName} ${formationRowSquads(row)}`)
        r.wrapText(totals.join('　')||'無具名武將，不建立假小隊',160,91,220,12,7,'#e5d4ac','center')
        r.text('未進行實際分兵與損耗',160,140,6.5,'#a99d82','center')
        r.text('C 確認預覽　B 返回調整',160,179,7,COLORS.cyan,'center')
      }else{
        const row=draft?.rows?.[draft.officerIndex??0]
        r.text(row?`${(draft.officerIndex??0)+1}/${draft.rows.length} ${row.officerName}`:'無具名出征武將',160,70,8,COLORS.cyan,'center')
        BATTLE_SQUAD_TYPES.forEach((type,index)=>{
          const active=index===(draft?.typeIndex??0)
          r.text(`${active?'▶ ':''}${type.label} ${row?.[type.id]??0}`,79+index*83,96,7,active?COLORS.cyan:'#ddd0ad')
        })
        r.text(`當前武將合計 ${formationRowSquads(row)}/${MAX_SQUADS_PER_UNIT}　不消耗兵力`,160,125,7,'#e5d4ac','center')
        r.text('A 換將　↑↓ 兵種　←→ 數量',160,139,6,'#a99d82','center')
        r.text('C 核對　B 返回速度',160,179,7,COLORS.cyan,'center')
      }
      r.text('最多 15 小隊・武官級限制未校準',160,196,6,'#cfc19f','center')
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
