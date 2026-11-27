import { battleMovementCandidate } from '../../src/game/battle-observation.js'
const el=id=>document.getElementById(id)
const video=el('video')
const status=el('status'),output=el('output'),download=el('download')
let videoUrl=null,videoName='',candidate=null
const panes=[]
function invalidate(){candidate=null;output.textContent='';download.disabled=true}
function render(pane){
  const {canvas,bitmap,points,prompt}=pane
  if(!bitmap){canvas.hidden=true;prompt.textContent='請載入原版畫面。';return}
  canvas.hidden=false
  const ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,canvas.width,canvas.height)
  ctx.drawImage(bitmap,0,0)
  points.forEach((p,i)=>{
    ctx.strokeStyle=['#00ffff','#ffff00','#ff5577'][i]
    ctx.lineWidth=Math.max(1,canvas.width/320)
    ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,canvas.width/160),0,Math.PI*2);ctx.stroke()
  })
  prompt.textContent=['點選固定地標 A','點選相同固定地標 B','點選同一部隊旗標','三點已記錄，可撤銷修正'][points.length]
}
function clearPane(pane){
  pane.bitmap?.close?.();pane.bitmap=null;pane.points=[];pane.mediaSeconds=null;pane.recordingId=null
  pane.ref.value='';pane.day.value='';pane.generation++
  render(pane);invalidate()
}
function setFrame(pane,bitmap,frameRef,mediaSeconds=null,recordingId=null){
  pane.bitmap?.close?.();pane.bitmap=bitmap;pane.points=[]
  pane.mediaSeconds=mediaSeconds;pane.recordingId=recordingId
  pane.canvas.width=bitmap.width;pane.canvas.height=bitmap.height
  pane.ref.value=frameRef;pane.day.value=''
  render(pane);invalidate()
}
for(const id of ['before','after']){
  const root=el(id),get=key=>root.querySelector('[data-'+key+']')
  const pane={canvas:get('canvas'),ref:get('ref'),day:get('day'),prompt:get('prompt'),
    bitmap:null,points:[],mediaSeconds:null,recordingId:null,generation:0}
  panes.push(pane)
  get('image').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return
    clearPane(pane);const generation=pane.generation
    try{
      const bitmap=await createImageBitmap(file)
      if(generation!==pane.generation){bitmap.close();return}
      setFrame(pane,bitmap,file.name)
    }catch(error){status.textContent=error.message}
  })
  get('freeze').addEventListener('click',()=>{
    if(video.readyState<2||video.seeking||!video.videoWidth){status.textContent='請先載入並定位錄影。';return}
    pane.generation++
    video.pause()
    const bitmap=document.createElement('canvas')
    bitmap.width=video.videoWidth;bitmap.height=video.videoHeight
    bitmap.getContext('2d').drawImage(video,0,0)
    const seconds=video.currentTime
    setFrame(pane,bitmap,videoName+'#t='+seconds.toFixed(6),seconds,videoUrl)
  })
  pane.canvas.addEventListener('click',event=>{
    if(!pane.bitmap||pane.points.length>=3)return
    const rect=pane.canvas.getBoundingClientRect()
    const x=Math.min(pane.canvas.width-1,Math.max(0,Math.floor((event.clientX-rect.left)*pane.canvas.width/rect.width)))
    const y=Math.min(pane.canvas.height-1,Math.max(0,Math.floor((event.clientY-rect.top)*pane.canvas.height/rect.height)))
    pane.points.push({x,y});render(pane);invalidate()
  })
  get('undo').addEventListener('click',()=>{pane.points.pop();render(pane);invalidate()})
  pane.ref.addEventListener('input',invalidate);pane.day.addEventListener('input',invalidate)
}
el('video-file').addEventListener('change',event=>{
  const file=event.target.files[0];if(!file)return
  panes.forEach(clearPane)
  if(videoUrl)URL.revokeObjectURL(videoUrl)
  videoUrl=URL.createObjectURL(file);videoName=file.name
  video.src=videoUrl;video.hidden=false
})
for(const id of ['source-id','source-ref','battle-ref','unit-ref','kind','speed'])el(id).addEventListener('input',invalidate)
const record=pane=>{
  if(!pane.bitmap||pane.points.length!==3)throw new Error('每幀必須記錄三個點。')
  return {frameRef:pane.ref.value,width:pane.canvas.width,height:pane.canvas.height,
    mediaSeconds:pane.mediaSeconds,battleDay:pane.day.value===''?null:Number(pane.day.value),
    anchors:pane.points.slice(0,2),marker:pane.points[2]}
}
el('generate').addEventListener('click',()=>{
  invalidate()
  try{
    if(panes[0].recordingId!==panes[1].recordingId)throw new Error('錄影幀必須來自同一個已載入的錄影；不要混用截圖。')
    candidate=battleMovementCandidate({
      sourceId:el('source-id').value,sourceRef:el('source-ref').value,
      battleRef:el('battle-ref').value,unitRef:el('unit-ref').value,
      kind:el('kind').value,speed:el('speed').value,
      before:record(panes[0]),after:record(panes[1]),
    })
    output.textContent=JSON.stringify(candidate,null,2)
    download.disabled=false
    status.textContent='已產生未驗證候選；相對位移 '+candidate.relativeDelta.x+', '+candidate.relativeDelta.y+' 原始像素。'
  }catch(error){status.textContent=error.message}
})
download.addEventListener('click',()=>{
  if(!candidate)return
  const url=URL.createObjectURL(new Blob([JSON.stringify(candidate,null,2)+'\n'],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='battle-movement-candidate.json';a.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
})
