export const HD_RASTER_MIN_SCALE = 5

export function assetPixelSize(image) {
  return {
    width: Number(image?.naturalWidth ?? image?.width ?? 0) || 0,
    height: Number(image?.naturalHeight ?? image?.height ?? 0) || 0,
  }
}

export function requiredRasterPixels(logicalWidth, logicalHeight, scale = HD_RASTER_MIN_SCALE) {
  const w = Math.max(0, Number(logicalWidth) || 0)
  const h = Math.max(0, Number(logicalHeight) || 0)
  const s = Math.max(1, Number(scale) || HD_RASTER_MIN_SCALE)
  return {
    width: Math.ceil(w * s),
    height: Math.ceil(h * s),
  }
}

export function assetSharpnessReport(image, logicalWidth, logicalHeight, scale = HD_RASTER_MIN_SCALE) {
  const actual = assetPixelSize(image)
  const required = requiredRasterPixels(logicalWidth, logicalHeight, scale)
  const widthRatio = required.width ? actual.width / required.width : 0
  const heightRatio = required.height ? actual.height / required.height : 0
  return Object.freeze({
    ok: actual.width >= required.width && actual.height >= required.height,
    actual,
    required,
    limitingRatio: Math.min(widthRatio, heightRatio),
  })
}

export function isAssetSharpEnough(image, logicalWidth, logicalHeight, scale = HD_RASTER_MIN_SCALE) {
  return assetSharpnessReport(image, logicalWidth, logicalHeight, scale).ok
}


export function nineSliceSharpnessReport(
  image,
  {
    sourceSlice=32,
    destEdge=6,
    scale=HD_RASTER_MIN_SCALE,
  }={},
) {
  const actual=assetPixelSize(image)
  const source=Math.max(1,Number(sourceSlice)||32)
  const edge=Math.max(0,Number(destEdge)||6)
  const requiredEdge=Math.ceil(edge*Math.max(1,Number(scale)||HD_RASTER_MIN_SCALE))
  const enoughSourcePixels=source>=requiredEdge
  const enoughImageBounds=actual.width>=source*3&&actual.height>=source*3
  return Object.freeze({
    ok:enoughSourcePixels&&enoughImageBounds,
    actual,
    sourceSlice:source,
    destEdge:edge,
    requiredEdgePixels:requiredEdge,
    enoughSourcePixels,
    enoughImageBounds,
  })
}

export function isNineSliceSharpEnough(image, options) {
  return nineSliceSharpnessReport(image,options).ok
}
