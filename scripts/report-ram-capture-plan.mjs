import {
  ZH_ROM_CITY_RESOURCE_RAM,
  ZH_ROM_RAM_EVIDENCE_SOURCE,
  ZH_ROM_RULER_SELECTOR_RAM,
  cityResourceRamPlan,
} from '../src/game/zh-rom-ram-evidence.js'

const hex=(value)=>'0x'+Number(value).toString(16).toUpperCase().padStart(4,'0')

console.log(JSON.stringify({
  source:ZH_ROM_RAM_EVIDENCE_SOURCE,
  warning:'addresses are observation leads only; they do not establish opening values',
  cityResourceTables:{
    stride:ZH_ROM_CITY_RESOURCE_RAM.stride,
    goldBase:hex(ZH_ROM_CITY_RESOURCE_RAM.tables.gold.base),
    foodBase:hex(ZH_ROM_CITY_RESOURCE_RAM.tables.food.base),
    troopsBase:hex(ZH_ROM_CITY_RESOURCE_RAM.tables.troops.base),
  },
  rulerSelector:{
    address:hex(ZH_ROM_RULER_SELECTOR_RAM.address),
    values:ZH_ROM_RULER_SELECTOR_RAM.values,
  },
  cities:cityResourceRamPlan().map((item)=>({
    index:item.index+1,
    city:item.city,
    gold:hex(item.gold),
    food:hex(item.food),
    troops:hex(item.troops),
  })),
},null,2))
