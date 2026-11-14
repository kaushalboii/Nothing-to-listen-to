import config from '../../config'
import { cn } from '../../utils/tw'
import type { Film } from '../../vf'
import { Button } from '../ui/button'

export const StdLinks = ({
  film,
  buttonClassName = '',
}: {
  film: {
    title: Film['title']
    artist?: Film['artist']
    tmdbId?: Film['tmdbId']
  }
  buttonClassName?: string
}) => {
  const query = encodeURIComponent(`${film.artist ?? ''} ${film.title}`.trim())

  return (
    <div className='flex flex-row flex-wrap gap-2'>
      <Button
        asChild
        variant='outline'
        size='sm'
        className={cn(
          'rounded-lg border-foreground font-semibold hover:border-emerald-500 hover:text-emerald-500 md:backdrop-blur-lg',
          buttonClassName,
        )}
      >
        <a
          href={`${config.spotifySearchUrl}${query}`}
          target='_blank'
          rel='noreferrer'
        >
          Spotify
        </a>
      </Button>
      <Button
        asChild
        variant='outline'
        size='sm'
        className={cn(
          'rounded-lg border-foreground font-semibold hover:border-pink-500 hover:text-pink-500 md:backdrop-blur-lg',
          buttonClassName,
        )}
      >
        <a
          href={`${config.appleMusicSearchUrl}${query}`}
          target='_blank'
          rel='noreferrer'
        >
          Apple Music
        </a>
      </Button>
      <Button
        asChild
        variant='outline'
        size='sm'
        className={cn(
          'rounded-lg border-foreground font-semibold hover:border-red-500 hover:text-red-500 md:backdrop-blur-lg',
          buttonClassName,
        )}
      >
        <a
          href={`${config.youtubeMusicSearchUrl}${query}`}
          target='_blank'
          rel='noreferrer'
        >
          YouTube
        </a>
      </Button>
    </div>
  )
}
