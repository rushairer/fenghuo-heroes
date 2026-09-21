const gameModuleRoot=location.pathname.includes('/public/tools/')
  ?'../../src/game/'
  :'../src/game/'

const modules=await Promise.all([
  import(gameModuleRoot+'scenario-evidence-capture.js'),
  import(gameModuleRoot+'original-data.js'),
  import(gameModuleRoot+'scenario-fields.js'),
])
const captureModule=modules[0]
const originalDataModule=modules[1]
const fieldsModule=modules[2]

const normalizeScenarioCaptureBundleForEditing=captureModule.normalizeScenarioCaptureBundleForEditing
const scenarioCaptureBundle=captureModule.scenarioCaptureBundle
const scenarioCityStateCandidate=captureModule.scenarioCityStateCandidate
const scenarioOfficerCandidate=captureModule.scenarioOfficerCandidate
const scenarioOwnershipCandidate=captureModule.scenarioOwnershipCandidate
const ZH_ROM_CANONICAL_CITY_SET=originalDataModule.ZH_ROM_CANONICAL_CITY_SET
const normalizeZhRomCityName=originalDataModule.normalizeZhRomCityName
const CITY_ECONOMY_FIELDS=fieldsModule.CITY_ECONOMY_FIELDS

const FIELD_LABELS=Object.freeze({
  gold:'金',food:'米',troops:'兵力',development:'產值',
  rule:'統治',defense:'防衛',training:'訓練',
})

const imageInput=document.querySelector('#image-input')
const bundleInput=document.querySelector('#bundle-input')
const scenarioYear=document.querySelector('#scenario-year')
const recordType=document.querySelector('#record-type')
const cityName=document.querySelector('#city-name')
const sourceId=document.querySelector('#source-id')
const sourceRef=document.querySelector('#source-ref')
const frameRef=document.querySelector('#frame-ref')
const factionId=document.querySelector('#faction-id')
const officerName=document.querySelector('#officer-name')
const officerRole=document.querySelector('#officer-role')
const ownershipEditor=document.querySelector('#ownership-editor')
const cityStateEditor=document.querySelector('#city-state-editor')
const officerEditor=document.querySelector('#officer-editor')
const cityStateFields=document.querySelector('#city-state-fields')
const autoNext=document.querySelector('#auto-next')
const saveRecord=document.querySelector('#save-record')
const copyOutput=document.querySelector('#copy-output')
const undoOutput=document.querySelector('#undo-output')
const clearOutput=document.querySelector('#clear-output')
const referenceImage=document.querySelector('#reference-image')
const imagePlaceholder=document.querySelector('#image-placeholder')
const output=document.querySelector('#output')
const progress=document.querySelector('#capture-progress')
const status=document.querySelector('#status')

let ownership=[]
let cityStates=[]
let officerAssignments=[]
let history=[]
let imageUrl=null

