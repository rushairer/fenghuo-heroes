export const INSPECTION_CATEGORY_SCHEMA = Object.freeze([
  Object.freeze({ id:'domestic', label:'內政' }),
  Object.freeze({ id:'diplomacy', label:'外交' }),
  Object.freeze({ id:'military', label:'軍備' }),
])

const action = (id,label) => Object.freeze({
  id,
  label,
  kind:'action',
  structureEvidence:'manual-and-zh-rom-community',
  effectEvidence:'unverified-formula',
})
const intel = Object.freeze({
  id:'intel',
  label:'情報',
  kind:'browser',
  structureEvidence:'jp-manual-and-zh-rom-community',
  effectEvidence:'read-only-country-status',
  usage:'repeatable',
})
const tax = Object.freeze({
  id:'tax',
  label:'稅率',
  kind:'configuration',
  structureEvidence:'jp-manual-and-zh-rom-community',
  effectEvidence:'persistent-rate-only; settlement-formula-unverified',
})
const end = Object.freeze({
  id:'end',
  label:'結束',
  kind:'end',
  structureEvidence:'jp-manual',
  effectEvidence:'turn-control',
})

export const INSPECTION_COMMAND_SCHEMA = Object.freeze({
  domestic:Object.freeze([
    action('develop','開發'),
    action('transfer','調動'),
    intel,
    action('welfare','福利'),
    Object.freeze({
      id:'appoint',
      label:'任命',
      kind:'submenu',
      structureEvidence:'zh-rom-community',
      effectEvidence:'n/a',
      children:Object.freeze([
        action('appoint-governor','太守'),
        action('appoint-strategist','軍師'),
        action('appoint-office','官職'),
      ]),
    }),
    tax,
    action('educate','教育'),
    action('transport','運輸'),
    end,
  ]),
  diplomacy:Object.freeze([
    action('ally','同盟'),
    Object.freeze({
      id:'strategy',
      label:'計策',
      kind:'submenu',
      structureEvidence:'manual-and-zh-rom-community',
      effectEvidence:'n/a',
      children:Object.freeze([
        action('alienate','離間'),
        action('assassinate','暗殺'),
        action('fire','火計'),
      ]),
    }),
    intel,
    action('borrow','借款'),
    action('repay','還款'),
    end,
  ]),
  military:Object.freeze([
    action('recruit','徵兵'),
    action('weapons','武器'),
    intel,
    Object.freeze({
      id:'talent',
      label:'人材',
      kind:'submenu',
      structureEvidence:'zh-rom-community',
      effectEvidence:'n/a',
      children:Object.freeze([
        action('talent-search','探尋'),
        Object.freeze({
          id:'talent-select',
          label:'選拔',
          kind:'submenu',
          structureEvidence:'zh-rom-community',
          effectEvidence:'n/a',
          children:Object.freeze([
            action('talent-persuade','說服'),
            action('talent-gift','貢品'),
          ]),
        }),
      ]),
    }),
    action('defense','防衛'),
    action('train','訓練'),
    end,
  ]),
})

const EMPTY_ITEMS=Object.freeze([])

function normalizeSubmenuPath(submenuPath=null) {
  if(Array.isArray(submenuPath))return submenuPath.filter(Boolean)
  return submenuPath?[submenuPath]:[]
}

export function inspectionCommandItems(category, submenuPath=null) {
  let items=INSPECTION_COMMAND_SCHEMA[category]??EMPTY_ITEMS
  for(const submenuId of normalizeSubmenuPath(submenuPath)){
    const submenu=items.find((item)=>item.id===submenuId&&item.kind==='submenu')
    if(!submenu)return EMPTY_ITEMS
    items=submenu.children??EMPTY_ITEMS
  }
  return items
}

export function inspectionCommandPath(category, submenuPath=null) {
  const labels=[INSPECTION_CATEGORY_SCHEMA.find((item)=>item.id===category)?.label??category]
  let items=INSPECTION_COMMAND_SCHEMA[category]??EMPTY_ITEMS
  for(const submenuId of normalizeSubmenuPath(submenuPath)){
    const submenu=items.find((item)=>item.id===submenuId&&item.kind==='submenu')
    if(!submenu){
      labels.push(submenuId)
      break
    }
    labels.push(submenu.label)
    items=submenu.children??EMPTY_ITEMS
  }
  return Object.freeze(labels)
}

export function inspectionCommandById(category,id) {
  const visit=(items)=>{
    for(const item of items){
      if(item.id===id)return item
      if(item.kind==='submenu'){
        const found=visit(item.children??EMPTY_ITEMS)
        if(found)return found
      }
    }
    return null
  }
  return visit(INSPECTION_COMMAND_SCHEMA[category]??EMPTY_ITEMS)
}

export function isInspectionConfirmButton(button) {
  return button==='C'
}
