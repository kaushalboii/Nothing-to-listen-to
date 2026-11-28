/**
 * High-performance, low-storage client-side Audio Cache Manager.
 *
 * Utilizes the browser CacheStorage API ('ntlt-audio-cache-v1') to:
 * 1. Cache pristine audio files on device with zero duplicate network requests.
 * 2. Play songs losslessly even in low-reception or offline areas.
 * 3. Keep storage minimal via LRU (Least Recently Used) automatic eviction (max 30 tracks ~ 100MB).
 */

const CACHE_NAME = 'ntlt-audio-cache-v1'
const MANIFEST_KEY = 'ntlt-audio-manifest-v1'
const MAX_CACHED_TRACKS = 30

interface CachedTrackEntry {
  url: string
  title?: string
  cachedAt: number
  lastAccessed: number
  sizeBytes?: number
}

class AudioCacheManager {
  private activeBlobUrls = new Set<string>()

  private isCacheStorageAvailable(): boolean {
    return (
      typeof window !== 'undefined' &&
      'caches' in window &&
      typeof window.caches?.open === 'function'
    )
  }

  private getManifest(): CachedTrackEntry[] {
    if (typeof localStorage === 'undefined') return []
    try {
      const raw = localStorage.getItem(MANIFEST_KEY)
      return raw ? (JSON.parse(raw) as CachedTrackEntry[]) : []
    } catch {
      return []
    }
  }

  private saveManifest(entries: CachedTrackEntry[]) {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(MANIFEST_KEY, JSON.stringify(entries))
    } catch {
      // Storage quota or disabled localStorage
    }
  }

  /**
   * Checks whether the audio stream for the given URL is already cached locally.
   */
  public async isCached(url: string): Promise<boolean> {
    if (!this.isCacheStorageAvailable() || !url) return false
    try {
      const cache = await caches.open(CACHE_NAME)
      const match = await cache.match(url)
      return Boolean(match)
    } catch {
      return false
    }
  }

  /**
   * Retrieves a high-speed, local Blob URL for a cached audio file.
   * Enables 0ms latency, zero network usage, and full offline playback.
   */
  public async getCachedAudioBlobUrl(url: string): Promise<string | null> {
    if (!this.isCacheStorageAvailable() || !url) return null
    try {
      const cache = await caches.open(CACHE_NAME)
      const response = await cache.match(url)
      if (!response) return null

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      this.activeBlobUrls.add(blobUrl)

      // Update LRU access timestamp
      const manifest = this.getManifest()
      const entry = manifest.find((m) => m.url === url)
      if (entry) {
        entry.lastAccessed = Date.now()
        this.saveManifest(manifest)
      }

      return blobUrl
    } catch {
      return null
    }
  }

  /**
   * Asynchronously streams and caches an audio URL into CacheStorage.
   * Evicts the oldest tracks if exceeding the maximum storage allowance.
   */
  public async cacheAudio(url: string, title?: string): Promise<boolean> {
    if (!this.isCacheStorageAvailable() || !url) return false
    if (url.startsWith('blob:') || url.startsWith('data:')) return false

    try {
      const cache = await caches.open(CACHE_NAME)
      const existing = await cache.match(url)
      if (existing) {
        return true
      }

      // Fetch with timeout to prevent hanging on degraded connections
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)

      const response = await fetch(url, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout))

      if (!response.ok) {
        return false
      }

      // Clone response for caching (CacheStorage requires standard HTTP 200)
      await cache.put(url, response.clone())

      // Update manifest and enforce LRU storage limit
      let manifest = this.getManifest()
      manifest = manifest.filter((m) => m.url !== url)
      manifest.push({
        url,
        title,
        cachedAt: Date.now(),
        lastAccessed: Date.now(),
      })

      // If over limit, evict oldest accessed items to keep device storage minimal
      if (manifest.length > MAX_CACHED_TRACKS) {
        manifest.sort((a, b) => a.lastAccessed - b.lastAccessed)
        const toEvict = manifest.slice(0, manifest.length - MAX_CACHED_TRACKS)
        for (const item of toEvict) {
          try {
            await cache.delete(item.url)
          } catch (_) {}
        }
        manifest = manifest.slice(manifest.length - MAX_CACHED_TRACKS)
      }

      this.saveManifest(manifest)
      return true
    } catch {
      return false
    }
  }

  /**
   * Cleans up allocated object URLs to prevent memory leaks.
   */
  public revokeBlobUrl(blobUrl: string) {
    if (blobUrl && this.activeBlobUrls.has(blobUrl)) {
      try {
        URL.revokeObjectURL(blobUrl)
      } catch (_) {}
      this.activeBlobUrls.delete(blobUrl)
    }
  }

  /**
   * Detects whether user is in Data Saver mode or on a slow cellular connection.
   */
  public isDataSaverActive(): boolean {
    if (typeof navigator === 'undefined') return false
    const nav = navigator as unknown as {
      connection?: {
        saveData?: boolean
        effectiveType?: string
      }
    }
    if (nav.connection?.saveData) return true
    if (
      nav.connection?.effectiveType === '2g' ||
      nav.connection?.effectiveType === 'slow-2g' ||
      nav.connection?.effectiveType === '3g'
    ) {
      return true
    }
    return false
  }

  /**
   * Returns total count of offline cached songs.
   */
  public async getCachedCount(): Promise<number> {
    return this.getManifest().length
  }
}

export const audioCache = new AudioCacheManager()
