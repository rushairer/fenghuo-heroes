import { BATTLE_SPEEDS, MAX_SQUADS_PER_UNIT, battlePreparation, cycleBattleSpeed } from '../game/battle-prep.js'
import { COLORS, SERIF } from '../game/constants.js'
import { FACTION_BY_ID } from '../game/data.js'
import { FIELD_BATTLE_COMMANDS, fieldBattleCommandAvailable, fieldBattleInputAction, fieldBattleOrder } from '../game/field-battle-parity.js'
import { mdButton } from '../game/input.js'
import { cancelFieldBattleFromArmies } from '../game/march.js'

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value))

export class FieldBattleScene{
  constructor(app){
    this.app=app
    this.conflict=app.store.pendingConflict
    this.phase='speed'
    this.speedIndex=0
    this.window=null
    this.commandIndex=0
    this.scrollY=0
    this.message=''
    this.retreatUnlocked=false
    if(!this.conflict||this.conflict.kind!=='field')app.go('strategy')
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
        this.phase='formation'
        this.app.audio.confirm()
      }
      return
    }

    if(this.phase==='formation'){
      if(b==='B'){
        this.phase='speed'
        this.app.audio.cancel()
        return
      }
      if(b==='C'){
        const speed=BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
        battlePreparation(this.conflict,speed)
        this.conflict.battleSpeed=speed
        this.phase='battle'
        this.message='小隊分兵與兵種上限受武官級影響；精確編成尚未校準，本輪保持原兵力進入控制層。'
        this.app.store.save()
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
      this.window='command'
      this.commandIndex=0
      this.app.audio.confirm()
      return
    }
    if(action==='scroll-battlefield'){
      this.scrollY=clamp(this.scrollY+(b==='UP'?-1:1),-8,8)
      this.app.audio.move()
    }
  }

  executeCommand(){
    const command=FIELD_BATTLE_COMMANDS[this.commandIndex]
    if(!command)return
    const order=fieldBattleOrder(command.id,{retreatUnlocked:this.retreatUnlocked})
    if(!order){
      this.message='退卻會在戰鬥進行一段時間後才可使用；精確解鎖時間尚未量測。'
      this.app.audio.alert()
      return
    }
    this.conflict.battleOrder={armyId:this.conflict.attackerArmyId,commandId:order.commandId}
    this.window=null
    if(order.commandId==='directional-movement'){
      this.message='移動命令已受理；目的地記號與實時移動速度仍待原版逐幀校準，因此暫不改變座標。'
    }else if(order.commandId==='enemy-commander'){
      this.message='已下達向敵總大將移動的命令；接敵速度與碰撞規則仍待校準。'
    }else if(order.commandId==='wait'){
      this.message='已下達待機命令；伏兵成立條件將在地形與兵力規則校準後接入。'
    }
    this.app.store.save()
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

    const offset=this.scrollY*3
    r.fillRect(0,28,320,162,'#82734e')
    r.line(0,109+offset,320,89+offset,'#514829',2,.65)
    r.fillRect(34,92+offset,46,18,af?.color??'#587cc7')
    r.fillRect(240,72+offset,46,18,df?.color??'#b75f52')
    r.text('自軍',57,97+offset,7,'#fff','center')
    r.text('敵軍',263,77+offset,7,'#fff','center')

    const order=this.conflict?.battleOrder?.commandId
    const orderLabel=FIELD_BATTLE_COMMANDS.find((item)=>item.id===order)?.label??'未下令'
    r.fillRect(0,190,320,34,'rgba(8,8,8,.88)')
    r.text(`目前命令：${orderLabel}`,12,196,6.5,'#e8dec4')
    r.text('A 戰力　C 命令　↑↓ 捲動畫面',308,196,6.2,'#d0c5ad','right')
    r.text('戰鬥傷害／移動速度／退卻時機尚未校準，不修改兵力',160,211,6,'#9f947b','center')

    if(this.window==='status'){
      r.panel(52,53,216,111,'#050505','#9b6514')
      r.text('戰力',160,63,10,'#efd27d','center','top',SERIF,'700')
      r.text(`我方兵力　${this.conflict?.attackerTroops??0}`,72,88,7,af?.color??'#fff')
      r.text(`敵方兵力　${this.conflict?.defenderTroops??0}`,72,106,7,df?.color??'#fff')
      r.text(`我方武將　${(this.conflict?.attackerOfficers??[]).join('、')||'—'}`,72,124,6.5,'#d8ccb0')
      r.text('攻擊力／士氣尚未取得可靠數值',160,143,6,'#9f947b','center')
      r.text('B 關閉',160,153,5.8,'#8e846f','center')
    }

    if(this.window==='command'){
      r.panel(88,48,144,128,'#050505','#9b6514')
      r.text('命令',160,58,10,'#efd27d','center','top',SERIF,'700')
      FIELD_BATTLE_COMMANDS.forEach((command,index)=>{
        const active=index===this.commandIndex
        const available=fieldBattleCommandAvailable(command.id,{retreatUnlocked:this.retreatUnlocked})
        r.text(`${active?'▶':'　'}${command.label}`,111,82+index*18,8,active?COLORS.cyan:available?'#ddd0ad':'#6b6458')
      })
      r.text('C 決定　B 關閉',160,159,6,'#8e846f','center')
    }

    if(this.message){
      r.panel(35,74,250,66,'#050505','#9b6514')
      r.wrapText(this.message,160,86,220,11,7,'#f0e4c5','center')
      r.text('A / B / C 關閉',160,126,6,'#8a806e','center')
    }
  }
}
