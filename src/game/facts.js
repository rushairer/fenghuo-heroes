// Evidence-backed facts about the original Mega Drive game.
// Keep uncertain implementation guesses out of this file. Runtime coordinates,
// resource values, road topology and later-scenario ownership remain separate
// until they are verified from the manual or repeatable emulator captures.

export const ORIGINAL_SCENARIOS = Object.freeze([
  Object.freeze({
    id: '189',
    year: 189,
    communityLabel: '群雄爭霸',
    playableRulers: Object.freeze(['劉備', '曹操', '孫堅', '袁紹', '董卓', '劉表', '馬騰']),
    confidence: 'cross-source',
  }),
  Object.freeze({
    id: '200',
    year: 200,
    communityLabel: '風雲再起',
    playableRulers: Object.freeze(['劉備', '曹操', '孫權', '袁紹', '劉表', '馬騰', '劉璋']),
    confidence: 'cross-source',
  }),
  Object.freeze({
    id: '215',
    year: 215,
    communityLabel: '三國鼎立',
    playableRulers: Object.freeze(['劉備', '曹操', '孫權']),
    confidence: 'cross-source',
  }),
])

// Canonical 40-city roster repeatedly documented by long-running player guides.
// This list intentionally contains names only. The current runtime map coordinates
// are still a scaffold and must not be treated as original-game coordinates.
export const ORIGINAL_CITY_NAMES = Object.freeze([
  '襄平', '蘇縣', '代縣', '晉陽', '平陽', '臨晉', '信都', '濮陽', '臨淄', '洛陽',
  '長安', '許昌', '下邳', '壽春', '安城', '新野', '襄陽', '西城', '江夏', '江陵',
  '永安', '江州', '會稽', '建安', '南昌', '臨湘', '番禺', '漢中', '成都', '武陽',
  '臨涇', '襄武', '西都', '故藏', '合浦', '且蘭', '雲南', '宛溫', '不韋', '龍編',
])

// 189 opening roster transcription from the commonly reproduced original-game
// guide. Names are kept in the source's traditional-Chinese transcription rather
// than silently normalized to historical variants.
export const ORIGINAL_189_RULERS = Object.freeze([
  Object.freeze({ id:'gongsun_zan', ruler:'公孫瓚', playable:false, officers:Object.freeze(['嚴網']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'liu', ruler:'劉備', playable:true, officers:Object.freeze(['關羽','張飛']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'yuan', ruler:'袁紹', playable:true, officers:Object.freeze(['袁熙','袁譚','文醜','顏良','田豊']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'cao', ruler:'曹操', playable:true, officers:Object.freeze(['曹仁','曹洪','夏候惇','夏候淵']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'dong', ruler:'董卓', playable:true, officers:Object.freeze(['李儒','賈詡','華雄','徐榮','呂布','李肅','李榷','張濟','胡軫','郭氾']), lowLoyalty:Object.freeze(['呂布','李肅','李榷','張濟','胡軫','郭氾']) }),
  Object.freeze({ id:'kong_rong', ruler:'孔融', playable:false, officers:Object.freeze(['武安國']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'ma', ruler:'馬騰', playable:true, officers:Object.freeze(['馬玩','韓遂','馬岱','程銀']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'tao_qian', ruler:'陶謙', playable:false, officers:Object.freeze(['糜竺','陳登']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'liu_biao', ruler:'劉表', playable:true, officers:Object.freeze(['呂公','蒯越','黃忠','張允','蔡瑁','黃袓']), lowLoyalty:Object.freeze(['張允','蔡瑁','黃袓']) }),
  Object.freeze({ id:'yuan_shu', ruler:'袁術', playable:false, officers:Object.freeze(['張勳','紀靈','呂範','陳蘭','雷薄']), lowLoyalty:Object.freeze(['陳蘭','雷薄']) }),
  Object.freeze({ id:'wang_lang', ruler:'王朗', playable:false, officers:Object.freeze(['虞翻']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'zhang_lu', ruler:'張魯', playable:false, officers:Object.freeze(['楊昂','楊任','楊松']), lowLoyalty:Object.freeze(['楊松']) }),
  Object.freeze({ id:'sun', ruler:'孫堅', playable:true, officers:Object.freeze(['程普','黃蓋','朱治','韓當']), lowLoyalty:Object.freeze([]) }),
  Object.freeze({ id:'liu_yan', ruler:'劉焉', playable:false, officers:Object.freeze(['張松','吳蘭','嚴顏','張任','吳懿','孟達','劉璋','王累']), lowLoyalty:Object.freeze([]) }),
])

export const ORIGINAL_189_PLAYABLE_RULERS = Object.freeze(
  ORIGINAL_189_RULERS.filter((item) => item.playable).map((item) => item.ruler),
)

export function originalScenario(year) {
  return ORIGINAL_SCENARIOS.find((item) => item.year === Number(year)) ?? null
}