function cloneState(){
  return {
    ownership:ownership.map((item)=>({...item})),
    cityStates:cityStates.map((item)=>({...item})),
    officerAssignments:officerAssignments.map((item)=>({...item})),
  }
}
function restoreState(snapshot){
  ownership=snapshot.ownership
  cityStates=snapshot.cityStates
  officerAssignments=snapshot.officerAssignments
}
function pushHistory(){
  history.push(cloneState())
  if(history.length>80)history.shift()
}
function populateCities(){
  cityName.replaceChildren()
  for(const name of ZH_ROM_CANONICAL_CITY_SET){
    const option=document.createElement('option')
    option.value=name
    option.textContent=name
    cityName.append(option)
  }
}
function populateCityStateFields(){
  cityStateFields.replaceChildren()
  for(const field of CITY_ECONOMY_FIELDS){
    const label=document.createElement('label')
    label.textContent=FIELD_LABELS[field]||field
    const input=document.createElement('input')
    input.type='number'
    input.inputMode='numeric'
    input.id='city-state-'+field
    input.dataset.field=field
    input.step='1'
    label.append(input)
    cityStateFields.append(label)
  }
}
function stateInputs(){
  return [...cityStateFields.querySelectorAll('input[data-field]')]
}
function activeBatchSourceId(){
  return ownership[0]?.sourceId
    ||cityStates[0]?.sourceId
    ||officerAssignments[0]?.sourceId
    ||null
}
function activeBatchYear(){
  const record=ownership[0]||cityStates[0]||officerAssignments[0]
  return record?Number(record.scenarioYear):null
}
function ensureBatchIdentity(){
  const requested=sourceId.value.trim()
  if(!requested){
    status.textContent='Source ID 不可為空。'
    sourceId.focus()
    return false
  }
  const existing=activeBatchSourceId()
  if(existing&&existing!==requested){
    status.textContent='目前批次使用 '+existing+'；請先複製/清空批次後再切換 Source ID。'
    return false
  }
  const requestedYear=Number(scenarioYear.value)
  const existingYear=activeBatchYear()
  if(existingYear&&existingYear!==requestedYear){
    status.textContent='目前批次屬於 '+existingYear+' 劇本；請先複製/清空批次後再切換劇本。'
    return false
  }
  if(!sourceRef.value.trim()){
    status.textContent='Source Ref 不可為空。'
    sourceRef.focus()
    return false
  }
  if(!frameRef.value.trim()){
    status.textContent='Frame Ref 不可為空。'
    frameRef.focus()
    return false
  }
  return true
}
function withScenarioYear(record){
  return {...record,scenarioYear:Number(scenarioYear.value)}
}
function upsertCityRecord(list,record){
  const identity=normalizeZhRomCityName(record.city)
  const index=list.findIndex((item)=>normalizeZhRomCityName(item.city)===identity)
  if(index>=0)list[index]=record
  else list.push(record)
}
function upsertOfficer(record){
  const name=String(record.officer||'').trim()
  const index=officerAssignments.findIndex((item)=>String(item.officer||'').trim()===name)
  if(index>=0)officerAssignments[index]=record
  else officerAssignments.push(record)
}
function capturedCitySet(list){
  return new Set(list.map((item)=>normalizeZhRomCityName(item.city)))
}
function selectNextMissing(list){
  if(!autoNext.checked)return
  const captured=capturedCitySet(list)
  const start=Math.max(0,ZH_ROM_CANONICAL_CITY_SET.indexOf(cityName.value))
  for(let offset=1;offset<=ZH_ROM_CANONICAL_CITY_SET.length;offset++){
    const candidate=ZH_ROM_CANONICAL_CITY_SET[(start+offset)%ZH_ROM_CANONICAL_CITY_SET.length]
    if(!captured.has(candidate)){
      cityName.value=candidate
      loadSelectedCityIntoEditor()
      return
    }
  }
}
function currentBundle(){
  return scenarioCaptureBundle({
    scenarioYear:Number(scenarioYear.value),
    source:{
      id:activeBatchSourceId()||sourceId.value.trim(),
      kind:'direct-capture',
      ref:sourceRef.value.trim(),
      note:'Chinese-ROM scenario capture workbench batch',
    },
    ownership,
    cityStates,
    officerAssignments,
  })
}
function render(message=''){
  output.textContent=JSON.stringify(currentBundle(),null,2)
  progress.textContent=
    '歸屬 '+capturedCitySet(ownership).size+'/40 · '+
    '數值 '+capturedCitySet(cityStates).size+'/40 · '+
    '武將 '+officerAssignments.length
  undoOutput.disabled=history.length===0
  status.textContent=message||'候選記錄不代表 verified evidence；請經 audit / 人工復核後再升級。'
}
function setEditorVisibility(){
  const type=recordType.value
  ownershipEditor.hidden=type!=='ownership'
  cityStateEditor.hidden=type!=='city-state'
  officerEditor.hidden=type!=='officer'
  loadSelectedCityIntoEditor()
}
function loadSelectedCityIntoEditor(){
  const city=normalizeZhRomCityName(cityName.value)
  const owner=ownership.find((item)=>normalizeZhRomCityName(item.city)===city)
  factionId.value=owner?.factionId||''
  const state=cityStates.find((item)=>normalizeZhRomCityName(item.city)===city)
  for(const input of stateInputs()){
    const value=state?.[input.dataset.field]
    input.value=Number.isFinite(value)?String(value):''
  }
}
function saveOwnership(){
  if(!factionId.value.trim()){
    status.textContent='城市歸屬需要 Faction ID。'
    factionId.focus()
    return false
  }
  const candidate=withScenarioYear(scenarioOwnershipCandidate({
    city:cityName.value,
    factionId:factionId.value,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
  }))
  upsertCityRecord(ownership,candidate)
  selectNextMissing(ownership)
  return true
}
function saveCityState(){
  const values={}
  for(const input of stateInputs()){
    if(input.value.trim()===''){
      status.textContent=(FIELD_LABELS[input.dataset.field]||input.dataset.field)+' 尚未填寫；不以猜值補齊。'
      input.focus()
      return false
    }
    const value=Number(input.value)
    if(!Number.isFinite(value)){
      status.textContent=(FIELD_LABELS[input.dataset.field]||input.dataset.field)+' 不是有效數值。'
      input.focus()
      return false
    }
    values[input.dataset.field]=value
  }
  const candidate=withScenarioYear(scenarioCityStateCandidate({
    city:cityName.value,
    ...values,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
  }))
  upsertCityRecord(cityStates,candidate)
  selectNextMissing(cityStates)
  return true
}
function saveOfficer(){
  if(!officerName.value.trim()){
    status.textContent='武將配屬需要武將名。'
    officerName.focus()
    return false
  }
  const candidate=withScenarioYear(scenarioOfficerCandidate({
    officer:officerName.value,
    role:officerRole.value,
    city:cityName.value,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
  }))
  upsertOfficer(candidate)
  officerName.value=''
  return true
}

