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

  const platforms = [
    {
      name: 'Spotify',
      url: `${config.spotifySearchUrl}${query}`,
      color:
        'hover:border-emerald-500 hover:text-emerald-500 text-emerald-500/90',
    },
    {
      name: 'Apple Music',
      url: `${config.appleMusicSearchUrl}${query}`,
      color: 'hover:border-pink-500 hover:text-pink-500 text-pink-500/90',
    },
    {
      name: 'YouTube Music',
      url: `${config.youtubeMusicSearchUrl}${query}`,
      color: 'hover:border-red-500 hover:text-red-500 text-red-500/90',
    },
    {
      name: 'JioSaavn',
      url: `${config.jiosaavnSearchUrl}${query}`,
      color: 'hover:border-teal-400 hover:text-teal-400 text-teal-400/90',
    },
    {
      name: 'Amazon Music',
      url: `${config.amazonMusicSearchUrl}${query}`,
      color: 'hover:border-sky-400 hover:text-sky-400 text-sky-400/90',
    },
    {
      name: 'Wynk',
      url: `${config.wynkSearchUrl}${query}`,
      color: 'hover:border-orange-500 hover:text-orange-500 text-orange-500/90',
    },
    {
      name: 'Gaana',
      url: `${config.gaanaSearchUrl}${query}`,
      color: 'hover:border-amber-500 hover:text-amber-500 text-amber-500/90',
    },
    {
      name: 'SoundCloud',
      url: `${config.soundcloudSearchUrl}${query}`,
      color: 'hover:border-orange-400 hover:text-orange-400 text-orange-400/90',
    },
  ]

  return (
    <div className='flex flex-row flex-wrap gap-1.5'>
      {platforms.map((p) => (
        <Button
          key={p.name}
          asChild
          variant='outline'
          size='sm'
          className={cn(
            'h-6 rounded-full border-border/80 px-2.5 font-semibold text-[11px] backdrop-blur-md transition-colors',
            p.color,
            buttonClassName,
          )}
        >
          <a href={p.url} target='_blank' rel='noreferrer'>
            {p.name}
          </a>
        </Button>
      ))}
    </div>
  )
}
