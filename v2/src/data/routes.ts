import type { RouteFeature } from './types'

export const routeFeatures: Partial<Record<string, RouteFeature[]>> = {
  'chengdu-hanzhong': ['village', 'pass'],
  'chengdu-jiangzhou': ['village'],
  'chang_an-hanzhong': ['supply', 'pass'],
  'chang_an-luoyang': ['supply', 'pass'],
  'luoyang-xiangyang': ['pass'],
  'jiangzhou-jiangxia': ['village', 'ferry'],
  'jiangxia-jianye': ['ferry', 'supply'],
  'jianye-shouchun': ['ferry', 'supply'],
  'shouchun-xiapi': ['supply'],
  'xuchang-shouchun': ['supply'],
  'xuchang-luoyang': ['supply'],
  'ye-luoyang': ['pass'],
}
