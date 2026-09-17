const MOUNTAIN_VARIANTS = Object.freeze([
  Object.freeze({ width:30, height:34, offsetY:-2, alpha:.98, mirror:false }),
  Object.freeze({ width:34, height:38, offsetY:-3, alpha:.97, mirror:true }),
  Object.freeze({ width:28, height:32, offsetY:-1, alpha:.95, mirror:true }),
  Object.freeze({ width:32, height:36, offsetY:-2, alpha:.96, mirror:false }),
  Object.freeze({ width:31, height:35, offsetY:-2, alpha:.97, mirror:true }),
])

export function mountainStampStyle(index, hasMountainB = false) {
  const safeIndex = Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0
  const variant = MOUNTAIN_VARIANTS[safeIndex % MOUNTAIN_VARIANTS.length]
  const preferB = safeIndex % 2 === 1
  return {
    assetKey: preferB && hasMountainB ? 'map.terrain.mountainB' : 'map.terrain.mountainA',
    width: variant.width,
    height: variant.height,
    offsetY: variant.offsetY,
    alpha: variant.alpha,
    // Until mountainB exists, mirroring alternate A stamps prevents a visibly repeated silhouette.
    // Once B is available, retain only the gentler per-variant mirror pattern.
    mirror: !hasMountainB && preferB ? true : variant.mirror,
  }
}
