// Evidence-backed data for the original Mega Drive game.
//
// IMPORTANT: the Japanese retail manual and the commonly played Chinese ROM
// do not currently agree on every scenario's selectable-ruler count. Keep the
// evidence streams separate until a repeatable Chinese-ROM capture/manual page
// resolves the difference. Never average or silently merge them.

export const ORIGINAL_CITY_NAMES = Object.freeze([
  '襄平','薊縣','代縣','信都','臨淄','下邳','濮陽','會稽','壽春','建安',
  '南昌','番禺','晉陽','洛陽','安城','新野','江夏','江陵','臨湘','合浦',
  '平陽','臨晉','長安','許昌','西城','襄陽','永安','且蘭','龍編','臨涇',
  '漢中','江州','宛溫','姑藏','西都','襄武','成都','武陽','雲南','不韋',
])

// The RAM-address source prints city #5 as 「臨溜」. Independent officer tables
// identify the same slot as 「臨淄」, so the normalized display name is 臨淄
// while retaining the raw source spelling for auditability.
export const ORIGINAL_CITY_SOURCE_VARIANTS = Object.freeze({
  5: Object.freeze({ normalized: '臨淄', source: '臨溜' }),
})

// Directly indexed from the Japanese Mega Drive manual scan. These counts are
// high-confidence for the Japanese retail edition, but are NOT automatically
// treated as Chinese-ROM facts.
export const JP_MANUAL_SCENARIOS = Object.freeze([
  Object.freeze({ id:'189', year:189, name:'桃園結義', selectableRulerCount:8, evidence:'jp-manual' }),
  Object.freeze({ id:'200', year:200, name:'群星亂舞', selectableRulerCount:9, evidence:'jp-manual' }),
  Object.freeze({ id:'215', year:215, name:'三國鼎立', selectableRulerCount:10, evidence:'jp-manual' }),
])

// Repeated Chinese-ROM player reports consistently describe these selectable
// rulers. This project targets the Chinese ROM experience, so this is the
// working target profile, but it remains lower-confidence than a readable
// Chinese manual page or a repeatable emulator capture.
export const ZH_ROM_SCENARIOS = Object.freeze([
  Object.freeze({
    id:'189', year:189, communityName:'群雄爭霸', selectableRulerCount:7,
    playableRulers:Object.freeze(['劉備','曹操','孫堅','袁紹','董卓','劉表','馬騰']),
    evidence:'zh-rom-community',
  }),
  Object.freeze({
    id:'200', year:200, communityName:'風雲再起', selectableRulerCount:7,
    playableRulers:Object.freeze(['劉備','曹操','孫權','袁紹','劉表','馬騰','劉璋']),
    evidence:'zh-rom-community',
  }),
  Object.freeze({
    id:'215', year:215, communityName:'三國鼎立', selectableRulerCount:3,
    playableRulers:Object.freeze(['劉備','曹操','孫權']),
    evidence:'zh-rom-community',
  }),
])

// Backward-compatible alias: ORIGINAL_SCENARIOS means the directly documented
// Japanese retail manual facts. Chinese-target code must use ZH_ROM_SCENARIOS
// explicitly rather than assuming the two editions are identical.
export const ORIGINAL_SCENARIOS = JP_MANUAL_SCENARIOS

// 189 opening-retinue transcription reproduced by multiple long-running
// Chinese-ROM guides. `zhCommunitySelectable` deliberately names the evidence
// source instead of presenting it as a universal-edition fact.
export const ORIGINAL_189_RULERS = Object.freeze([
  Object.freeze({ id:'gongsun_zan', ruler:'公孫瓚', zhCommunitySelectable:false, officers:Object.freeze(['嚴網']) }),
  Object.freeze({ id:'liu', ruler:'劉備', zhCommunitySelectable:true, officers:Object.freeze(['關羽','張飛']) }),
  Object.freeze({ id:'yuan', ruler:'袁紹', zhCommunitySelectable:true, officers:Object.freeze(['袁熙','袁譚','文醜','顏良','田豊']) }),
  Object.freeze({ id:'cao', ruler:'曹操', zhCommunitySelectable:true, officers:Object.freeze(['曹仁','曹洪','夏候惇','夏候淵']) }),
  Object.freeze({ id:'dong', ruler:'董卓', zhCommunitySelectable:true, officers:Object.freeze(['李儒','賈詡','華雄','徐榮','呂布','李肅','李榷','張濟','胡軫','郭氾']) }),
  Object.freeze({ id:'kong_rong', ruler:'孔融', zhCommunitySelectable:false, officers:Object.freeze(['武安國']) }),
  Object.freeze({ id:'ma', ruler:'馬騰', zhCommunitySelectable:true, officers:Object.freeze(['馬玩','韓遂','馬岱','程銀']) }),
  Object.freeze({ id:'tao_qian', ruler:'陶謙', zhCommunitySelectable:false, officers:Object.freeze(['糜竺','陳登']) }),
  Object.freeze({ id:'liu_biao', ruler:'劉表', zhCommunitySelectable:true, officers:Object.freeze(['呂公','蒯越','黃忠','張允','蔡瑁','黃祖']) }),
  Object.freeze({ id:'yuan_shu', ruler:'袁術', zhCommunitySelectable:false, officers:Object.freeze(['張勳','紀靈','呂範','陳蘭','雷薄']) }),
  Object.freeze({ id:'wang_lang', ruler:'王朗', zhCommunitySelectable:false, officers:Object.freeze(['虞翻']) }),
  Object.freeze({ id:'zhang_lu', ruler:'張魯', zhCommunitySelectable:false, officers:Object.freeze(['楊昂','楊任','楊松']) }),
  Object.freeze({ id:'sun', ruler:'孫堅', zhCommunitySelectable:true, officers:Object.freeze(['程普','黃蓋','朱治','韓當']) }),
  Object.freeze({ id:'liu_yan', ruler:'劉焉', zhCommunitySelectable:false, officers:Object.freeze(['張松','吳蘭','嚴顏','張任','吳懿','孟達','劉璋','王累']) }),
])

export const ZH_189_SELECTABLE_RULERS = Object.freeze(
  ORIGINAL_189_RULERS.filter((entry) => entry.zhCommunitySelectable).map((entry) => entry.ruler),
)

export const ZH_189_SELECTABLE_IDS = Object.freeze(
  ORIGINAL_189_RULERS.filter((entry) => entry.zhCommunitySelectable).map((entry) => entry.id),
)

// Legacy aliases kept temporarily for existing callers. New code should use the
// source-qualified ZH_* names.
export const ORIGINAL_189_SELECTABLE_RULERS = ZH_189_SELECTABLE_RULERS
export const ORIGINAL_189_SELECTABLE_IDS = ZH_189_SELECTABLE_IDS

export function scenarioEvidence(year, edition='zh-rom') {
  const source = edition === 'jp' ? JP_MANUAL_SCENARIOS : ZH_ROM_SCENARIOS
  return source.find((scenario) => scenario.year === Number(year)) ?? null
}
