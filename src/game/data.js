export const FACTIONS = Object.freeze([
  { id: 'cao', ruler: '曹操', label: '曹操军', color: '#5376b7' },
  { id: 'liu', ruler: '刘备', label: '刘备军', color: '#5e9258' },
  { id: 'sun', ruler: '孙坚', label: '孙坚军', color: '#b55b44' },
  { id: 'yuan', ruler: '袁绍', label: '袁绍军', color: '#b68c50' },
  { id: 'dong', ruler: '董卓', label: '董卓军', color: '#7f5b8d' },
  { id: 'ma', ruler: '马腾', label: '马腾军', color: '#4e8b86' }
])

export const FACTION_BY_ID = Object.fromEntries(FACTIONS.map((item) => [item.id, item]))

export const CITIES = Object.freeze([
  { id: 'beiping', name: '北平', x: 210, y: 45, neighbors: ['ye'], owner: 'yuan', gold: 430, food: 780, troops: 7200 },
  { id: 'ye', name: '邺', x: 181, y: 59, neighbors: ['beiping', 'luoyang', 'xuchang'], owner: 'yuan', gold: 680, food: 930, troops: 9800 },
  { id: 'xiliang', name: '西凉', x: 42, y: 58, neighbors: ['chang_an'], owner: 'ma', gold: 360, food: 820, troops: 8000 },
  { id: 'chang_an', name: '长安', x: 77, y: 79, neighbors: ['xiliang', 'luoyang', 'hanzhong'], owner: 'dong', gold: 770, food: 940, troops: 12000 },
  { id: 'luoyang', name: '洛阳', x: 124, y: 72, neighbors: ['chang_an', 'ye', 'xuchang', 'xiangyang'], owner: 'dong', gold: 920, food: 1020, troops: 13500 },
  { id: 'xuchang', name: '许昌', x: 151, y: 91, neighbors: ['ye', 'luoyang', 'xiangyang', 'lujiang'], owner: 'cao', gold: 720, food: 980, troops: 11000 },
  { id: 'hanzhong', name: '汉中', x: 81, y: 111, neighbors: ['chang_an', 'chengdu', 'xiangyang'], owner: 'liu', gold: 360, food: 760, troops: 6500 },
  { id: 'chengdu', name: '成都', x: 53, y: 143, neighbors: ['hanzhong', 'jiangling'], owner: 'liu', gold: 640, food: 1160, troops: 9400 },
  { id: 'xiangyang', name: '襄阳', x: 122, y: 119, neighbors: ['luoyang', 'xuchang', 'hanzhong', 'jiangling', 'lujiang'], owner: 'liu', gold: 520, food: 900, troops: 8200 },
  { id: 'jiangling', name: '江陵', x: 109, y: 147, neighbors: ['chengdu', 'xiangyang', 'jianye'], owner: 'liu', gold: 420, food: 850, troops: 7000 },
  { id: 'lujiang', name: '庐江', x: 174, y: 126, neighbors: ['xuchang', 'xiangyang', 'jianye'], owner: 'sun', gold: 480, food: 790, troops: 7600 },
  { id: 'jianye', name: '建业', x: 204, y: 146, neighbors: ['jiangling', 'lujiang'], owner: 'sun', gold: 690, food: 1040, troops: 9800 }
])

export const CITY_BY_ID = Object.fromEntries(CITIES.map((item) => [item.id, item]))

export const COMMANDS = Object.freeze({
  domestic: [
    ['develop', '开发'], ['transfer', '调动'], ['intel', '情报'], ['welfare', '福利'],
    ['appoint', '任命'], ['tax', '税率'], ['educate', '教育'], ['transport', '运输']
  ],
  diplomacy: [
    ['ally', '同盟'], ['alienate', '离间'], ['assassinate', '暗杀'], ['fire', '火计'],
    ['intel', '情报'], ['borrow', '借款'], ['repay', '还款']
  ],
  military: [
    ['recruit', '征兵'], ['weapons', '武器'], ['intel', '情报'], ['talent', '人材'],
    ['defense', '防卫'], ['train', '训练']
  ]
})

export const CATEGORY_LABELS = Object.freeze({ domestic: '内 政', diplomacy: '外 交', military: '军 事' })
