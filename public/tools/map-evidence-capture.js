const gameModuleRoot=location.pathname.includes('/public/tools/')
  ?'../../src/game/'
  :'../src/game/'

const [
  captureModule,
  originalDataModule,
  evidenceModule,
]=await Promise.all([
  import(gameModuleRoot+'map-evidence-capture.js'),
  import(gameModuleRoot+'original-data.js'),
  import(gameModuleRoot+'map-evidence.js'),
])

const {
  cityEvidenceCandidate,
  villageEvidenceCandidate,
}=captureModule
const {
  ZH_ROM_CANONICAL_CITY_SET,
  normalizeZhRomCityName,
}=originalDataModule
const {MAP_COORDINATE_SPACES}=evidenceModule

const imageInput=document.querySelector('#image-input')
const recordType=document.querySelector('#record-type')
const cityNameWrap=document.querySelector('#city-name-wrap')
const cityName=document.querySelector('#city-name')
const autoNextWrap=document.querySelector('#auto-next-wrap')
const autoNext=document.querySelector('#auto-next')
const sourceId=document.querySelector('#source-id')
const frameRef=document.querySelector('#frame-ref')
const targetSpace=document.querySelector('#target-space')
const copyOutput=document.querySelector('#copy-output')
const undoOutput=document.querySelector('#undo-output')
const clearOutput=document.querySelector('#clear-output')
const canvas=document.querySelector('#capture-canvas')
const output=document.querySelector('#output')
const progress=document.querySelector('#capture-progress')
const status=document.querySelector('#status')
const ctx=canvas.getContext('2d')

let image=null
let candidates=[]
let history=[]

function cloneCandidates(){
  return candidates.map((item)=>({...item}))
}

function pushHistory(){
  history.push(cloneCandidates())
  if(history.length>50)history.shift()
}

function cityCandidates(){
  return candidates.filter((item)=>typeof item.name==='string'&&item.name.trim())
}

function villageCandidates(){
  return candidates.filter((item)=>!('name' in item))
}

function capturedCityNames(){
  return new Set(cityCandidates().map((item)=>normalizeZhRomCityName(item.name)))
}

function populateCityOptions(){
  cityName.replaceChildren()
  for(const name of ZH_ROM_CANONICAL_CITY_SET){
    const option=document.createElement('option')
    option.value=name
    option.textContent=name
    cityName.append(option)
  }
  cityName.value=ZH_ROM_CANONICAL_CITY_SET[0]??''
}

function candidateImagePoint(candidate){
  const space=Object.values(MAP_COORDINATE_SPACES).find((item)=>item.id===candidate.space)
  if(!space||!image)return null
  return {
    x:(candidate.x/space.width)*canvas.width,
    y:(candidate.y/space.height)*canvas.height,
  }
}

