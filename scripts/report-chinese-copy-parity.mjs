import {
  MONTHLY_COMMAND_PROMPT_EVIDENCE,
} from '../src/game/chinese-copy-parity.js'
import { chineseCopyGapReport } from '../src/game/chinese-copy-gaps.js'

const gaps=chineseCopyGapReport()

console.log(JSON.stringify({
  protected:[
    {
      id:'monthly-command-prompt',
      copy:MONTHLY_COMMAND_PROMPT_EVIDENCE.copy,
      status:MONTHLY_COMMAND_PROMPT_EVIDENCE.status,
      directFramePending:MONTHLY_COMMAND_PROMPT_EVIDENCE.directFramePending,
      sourceCount:MONTHLY_COMMAND_PROMPT_EVIDENCE.sources.length,
    },
  ],
  gaps,
  totals:{
    protected:1,
    directFramePending:
      (MONTHLY_COMMAND_PROMPT_EVIDENCE.directFramePending?1:0)+
      gaps.filter((item)=>item.directFramePending).length,
    engineeringDiagnostic:gaps.filter((item)=>
      item.status==='engineering-diagnostic-not-original-copy'
    ).length,
  },
},null,2))
