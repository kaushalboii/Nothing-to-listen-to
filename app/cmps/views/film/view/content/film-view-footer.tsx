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
        'relative flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-3.5 bg-background/95 backdrop-blur-2xl border-t border-border/60 shadow-2xl rounded-b-2xl',
        className,
      )}
    >
      <div className='pointer-events-auto flex flex-1 flex-wrap items-center gap-2 min-w-0'>
        <StdLinks film={film} />
        <CustomLinks film={film} />
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                className='hidden cursor-pointer rounded-lg border-foreground/40 hover:border-foreground md:inline-flex md:backdrop-blur-lg size-7'
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
      <div className='pointer-events-auto flex items-center gap-2 shrink-0'>
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
                className='pointer-events-auto hidden rounded-lg border-foreground/40 hover:border-foreground backdrop-blur-lg md:inline-flex size-7'
              >
                {isFavorite ? <HeartOff className='size-3.5' /> : <HeartPlus className='size-3.5' />}
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
          className='pointer-events-auto rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 h-8 text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer'
        >
          <Play className='size-3.5 fill-white' /> Play
        </Button>

        <Button
          variant='outline'
          size='sm'
          onClick={handleClose}
          className='pointer-events-auto rounded-lg border-foreground/40 hover:border-foreground backdrop-blur-lg px-4 h-8 text-xs font-semibold'
        >
          Close
        </Button>
      </div>
    </div>
  )
}
