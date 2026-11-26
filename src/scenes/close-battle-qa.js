import { COLORS, SERIF } from '../game/constants.js'
import { mdButton } from '../game/input.js'
import { CLOSE_FORMATION_COUNT, initialCloseFormationPreview, transitionCloseFormationPreview } from '../game/close-battle-formation.js'

export class CloseBattleQaScene{
  constructor(app){
    this.app=app
    this.resetPreview()
  }

  resetPreview(){this.preview=initialCloseFormationPreview()}

  update(_dt,input){
    const key=input.consume()
    if(!key)return
    const button=mdButton(key)
    if(button==='HD')return this.app.toggleHd()
    const previous=this.preview
    this.preview=transitionCloseFormationPreview(previous,button)
    if(previous===this.preview)return
    if(button==='C')this.app.audio.confirm()
    else if(button==='B')this.app.audio.cancel()
    else this.app.audio.move()
  }

  draw(){
    const r=this.app.r
    const p=this.preview
    r.clear('#16130e')
    r.text('部隊接戰・陣形操作預覽',160,14,11,'#efd27d','center','top',SERIF,'700')
    r.panel(24,38,272,143,'#050505','#9b6514')
    if(p.phase==='speed'){
      r.text('戰鬥速度',160,49,11,'#efd27d','center')
      for(const [i,speed] of ['normal','fast'].entries()){
        const active=p.speed===speed
        r.text((active?'▶ ':'　 ')+(speed==='normal'?'普通':'快速'),160,83+i*24,10,active?COLORS.cyan:'#ddd0ad','center')
      }
      r.text('方向鍵 選擇　C 決定',160,159,7,'#a99d82','center')
    }else if(p.phase==='formation'){
      r.text('決定陣形',160,49,11,'#efd27d','center')
      for(let i=0;i<CLOSE_FORMATION_COUNT;i++){
        const active=p.index===i
        r.text(String(i+1),64+i*48,92,14,active?COLORS.cyan:'#ddd0ad','center')
        if(active)r.text('▲',64+i*48,113,8,COLORS.cyan,'center')
      }
      r.text('形狀及原版順序尚未校準',160,135,7,'#a99d82','center')
      r.text('← → 選擇　C 決定　B 返回',160,159,7,'#a99d82','center')
    }else{
      r.text(p.phase==='blocked'?'快速：不提供陣形選擇':'已記錄陣形 '+p.selected,160,65,10,'#efd27d','center')
      r.text('未校準實際小隊位置及戰鬥效果',160,104,7,'#ddd0ad','center')
      r.text('B 返回',160,159,7,'#a99d82','center')
    }
    r.text('QA・非原版畫面・不變更存檔或戰鬥結果',160,199,7,'#a99d82','center')
  }
}
