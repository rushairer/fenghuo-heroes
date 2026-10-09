import { BATTLE_SPEEDS, MAX_SQUADS_PER_UNIT, battlePreparation, cycleBattleSpeed } from '../game/battle-prep.js'
import { COLORS, SERIF } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import {
  FIELD_BATTLE_COMMANDS,
  FIELD_BATTLE_TACTICS,
  fieldBattleAmbushState,
  fieldBattleCommandAvailable,
  fieldBattleInputAction,
  fieldBattleOrder,
  fieldBattleStatusProjection,
  fieldBattleTacticAvailable,
  fieldBattleTacticOrder,
} from '../game/field-battle-parity.js'
import {
  advanceFieldBattleDayRuntime,
  ensureFieldBattleRuntime,
  setFieldBattleAmbush,
  setFieldBattleOrder,
  setFieldBattlePhase,
  setFieldBattleSpeed,
} from '../game/field-battle-runtime.js'
import { mdButton } from '../game/input.js'
import {
  fieldMoveOfficers,
  initialFieldMoveDraft,
  transitionFieldMoveDraft,
} from '../game/field-battle-move.js'

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))

export class FieldBattleScene{
  constructor(app){
    this.app=app
    this.conflict=app.store.pendingConflict
    if(!this.conflict||this.conflict.kind!=='field'){app.go('strategy');return}
    this.runtime=ensureFieldBattleRuntime(this.conflict)
    this.phase=this.runtime.phase
    this.speedIndex=Math.max(0,BATTLE_SPEEDS.findIndex((item)=>item.id===this.runtime.speed))
    this.window=this.runtime.moveDraft
      ?(this.runtime.moveDraft.phase==='officer'?'move-officer':'move-destination')
      :null
    this.commandIndex=0
    this.tacticIndex=0
    this.scrollX=0
    this.scrollY=0
    this.message=''
    this.retreatUnlocked=Boolean(this.conflict.retreatUnlocked)
    this.pauseConfirm=false
  }

  commandContext(){
    return {
      retreatUnlocked:this.retreatUnlocked,
      strategyAvailable:Boolean(this.conflict.strategyAvailable),
      siegeAvailable:Boolean(this.conflict.enemyCityAdjacent),
      ordersClosed:Boolean(this.runtime.ordersClosed),
    }
  }

  tacticContext(){
    return {
      strategyAvailable:Boolean(this.conflict.strategyAvailable),
      enemyTerrain:this.conflict.enemyTerrain??null,
      ownTerrain:this.conflict.ownTerrain??null,
    }
  }

  saveRuntime(){
    this.runtime=ensureFieldBattleRuntime(this.conflict)
    this.app.store.save()
  }

