export const MONTHLY_COMMAND_PROMPT_EVIDENCE=Object.freeze({
  copy:'本月想搞什麼？',
  status:'corroborated-chinese-release-recollection',
  directFramePending:true,
  sources:Object.freeze([
    'https://zazu.tw/talks/6419',
    'https://black16bit.pixnet.net/blog/posts/5036126701',
  ]),
})

export function monthlyCommandPrompt(ruler){
  const name=String(ruler??'').trim()
  return name
    ?`${name}，${MONTHLY_COMMAND_PROMPT_EVIDENCE.copy}`
    :MONTHLY_COMMAND_PROMPT_EVIDENCE.copy
}