function drawCandidateMarker(candidate,index){
  if(candidate.sourceId!==sourceId.value.trim()||candidate.frameRef!==frameRef.value.trim())return
  const point=candidateImagePoint(candidate)
  if(!point)return

  const size=Math.max(4,canvas.width/220)
  ctx.save()
  ctx.lineWidth=Math.max(1,canvas.width/900)
  if('name' in candidate){
    ctx.strokeStyle='rgba(62,229,239,.95)'
    ctx.fillStyle='rgba(4,20,22,.72)'
    ctx.beginPath()
    ctx.arc(point.x,point.y,size,0,Math.PI*2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(point.x-size*1.45,point.y)
    ctx.lineTo(point.x+size*1.45,point.y)
    ctx.moveTo(point.x,point.y-size*1.45)
    ctx.lineTo(point.x,point.y+size*1.45)
    ctx.stroke()
  }else{
    ctx.strokeStyle='rgba(239,210,125,.96)'
    ctx.fillStyle='rgba(35,24,9,.7)'
    ctx.strokeRect(point.x-size*.8,point.y-size*.8,size*1.6,size*1.6)
    ctx.fillRect(point.x-size*.36,point.y-size*.36,size*.72,size*.72)
  }
  ctx.font=`${Math.max(10,canvas.width/110)}px ui-monospace,monospace`
  ctx.fillStyle='rgba(255,255,255,.92)'
  ctx.fillText(String(index+1),point.x+size*1.55,point.y-size*.8)
  ctx.restore()
}

function drawCanvas(){
  if(!image)return
  canvas.width=image.naturalWidth
  canvas.height=image.naturalHeight
  ctx.clearRect(0,0,canvas.width,canvas.height)
  ctx.drawImage(image,0,0)
  candidates.forEach(drawCandidateMarker)
}

function selectNextMissingCity(){
  if(!autoNext.checked)return
  const captured=capturedCityNames()
  const start=Math.max(0,ZH_ROM_CANONICAL_CITY_SET.indexOf(cityName.value))
  for(let offset=1;offset<=ZH_ROM_CANONICAL_CITY_SET.length;offset++){
    const name=ZH_ROM_CANONICAL_CITY_SET[(start+offset)%ZH_ROM_CANONICAL_CITY_SET.length]
    if(!captured.has(name)){
      cityName.value=name
      return
    }
  }
}

function renderOutput(message=''){
  output.textContent=JSON.stringify(candidates,null,2)
  const cityCount=capturedCityNames().size
  const villageCount=villageCandidates().length
  progress.textContent=`城市 ${cityCount}/${ZH_ROM_CANONICAL_CITY_SET.length} · 村莊 ${villageCount}`
  undoOutput.disabled=history.length===0
  drawCanvas()
  if(message){
    status.textContent=message
  }else{
    status.textContent=image
      ?`已載入 ${image.naturalWidth}×${image.naturalHeight}；城市 ${cityCount}/${ZH_ROM_CANONICAL_CITY_SET.length}；村莊 ${villageCount}。`
      :'尚未載入截圖。'
  }
}

function updateTypeUi(){
  const cityMode=recordType.value==='city'
  cityNameWrap.hidden=!cityMode
  autoNextWrap.hidden=!cityMode
}

function upsertCity(candidate){
  const identity=normalizeZhRomCityName(candidate.name)
  const index=candidates.findIndex((item)=>
    typeof item.name==='string'&&normalizeZhRomCityName(item.name)===identity
  )
  if(index>=0)candidates[index]=candidate
  else candidates.push(candidate)
}

function addVillage(candidate){
  const duplicate=candidates.some((item)=>
    !('name' in item)&&
    item.space===candidate.space&&
    item.sourceId===candidate.sourceId&&
    item.frameRef===candidate.frameRef&&
    Math.abs(item.x-candidate.x)<.01&&
    Math.abs(item.y-candidate.y)<.01
  )
  if(duplicate)return false
  candidates.push(candidate)
  return true
}

recordType.addEventListener('change',()=>{
  updateTypeUi()
  renderOutput()
})

for(const control of [sourceId,frameRef]){
  control.addEventListener('input',()=>drawCanvas())
}

imageInput.addEventListener('change',()=>{
  const file=imageInput.files?.[0]
  if(!file)return
  const url=URL.createObjectURL(file)
  const next=new Image()
  next.onload=()=>{
    if(image?.src?.startsWith('blob:'))URL.revokeObjectURL(image.src)
    image=next
    renderOutput()
  }
  next.onerror=()=>{
    URL.revokeObjectURL(url)
    status.textContent='截圖載入失敗。'
  }
  next.src=url
})

canvas.addEventListener('click',(event)=>{
  if(!image){
    status.textContent='請先載入原版截圖。'
    return
  }
  const rect=canvas.getBoundingClientRect()
  const rawX=(event.clientX-rect.left)*(canvas.width/rect.width)
  const rawY=(event.clientY-rect.top)*(canvas.height/rect.height)
  const imageX=Math.max(0,Math.min(canvas.width-1e-6,rawX))
  const imageY=Math.max(0,Math.min(canvas.height-1e-6,rawY))
  const common={
    imageX,
    imageY,
    imageWidth:canvas.width,
    imageHeight:canvas.height,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
    targetSpace:targetSpace.value,
  }

  pushHistory()
  if(recordType.value==='city'){
    const candidate=cityEvidenceCandidate({
      ...common,
      name:cityName.value,
    })
    upsertCity(candidate)
    selectNextMissingCity()
    renderOutput(`已記錄城市 ${candidate.name}；候選仍為 verified:false。`)
  }else{
    const candidate=villageEvidenceCandidate(common)
    if(!addVillage(candidate)){
      history.pop()
      renderOutput('同一 frame 的這個村莊座標已存在，未重複加入。')
      return
    }
    renderOutput('已記錄村莊候選；仍需人工驗證完整 coverage。')
  }
})

copyOutput.addEventListener('click',async()=>{
  const text=JSON.stringify(candidates,null,2)
  try{
    await navigator.clipboard.writeText(text)
    status.textContent=`已複製 ${candidates.length} 筆候選 JSON；仍需人工驗證。`
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
  candidates=previous
  renderOutput('已撤銷上一筆候選變更。')
})

clearOutput.addEventListener('click',()=>{
  if(candidates.length===0)return
  pushHistory()
  candidates=[]
  cityName.value=ZH_ROM_CANONICAL_CITY_SET[0]??''
  renderOutput('候選已清空；可以使用撤銷恢復。')
})

populateCityOptions()
updateTypeUi()
renderOutput()
