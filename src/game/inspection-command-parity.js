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
const program = (id,label,target) => Object.freeze({
  id,
  label,
  kind:'program',
  target,
  continuous:true,
  requires:Object.freeze(['officer','monthlyBudget']),
  structureEvidence:'jp-manual-and-zh-rom-community',
  effectEvidence:'continuous-program-structure-only; formula-unverified',
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
    program('develop','開發','industry'),
    action('transfer','調動'),
    intel,
    program('welfare','福利','rule'),
    action('appoint','任命'),
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
    action('talent','人材'),
    action('defense','防衛'),
    action('train','訓練'),
    end,
  ]),
})

export function inspectionCommandItems(category, submenuId=null) {
  const items=INSPECTION_COMMAND_SCHEMA[category]??Object.freeze([])
  if(!submenuId)return items
  const submenu=items.find((item)=>item.id===submenuId&&item.kind==='submenu')
  return submenu?.children??Object.freeze([])
}

export function inspectionCommandPath(category, submenuId=null) {
  const categoryLabel=INSPECTION_CATEGORY_SCHEMA.find((item)=>item.id===category)?.label??category
  if(!submenuId)return Object.freeze([categoryLabel])
  const submenu=(INSPECTION_COMMAND_SCHEMA[category]??[]).find((item)=>item.id===submenuId)
  return Object.freeze([categoryLabel,submenu?.label??submenuId])
}

export function inspectionCommandById(category,id) {
  const top=INSPECTION_COMMAND_SCHEMA[category]??[]
  for(const item of top){
    if(item.id===id)return item
    if(item.kind==='submenu'){
      const child=item.children.find((candidate)=>candidate.id===id)
      if(child)return child
    }
  }
  return null
}

export function isInspectionConfirmButton(button) {
  return button==='C'
}
