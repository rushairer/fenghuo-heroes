import { COLORS } from '../game/constants.js'
import { openingOfficerRows } from '../game/officer-roster.js'
import { StrategyScene as ParityStrategyScene } from './strategy-parity.js'

export class StrategyScene extends ParityStrategyScene {
  drawInfo() {
    if (this.infoTab !== 2) return super.drawInfo()

    const r = this.app.r
    const rows = openingOfficerRows(this.app.store)
    r.panel(18,20,284,170,'#020202','#b07118')
    const tabs=['統治國一覽','全體地圖','武將狀態']
    tabs.forEach((title,index)=>r.text(title,66+index*94,30,8,index===this.infoTab?COLORS.cyan:'#777','center'))
    r.line(28,45,292,45,'#7b4e12',1)

    if (!rows.length) {
      r.text('此劇本的可驗證武將名冊尚未建立',160,82,8,'#d7caa8','center')
      r.text('不以歷史資料或其他遊戲資料補造',160,104,7,'#9e9582','center')
    } else {
      r.text(`${this.app.store.state.scenarioYear}年開局名冊 · ${rows.length}人`,160,53,7,'#d7caa8','center')
      rows.forEach((row,index)=>{
        const col=index>=8?1:0
        const line=index%8
        const x=42+col*133
        const y=67+line*13
        r.text(row.role==='君主'?'君':'將',x,y,6.5,row.role==='君主'?'#efd27d':'#8f8674')
        r.text(row.name,x+18,y,8,row.role==='君主'?COLORS.cyan:'#e8dfc8')
      })
      r.text('等級／武力／知力／德／忠誠仍待中文版實機逐項校準',160,166,6,'#9e9582','center')
    }

    r.text('← → 切換　A/B/C 返回',160,178,6,'#887f6d','center')
  }
}
