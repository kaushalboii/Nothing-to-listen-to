import { useEffect, useMemo, useState } from 'react'
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
import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { Film, VOROFORCE_MODE } from '../../../vf'
import { AlbumCover } from '../film/shared/film-poster'
import { Button } from '../../ui/button'

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
  '🔥 New This Week',
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
    setMode,
    playTrack,
    setReportOpen,
    setReportInitialQuery,
  } = useShallowState((state) => ({
    searchOpen: state.searchOpen,
    setSearchOpen: state.setSearchOpen,
    filmBatches: state.filmBatches,
    setFilm: state.setFilm,
    setMode: state.setMode,
    playTrack: state.playTrack,
    setReportOpen: state.setReportOpen,
    setReportInitialQuery: state.setReportInitialQuery,
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
      const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
      fetch(`${normalizedBase}/json/0.json`)
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
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
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
    if (!localRecords || localRecords.length === 0) return []
    const q = query.trim().toLowerCase()

    return localRecords.filter((rec) => {
      // Language filter
      if (selectedLang !== 'All') {
        const lang = String(rec.language || '').toLowerCase()
        const genres = String(rec.genres || '').toLowerCase()
        if (lang !== selectedLang.toLowerCase() && !genres.includes(selectedLang.toLowerCase())) {
          return false
        }
      }

      // Era filter
      if (selectedEra !== 'All Eras') {
        const year = Number(rec.release_year || 0)
        if (selectedEra === '🔥 New This Week' && !rec.trending && year < 2024) return false
        if ((selectedEra === '2024-2026' || selectedEra === '2024-2025') && year < 2024) return false
        if (selectedEra === '2020s' && (year < 2020 || year > 2023)) return false
        if (selectedEra === '2010s' && (year < 2010 || year > 2019)) return false
        if (selectedEra === '2000s' && (year < 2000 || year > 2009)) return false
        if (selectedEra === '1990s' && (year < 1990 || year > 1999)) return false
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
        ? rec.tracks.map((t: any) => String(t.title || '').toLowerCase()).join(' ')
        : ''

      // Full search corpus for comprehensive discovery
      const combined = `${title} ${artist} ${genres} ${year} ${lang} ${tagline} ${overview} ${tracks}`
      
      // Token-based matching: every keyword entered by the user must match somewhere in the song metadata
      const tokens = q.split(/\s+/).filter(Boolean)
      return tokens.every((token) => combined.includes(token))
    })
  }, [localRecords, query, selectedLang, selectedEra])

  if (!searchOpen) return null

  const handleSelectRecord = (record: any) => {
    const filmObj = new Film(record)
    setFilm(filmObj)
    setMode(VOROFORCE_MODE.select)
    setSearchOpen(false)
  }

  const handlePlayDirect = (e: React.MouseEvent, record: any) => {
    e.stopPropagation()
    const firstTrack = record.tracks?.[0]?.title ?? record.title
    playTrack({
      title: firstTrack,
      artist: record.artist,
      albumTitle: record.title,
      videoId: record.youtube_id,
      query: `${record.artist} ${firstTrack}`,
    })
  }

  return (
    <div
      className='fixed inset-0 z-90 flex items-start justify-center p-4 pt-12 md:pt-20 bg-black/80 backdrop-blur-md animate-in fade-in duration-200'
      onClick={() => setSearchOpen(false)}
    >
      <div
        className='relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className='relative flex items-center border-b border-border/60 px-4 py-3.5'>
          <Search className='size-5 text-muted-foreground shrink-0 mr-3' />
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
            autoFocus
            className='w-full bg-transparent text-base md:text-lg font-medium text-foreground placeholder:text-muted-foreground outline-none'
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className='p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors mr-2 cursor-pointer'
            >
              <X className='size-4' />
            </button>
          )}
          <kbd className='hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground'>
            ESC
          </kbd>
        </div>

        {/* Language Filter Bar */}
        <div className='flex items-center gap-1.5 px-4 py-2 border-b border-border/40 overflow-x-auto scrollbar-none bg-muted/20'>
          <div className='flex items-center gap-1 text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0'>
            <Globe2 className='size-3.5 text-primary' />
            Lang:
          </div>
          {LANGUAGE_FILTERS.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
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
        <div className='flex items-center gap-1.5 px-4 py-2 border-b border-border/40 overflow-x-auto scrollbar-none bg-muted/10'>
          <div className='flex items-center gap-1 text-[0.7rem] font-bold text-muted-foreground uppercase tracking-wider mr-1 shrink-0'>
            <Calendar className='size-3.5 text-amber-500' />
            Era:
          </div>
          {ERA_FILTERS.map((era) => (
            <button
              key={era}
              onClick={() => setSelectedEra(era)}
              className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                selectedEra === era
                  ? 'bg-amber-500 text-black font-bold shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {era}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className='overflow-y-auto p-2 divide-y divide-border/20 flex-1'>
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 px-4 text-center'>
              <Music2 className='size-10 text-muted-foreground/50 mb-3' />
              <p className='font-bold text-foreground text-sm'>No songs found</p>
              <p className='text-xs text-muted-foreground mt-1 max-w-xs'>
                Try adjusting your search query, or requesting this track to be automatically fetched and added.
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setSearchOpen(false)
                  setReportInitialQuery(query)
                  setReportOpen(true)
                }}
                className='mt-4 flex items-center gap-1.5 rounded-full border-primary/50 text-primary hover:bg-primary/10 cursor-pointer shadow-sm'
              >
                <PlusCircle className='size-3.5' />
                <span>Request &quot;{query || 'Missing Song'}&quot; to be auto-added</span>
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
                  className='group flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/70 transition-all cursor-pointer gap-3'
                >
                  <div className='flex items-center gap-3 min-w-0'>
                    {/* Real Album Artwork Thumbnail */}
                    <div className='relative size-12 shrink-0 rounded-lg overflow-hidden shadow-sm bg-neutral-900 border border-border/50'>
                      <AlbumCover film={filmMock} />
                    </div>

                    <div className='min-w-0 flex flex-col'>
                      <div className='flex items-center gap-2'>
                        <p className='truncate font-bold text-sm text-foreground group-hover:text-primary transition-colors'>
                          {record.title}
                        </p>
                        <span className='shrink-0 px-1.5 py-0.2 rounded text-[10px] font-bold bg-primary/10 text-primary'>
                          {record.release_year}
                        </span>
                        {record.language && (
                          <span className='hidden sm:inline-block shrink-0 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-muted text-muted-foreground'>
                            {record.language}
                          </span>
                        )}
                      </div>
                      <p className='truncate text-xs font-medium text-muted-foreground'>
                        {record.artist}
                      </p>
                      <p className='truncate text-[11px] text-muted-foreground/70 hidden sm:block'>
                        {record.genres}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Stream or View */}
                  <div className='flex items-center gap-1.5 shrink-0'>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={(e) => handlePlayDirect(e, record)}
                      className='size-8 rounded-full p-0 bg-red-600/10 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer'
                      title='Stream on YouTube'
                    >
                      <Play className='size-3.5 fill-current' />
                    </Button>

                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => handleSelectRecord(record)}
                      className='hidden sm:inline-flex text-xs h-8 px-2.5 rounded-lg cursor-pointer'
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
        <div className='flex items-center justify-between px-4 py-2.5 border-t border-border/40 text-[11px] text-muted-foreground bg-muted/30'>
          <div className='flex items-center gap-1.5'>
            <Sparkles className='size-3.5 text-primary' />
            <span>Showing {filtered.length} of {localRecords.length} songs</span>
          </div>
          <div className='flex items-center gap-2'>
            <span>Click any song to focus 3D Voronoi sphere</span>
          </div>
        </div>
      </div>
    </div>
  )
}
