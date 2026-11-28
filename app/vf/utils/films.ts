import type { VoroforceCell } from '../types'

export interface TrackItem {
  number: number
  title: string
  duration: string
  videoId?: string
  audioUrl?: string
}

export type FilmData = Record<string, any>
export type FilmBatch = FilmData[]
export type FilmBatches = Map<number, FilmBatch>

export class Film {
  tmdbId: number
  imdbId?: string
  title: string
  artist: string
  tagline?: string
  overview?: string
  genres?: string[]
  year: number
  rating: number
  popularity: number
  poster: string
  backdrop: string
  tracks: TrackItem[]
  spotifyId?: string
  appleMusicId?: string
  youtubeId?: string
  audioUrl?: string
  language?: string
  era?: string

  constructor(data: FilmData) {
    this.tmdbId = Number(data.id)
    this.imdbId = data.imdb_id ? String(data.imdb_id) : undefined
    this.title = String(data.title)
    this.artist = data.artist ? String(data.artist) : 'Various Artists'
    this.tagline = data.tagline ? String(data.tagline) : undefined
    this.overview = data.overview ? String(data.overview) : undefined
    const rawGenres = data.genres
      ? Array.isArray(data.genres)
        ? data.genres
        : String(data.genres).split(/,\s*/)
      : []
    const lang = data.language ? String(data.language).toLowerCase() : ''
    const uniqueGenres = Array.from(
      new Set(rawGenres.map((g) => String(g).trim()).filter(Boolean)),
    ).filter((g) => g.toLowerCase() !== lang)
    this.genres = uniqueGenres.length > 0 ? uniqueGenres : undefined
    this.year = Number(data.release_year)
    this.rating = Number(data.vote_average) * 10
    this.popularity = Number(data.popularity)
    this.poster = String(data.poster_path)
    this.backdrop = String(data.backdrop_path ?? data.poster_path)
    this.tracks = Array.isArray(data.tracks) ? data.tracks : []
    this.spotifyId = data.spotify_id ? String(data.spotify_id) : undefined
    this.appleMusicId = data.apple_music_id
      ? String(data.apple_music_id)
      : undefined
    this.youtubeId = data.youtube_id ? String(data.youtube_id) : undefined
    this.audioUrl = data.audio_url ? String(data.audio_url) : undefined
    this.language = data.language ? String(data.language) : undefined
    this.era = data.era ? String(data.era) : undefined
  }
}

export const Album = Film
export type AlbumData = FilmData
export type AlbumBatch = FilmBatch
export type AlbumBatches = FilmBatches

const loadCellFilmBatch = async (batchIndex: number) => {
  const rawBase = import.meta.env.BASE_URL || '/'
  const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
  const baseUrl =
    import.meta.env.VITE_MUSIC_INFO_BASE_URL ??
    import.meta.env.VITE_FILM_INFO_BASE_URL ??
    `${normalizedBase}/json`
  const url = `${baseUrl}/${batchIndex}.json?v=${Date.now().toString(36)}`
  try {
    const response = await fetch(url, { cache: 'no-cache' })
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.log('batchIndex', batchIndex)
    console.error('Error loading JSON:', error)
  }
}

export const getCellFilm = async (
  cell: VoroforceCell,
  filmBatches: FilmBatches,
) => {
  if (!cell) return
  // In Nothing to Listen to, all 216 curated songs are stored in batch 0
  const subgrid = 0
  // Primary lookup is cell.id because that is the exact ID sampled by main.frag in uCellIdMapTexture
  const rawId =
    (typeof cell.id === 'number' && !Number.isNaN(cell.id) && cell.id >= 0
      ? cell.id
      : undefined) ??
    (typeof cell.subgridIndex === 'number' &&
    !Number.isNaN(cell.subgridIndex) &&
    cell.subgridIndex >= 0
      ? cell.subgridIndex
      : undefined) ??
    (typeof cell.index === 'number' &&
    !Number.isNaN(cell.index) &&
    cell.index >= 0
      ? cell.index
      : 0)
  let filmBatch = filmBatches.get(subgrid)
  if (!filmBatch || filmBatch.length === 0) {
    filmBatch = await loadCellFilmBatch(subgrid)
    if (filmBatch) {
      filmBatches.set(subgrid, filmBatch)
    }
  }

  const batchLen = filmBatch && filmBatch.length > 0 ? filmBatch.length : 216
  const subgridIndex = Math.abs(rawId) % batchLen

  const record = filmBatch?.[subgridIndex]
  return record ? new Film(record) : undefined
}

export const getCellAlbum = getCellFilm
