import { HeartOff, HeartPlus, Plus } from 'lucide-react'
import type { DialogProps } from 'vaul'
import { useShallowState } from '../../../../../store'
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
                  if (isFavorite) {
                    delete userConfig.favorites?.[film.tmdbId]
                  } else {
                    if (!userConfig.favorites) userConfig.favorites = {}
                    userConfig.favorites[film.tmdbId] = {
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
                  setUserConfig(userConfig)
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
