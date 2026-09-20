import { assetSharpnessReport, isAssetSharpEnough } from './asset-quality.js'

const DEFAULT_MANIFEST_URL = './assets/manifests/asset-manifest.v1.json'

export function manifestEntry(manifest, key) {
  if (!manifest || !key) return null
  return key.split('.').reduce((value, part) => value?.[part], manifest) ?? null
}

export function readyAssetEntries(manifest) {
  const entries = []
  const visit = (value, prefix = '') => {
    if (!value || typeof value !== 'object') return
    if (typeof value.src === 'string') {
      if (value.status === 'ready') entries.push([prefix, value])
      return
    }
    for (const [key, child] of Object.entries(value)) {
      if (key === 'policy' || key === 'version') continue
      visit(child, prefix ? `${prefix}.${key}` : key)
    }
  }
  visit(manifest)
  return entries
}

export function assetUrl(src) {
  if (!src) return null
  if (/^(?:https?:|data:|blob:)/.test(src)) return src
  if (src.startsWith('./') || src.startsWith('../') || src.startsWith('/')) return src
  return `./${src}`
}

export class AssetRegistry {
  constructor({
    fetchFn = globalThis.fetch?.bind(globalThis),
    imageFactory = typeof globalThis.Image === 'function' ? () => new globalThis.Image() : null,
    manifestUrl = DEFAULT_MANIFEST_URL,
  } = {}) {
    this.fetchFn = fetchFn
    this.imageFactory = imageFactory
    this.manifestUrl = manifestUrl
    this.manifest = null
    this.images = new Map()
    this.failures = new Map()
    this.loaded = false
    this.error = null
  }

  async loadManifest() {
    if (!this.fetchFn) throw new Error('Asset manifest fetch is unavailable')
    const response = await this.fetchFn(this.manifestUrl)
    if (!response?.ok) throw new Error(`Asset manifest request failed: ${response?.status ?? 'unknown'}`)
    this.manifest = await response.json()
    return this.manifest
  }

  async loadImage(key, entry) {
    if (!this.imageFactory || !entry?.src) return false
    const image = this.imageFactory()
    const src = assetUrl(entry.src)
    const loaded = await new Promise((resolve) => {
      image.onload = () => resolve(true)
      image.onerror = () => resolve(false)
      image.src = src
    })
    if (loaded) {
      this.images.set(key, image)
      this.failures.delete(key)
      return true
    }
    this.failures.set(key, src)
    return false
  }

  async preloadReady() {
    if (!this.manifest) await this.loadManifest()
    const entries = readyAssetEntries(this.manifest)
    await Promise.all(entries.map(([key, entry]) => this.loadImage(key, entry)))
    return this.images.size
  }

  async load() {
    try {
      await this.loadManifest()
      await this.preloadReady()
      this.loaded = true
    } catch (error) {
      this.error = error instanceof Error ? error : new Error(String(error))
      this.loaded = false
    }
    return this
  }

  entry(key) {
    return manifestEntry(this.manifest, key)
  }

  get(key) {
    return this.images.get(key) ?? null
  }

  has(key) {
    return this.images.has(key)
  }

  isPlanned(key) {
    return this.entry(key)?.status === 'planned'
  }

  sharpness(key, logicalWidth, logicalHeight) {
    return assetSharpnessReport(this.get(key), logicalWidth, logicalHeight)
  }

  isSharpEnough(key, logicalWidth, logicalHeight) {
    return isAssetSharpEnough(this.get(key), logicalWidth, logicalHeight)
  }
}

export const ASSET_MANIFEST_URL = DEFAULT_MANIFEST_URL
