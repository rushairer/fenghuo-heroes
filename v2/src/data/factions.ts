import type { StrategyFaction } from './types'

export const strategyFactions: StrategyFaction[] = [
  { id: 'cao', name: '曹操军', ruler: '曹操', color: 0x3b5ba9, capital: 'xuchang', trait: '屯田强军' },
  { id: 'liu', name: '刘备军', ruler: '刘备', color: 0x4e9f50, capital: 'chengdu', trait: '仁德聚众' },
  { id: 'sun', name: '孙权军', ruler: '孙权', color: 0xd9a441, capital: 'jianye', trait: '江东水师' },
  { id: 'yuan', name: '袁绍军', ruler: '袁绍', color: 0x8b5fbf, capital: 'ye', trait: '河北名门' },
  { id: 'dong', name: '董卓军', ruler: '董卓', color: 0x7a2f2f, capital: 'chang_an', trait: '强权威压' },
  { id: 'neutral', name: '群雄割据', ruler: '诸郡豪强', color: 0x8a8f98, capital: 'luoyang', trait: '待势而动' },
]
