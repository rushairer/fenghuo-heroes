const gameModuleRoot=location.pathname.includes('/public/tools/')
  ?'../../src/game/'
  :'../src/game/'

const captureModule=await import(gameModuleRoot+'march-evidence-capture.js')
const {
  marchAdjacencyCandidate,
  marchCaptureBundle,
  marchMonthlyExecutionCandidate,
  marchMovementWindowCandidate,
  marchRouteStepCandidate,
  marchStarvationCandidate,
  normalizeMarchCaptureBundleForEditing,
}=captureModule

const mediaInput=document.querySelector('#media-input')
const bundleInput=document.querySelector('#bundle-input')
const sourceId=document.querySelector('#source-id')
const sourceRef=document.querySelector('#source-ref')
const frameRef=document.querySelector('#frame-ref')
const useTime=document.querySelector('#use-time')
const recordType=document.querySelector('#record-type')
const saveRecord=document.querySelector('#save-record')
const copyOutput=document.querySelector('#copy-output')
const undoOutput=document.querySelector('#undo-output')
const clearOutput=document.querySelector('#clear-output')
const referenceVideo=document.querySelector('#reference-video')
const referenceImage=document.querySelector('#reference-image')
const mediaPlaceholder=document.querySelector('#media-placeholder')
const output=document.querySelector('#output')
const progress=document.querySelector('#capture-progress')
const status=document.querySelector('#status')

const editors={
  'route-step':document.querySelector('#route-step-editor'),
  'movement-window':document.querySelector('#movement-window-editor'),
  'month-window':document.querySelector('#month-window-editor'),
  adjacency:document.querySelector('#adjacency-editor'),
  starvation:document.querySelector('#starvation-editor'),
}

const fields={
  routeFromX:document.querySelector('#route-from-x'),
  routeFromY:document.querySelector('#route-from-y'),
  routeToX:document.querySelector('#route-to-x'),
  routeToY:document.querySelector('#route-to-y'),
  routeSpace:document.querySelector('#route-space'),
  movementSteps:document.querySelector('#movement-steps'),
  movementDays:document.querySelector('#movement-days'),
  monthDays:document.querySelector('#month-days'),
  monthSteps:document.querySelector('#month-steps'),
  monthContinued:document.querySelector('#month-continued'),
  adjacencyTarget:document.querySelector('#adjacency-target'),
  adjacencyDistance:document.querySelector('#adjacency-distance'),
  adjacencyAvailable:document.querySelector('#adjacency-available'),
  starvationDays:document.querySelector('#starvation-days'),
  troopsBefore:document.querySelector('#troops-before'),
  troopsAfter:document.querySelector('#troops-after'),
  hpBefore:document.querySelector('#hp-before'),
  hpAfter:document.querySelector('#hp-after'),
}

let routeSteps=[]
let movementWindows=[]
let monthlyExecutionWindows=[]
let adjacencyChecks=[]
let starvationObservations=[]
let history=[]
let mediaUrl=null

