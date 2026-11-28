import {
  Calendar,
  Globe2,
  Music2,
  Play,
  PlusCircle,
  Search,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { store, useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { Film, VOROFORCE_MODE, handleModeChange } from '../../../vf'
import { Button } from '../../ui/button'
import { AlbumCover } from '../film/shared/film-poster'

const LANGUAGE_FILTERS = [
  'All',
  'Tamil',
  'Hindi',
  'Telugu',
  'Punjabi',
  'Malayalam',
  'English',
  'K-Pop',
  'Latin',
  'Japanese',
]

const ERA_FILTERS = [
  'All Eras',
  '2024-2026',
  '2020s',
  '2010s',
  '2000s',
  '1990s',
  'Classics',
]

export const MusicSearchModal = () => {
  const {
    searchOpen,
    setSearchOpen,
    filmBatches,
    setFilm,
    playTrack,
    playPlaylist,
    setReportOpen,
    setReportInitialQuery,
    voroforce,
  } = useShallowState((state) => ({
    searchOpen: state.searchOpen,
    setSearchOpen: state.setSearchOpen,
    filmBatches: state.filmBatches,
    setFilm: state.setFilm,
    playTrack: state.playTrack,
    playPlaylist: state.playPlaylist,
    setReportOpen: state.setReportOpen,
    setReportInitialQuery: state.setReportInitialQuery,
    voroforce: state.voroforce,
  }))

  const [query, setQuery] = useState('')
  const [selectedLang, setSelectedLang] = useState('All')
  const [selectedEra, setSelectedEra] = useState('All Eras')
  const [localRecords, setLocalRecords] = useState<any[]>([])

  // Load raw records from filmBatches or /json/0.json
  useEffect(() => {
    const batch = filmBatches.get(0)
    if (batch && batch.length > 0) {
      setLocalRecords(batch)
    } else {
      const rawBase = import.meta.env.BASE_URL || '/'
      const normalizedBase = rawBase.endsWith('/')
        ? rawBase.slice(0, -1)
        : rawBase
      fetch(`${normalizedBase}/json/0.json?v=${Date.now().toString(36)}`, {
        cache: 'no-cache',
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setLocalRecords(data)
          }
        })
        .catch(() => {})
    }
  }, [filmBatches])

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, /)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      } else if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [searchOpen, setSearchOpen])

  // Filter records in real-time across query, language, and era
  const filtered = useMemo(() => {
    if (!searchOpen || !localRecords || localRecords.length === 0) return []
    const q = query.trim().toLowerCase()

    return localRecords.filter((rec) => {
      // Language filter
      if (selectedLang !== 'All') {
        const lang = String(rec.language || '').toLowerCase()
        const genres = String(rec.genres || '').toLowerCase()
        if (
          lang !== selectedLang.toLowerCase() &&
          !genres.includes(selectedLang.toLowerCase())
        ) {
          return false
        }
      }

      // Era filter
      if (selectedEra !== 'All Eras') {
        const year = Number(rec.release_year || 0)
        if (
          (selectedEra === '2024-2026' || selectedEra === '2024-2025') &&
          year < 2024
        )
          return false
        if (selectedEra === '2020s' && (year < 2020 || year > 2023))
          return false
        if (selectedEra === '2010s' && (year < 2010 || year > 2019))
          return false
        if (selectedEra === '2000s' && (year < 2000 || year > 2009))
          return false
        if (selectedEra === '1990s' && (year < 1990 || year > 1999))
          return false
        if (selectedEra === 'Classics' && year >= 1990) return false
      }

      if (!q) return true

      const title = String(rec.title || '').toLowerCase()
      const artist = String(rec.artist || '').toLowerCase()
      const genres = String(rec.genres || '').toLowerCase()
      const year = String(rec.release_year || '')
      const lang = String(rec.language || '').toLowerCase()
      const tagline = String(rec.tagline || '').toLowerCase()
      const overview = String(rec.overview || '').toLowerCase()
      const tracks = Array.isArray(rec.tracks)
        ? rec.tracks
            .map((t: any) => String(t.title || '').toLowerCase())
            .join(' ')
        : ''

      // Full search corpus for comprehensive discovery
      const combined = `${title} ${artist} ${genres} ${year} ${lang} ${tagline} ${overview} ${tracks}`

      // Token-based matching: every keyword entered by the user must match somewhere in the song metadata
      const tokens = q.split(/\s+/).filter(Boolean)
      return tokens.every((token) => combined.includes(token))
    })
  }, [searchOpen, localRecords, query, selectedLang, selectedEra])

  if (!searchOpen) return null

  const handleSelectRecord = (record: any) => {
    // 1. Immediately close search modal
    setSearchOpen(false)

    // 2. Instantiate and set Film
    const filmObj = new Film(record)
    setFilm(filmObj)

    // 3. Immediately update global store state
    store.setState({
      mode: VOROFORCE_MODE.select,
      film: filmObj,
      searchOpen: false,
    })

    // 4. Focus Voronoi cell in 3D
    const cellId = typeof record.id === 'number' ? record.id : Number(record.id)

    if (voroforce?.controls) {
      const controls = voroforce.controls as any
      const cells = controls.cells || (voroforce as any).cells

      // Locate the exact Voronoi cell on the 3D sphere matching this song's ID
      let targetCell: any = null
      if (Array.isArray(cells)) {
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i]
          if (
            c &&
            (c.id === cellId ||
              c.subgridIndex === cellId ||
              (c.subgrid === 0 && c.subgridIndex === cellId) ||
              Number(c.id) === cellId ||
              Number(c.subgridIndex) === cellId)
          ) {
            targetCell = c
            break
          }
        }
      }

      if (targetCell) {
        if (typeof controls.selectCell === 'function') {
          controls.selectCell(targetCell)
        }
        if (typeof controls.pinPointer === 'function') {
          controls.pinPointer(targetCell)
        }
        if (typeof controls.focusCell === 'function') {
          controls.focusCell(targetCell)
        }
      }
    }

    // 5. Trigger full 3D shader, simulation force, and camera focus
    handleModeChange(VOROFORCE_MODE.select)
  }

  const handlePlayDirect = (e: React.MouseEvent, record: any) => {
    e.stopPropagation()
    if (Array.isArray(record.tracks) && record.tracks.length > 0) {
      const tracks = record.tracks.map((t: any) => ({
        title: t.title,
        artist: record.artist,
        albumTitle: record.title,
        cover: record.artwork || record.poster_path,
        videoId: t.videoId || record.youtube_id,
        audioUrl: t.audioUrl || record.audio_url,
        query: `${record.artist} ${t.title}`,
      }))
      playPlaylist(tracks, 0)
    } else {
      const firstTrack = record.tracks?.[0]
      const firstTitle = firstTrack?.title ?? record.title
      playTrack({
        title: firstTitle,
        artist: record.artist,
        albumTitle: record.title,
        cover: record.artwork || record.poster_path,
        videoId: firstTrack?.videoId || record.youtube_id,
        audioUrl: firstTrack?.audioUrl || record.audio_url,
        query: `${record.artist} ${firstTitle}`,
      })
    }
    handleSelectRecord(record)
  }

  return (
    <div
      className='fade-in fixed inset-0 z-90 flex animate-in items-start justify-center bg-black/80 p-4 pt-12 backdrop-blur-md duration-200 md:pt-20'
      onClick={() => setSearchOpen(false)}
    >
      <div
        className='zoom-in-95 relative flex max-h-[85vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl duration-200'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className='relative flex items-center border-border/60 border-b px-4 py-3.5'>
          <Search className='mr-3 size-5 shrink-0 text-muted-foreground' />
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.code === 'Space') {
                e.stopPropagation()
              }
            }}
            placeholder='Search 216+ songs, artists, languages, eras, or genres...'
            className='w-full bg-transparent font-medium text-base text-foreground outline-none placeholder:text-muted-foreground md:text-lg'
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className='mr-2 cursor-pointer rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground'
            >
              <X className='size-4' />
            </button>
          )}
          <kbd className='hidden items-center gap-0.5 rounded border border-border bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-flex'>
            ESC
          </kbd>
        </div>

        {/* Language Filter Bar */}
        <div className='scrollbar-none flex items-center gap-1.5 overflow-x-auto border-border/40 border-b bg-muted/20 px-4 py-2'>
          <div className='mr-1 flex shrink-0 items-center gap-1 font-bold text-[0.7rem] text-muted-foreground uppercase tracking-wider'>
            <Globe2 className='size-3.5 text-primary' />
            Lang:
          </div>
          {LANGUAGE_FILTERS.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={cn(
                'cursor-pointer whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold text-xs transition-all',
                selectedLang === lang
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Era / Decade Filter Bar */}
        <div className='scrollbar-none flex items-center gap-1.5 overflow-x-auto border-border/40 border-b bg-muted/10 px-4 py-2'>
          <div className='mr-1 flex shrink-0 items-center gap-1 font-bold text-[0.7rem] text-muted-foreground uppercase tracking-wider'>
            <Calendar className='size-3.5 text-amber-500' />
            Era:
          </div>
          {ERA_FILTERS.map((era) => (
            <button
              key={era}
              onClick={() => setSelectedEra(era)}
              className={cn(
                'cursor-pointer whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold text-xs transition-all',
                selectedEra === era
                  ? 'bg-amber-500 font-bold text-black shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {era}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className='flex-1 divide-y divide-border/20 overflow-y-auto p-2'>
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center px-4 py-10 text-center'>
              <Music2 className='mb-3 size-10 text-muted-foreground/50' />
              <p className='font-bold text-foreground text-sm'>
                No songs found
              </p>
              <p className='mt-1 max-w-xs text-muted-foreground text-xs'>
                Try adjusting your search query, or requesting this track to be
                automatically fetched and added.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setSearchOpen(false)
                  setReportInitialQuery(query)
                  setReportOpen(true)
                }}
                className='mt-4 flex cursor-pointer items-center gap-1.5 rounded-full border-primary/50 text-primary shadow-sm hover:bg-primary/10'
              >
                <PlusCircle className='size-3.5' />
                <span>
                  Request &quot;{query || 'Missing Song'}&quot; to be auto-added
                </span>
              </Button>
            </div>
          ) : (
            filtered.map((record) => {
              const filmMock = {
                tmdbId: record.id,
                title: record.title,
                poster: record.poster_path || record.artwork,
              }

              return (
                <div
                  key={record.id}
                  onClick={() => handleSelectRecord(record)}
                  className='group flex cursor-pointer items-center justify-between gap-3 rounded-xl p-2.5 transition-all hover:bg-muted/70'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    {/* Real Album Artwork Thumbnail */}
                    <div className='relative size-12 shrink-0 overflow-hidden rounded-lg border border-border/50 bg-neutral-900 shadow-sm'>
                      <AlbumCover film={filmMock} />
                    </div>

                    <div className='flex min-w-0 flex-col'>
                      <div className='flex items-center gap-2'>
                        <p className='truncate font-bold text-foreground text-sm transition-colors group-hover:text-primary'>
                          {record.title}
                        </p>
                        <span className='shrink-0 rounded bg-primary/10 px-1.5 py-0.2 font-bold text-[10px] text-primary'>
                          {record.release_year}
                        </span>
                        {record.language && (
                          <span className='hidden shrink-0 rounded bg-muted px-1.5 py-0.2 font-semibold text-[10px] text-muted-foreground sm:inline-block'>
                            {record.language}
                          </span>
                        )}
                      </div>
                      <p className='truncate font-medium text-muted-foreground text-xs'>
                        {record.artist}
                      </p>
                      <p className='hidden truncate text-[11px] text-muted-foreground/70 sm:block'>
                        {record.genres}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Stream or View */}
                  <div className='flex shrink-0 items-center gap-1.5'>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={(e) => handlePlayDirect(e, record)}
                      className='size-8 cursor-pointer rounded-full bg-red-600/10 p-0 text-red-600 transition-colors hover:bg-red-600 hover:text-white'
                      title='Stream on YouTube'
                    >
                      <Play className='size-3.5 fill-current' />
                    </Button>

                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleSelectRecord(record)}
                      className='hidden h-8 cursor-pointer rounded-lg px-2.5 text-xs sm:inline-flex'
                    >
                      3D Focus
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className='flex items-center justify-between border-border/40 border-t bg-muted/30 px-4 py-2.5 text-[11px] text-muted-foreground'>
          <div className='flex items-center gap-1.5'>
            <Sparkles className='size-3.5 text-primary' />
            <span>
              Showing {filtered.length} of {localRecords.length} songs
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span>Click any song to focus 3D Voronoi sphere</span>
          </div>
        </div>
      </div>
    </div>
  )
}
