import { MAP_COORDINATE_SPACES } from './map-evidence.js'

export function captureScale({
  imageWidth,
  imageHeight,
  targetSpace='logical-320x224',
}={}){
  const space=Object.values(MAP_COORDINATE_SPACES).find((item)=>item.id===targetSpace)
  if(!space)throw new Error(`Unknown map coordinate space: ${targetSpace}`)
  if(!Number.isFinite(imageWidth)||imageWidth<=0||!Number.isFinite(imageHeight)||imageHeight<=0){
    throw new RangeError('Capture image dimensions must be positive finite numbers.')
  }
  return Object.freeze({
    targetSpace:space.id,
    scaleX:space.width/imageWidth,
    scaleY:space.height/imageHeight,
  })
}

export function capturePoint({
  imageX,
  imageY,
  imageWidth,
  imageHeight,
  targetSpace='logical-320x224',
}={}){
  if(!Number.isFinite(imageX)||!Number.isFinite(imageY)){
    throw new TypeError('Capture point must contain finite image coordinates.')
  }
  if(imageX<0||imageX>=imageWidth||imageY<0||imageY>=imageHeight){
    throw new RangeError('Capture point lies outside the source image.')
  }
  const scale=captureScale({imageWidth,imageHeight,targetSpace})
  return Object.freeze({
    x:Math.round(imageX*scale.scaleX*100)/100,
    y:Math.round(imageY*scale.scaleY*100)/100,
    space:scale.targetSpace,
  })
}

export function cityEvidenceCandidate({
  name,
  imageX,
  imageY,
  imageWidth,
  imageHeight,
  sourceId,
  frameRef,
  targetSpace='logical-320x224',
}={}){
  const point=capturePoint({imageX,imageY,imageWidth,imageHeight,targetSpace})
  return Object.freeze({
    name:String(name??'').trim(),
    ...point,
    sourceId:String(sourceId??'').trim(),
    frameRef:String(frameRef??'').trim(),
    verified:false,
  })
}

export function villageEvidenceCandidate({
  imageX,
  imageY,
  imageWidth,
  imageHeight,
  sourceId,
  frameRef,
  targetSpace='logical-320x224',
}={}){
  const point=capturePoint({imageX,imageY,imageWidth,imageHeight,targetSpace})
  return Object.freeze({
    ...point,
    sourceId:String(sourceId??'').trim(),
    frameRef:String(frameRef??'').trim(),
    verified:false,
  })
}

export function sourceEvidenceCandidate({
  id,
  kind='direct-capture',
  ref,
  note='',
}={}){
  return Object.freeze({
    id:String(id??'').trim(),
    kind:String(kind??'direct-capture').trim(),
    ref:String(ref??'').trim(),
    note:String(note??'').trim(),
  })
}
