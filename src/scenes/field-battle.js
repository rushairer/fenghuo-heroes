import { BATTLE_SPEEDS, MAX_SQUADS_PER_UNIT, battlePreparation, cycleBattleSpeed } from '../game/battle-prep.js'
import { COLORS, SERIF } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import {
  FIELD_BATTLE_COMMANDS,
  FIELD_BATTLE_TACTICS,
  fieldBattleCommandAvailable,
  fieldBattleInputAction,
  fieldBattleOrder,
  fieldBattleStatusProjection,
  fieldBattleTacticAvailable,
  fieldBattleTacticOrder,
} from '../game/field-battle-parity.js'
import {
  ensureFieldBattleRuntime,
  setFieldBattleOrder,
  setFieldBattlePhase,
  setFieldBattleSpeed,
} from '../game/field-battle-runtime.js'
import { mdButton } from '../game/input.js'
import { cancelFieldBattleFromArmies } from '../game/march.js'

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))

export class FieldBattleScene{
  constructor(app){
    this.app=app
    this.conflict=app.store.pendingConflict
    if(!this.conflict||this.conflict.kind!=='field'){app.go('strategy');return}
    this.runtime=ensureFieldBattleRuntime(this.conflict)
    this.phase=this.runtime.phase
    this.speedIndex=Math.max(0,BATTLE_SPEEDS.findIndex((item)=>item.id===this.runtime.speed))
    this.window=null
    this.commandIndex=0
    this.tacticIndex=0
    this.scrollX=0
    this.scrollY=0
    this.message=''
    this.retreatUnlocked=Boolean(this.conflict.retreatUnlocked)
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
    this.app.store.save()
  }

  update(_dt,input){
    const key=input.consume()
    if(!key)return
    if(key==='Escape'){
      cancelFieldBattleFromArmies(this.app.store)
      this.app.audio.cancel()
      this.app.go('strategy')
      return
    }
    const b=mdButton(key)
    if(b==='HD'){this.app.toggleHd();return}

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

  executeCommand(){
    const command=FIELD_BATTLE_COMMANDS[this.commandIndex]
    if(!command)return
    const context=this.commandContext()
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
    if(order.commandId==='move'){
      this.message='移動命令已受理；原版需先選部隊再指定目的地，精確小隊位置與移動速度校準後接入。'
    }else if(order.commandId==='siege'){
      this.message='攻城命令已受理；城防下降與進入城內部隊戰的機率公式尚未校準。'
    }else if(order.commandId==='retreat'){
      this.message='退卻命令已受理；退卻路徑與完成判定尚未校準。'
    }else if(order.commandId==='wait'){
      this.message='待機命令已受理；森林中兵力5000以下可成為伏兵的條件已記錄，伏兵效果仍待校準。'
    }else if(order.commandId==='end'){
      this.message='本戰鬥日命令已結束；等待日數改變後再接受下一次命令。'
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
    r.text('部隊戰',160,7,12,'#efd27d','center','top',SERIF,'700')
    r.text(`${af?.label??''} ${this.conflict?.attackerTroops??0}`,12,18,6.5,af?.color??'#fff')
    r.text(`${df?.label??''} ${this.conflict?.defenderTroops??0}`,308,18,6.5,df?.color??'#fff','right')

    if(this.phase==='speed'){
      r.panel(86,62,148,92,'#050505','#9b6514')
      r.text('戰鬥速度',160,73,10,'#efd27d','center','top',SERIF,'700')
      BATTLE_SPEEDS.forEach((option,index)=>r.text(`${index===this.speedIndex?'▶':'　'}${option.label}`,160,99+index*18,8,index===this.speedIndex?COLORS.cyan:'#ddd0ad','center'))
      r.text('C 決定',160,139,6,'#8e846f','center')
      return
    }

    if(this.phase==='formation'){
      r.panel(49,49,222,119,'#050505','#9b6514')
      r.text('小隊編成',160,61,10,'#efd27d','center','top',SERIF,'700')
      r.text(`每部隊最多 ${MAX_SQUADS_PER_UNIT} 小隊`,160,85,8,COLORS.cyan,'center')
      r.text('騎兵／弓箭／步兵數受武官級限制',160,106,6.5,'#d8ccb0','center')
      r.text('武官級與分配規則未校準，不造假分兵',160,123,6.2,'#a99d82','center')
      r.text('C 進入控制層　B 返回',160,148,6,'#8e846f','center')
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
    const orderLabel=tactic?`${command?.label??''}・${tactic.label}`:(command?.label??'未下令')
    r.fillRect(0,190,320,34,'rgba(8,8,8,.88)')
    r.text(`目前命令：${orderLabel}`,12,196,6.5,'#e8dec4')
    r.text('A 戰力　C 命令　方向鍵捲動畫面',308,196,6.2,'#d0c5ad','right')
    r.text('未校準的傷害／速度／勝負公式不套用',160,211,6,'#9f947b','center')

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
  }
}
