import { useEffect, useMemo, useState } from 'react'
import {
  Music2,
  Play,
  Search,
  X,
} from 'lucide-react'
import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { Film, VOROFORCE_MODE } from '../../../vf'
import { AlbumCover } from '../film/shared/film-poster'
import { Button } from '../../ui/button'

const GENRE_SHORTCUTS = [
  'All',
  'Rock',
  'Pop',
  'Hip-Hop',
  'R&B',
  'Electronic',
  'Holiday',
  'New Age',
  'K-Pop',
]

export const MusicSearchModal = () => {
  const { searchOpen, setSearchOpen, filmBatches, setFilm, setMode, playTrack } =
    useShallowState((state) => ({
      searchOpen: state.searchOpen,
      setSearchOpen: state.setSearchOpen,
      filmBatches: state.filmBatches,
      setFilm: state.setFilm,
      setMode: state.setMode,
      playTrack: state.playTrack,
    }))

  const [query, setQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('All')
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

  // Filter records in real-time
  const filtered = useMemo(() => {
    if (!localRecords || localRecords.length === 0) return []
    const q = query.trim().toLowerCase()

    return localRecords.filter((rec) => {
      // Genre filter
      if (selectedGenre !== 'All') {
        const genres = String(rec.genres || '').toLowerCase()
        if (!genres.includes(selectedGenre.toLowerCase())) {
          return false
        }
      }

      if (!q) return true

      const title = String(rec.title || '').toLowerCase()
      const artist = String(rec.artist || '').toLowerCase()
      const genres = String(rec.genres || '').toLowerCase()
      const tracks = Array.isArray(rec.tracks)
        ? rec.tracks.map((t: any) => String(t.title || '').toLowerCase()).join(' ')
        : ''

      return (
        title.includes(q) ||
        artist.includes(q) ||
        genres.includes(q) ||
        tracks.includes(q)
      )
    })
  }, [localRecords, query, selectedGenre])

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
      className='fixed inset-0 z-90 flex items-start justify-center p-4 pt-16 md:pt-24 bg-black/75 backdrop-blur-md animate-in fade-in duration-200'
      onClick={() => setSearchOpen(false)}
    >
      <div
        className='relative w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className='relative flex items-center border-b border-border/60 px-4 py-3.5'>
          <Search className='size-5 text-muted-foreground shrink-0 mr-3' />
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search 200+ songs, artists, albums, or genres...'
            autoFocus
            className='w-full bg-transparent text-base md:text-lg font-medium text-foreground placeholder:text-muted-foreground outline-none'
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className='p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors mr-2'
            >
              <X className='size-4' />
            </button>
          )}
          <kbd className='hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-2 py-0.5 text-[10px] font-mono text-muted-foreground'>
            ESC
          </kbd>
        </div>

        {/* Quick Genre Filter Pills */}
        <div className='flex items-center gap-1.5 px-4 py-2.5 border-b border-border/40 overflow-x-auto scrollbar-none'>
          {GENRE_SHORTCUTS.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer',
                selectedGenre === g
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className='overflow-y-auto p-2 divide-y divide-border/20 flex-1'>
          {filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
              <Music2 className='size-10 text-muted-foreground/50 mb-3' />
              <p className='font-bold text-foreground text-sm'>No songs found</p>
              <p className='text-xs text-muted-foreground mt-1 max-w-xs'>
                Try searching for popular artists like "Eminem", "Pink Floyd", "Michael Bublé", or genres like "Rock" or "Pop".
              </p>
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
                  className='group flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/80 cursor-pointer transition-all duration-150'
                >
                  <div className='flex items-center gap-3.5 min-w-0 pr-2'>
                    {/* Real Album Cover Thumbnail */}
                    <div className='size-12 md:size-14 shrink-0 rounded-lg overflow-hidden border border-border/50 bg-neutral-900 shadow-sm relative group-hover:scale-105 transition-transform'>
                      <AlbumCover
                        film={filmMock as any}
                        className='size-full object-cover'
                      />
                    </div>

                    <div className='min-w-0 flex flex-col'>
                      <h4 className='truncate font-black text-sm md:text-base text-foreground group-hover:text-primary transition-colors'>
                        {record.title}
                      </h4>
                      <p className='truncate text-xs font-semibold text-muted-foreground'>
                        {record.artist}
                        {record.release_year ? ` • ${record.release_year}` : ''}
                      </p>
                      <div className='flex items-center gap-1.5 mt-1'>
                        <span className='text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono'>
                          {record.genres?.split(',')[0] ?? 'Music'}
                        </span>
                        {record.tracks?.length > 0 && (
                          <span className='text-[10px] text-muted-foreground/70'>
                            {record.tracks.length} tracks
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className='flex items-center gap-1.5 shrink-0'>
                    <Button
                      size='sm'
                      variant='ghost'
                      onClick={(e) => handlePlayDirect(e, record)}
                      className='size-9 p-0 rounded-full hover:bg-red-600/10 hover:text-red-600 text-muted-foreground transition-colors'
                      title='Play on YouTube Player'
                    >
                      <Play className='size-4 fill-current' />
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className='px-4 py-2.5 bg-muted/30 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground'>
          <span>
            Found <strong className='text-foreground'>{filtered.length}</strong> songs
          </span>
          <span className='hidden sm:inline'>
            Click any song to view details • Press <kbd className='font-mono'>ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  )
}
