import { COLORS, SERIF } from '../game/constants.js'
import { drawSiegeFortress } from '../game/battle-art.js'
import { BATTLE_SPEEDS, MAX_SQUADS_PER_UNIT, battlePreparation, cycleBattleSpeed } from '../game/battle-prep.js'
import { FACTION_BY_ID } from '../game/data.js'
import { mdButton } from '../game/input.js'
import { cancelSiegeFromArmy } from '../game/march.js'

export class SiegeScene{
  constructor(app){
    this.app=app
    this.conflict=app.store.pendingConflict
    this.speedIndex=0
    this.phase='speed'
    this.message=''
    if(!this.conflict)app.go('strategy')
  }

  update(_dt,input){
    const key=input.consume()
    if(!key)return
    const b=mdButton(key)
    if(b==='HD'){this.app.toggleHd();return}

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
        this.retreat()
        return
      }
      if(b==='A'||b==='C'||b==='START'){
        this.phase='formation'
        this.app.audio.confirm()
      }
      return
    }

    if(b==='B'){
      this.phase='speed'
      this.app.audio.cancel()
      return
    }
    if(b==='A'||b==='C'||b==='START'){
      const speed=BATTLE_SPEEDS[this.speedIndex]?.id??'normal'
      battlePreparation(this.conflict,speed)
      this.message='小隊編成與即時部隊戰仍待實機校準；目前不使用虛構公式結算攻城。'
      this.app.audio.alert()
    }
  }

  retreat(){
    this.app.audio.cancel()
    cancelSiegeFromArmy(this.app.store)
    this.app.go('strategy')
  }

  draw(){
    const r=this.app.r,c=r.ctx
    const smallPanel=this.app.assets?.getNineSlice('ui.panels.small',{sourceSlice:32,destEdge:6})
    const largeFrame=this.app.assets?.getNineSlice('ui.frames.large',{sourceSlice:48,destEdge:7})
    r.clear('#160d08')
    r.ornateFrame(3,3,314,218,largeFrame)
    const city=this.app.store.mapProfile?.cityById?.[this.conflict?.target]
    r.shadowText(`${city?.name??''} 攻城準備`,160,18,14,'#f2d174','center')

    drawSiegeFortress(r,{x:15,y:48,width:290,height:105})

    const af=FACTION_BY_ID[this.conflict?.attacker]
    const df=FACTION_BY_ID[this.conflict?.defender]
    r.panel(30,157,260,50,'#030303','#7e5315',smallPanel)
    r.text(`${af?.label??''} ${this.conflict?.attackerTroops??0}`,45,164,7,af?.color??'#fff')
    r.text(`${df?.label??''} ${this.conflict?.defenderTroops??0}`,275,164,7,df?.color??'#fff','right')

    if(this.phase==='speed'){
      r.text('戰鬥速度',160,177,8,'#efd27d','center','top',SERIF,'700')
      BATTLE_SPEEDS.forEach((option,index)=>{
        r.text(`${index===this.speedIndex?'▶':'　'}${option.label}`,160,190+index*10,7.5,index===this.speedIndex?COLORS.cyan:'#ddd0ad','center')
      })
      r.text('C 決定　B 退卻',160,213,5.8,'#8e846f','center')
    }else{
      r.text(`小隊編成　每部隊最多 ${MAX_SQUADS_PER_UNIT} 小隊`,160,180,7.5,COLORS.cyan,'center')
      r.text('原版編成規則仍待逐項校準',160,194,6.5,'#cfc19f','center')
      r.text('C 繼續　B 返回速度選擇',160,208,5.8,'#8e846f','center')
    }

    if(this.message){
      r.panel(40,75,240,64,'#000','#b07118',smallPanel)
      r.wrapText(this.message,160,88,208,11,7.5,'#f0e4c5','center')
      r.text('A / B / C 關閉',160,124,6,'#8a806e','center')
    }
    r.scanlines(.02)
  }
}
