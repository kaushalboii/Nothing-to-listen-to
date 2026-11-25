const SAAVN_API_ENDPOINTS = [
  'https://saavn.sumit.co/api/search/songs',
]

const audioStreamCache = new Map<string, string | null>()

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
    .replace(/\s*[-–|]\s*(telugu|tamil|hindi|malayalam|kannada|punjabi|official).*$/i, '')
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
    if (titleTokens.length === 1 && artistTokens.length > 0 && artistOverlap === 0) {
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
    const minRequiredScore = artistTokens.length > 0 && artistOverlap === 0 ? 4 : 2
    if (score < minRequiredScore) continue

    // Pick highest quality audio stream (typically 320kbps or 160kbps .mp4)
    const bestDownload =
      downloads.find((d) => d.quality === '320kbps') ??
      downloads.find((d) => d.quality === '160kbps') ??
      downloads[downloads.length - 1]
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

export async function resolveAdFreeAudioStream(
  track: { title: string; artist: string; albumTitle?: string },
  signal?: AbortSignal,
): Promise<string | null> {
  const cacheKey = `${track.title}::${track.artist}`.toLowerCase()
  if (audioStreamCache.has(cacheKey)) {
    return audioStreamCache.get(cacheKey) ?? null
  }

  const cleanedTitle = cleanText(track.title)
  const primaryArtist = cleanText(
    (track.artist || '').split(/[,&]/)[0] || '',
  )
  const searchQueries = [
    `${cleanedTitle} ${primaryArtist}`.trim(),
    cleanedTitle,
  ].filter((q, idx, arr) => q.length > 0 && arr.indexOf(q) === idx)

  for (const endpoint of SAAVN_API_ENDPOINTS) {
    for (const query of searchQueries) {
      if (signal?.aborted) return null
      const results = await querySaavnEndpoint(endpoint, query, signal)
      if (results.length > 0) {
        const audioUrl = pickBestAudioUrl(results, track.title, track.artist)
        if (audioUrl) {
          audioStreamCache.set(cacheKey, audioUrl)
          return audioUrl
        }
      }
    }
  }

  audioStreamCache.set(cacheKey, null)
  return null
}