saveRecord.addEventListener('click',()=>{
  if(!ensureBatchIdentity())return
  pushHistory()
  const type=recordType.value
  const ok=type==='ownership'
    ?saveOwnership()
    :type==='city-state'
      ?saveCityState()
      :saveOfficer()
  if(!ok){
    history.pop()
    return
  }
  render('已記錄 '+type+' 候選；仍為 verified:false。')
})
recordType.addEventListener('change',setEditorVisibility)
cityName.addEventListener('change',loadSelectedCityIntoEditor)
scenarioYear.addEventListener('change',()=>{
  if(ownership.length||cityStates.length||officerAssignments.length){
    scenarioYear.value=String(activeBatchYear())
    render('已有候選時不可直接切換劇本；請先複製並清空批次。')
    return
  }
  render()
})
imageInput.addEventListener('change',()=>{
  const file=imageInput.files?.[0]
  if(!file)return
  if(imageUrl)URL.revokeObjectURL(imageUrl)
  imageUrl=URL.createObjectURL(file)
  referenceImage.src=imageUrl
  referenceImage.hidden=false
  imagePlaceholder.hidden=true
  if(!sourceRef.value.trim())sourceRef.value=file.name
  render('已載入本地參考截圖 '+file.name+'；圖片不會寫入 JSON。')
})
bundleInput.addEventListener('change',async()=>{
  const file=bundleInput.files?.[0]
  if(!file)return
  try{
    const parsed=JSON.parse(await file.text())
    const editable=normalizeScenarioCaptureBundleForEditing(parsed)
    scenarioYear.value=String(editable.scenarioYear)
    sourceId.value=editable.source.id
    sourceRef.value=editable.source.ref
    ownership=editable.ownership.map((item)=>({...item,scenarioYear:editable.scenarioYear}))
    cityStates=editable.cityStates.map((item)=>({...item,scenarioYear:editable.scenarioYear}))
    officerAssignments=editable.officerAssignments.map((item)=>({...item,scenarioYear:editable.scenarioYear}))
    history=[]
    const first=[...ownership,...cityStates,...officerAssignments].find((item)=>item.frameRef)
    if(first)frameRef.value=first.frameRef
    const captured=capturedCitySet(ownership)
    const missing=ZH_ROM_CANONICAL_CITY_SET.find((name)=>!captured.has(name))
    if(missing)cityName.value=missing
    loadSelectedCityIntoEditor()
    render('已載入 '+editable.scenarioYear+' 劇本批次；所有記錄保持 verified:false。')
  }catch(error){
    status.textContent=error instanceof Error?error.message:String(error)
  }finally{
    bundleInput.value=''
  }
})
copyOutput.addEventListener('click',async()=>{
  const text=JSON.stringify(currentBundle(),null,2)
  try{
    await navigator.clipboard.writeText(text)
    status.textContent='Capture Bundle 已複製；仍需 merge / audit / 人工驗證。'
  }catch{
    const range=document.createRange()
    range.selectNodeContents(output)
    const selection=window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    status.textContent='無法直接寫入剪貼簿，已選中 JSON，請手動複製。'
  }
})
undoOutput.addEventListener('click',()=>{
  const previous=history.pop()
  if(!previous)return
  restoreState(previous)
  loadSelectedCityIntoEditor()
  render('已撤銷上一筆候選變更。')
})
clearOutput.addEventListener('click',()=>{
  if(!ownership.length&&!cityStates.length&&!officerAssignments.length)return
  pushHistory()
  ownership=[]
  cityStates=[]
  officerAssignments=[]
  cityName.value=ZH_ROM_CANONICAL_CITY_SET[0]||''
  loadSelectedCityIntoEditor()
  render('候選已清空；可用撤銷恢復。')
})

populateCities()
populateCityStateFields()
cityName.value=ZH_ROM_CANONICAL_CITY_SET[0]||''
setEditorVisibility()
render()
