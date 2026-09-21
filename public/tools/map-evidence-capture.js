const captureModuleUrl=location.pathname.includes('/public/tools/')
  ?'../../src/game/map-evidence-capture.js'
  :'../src/game/map-evidence-capture.js'
const {
  cityEvidenceCandidate,
  villageEvidenceCandidate,
}=await import(captureModuleUrl)

const imageInput=document.querySelector('#image-input')
const recordType=document.querySelector('#record-type')
const cityNameWrap=document.querySelector('#city-name-wrap')
const cityName=document.querySelector('#city-name')
const sourceId=document.querySelector('#source-id')
const frameRef=document.querySelector('#frame-ref')
const targetSpace=document.querySelector('#target-space')
const copyOutput=document.querySelector('#copy-output')
const clearOutput=document.querySelector('#clear-output')
const canvas=document.querySelector('#capture-canvas')
const output=document.querySelector('#output')
const status=document.querySelector('#status')
const ctx=canvas.getContext('2d')

let image=null
let candidates=[]

function renderOutput(){
  output.textContent=JSON.stringify(candidates,null,2)
  status.textContent=image
    ? `已載入 ${image.naturalWidth}×${image.naturalHeight}；候選 ${candidates.length} 筆。`
    :'尚未載入截圖。'
}

function drawImage(){
  if(!image)return
  canvas.width=image.naturalWidth
  canvas.height=image.naturalHeight
  ctx.clearRect(0,0,canvas.width,canvas.height)
  ctx.drawImage(image,0,0)
}

function updateTypeUi(){
  cityNameWrap.hidden=recordType.value!=='city'
}

recordType.addEventListener('change',updateTypeUi)

imageInput.addEventListener('change',()=>{
  const file=imageInput.files?.[0]
  if(!file)return
  const url=URL.createObjectURL(file)
  const next=new Image()
  next.onload=()=>{
    if(image?.src?.startsWith('blob:'))URL.revokeObjectURL(image.src)
    image=next
    drawImage()
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
  const imageX=(event.clientX-rect.left)*(canvas.width/rect.width)
  const imageY=(event.clientY-rect.top)*(canvas.height/rect.height)
  const common={
    imageX,
    imageY,
    imageWidth:canvas.width,
    imageHeight:canvas.height,
    sourceId:sourceId.value,
    frameRef:frameRef.value,
    targetSpace:targetSpace.value,
  }

  if(recordType.value==='city'){
    if(!cityName.value.trim()){
      status.textContent='城市候選需要先填寫城市名。'
      cityName.focus()
      return
    }
    candidates.push(cityEvidenceCandidate({
      ...common,
      name:cityName.value,
    }))
  }else{
    candidates.push(villageEvidenceCandidate(common))
  }
  renderOutput()
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

clearOutput.addEventListener('click',()=>{
  candidates=[]
  renderOutput()
})

updateTypeUi()
renderOutput()
