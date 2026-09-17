// Evidence-backed canonical data for the original Mega Drive game.
// Keep this separate from provisional runtime coordinates until map geometry
// has been verified screen-by-screen.

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

export const ORIGINAL_SCENARIOS = Object.freeze([
  Object.freeze({ id:'189', year:189, name:'桃園結義', selectableRulerCount:7 }),
  Object.freeze({ id:'200', year:200, name:'群星亂舞', selectableRulerCount:9 }),
  Object.freeze({ id:'215', year:215, name:'三國鼎立', selectableRulerCount:10 }),
])

export const ORIGINAL_189_RULERS = Object.freeze([
  Object.freeze({ id:'gongsun_zan', ruler:'公孫瓚', selectable:false, officers:Object.freeze(['嚴網']) }),
  Object.freeze({ id:'liu', ruler:'劉備', selectable:true, officers:Object.freeze(['關羽','張飛']) }),
  Object.freeze({ id:'yuan', ruler:'袁紹', selectable:true, officers:Object.freeze(['袁熙','袁譚','文醜','顏良','田豊']) }),
  Object.freeze({ id:'cao', ruler:'曹操', selectable:true, officers:Object.freeze(['曹仁','曹洪','夏候惇','夏候淵']) }),
  Object.freeze({ id:'dong', ruler:'董卓', selectable:true, officers:Object.freeze(['李儒','賈詡','華雄','徐榮','呂布','李肅','李榷','張濟','胡軫','郭氾']) }),
  Object.freeze({ id:'kong_rong', ruler:'孔融', selectable:false, officers:Object.freeze(['武安國']) }),
  Object.freeze({ id:'ma', ruler:'馬騰', selectable:true, officers:Object.freeze(['馬玩','韓遂','馬岱','程銀']) }),
  Object.freeze({ id:'tao_qian', ruler:'陶謙', selectable:false, officers:Object.freeze(['糜竺','陳登']) }),
  Object.freeze({ id:'liu_biao', ruler:'劉表', selectable:true, officers:Object.freeze(['呂公','蒯越','黃忠','張允','蔡瑁','黃祖']) }),
  Object.freeze({ id:'yuan_shu', ruler:'袁術', selectable:false, officers:Object.freeze(['張勳','紀靈','呂範','陳蘭','雷薄']) }),
  Object.freeze({ id:'wang_lang', ruler:'王朗', selectable:false, officers:Object.freeze(['虞翻']) }),
  Object.freeze({ id:'zhang_lu', ruler:'張魯', selectable:false, officers:Object.freeze(['楊昂','楊任','楊松']) }),
  Object.freeze({ id:'sun', ruler:'孫堅', selectable:true, officers:Object.freeze(['程普','黃蓋','朱治','韓當']) }),
  Object.freeze({ id:'liu_yan', ruler:'劉焉', selectable:false, officers:Object.freeze(['張松','吳蘭','嚴顏','張任','吳懿','孟達','劉璋','王累']) }),
])

export const ORIGINAL_189_SELECTABLE_RULERS = Object.freeze(
  ORIGINAL_189_RULERS.filter((entry) => entry.selectable).map((entry) => entry.ruler),
)

export const ORIGINAL_189_SELECTABLE_IDS = Object.freeze(
  ORIGINAL_189_RULERS.filter((entry) => entry.selectable).map((entry) => entry.id),
)
