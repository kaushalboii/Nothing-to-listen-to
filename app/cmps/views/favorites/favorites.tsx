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
    filmBatches,
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
    filmBatches: state.filmBatches,
  }))

  const [localRecords, setLocalRecords] = useState<any[]>([])

  // Load raw records to resolve video IDs for favorites
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
          if (Array.isArray(data)) setLocalRecords(data)
        })
        .catch(() => {})
    }
  }, [filmBatches])

  const hasFavorites = favorites && Object.keys(favorites).length > 0

  const favoriteEntries = useMemo(() => {
    if (!favorites) return []
    return Object.entries(favorites).map(([key, film]) => {
      const record = localRecords.find(
        (r) => Number(r.id) === Number(film.tmdbId) || r.title === film.title,
      )
      const videoId =
        (film as any).youtubeId ||
        record?.youtube_id ||
        record?.tracks?.[0]?.videoId ||
        undefined
      return {
        key,
        film,
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
                userConfig.favorites = undefined
                setUserConfig(userConfig)
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
        <div className='flex min-h-64 w-full flex-col gap-4 p-4 pb-18 md:gap-6 md:p-6 md:pb-24 lg:flex lg:pt-16 lg:pb-24'>
          {hasFavorites ? (
            <>
              {favoriteEntries.map(({ key, film }, index) => (
                <div
                  className='relative flex h-36 w-full cursor-auto flex-row overflow-hidden rounded-xl border bg-card/60'
                  key={key}
                >
                  <div
                    className='relative group/poster cursor-pointer shrink-0'
                    onClick={() => handlePlayOne(index)}
                    title={`Play ${film.title}`}
                  >
                    <FilmPoster film={film} />
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover/poster:opacity-100 transition-opacity flex items-center justify-center'>
                      <Play className='size-8 text-white fill-white drop-shadow-md' />
                    </div>
                  </div>
                  <div className='flex h-full grow flex-col justify-between gap-3 p-4 min-w-0'>
                    <div>
                      {(film as any).artist && (
                        <p className='text-xs font-bold text-primary uppercase tracking-wider mb-0.5 truncate'>
                          {(film as any).artist}
                        </p>
                      )}
                      <h6 className='pr-3 font-black text-2xl leading-none truncate'>
                        {film.title}
                        <span className='font-normal text-foreground/50'>
                          &nbsp;({film.year})
                        </span>
                      </h6>
                    </div>
                    <p className='line-clamp-1 hidden font-medium text-base text-foreground/90 leading-none md:inline-block'>
                      {film.tagline}
                    </p>
                    <div
                      className={cn(
                        'pointer-events-auto flex flex-row flex-wrap gap-1.5',
                      )}
                    >
                      <StdLinks
                        film={film}
                        buttonClassName='text-xxs !py-1 !px-2 !h-auto'
                      />
                      {hasCustomLinks && (
                        <CustomLinks
                          film={film}
                          addNewDisabled
                          buttonClassName='!py-1 !px-2 !h-auto'
                        />
                      )}
                    </div>
                  </div>
                  <div className='absolute top-4 right-4 flex flex-row items-center gap-1.5'>
                    <Button
                      size='icon'
                      className='!size-6 [&_svg]:!size-3.5 cursor-pointer rounded-full bg-red-600 hover:bg-red-700 text-white shadow-sm'
                      onClick={() => handlePlayOne(index)}
                      title={`Play ${film.title}`}
                    >
                      <Play className='fill-white' />
                    </Button>
                    {film.cellId && voroforceControls && (
                      <Button
                        size='icon'
                        variant='outline'
                        className='!size-6 [&_svg]:!size-3.5 cursor-pointer rounded-full'
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
                      className='!size-6 [&_svg]:!size-3.5 cursor-pointer rounded-full hover:bg-destructive/15 hover:text-destructive'
                      onClick={() => {
                        delete favorites?.[Number.parseInt(key)]
                        userConfig.favorites = { ...favorites }
                        setUserConfig(userConfig)
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