  update(_dt,input){
    const key=input.consume()
    if(!key)return
    const b=mdButton(key)
    if(b==='HD'){this.app.toggleHd();return}
    // Never interpret Esc/B as a strategic battle cancellation. P is an
    // explicit save-and-return control because outcome rules remain blocked.
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

    if(this.message){
      if(['A','B','C'].includes(b)){
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
      if(b==='C'){
        const speed=BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
        setFieldBattleSpeed(this.conflict,speed)
        setFieldBattlePhase(this.conflict,'formation')
        this.phase='formation'
        this.saveRuntime()
        this.app.audio.confirm()
      }
      return
    }

    if(this.phase==='formation'){
      if(b==='B'){
        setFieldBattlePhase(this.conflict,'speed')
        this.phase='speed'
        this.saveRuntime()
        this.app.audio.cancel()
        return
      }
      if(b==='C'){
        const speed=this.runtime.speed??BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
        battlePreparation(this.conflict,speed)
        setFieldBattleSpeed(this.conflict,speed)
        setFieldBattlePhase(this.conflict,'battle')
        this.phase='battle'
        this.message='小隊分兵與兵種上限受武官級影響；精確編成尚未校準，本輪保持原兵力進入控制層。'
        this.saveRuntime()
        this.app.audio.confirm()
      }
      return
    }

    if(this.window==='move-officer'||this.window==='move-destination'){
      this.updateMoveDraft(b)
      return
    }

    if(this.window==='status'){
      if(b==='B'){
        this.window=null
        this.app.audio.cancel()
      }
      return
    }

    if(this.window==='strategy'){
      if(b==='UP'){
        this.tacticIndex=(this.tacticIndex-1+FIELD_BATTLE_TACTICS.length)%FIELD_BATTLE_TACTICS.length
        this.app.audio.move()
        return
      }
      if(b==='DOWN'){
        this.tacticIndex=(this.tacticIndex+1)%FIELD_BATTLE_TACTICS.length
        this.app.audio.move()
        return
      }
      if(b==='B'){
        this.window='command'
        this.app.audio.cancel()
        return
      }
      if(b==='C')this.executeTactic()
      return
    }

    if(this.window==='command'){
      if(b==='UP'){
        this.commandIndex=(this.commandIndex-1+FIELD_BATTLE_COMMANDS.length)%FIELD_BATTLE_COMMANDS.length
        this.app.audio.move()
        return
      }
      if(b==='DOWN'){
        this.commandIndex=(this.commandIndex+1)%FIELD_BATTLE_COMMANDS.length
        this.app.audio.move()
        return
      }
      if(b==='B'){
        this.window=null
        this.app.audio.cancel()
        return
      }
      if(b==='C')this.executeCommand()
      return
    }

    // Explicit engineering control: we have no verified automatic frame-to-day
    // timing yet. START after 結束 advances the day without combat effects.
    if(b==='START'&&this.runtime.ordersClosed){
      if(this.runtime.carryoverPending){
        this.message='戰鬥已達30日段落；回到戰略月及下一段戰鬥的銜接尚未校準，請按 P 保存進度。'
        this.app.audio.alert()
        return
      }
      const next=advanceFieldBattleDayRuntime(this.conflict)
      this.runtime=ensureFieldBattleRuntime(this.conflict)
      this.message=next.segmentComplete
        ?'已記錄30日戰鬥段落。未校準戰略銜接與勝負，不會自動結算。'
        :`已手動進入第${this.runtime.day}日；戰鬥時鐘和交戰效果未校準，本次只重開命令。`
      this.saveRuntime()
      this.app.audio.confirm()
      return
    }

    const action=fieldBattleInputAction(b,{windowOpen:false})
    if(action==='status-window'){
      this.window='status'
      this.app.audio.confirm()
      return
    }
    if(action==='command-window'){
      if(this.runtime.ordersClosed){
        this.message='本戰鬥日的命令已結束；原版在日數改變後才可再次下令，精確日長仍待量測。'
        this.app.audio.alert()
        return
      }
      this.window='command'
      this.commandIndex=0
      this.app.audio.confirm()
      return
    }
    if(action==='scroll-battlefield'){
      if(b==='LEFT')this.scrollX=clamp(this.scrollX-1,-8,8)
      if(b==='RIGHT')this.scrollX=clamp(this.scrollX+1,-8,8)
      if(b==='UP')this.scrollY=clamp(this.scrollY-1,-8,8)
      if(b==='DOWN')this.scrollY=clamp(this.scrollY+1,-8,8)
      this.app.audio.move()
    }
  }

  beginMoveDraft(){
    const previous=structuredClone(this.conflict.runtime)
    try{
      this.conflict.runtime.moveDraft=initialFieldMoveDraft(this.conflict)
      this.window='move-officer'
      this.saveRuntime()
      this.app.audio.confirm()
    }catch(error){
      this.conflict.runtime=previous
      this.runtime=ensureFieldBattleRuntime(this.conflict)
      this.window='command'
      this.message=error instanceof Error?error.message:'部隊移動準備失敗。'
      this.app.audio.alert()
    }
  }

  updateMoveDraft(b){
    if(!this.runtime.moveDraft){
      this.window='command'
      return
    }
    const prior=structuredClone(this.conflict.runtime)
    const previousWindow=this.window
    try{
      const result=transitionFieldMoveDraft(this.conflict,this.runtime.moveDraft,b)
      if(result.status==='ignored')return
      if(result.status==='cancelled'){
        this.conflict.runtime.moveDraft=null
        this.window='command'
      }else if(result.status==='updated'){
        this.conflict.runtime.moveDraft=result.draft
        this.window=result.draft.phase==='officer'?'move-officer':'move-destination'
      }else if(result.status==='committed'){
        setFieldBattleOrder(this.conflict,result.order)
        this.window=null
        const move=result.order.move
        this.message=`${move.officerName}：已記錄向 (${move.target.x},${move.target.y}) 移動的命令意向；實際移動速度與損失尚未校準，不會變更部隊位置。`
      }
      this.saveRuntime()
      if(result.status==='cancelled'||b==='B')this.app.audio.cancel()
      else this.app.audio.confirm()
    }catch(error){
      this.conflict.runtime=prior
      this.runtime=ensureFieldBattleRuntime(this.conflict)
      this.window=previousWindow
      this.message=error instanceof Error?error.message:'移動命令未保存。'
      this.app.audio.alert()
    }
  }

  executeCommand(){
    const command=FIELD_BATTLE_COMMANDS[this.commandIndex]
    if(!command)return
    const context=this.commandContext()
    if(command.id==='move'){
      if(!fieldBattleCommandAvailable('move',context)){
        this.message='本戰鬥日的命令已結束。'
        this.app.audio.alert()
        return
      }
      this.beginMoveDraft()
      return
    }
    if(command.id==='strategy'){
      if(!fieldBattleCommandAvailable(command.id,context)){
        this.message='計略只在敵軍位於執行部隊兩日移動範圍內時可選；目前戰場距離尚未校準。'
        this.app.audio.alert()
        return
      }
      this.window='strategy'
      this.tacticIndex=0
      this.app.audio.confirm()
      return
    }
    const order=fieldBattleOrder(command.id,context)
    if(!order){
      if(command.id==='siege')this.message='攻城只在部隊接觸敵城時可選。'
      else if(command.id==='retreat')this.message='退卻的精確可用時機仍待實機量測。'
      else this.message='此命令目前條件未滿足。'
      this.app.audio.alert()
      return
    }
    setFieldBattleOrder(this.conflict,order)
    this.window=null
    if(order.commandId==='siege'){
      this.message='攻城命令已受理；城防下降與進入城內部隊戰的機率公式尚未校準。'
    }else if(order.commandId==='retreat'){
      this.message='退卻命令已受理；退卻路徑與完成判定尚未校準。'
    }else if(order.commandId==='wait'){
      const ambush=fieldBattleAmbushState({
        commandId:'wait',
        ownTerrain:this.conflict.ownTerrain??null,
        troops:this.conflict.attackerTroops??0,
      })
      setFieldBattleAmbush(this.conflict,ambush.active)
      this.message=ambush.active
        ?'待機命令已受理；符合森林且兵力5000以下條件，部隊進入伏兵狀態。伏兵戰鬥效果仍待校準。'
        :'待機命令已受理；目前不符合已確認的伏兵條件。'
    }else if(order.commandId==='end'){
      this.message='本戰鬥日命令已結束；按 START 手動進入下一日（工程控制，非原版計時）。'
    }
    this.saveRuntime()
    this.app.audio.confirm()
  }

  executeTactic(){
    const tactic=FIELD_BATTLE_TACTICS[this.tacticIndex]
    if(!tactic)return
    const order=fieldBattleTacticOrder(tactic.id,this.tacticContext())
    if(!order){
      this.message=tactic.id==='chain'
        ?'連環只可對河中的敵部隊使用。'
        :tactic.id==='rockfall'
          ?'落石需要自軍在山上、敵軍在平地。'
          :tactic.id==='immobilize'
            ?'止足對山地或森林中的敵軍有效。'
            :'目前尚未滿足此計略的已知條件。'
      this.app.audio.alert()
      return
    }
    setFieldBattleOrder(this.conflict,order)
    this.window=null
    this.message=`${tactic.label}命令已受理；成功率、士氣與兵力變化公式尚未校準，本次不修改數值。`
    this.saveRuntime()
    this.app.audio.confirm()
  }

  draw(){
    const r=this.app.r
    const af=FACTION_BY_ID[this.conflict?.attacker]
    const df=FACTION_BY_ID[this.conflict?.defender]
    r.clear('#6f603f')
    r.fillRect(0,0,320,28,'#101010')
    r.text(`部隊戰　第${this.runtime.day}日`,160,7,12,'#efd27d','center','top',SERIF,'700')
    r.text(`${af?.label??''} ${this.conflict?.attackerTroops??0}`,12,18,6.5,af?.color??'#fff')
    r.text(`${df?.label??''} ${this.conflict?.defenderTroops??0}`,308,18,6.5,df?.color??'#fff','right')

    if(this.phase==='speed'){
      r.panel(86,62,148,92,'#050505','#9b6514')
      r.text('戰鬥速度',160,73,10,'#efd27d','center','top',SERIF,'700')
      BATTLE_SPEEDS.forEach((option,index)=>r.text(`${index===this.speedIndex?'▶':'　'}${option.label}`,160,99+index*18,8,index===this.speedIndex?COLORS.cyan:'#ddd0ad','center'))
      r.text('C 決定',160,139,6,'#8e846f','center')
      if(this.pauseConfirm)this.drawPauseConfirm()
      return
    }

    if(this.phase==='formation'){
      r.panel(49,49,222,119,'#050505','#9b6514')
      r.text('小隊編成',160,61,10,'#efd27d','center','top',SERIF,'700')
      r.text(`每部隊最多 ${MAX_SQUADS_PER_UNIT} 小隊`,160,85,8,COLORS.cyan,'center')
      r.text('騎兵／弓箭／步兵數受武官級限制',160,106,6.5,'#d8ccb0','center')
      r.text('武官級與分配規則未校準，不造假分兵',160,123,6.2,'#a99d82','center')
      r.text('C 進入控制層　B 返回',160,148,6,'#8e846f','center')
      if(this.pauseConfirm)this.drawPauseConfirm()
      return
    }

    const offsetX=this.scrollX*3
    const offsetY=this.scrollY*3
    r.fillRect(0,28,320,162,'#82734e')
    r.line(0,109+offsetY,320,89+offsetY,'#514829',2,.65)
    r.fillRect(34+offsetX,92+offsetY,46,18,af?.color??'#587cc7')
    r.fillRect(240+offsetX,72+offsetY,46,18,df?.color??'#b75f52')
    r.text('自軍',57+offsetX,97+offsetY,7,'#fff','center')
    r.text('敵軍',263+offsetX,77+offsetY,7,'#fff','center')

    const order=this.runtime.order
    const command=FIELD_BATTLE_COMMANDS.find((item)=>item.id===order?.commandId)
    const tactic=FIELD_BATTLE_TACTICS.find((item)=>item.id===order?.tacticId)
    const orderLabel=tactic?`${command?.label??''}・${tactic.label}`
      :order?.commandId==='move'&&order.move
        ?`移動 ${order.move.officerName} → ${order.move.target.x},${order.move.target.y}`
        :(command?.label??'未下令')
    r.fillRect(0,190,320,34,'rgba(8,8,8,.88)')
    r.text(`目前命令：${orderLabel}`,12,196,6.5,'#e8dec4')
    r.text('A 戰力　C 命令　方向鍵捲動畫面',308,196,6.2,'#d0c5ad','right')
    const timingHint=this.runtime.carryoverPending
      ?'30日段落已結束　P 保存離開'
      :this.runtime.ordersClosed
        ?'START 手動換日（非原版計時）'
        :'未校準的傷害／速度／勝負公式不套用'
    r.text(timingHint,160,211,6,'#9f947b','center')

    if(this.window==='move-destination'&&this.runtime.moveDraft?.target){
      const target=this.runtime.moveDraft.target
      r.strokeRect(target.x-7,target.y-7,14,14,COLORS.cyan,1.5)
      r.line(target.x-10,target.y,target.x+10,target.y,COLORS.cyan,1,.8)
      r.line(target.x,target.y-10,target.x,target.y+10,COLORS.cyan,1,.8)
      r.panel(25,43,270,41,'#050505','#9b6514')
      r.text('移動目標：'+this.runtime.moveDraft.officerName,160,50,8,'#efd27d','center')
      r.text('方向鍵選點　C 記錄意向　B 返回武將',160,69,6.5,'#d8ccb0','center')
    }

    if(this.window==='move-officer'){
      const candidates=fieldMoveOfficers(this.conflict)
      const cursor=this.runtime.moveDraft?.officerIndex??0
      const start=Math.max(0,Math.min(candidates.length-7,cursor-3))
      r.panel(70,37,180,149,'#050505','#9b6514')
      r.text('選擇出陣武將',160,46,10,'#efd27d','center')
      candidates.slice(start,start+7).forEach((name,i)=>{
        const active=start+i===cursor
        r.text(`${active?'▶':'　'}${name}`,100,68+i*14,8,active?COLORS.cyan:'#ddd0ad')
      })
      r.text('C 指定位置　B 返回命令',160,173,6,'#a99d82','center')
    }

    if(this.window==='status'){
      const status=fieldBattleStatusProjection(this.conflict)
      r.panel(48,47,224,123,'#050505','#9b6514')
      r.text('戰力',160,57,10,'#efd27d','center','top',SERIF,'700')
      r.text(`我方 兵${status.attacker.troops} 攻${status.attacker.attack??'—'} 士氣${status.attacker.morale??'—'}`,65,84,7,af?.color??'#fff')
      r.text(`敵方 兵${status.defender.troops} 攻${status.defender.attack??'—'} 士氣${status.defender.morale??'—'}`,65,104,7,df?.color??'#fff')
      r.text(`我方武將　${status.attacker.officers.join('、')||'—'}`,65,126,6.5,'#d8ccb0')
      r.text(`敵方武將　${status.defender.officers.join('、')||'—'}`,65,142,6.5,'#d8ccb0')
      r.text('B 關閉',160,157,5.8,'#8e846f','center')
    }

    if(this.window==='command'){
      const context=this.commandContext()
      r.panel(88,36,144,154,'#050505','#9b6514')
      r.text('命令',160,46,10,'#efd27d','center','top',SERIF,'700')
      FIELD_BATTLE_COMMANDS.forEach((command,index)=>{
        const active=index===this.commandIndex
        const available=fieldBattleCommandAvailable(command.id,context)
        r.text(`${active?'▶':'　'}${command.label}`,111,70+index*18,8,active?COLORS.cyan:available?'#ddd0ad':'#6b6458')
      })
      r.text('C 決定　B 關閉',160,176,6,'#8e846f','center')
    }

    if(this.window==='strategy'){
      const context=this.tacticContext()
      r.panel(88,36,144,154,'#050505','#9b6514')
      r.text('計略',160,46,10,'#efd27d','center','top',SERIF,'700')
      FIELD_BATTLE_TACTICS.forEach((tactic,index)=>{
        const active=index===this.tacticIndex
        const available=fieldBattleTacticAvailable(tactic.id,context)
        r.text(`${active?'▶':'　'}${tactic.label}`,111,70+index*18,8,active?COLORS.cyan:available?'#ddd0ad':'#6b6458')
      })
      r.text('C 決定　B 返回',160,176,6,'#8e846f','center')
    }

    if(this.message){
      r.panel(35,74,250,66,'#050505','#9b6514')
      r.wrapText(this.message,160,86,220,11,7,'#f0e4c5','center')
      r.text('A / B / C 關閉',160,126,6,'#8a806e','center')
    }
    if(this.pauseConfirm)this.drawPauseConfirm()
    else r.text('P：保存並返回標題',160,217,5.5,'#c5b99c','center')
  }

  drawPauseConfirm(){
    const r=this.app.r
    r.panel(33,70,254,78,'#050505','#9b6514')
    r.text('保存目前戰鬥並返回標題？',160,85,9,'#efd27d','center')
    r.text('C / START 確定　B 取消',160,117,7,COLORS.cyan,'center')
  }
}
