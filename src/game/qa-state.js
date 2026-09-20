export const VISUAL_QA_STATES = Object.freeze([
  'title-menu',
  'country-overview',
  'full-map',
  'officer-status',
])

export function applyVisualQaState(app, qaState) {
  if (!VISUAL_QA_STATES.includes(qaState)) return false
  const scene=app?.scene
  if (!scene) return false

  if (qaState==='title-menu') {
    if (!('phase' in scene)) return false
    scene.phase='menu'
    scene.selection=0
    return true
  }

  if (!app?.store?.hasGame?.()) return false
  if (!('view' in scene) || !('infoTab' in scene)) return false
  scene.view='info'
  scene.infoReturnView='map'
  scene.infoCommandBrowse=false
  scene.infoTab=qaState==='country-overview'?0:qaState==='full-map'?1:2
  return true
}
