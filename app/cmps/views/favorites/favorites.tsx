import { useShallowState } from '@/store'
import type { ActiveTrack } from '@/store/player-slice'
import { MapPin, Play, Trash } from 'lucide-react'
import { lazy, useEffect, useMemo, useState } from 'react'
import { cn } from '../../../utils/tw'
import { Modal } from '../../common/modal'
import { StdLinks } from '../../common/standard-links'
import { Button } from '../../ui/button'
import { ScrollArea } from '../../ui/scroll-area'
import { FilmPoster } from '../film/shared/film-poster'

const CustomLinks = lazy(() =>
  import('../../common/custom-links').then((module) => ({
    default: module.CustomLinks,
  })),
)

export const Favorites = () => {
  const {
    open,
    setOpen,
    userConfig,
    setUserConfig,
    favorites,
    hasCustomLinks,
    voroforceControls,
    playPlaylist,
  } = useShallowState((state) => ({
    open: state.favoritesOpen,
    setOpen: state.setFavoritesOpen,
    userConfig: state.userConfig,
    setUserConfig: state.setUserConfig,
    favorites: state.userConfig.favorites,
    hasCustomLinks:
      state.userConfig.customLinks && state.userConfig.customLinks.length > 0,
    voroforceControls: state.voroforce?.controls,
    playPlaylist: state.playPlaylist,
  }))

  const [localRecords, setLocalRecords] = useState<any[]>([])

  // Load raw records to resolve video IDs for favorites
  useEffect(() => {
    const rawBase = import.meta.env.BASE_URL || '/'
    const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase
    fetch(`${normalizedBase}/json/0.json?v=${Date.now().toString(36)}`, { cache: 'no-cache' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setLocalRecords(data)
      })
      .catch(() => {})
  }, [])

  const hasFavorites = favorites && Object.keys(favorites).length > 0

  const favoriteEntries = useMemo(() => {
    if (!favorites) return []
    return Object.entries(favorites).map(([key, film]) => {
      const filmTitle = (film.title || '').trim().toLowerCase()

      // 1. Prioritize exact title match
      let record = localRecords.find(
        (r) => r.title && r.title.trim().toLowerCase() === filmTitle,
      )

      // 2. Substring title match
      if (!record && filmTitle.length > 3) {
        record = localRecords.find(
          (r) =>
            r.title &&
            (r.title.toLowerCase().includes(filmTitle) ||
              filmTitle.includes(r.title.toLowerCase())),
        )
      }

      // 3. ID match only if title is compatible
      if (!record && film.tmdbId !== undefined && film.tmdbId !== null) {
        const idMatch = localRecords.find(
          (r) => Number(r.id) === Number(film.tmdbId),
        )
        if (idMatch) {
          const matchTitle = (idMatch.title || '').toLowerCase()
          if (!filmTitle || matchTitle.includes(filmTitle) || filmTitle.includes(matchTitle)) {
            record = idMatch
          }
        }
      }

      const videoId =
        ((film as any).youtubeId && (film as any).youtubeId.length === 11
          ? (film as any).youtubeId
          : undefined) ||
        record?.youtube_id ||
        record?.tracks?.[0]?.videoId ||
        undefined

      return {
        key,
        film: {
          ...film,
          artist: (film as any).artist || record?.artist,
        },
        videoId,
      }
    })
  }, [favorites, localRecords])

  const handlePlayAll = () => {
    if (favoriteEntries.length === 0) return
    const tracks: ActiveTrack[] = favoriteEntries.map(({ film, videoId }) => ({
      id: film.tmdbId,
      title: film.title,
      artist: (film as any).artist ?? 'Various Artists',
      albumTitle: film.title,
      cover: film.poster,
      videoId,
      query: `${(film as any).artist ?? ''} ${film.title}`.trim(),
    }))
    playPlaylist(tracks, 0)
  }

  const handlePlayOne = (index: number) => {
    const tracks: ActiveTrack[] = favoriteEntries.map(({ film, videoId }) => ({
      id: film.tmdbId,
      title: film.title,
      artist: (film as any).artist ?? 'Various Artists',
      albumTitle: film.title,
      cover: film.poster,
      videoId,
      query: `${(film as any).artist ?? ''} ${film.title}`.trim(),
    }))
    playPlaylist(tracks, index)
  }

  return (
    <Modal
      rootProps={{
        open: open,
        onClose: () => setOpen(false),
      }}
      overlay
      footer={
        <div className='flex w-full flex-row items-center justify-between gap-3 p-4 md:gap-6 md:p-6'>
          <div className='flex items-center gap-2.5'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Close
            </Button>
            {hasFavorites && (
              <Button
                className='cursor-pointer gap-2 font-bold bg-red-600 hover:bg-red-700 text-white shadow-md'
                onClick={handlePlayAll}
              >
                <Play className='size-4 fill-white' /> Play All ({favoriteEntries.length})
              </Button>
            )}
          </div>
          {hasFavorites && (
            <Button
              variant='outline'
              onClick={() => {
                setUserConfig({
                  ...userConfig,
                  favorites: undefined,
                })
              }}
            >
              Clear favorites
            </Button>
          )}
        </div>
      }
    >
      <ScrollArea
        className='not-landscape:w-full bg-background/60 lg:w-full landscape:h-full'
        innerClassName='max-h-[calc(100vh-var(--spacing)*12)]'
      >
        <div className='flex min-h-64 w-full flex-col gap-3.5 p-3.5 pb-18 md:gap-5 md:p-6 md:pb-24 lg:flex lg:pt-16 lg:pb-24'>
          {hasFavorites ? (
            <>
              {favoriteEntries.map(({ key, film }, index) => (
                <div
                  className='relative flex min-h-[7.5rem] w-full cursor-auto flex-row items-stretch overflow-hidden rounded-xl border border-border/60 bg-card/85 backdrop-blur-md shadow-sm transition-all hover:border-border'
                  key={key}
                >
                  <div
                    className='relative group/poster cursor-pointer shrink-0 w-28 h-28 sm:w-32 sm:h-32 m-2 sm:m-2.5 rounded-lg overflow-hidden bg-zinc-900 shadow-md'
                    onClick={() => handlePlayOne(index)}
                    title={`Play ${film.title}`}
                  >
                    <FilmPoster film={film} className='h-full w-full object-cover' />
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center'>
                      <Play className='size-8 text-white fill-white drop-shadow-md' />
                    </div>
                  </div>
                  <div className='flex flex-1 flex-col justify-between p-2.5 sm:p-3 sm:pl-0 min-w-0 pr-18 sm:pr-24'>
                    <div className='min-w-0'>
                      {(film as any).artist && (
                        <p className='text-xs font-bold text-amber-500 uppercase tracking-wider mb-0.5 truncate'>
                          {(film as any).artist}
                        </p>
                      )}
                      <h6 className='font-black text-base sm:text-lg leading-tight truncate text-foreground'>
                        {film.title}
                        {film.year && (
                          <span className='font-normal text-muted-foreground text-sm'>
                            &nbsp;({film.year})
                          </span>
                        )}
                      </h6>
                      {film.tagline && (
                        <p className='line-clamp-1 mt-1 text-xs text-muted-foreground italic'>
                          {film.tagline}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        'pointer-events-auto flex flex-row flex-wrap items-center gap-1.5 mt-2',
                      )}
                    >
                      <StdLinks
                        film={film}
                        buttonClassName='text-[10px] !py-0.5 !px-2 !h-6'
                      />
                      {hasCustomLinks && (
                        <CustomLinks
                          film={film}
                          addNewDisabled
                          buttonClassName='text-[10px] !py-0.5 !px-2 !h-6'
                        />
                      )}
                    </div>
                  </div>
                  <div className='absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex flex-row items-center gap-1.5'>
                    <Button
                      size='icon'
                      className='!size-7 [&_svg]:!size-3.5 cursor-pointer rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm'
                      onClick={() => handlePlayOne(index)}
                      title={`Play ${film.title}`}
                    >
                      <Play className='fill-white' />
                    </Button>
                    {film.cellId && voroforceControls && (
                      <Button
                        size='icon'
                        variant='outline'
                        className='!size-7 [&_svg]:!size-3.5 cursor-pointer rounded-full'
                        onClick={() => {
                          voroforceControls.navigateToCellById(film.cellId)
                        }}
                        title='Locate on 3D Globe'
                      >
                        <MapPin />
                      </Button>
                    )}
                    <Button
                      size='icon'
                      variant='outline'
                      className='!size-7 [&_svg]:!size-3.5 cursor-pointer rounded-full hover:bg-destructive/15 hover:text-destructive'
                      onClick={() => {
                        const nextFavorites = { ...favorites }
                        delete nextFavorites[Number.parseInt(key)]
                        setUserConfig({
                          ...userConfig,
                          favorites:
                            Object.keys(nextFavorites).length > 0
                              ? nextFavorites
                              : undefined,
                        })
                      }}
                      title='Remove from favorites'
                    >
                      <Trash />
                    </Button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className='flex h-full w-full flex-1 items-center justify-center text-lg text-muted-foreground'>
              No favourites added yet
            </div>
          )}
        </div>
      </ScrollArea>
    </Modal>
  )
}