function cloneState(){
  return {
    routeSteps:routeSteps.map((item)=>({...item})),
    movementWindows:movementWindows.map((item)=>({...item})),
    monthlyExecutionWindows:monthlyExecutionWindows.map((item)=>({...item})),
    adjacencyChecks:adjacencyChecks.map((item)=>({...item})),
    starvationObservations:starvationObservations.map((item)=>({...item})),
  }
}
function restoreState(snapshot){
  routeSteps=snapshot.routeSteps
  movementWindows=snapshot.movementWindows
  monthlyExecutionWindows=snapshot.monthlyExecutionWindows
  adjacencyChecks=snapshot.adjacencyChecks
  starvationObservations=snapshot.starvationObservations
}
function pushHistory(){
  history.push(cloneState())
  if(history.length>80)history.shift()
}
function allRecords(){
  return [
    ...routeSteps,
    ...movementWindows,
    ...monthlyExecutionWindows,
    ...adjacencyChecks,
    ...starvationObservations,
  ]
}
function activeBatchSourceId(){
  return allRecords()[0]?.sourceId||null
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
    status.textContent='目前批次使用 '+existing+'；請先複製/清空後再切換 Source ID。'
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
function currentBundle(){
  return marchCaptureBundle({
    source:{
      id:activeBatchSourceId()||sourceId.value.trim(),
      kind:'direct-capture',
      ref:sourceRef.value.trim(),
      note:'Chinese-ROM march capture workbench batch',
    },
    routeSteps,
    movementWindows,
    monthlyExecutionWindows,
    adjacencyChecks,
    starvationObservations,
  })
}
function render(message=''){
  output.textContent=JSON.stringify(currentBundle(),null,2)
  progress.textContent=
    '格步 '+routeSteps.length+
    ' · 日數 '+movementWindows.length+
    ' · 月窗 '+monthlyExecutionWindows.length+
    ' · 鄰接 '+adjacencyChecks.length+
    ' · 缺糧 '+starvationObservations.length
  undoOutput.disabled=history.length===0
  status.textContent=message||'候選仍為 verified:false；需 audit 與人工復核。'
}
function updateEditor(){
  const type=recordType.value
  for(const [id,element] of Object.entries(editors))element.hidden=id!==type
}
function upsertByFrame(list,candidate){
  const index=list.findIndex((item)=>item.frameRef===candidate.frameRef)
  if(index>=0)list[index]=candidate
  else list.push(candidate)
}
function requiredNumber(input,label){
  if(input.value.trim()===''){
    status.textContent=label+' 不可為空。'
    input.focus()
    return null
  }
  const value=Number(input.value)
  if(!Number.isFinite(value)){
    status.textContent=label+' 不是有效數值。'
    input.focus()
    return null
  }
  return value
}
function requiredInteger(input,label){
  const value=requiredNumber(input,label)
  if(value==null)return null
  if(!Number.isInteger(value)){
    status.textContent=label+' 必須是整數。'
    input.focus()
    return null
  }
  return value
}
function saveRouteStep(){
  const fromX=requiredNumber(fields.routeFromX,'From X')
  const fromY=requiredNumber(fields.routeFromY,'From Y')
  const toX=requiredNumber(fields.routeToX,'To X')
  const toY=requiredNumber(fields.routeToY,'To Y')
  if([fromX,fromY,toX,toY].some((value)=>value==null))return false
  upsertByFrame(routeSteps,marchRouteStepCandidate({
    fromX,fromY,toX,toY,space:fields.routeSpace.value,
    sourceId:sourceId.value,frameRef:frameRef.value,
  }))
  return true
}
function saveMovementWindow(){
  const stepsMoved=requiredInteger(fields.movementSteps,'移動格數')
  const calendarDaysElapsed=requiredInteger(fields.movementDays,'經過日數')
  if(stepsMoved==null||calendarDaysElapsed==null)return false
  upsertByFrame(movementWindows,marchMovementWindowCandidate({
    stepsMoved,calendarDaysElapsed,sourceId:sourceId.value,frameRef:frameRef.value,
  }))
  return true
}
function saveMonthWindow(){
  const calendarDaysAdvanced=requiredInteger(fields.monthDays,'日曆推進日數')
  const routeStepsMoved=requiredInteger(fields.monthSteps,'實際移動格數')
  if(calendarDaysAdvanced==null||routeStepsMoved==null)return false
  upsertByFrame(monthlyExecutionWindows,marchMonthlyExecutionCandidate({
    calendarDaysAdvanced,
    routeStepsMoved,
    routeContinuedNextMonth:fields.monthContinued.checked,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
  }))
  return true
}
function saveAdjacency(){
  const gridDistance=requiredInteger(fields.adjacencyDistance,'格距')
  if(gridDistance==null)return false
  upsertByFrame(adjacencyChecks,marchAdjacencyCandidate({
    targetKind:fields.adjacencyTarget.value,
    gridDistance,
    commandAvailable:fields.adjacencyAvailable.checked,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
  }))
  return true
}
function saveStarvation(){
  const daysStarved=requiredInteger(fields.starvationDays,'缺糧日數')
  const troopsBefore=requiredInteger(fields.troopsBefore,'兵力 Before')
  const troopsAfter=requiredInteger(fields.troopsAfter,'兵力 After')
  if(daysStarved==null||troopsBefore==null||troopsAfter==null)return false
  upsertByFrame(starvationObservations,marchStarvationCandidate({
    daysStarved,
    troopsBefore,
    troopsAfter,
    officerHpBefore:fields.hpBefore.value,
    officerHpAfter:fields.hpAfter.value,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
  }))
  return true
}

saveRecord.addEventListener('click',()=>{
  if(!ensureBatchIdentity())return
  pushHistory()
  const type=recordType.value
  const ok=type==='route-step'
    ?saveRouteStep()
    :type==='movement-window'
      ?saveMovementWindow()
      :type==='month-window'
        ?saveMonthWindow()
        :type==='adjacency'
          ?saveAdjacency()
          :saveStarvation()
  if(!ok){
    history.pop()
    return
  }
  render('已記錄 '+type+' 候選；仍為 verified:false。')
})
recordType.addEventListener('change',updateEditor)

mediaInput.addEventListener('change',()=>{
  const file=mediaInput.files?.[0]
  if(!file)return
  if(mediaUrl)URL.revokeObjectURL(mediaUrl)
  mediaUrl=URL.createObjectURL(file)
  if(!sourceRef.value.trim())sourceRef.value=file.name
  const video=file.type.startsWith('video/')
  referenceVideo.hidden=!video
  referenceImage.hidden=video
  mediaPlaceholder.hidden=true
  if(video){
    referenceVideo.src=mediaUrl
    referenceImage.removeAttribute('src')
  }else{
    referenceImage.src=mediaUrl
    referenceVideo.removeAttribute('src')
  }
  render('已載入本地參考媒體 '+file.name+'；媒體不會寫入 JSON。')
})

useTime.addEventListener('click',()=>{
  if(referenceVideo.hidden||!Number.isFinite(referenceVideo.currentTime)){
    status.textContent='目前沒有可用的影片時間；截圖請手動填寫 Frame Ref。'
    return
  }
  const id=sourceId.value.trim()||'march-capture'
  frameRef.value=id+'#t='+referenceVideo.currentTime.toFixed(3)+'s'
  render('Frame Ref 已更新為目前影片時間。')
})

bundleInput.addEventListener('change',async()=>{
  const file=bundleInput.files?.[0]
  if(!file)return
  try{
    const parsed=JSON.parse(await file.text())
    const editable=normalizeMarchCaptureBundleForEditing(parsed)
    sourceId.value=editable.source.id
    sourceRef.value=editable.source.ref
    routeSteps=editable.routeSteps.map((item)=>({...item}))
    movementWindows=editable.movementWindows.map((item)=>({...item}))
    monthlyExecutionWindows=editable.monthlyExecutionWindows.map((item)=>({...item}))
    adjacencyChecks=editable.adjacencyChecks.map((item)=>({...item}))
    starvationObservations=editable.starvationObservations.map((item)=>({...item}))
    history=[]
    const first=allRecords().find((item)=>item.frameRef)
    if(first)frameRef.value=first.frameRef
    render('已載入觀測批次；所有記錄保持 verified:false。')
  }catch(error){
    status.textContent=error instanceof Error?error.message:String(error)
  }finally{
    bundleInput.value=''
  }
})

copyOutput.addEventListener('click',async()=>{
  if(!ensureBatchIdentity())return
  const text=JSON.stringify(currentBundle(),null,2)
  try{
    await navigator.clipboard.writeText(text)
    status.textContent='Capture Bundle 已複製；仍需 march:evidence:audit 與人工驗證。'
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
  render('已撤銷上一筆觀測變更。')
})
clearOutput.addEventListener('click',()=>{
  if(!allRecords().length)return
  pushHistory()
  routeSteps=[]
  movementWindows=[]
  monthlyExecutionWindows=[]
  adjacencyChecks=[]
  starvationObservations=[]
  render('候選已清空；可用撤銷恢復。')
})

updateEditor()
render()
