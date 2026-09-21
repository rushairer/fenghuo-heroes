import { ZH_ROM_RAM_CITY_ORDER } from './original-data.js'

export const ZH_ROM_RAM_EVIDENCE_SOURCE=Object.freeze({
  id:'ng173-ec-2006',
  kind:'community-memory-code-table',
  url:'https://www.ng173.com/thread-152866-1-1.html',
  edition:'traditional-chinese-md',
  confidence:'layout-lead-not-start-value-evidence',
})

export const ZH_ROM_CITY_RESOURCE_RAM=Object.freeze({
  stride:0x4,
  cityCount:40,
  tables:Object.freeze({
    gold:Object.freeze({base:0xE000}),
    food:Object.freeze({base:0xE0A0}),
    troops:Object.freeze({base:0xE500}),
  }),
})

export const ZH_ROM_RULER_SELECTOR_RAM=Object.freeze({
  address:0xF67A,
  values:Object.freeze({
    0x0:'公孫瓚',
    0x1:'劉備',
    0x2:'袁紹',
    0x3:'孔融',
    0x4:'陶謙',
    0x5:'曹操',
    0x6:'王朗',
    0x7:'董卓',
    0x8:'劉表',
    0x9:'袁術',
    0xA:'孫堅/孫權',
    0xB:'張魯',
    0xC:'劉焉/劉璋',
    0xD:'馬騰',
    0xE:'觀看模式',
  }),
})

export function cityResourceRamAddress(cityName,field){
  const index=ZH_ROM_RAM_CITY_ORDER.indexOf(cityName)
  if(index<0)throw new Error(`Unknown Chinese-ROM RAM city identity: ${cityName}`)
  const table=ZH_ROM_CITY_RESOURCE_RAM.tables[field]
  if(!table)throw new Error(`Unknown Chinese-ROM city resource field: ${field}`)
  return table.base+index*ZH_ROM_CITY_RESOURCE_RAM.stride
}

export function cityResourceRamPlan(){
  return Object.freeze(ZH_ROM_RAM_CITY_ORDER.map((city,index)=>Object.freeze({
    index,
    city,
    gold:cityResourceRamAddress(city,'gold'),
    food:cityResourceRamAddress(city,'food'),
    troops:cityResourceRamAddress(city,'troops'),
  })))
}
