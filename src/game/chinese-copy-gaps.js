export const CHINESE_COPY_GAPS=Object.freeze({
  commandCategoryLocked:Object.freeze({
    status:'unverified-engineering-copy',
    directFramePending:true,
    text:(category)=>`本月已经决定执行「${category}」，不能再改成其他类别。`,
  }),
  ownCityRequired:Object.freeze({
    status:'unverified-engineering-copy',
    directFramePending:true,
    text:()=> '请选择本国城池。',
  }),
  confirmCategoryAtCity:Object.freeze({
    status:'unverified-engineering-copy',
    directFramePending:true,
    text:(city,category)=>`确定在「${city}」执行${category}？`,
  }),
  foreignCityCommandRejected:Object.freeze({
    status:'unverified-engineering-copy',
    directFramePending:true,
    text:()=> '只能向本国城池下令。',
  }),
  commandEntryHint:Object.freeze({
    status:'unverified-engineering-copy',
    directFramePending:true,
    text:()=> '先把方框移到地图空白处按 C，决定本月是内政、外交还是军备。',
  }),
  retiredAdjacentMarchHint:Object.freeze({
    status:'engineering-diagnostic-not-original-copy',
    directFramePending:false,
    text:()=> '舊版相鄰城市行軍入口已退休；行軍必須使用自由路線部隊狀態機。',
  }),
})

export function chineseCopyGapReport(){
  return Object.freeze(Object.entries(CHINESE_COPY_GAPS).map(([id,item])=>Object.freeze({
    id,
    status:item.status,
    directFramePending:item.directFramePending,
  })))
}
