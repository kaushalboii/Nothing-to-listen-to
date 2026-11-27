import { HeartOff, HeartPlus, Play, Plus } from 'lucide-react'
import type { DialogProps } from 'vaul'
import { store, useShallowState } from '../../../../../store'
import { cn } from '../../../../../utils/tw'
import type { Film, VoroforceCell } from '../../../../../vf'
import { CustomLinks } from '../../../../common/custom-links'
import { StdLinks } from '../../../../common/standard-links'
import { Button } from '../../../../ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../ui/tooltip'

export const FilmViewFooter = ({
  film,
  voroforceCell,
  className = '',
  handleClose,
  direction,
}: {
  film?: Film
  voroforceCell?: VoroforceCell
  className?: string
  handleClose?: () => void
  direction: DialogProps['direction']
}) => {
  const { userConfig, setUserConfig, isFavorite, setAddCustomLinkTypeOpen } =
    useShallowState((state) => ({
      userConfig: state.userConfig,
      setUserConfig: state.setUserConfig,
      isFavorite: film && state.userConfig?.favorites?.[film.tmdbId],
      setAddCustomLinkTypeOpen: state.setAddCustomLinkTypeOpen,
    }))

  if (!film) return
  return (
    <div
      className={cn(
        'relative flex w-full flex-wrap items-center justify-between gap-3 rounded-b-2xl border-border/60 border-t bg-background/95 px-4 py-3 shadow-2xl backdrop-blur-2xl md:px-6 md:py-3.5',
        className,
      )}
    >
      <div className='pointer-events-auto flex min-w-0 flex-1 flex-wrap items-center gap-2'>
        <StdLinks film={film} />
        <CustomLinks film={film} />
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                className='hidden size-7 cursor-pointer rounded-lg border-foreground/40 hover:border-foreground md:inline-flex md:backdrop-blur-lg'
                variant='outline'
                onClick={() => setAddCustomLinkTypeOpen(direction)}
              >
                <Plus className='size-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add new link type</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className='pointer-events-auto flex shrink-0 items-center gap-2'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant={isFavorite ? 'default' : 'outline'}
                onClick={() => {
                  const currentFavorites = { ...(userConfig.favorites ?? {}) }
                  if (isFavorite) {
                    delete currentFavorites[film.tmdbId]
                  } else {
                    currentFavorites[film.tmdbId] = {
                      cellId: voroforceCell?.id,
                      imdbId: film.imdbId,
                      tmdbId: film.tmdbId,
                      title: film.title,
                      artist: film.artist,
                      tagline: film.tagline,
                      year: film.year,
                      poster: film.poster,
                      youtubeId: film.youtubeId,
                    }
                  }
                  setUserConfig({
                    ...userConfig,
                    favorites:
                      Object.keys(currentFavorites).length > 0
                        ? currentFavorites
                        : undefined,
                  })
                }}
                className='pointer-events-auto hidden size-7 rounded-lg border-foreground/40 backdrop-blur-lg hover:border-foreground md:inline-flex'
              >
                {isFavorite ? (
                  <HeartOff className='size-3.5' />
                ) : (
                  <HeartPlus className='size-3.5' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          size='sm'
          onClick={() => {
            const firstTrack = film.tracks?.[0]
            const firstTitle = firstTrack?.title ?? film.title
            store.getState().playTrack({
              title: firstTitle,
              artist: film.artist,
              albumTitle: film.title,
              cover: film.poster,
              videoId: firstTrack?.videoId || film.youtubeId,
              audioUrl: firstTrack?.audioUrl || film.audioUrl,
              query: `${film.artist} ${firstTitle}`,
            })
          }}
          className='pointer-events-auto flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-red-600 px-3.5 font-bold text-white text-xs shadow-md hover:bg-red-700'
        >
          <Play className='size-3.5 fill-white' /> Play
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={handleClose}
          className='pointer-events-auto h-8 rounded-lg border-foreground/40 px-4 font-semibold text-xs backdrop-blur-lg hover:border-foreground'
        >
          Close
        </Button>
      </div>
    </div>
  )
}
