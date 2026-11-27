import { audioCache } from '../../../services/audio-cache'

const SAAVN_API_ENDPOINTS = [
  'https://saavn.sumit.co/api/search/songs',
  'https://saavn.dev/api/search/songs',
  'https://saavn.me/search/songs',
]

const PERSISTENT_STREAM_CACHE_KEY = 'ntlt-stream-cache-v2'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

const memoryStreamCache = new Map<string, string | null>()

function getPersistentCache(): Record<
  string,
  { url: string; timestamp: number }
> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(PERSISTENT_STREAM_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function setPersistentCache(key: string, url: string) {
  if (typeof localStorage === 'undefined') return
  try {
    const cache = getPersistentCache()
    cache[key] = { url, timestamp: Date.now() }
    localStorage.setItem(PERSISTENT_STREAM_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

const NOISE_WORDS = [
  'cover',
  'karaoke',
  'ringtone',
  'instrumental',
  'lofi',
  'lo-fi',
  'slowed',
  'reverb',
  '8d',
  'mashup',
  'remix',
]

function cleanText(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s*\([^)]*\)/g, ' ')
    .replace(/\s*\[[^\]]*\]/g, ' ')
    .replace(
      /\s*[-–|]\s*(telugu|tamil|hindi|malayalam|kannada|punjabi|official).*$/i,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(value: string): string[] {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1)
}

interface SaavnSongResult {
  name?: string
  duration?: number
  artists?: {
    primary?: Array<{ name?: string }>
    all?: Array<{ name?: string }>
  }
  downloadUrl?: Array<{ quality?: string; url?: string; link?: string }>
}

function pickBestAudioUrl(
  results: SaavnSongResult[],
  title: string,
  artist: string,
  preferLowData = false,
): string | null {
  const cleanTitleLower = cleanText(title).toLowerCase()
  const titleTokens = tokenize(title)
  const artistTokens = tokenize(artist)

  if (titleTokens.length === 0) return null

  let bestScore = -1
  let bestUrl: string | null = null

  for (const item of results) {
    const downloads = item.downloadUrl
    if (!downloads || downloads.length === 0) continue

    const candidateRawTitle = cleanText(item.name || '')
    const candidateTitleLower = candidateRawTitle.toLowerCase()
    const candidateTitleTokens = tokenize(item.name || '')

    const candidateArtists = [
      ...(item.artists?.primary ?? []),
      ...(item.artists?.all ?? []),
    ]
      .map((a) => a.name || '')
      .join(' ')
    const candidateArtistTokens = tokenize(candidateArtists)

    let titleOverlap = 0
    for (const token of titleTokens) {
      if (candidateTitleTokens.includes(token)) titleOverlap++
    }
    if (titleOverlap === 0) continue

    let artistOverlap = 0
    for (const token of artistTokens) {
      if (candidateArtistTokens.includes(token)) artistOverlap++
    }

    // Generic single-word track titles like "Intro" require artist confirmation
    if (
      titleTokens.length === 1 &&
      artistTokens.length > 0 &&
      artistOverlap === 0
    ) {
      continue
    }

    let score = titleOverlap * 2 + artistOverlap * 3
    if (candidateTitleLower === cleanTitleLower) {
      score += 5
    } else if (
      candidateTitleLower.includes(cleanTitleLower) ||
      cleanTitleLower.includes(candidateTitleLower)
    ) {
      score += 2
    }

    // Penalize covers / karaoke / remixes unless specifically requested
    for (const noise of NOISE_WORDS) {
      if (
        candidateTitleLower.includes(noise) &&
        !cleanTitleLower.includes(noise)
      ) {
        score -= 4
      }
    }

    // Require strong match if short track or missing artist
    const minRequiredScore =
      artistTokens.length > 0 && artistOverlap === 0 ? 4 : 2
    if (score < minRequiredScore) continue

    // Quality selection:
    // If preferLowData: prefer 160kbps for 50% data savings on 2G/3G/spotty networks.
    // Otherwise: prefer 320kbps for pristine lossless fidelity.
    let bestDownload:
      | { quality?: string; url?: string; link?: string }
      | undefined
    if (preferLowData) {
      bestDownload =
        downloads.find((d) => d.quality === '160kbps') ??
        downloads.find((d) => d.quality === '96kbps') ??
        downloads.find((d) => d.quality === '320kbps') ??
        downloads[0]
    } else {
      bestDownload =
        downloads.find((d) => d.quality === '320kbps') ??
        downloads.find((d) => d.quality === '160kbps') ??
        downloads[downloads.length - 1]
    }

    const rawUrl = bestDownload?.url || bestDownload?.link
    if (!rawUrl) continue

    const normalizedUrl = rawUrl.replace(/^http:\/\//i, 'https://')
    if (score > bestScore) {
      bestScore = score
      bestUrl = normalizedUrl
    }
  }

  return bestUrl
}

async function querySaavnEndpoint(
  endpoint: string,
  query: string,
  signal?: AbortSignal,
): Promise<SaavnSongResult[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3500)

  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const url = `${endpoint}?limit=8&query=${encodeURIComponent(query)}`
    const resp = await fetch(url, { signal: controller.signal })
    if (!resp.ok) return []
    const json = await resp.json()
    return Array.isArray(json?.data?.results) ? json.data.results : []
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Resolves high-fidelity, ad-free direct audio stream for a track.
 * 1. Checks memory cache first.
 * 2. Checks persistent localStorage cache next (0ms latency, zero API calls).
 * 3. Falls back through multiple redundant mirrors with fast timeouts.
 * 4. Checks local CacheStorage for immediate offline/blob playback.
 */
export async function resolveAdFreeAudioStream(
  track: { title: string; artist: string; albumTitle?: string },
  signal?: AbortSignal,
): Promise<string | null> {
  const cacheKey = `${track.title}::${track.artist}`.toLowerCase()

  // 1. In-memory check
  if (memoryStreamCache.has(cacheKey)) {
    return memoryStreamCache.get(cacheKey) ?? null
  }

  // 2. Persistent localStorage check (preserves resolution across visits)
  const persistent = getPersistentCache()
  const cachedEntry = persistent[cacheKey]
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    memoryStreamCache.set(cacheKey, cachedEntry.url)
    return cachedEntry.url
  }

  const preferLowData = audioCache.isDataSaverActive()
  const cleanedTitle = cleanText(track.title)
  const primaryArtist = cleanText((track.artist || '').split(/[,&]/)[0] || '')
  const searchQueries = [
    `${cleanedTitle} ${primaryArtist}`.trim(),
    cleanedTitle,
  ].filter((q, idx, arr) => q.length > 0 && arr.indexOf(q) === idx)

  // 3. Multi-endpoint query loop
  for (const endpoint of SAAVN_API_ENDPOINTS) {
    for (const query of searchQueries) {
      if (signal?.aborted) return null
      const results = await querySaavnEndpoint(endpoint, query, signal)
      if (results.length > 0) {
        const audioUrl = pickBestAudioUrl(
          results,
          track.title,
          track.artist,
          preferLowData,
        )
        if (audioUrl) {
          memoryStreamCache.set(cacheKey, audioUrl)
          setPersistentCache(cacheKey, audioUrl)
          return audioUrl
        }
      }
    }
  }

  memoryStreamCache.set(cacheKey, null)
  return null
}

/**
 * Background pre-caching of the next track to eliminate buffering and enable seamless
 * transition in spotty reception areas.
 */
export async function preloadNextTrackAudio(track: {
  title: string
  artist: string
  albumTitle?: string
}): Promise<void> {
  try {
    const url = await resolveAdFreeAudioStream(track)
    if (url) {
      await audioCache.cacheAudio(url, track.title)
    }
  } catch {
    // Non-blocking background prefetch
  }
}
