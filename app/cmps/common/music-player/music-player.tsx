import {
  ChevronDown,
  ChevronUp,
  Disc3,
  ExternalLink,
  Volume2,
  X,
  Youtube,
} from 'lucide-react'
import config from '../../../config'
import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { Button } from '../../ui/button'

const FALLBACK_VIDEO_ID = 'ZdMZ40GSVmc' // Anirudh - Badass (Leo)

export const MusicPlayer = () => {
  const { activeTrack, playerOpen, isMinimized, setIsMinimized, stopTrack } =
    useShallowState((state) => ({
      activeTrack: state.activeTrack,
      playerOpen: state.playerOpen,
      isMinimized: state.isMinimized,
      setIsMinimized: state.setIsMinimized,
      stopTrack: state.stopTrack,
    }))

  if (!playerOpen || !activeTrack) return null

  const query = encodeURIComponent(`${activeTrack.artist} ${activeTrack.title}`.trim())
  const videoId = activeTrack.videoId && activeTrack.videoId.length === 11
    ? activeTrack.videoId
    : FALLBACK_VIDEO_ID

  // Construct ad-free privacy-enhanced YouTube embed URL with verified video ID
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`

  const directYtWatchUrl = activeTrack.videoId && activeTrack.videoId.length === 11
    ? `https://www.youtube.com/watch?v=${activeTrack.videoId}`
    : `https://www.youtube.com/results?search_query=${query}`

  const spotifyUrl = `${config.spotifySearchUrl}${query}`
  const appleMusicUrl = `${config.appleMusicSearchUrl}${query}`
  const ytMusicUrl = `${config.youtubeMusicSearchUrl}${query}`
  const jiosaavnUrl = `${config.jiosaavnSearchUrl}${query}`
  const amazonMusicUrl = `${config.amazonMusicSearchUrl}${query}`
  const wynkUrl = `${config.wynkSearchUrl}${query}`
  const soundcloudUrl = `${config.soundcloudSearchUrl}${query}`

  return (
    <div
      className={cn(
        'pointer-events-auto fixed z-70 transition-all duration-300 ease-out shadow-2xl',
        isMinimized
          ? 'bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 rounded-2xl bg-background/95 border border-border backdrop-blur-xl p-3'
          : 'bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[480px] rounded-2xl bg-background/95 border border-border backdrop-blur-xl p-4',
      )}
    >
      {/* Player Header / Controls Bar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 min-w-0'>
          {/* Animated Vinyl Disc Icon */}
          <div className='relative flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-amber-500 shadow-md'>
            <Disc3 className='size-6 animate-[spin_4s_linear_infinite]' />
          </div>

          <div className='min-w-0 flex flex-col'>
            <p className='truncate font-black text-sm text-foreground leading-tight'>
              {activeTrack.title}
            </p>
            <p className='truncate text-xs font-semibold text-primary'>
              {activeTrack.artist}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className='flex items-center gap-1.5 shrink-0'>
          <a
            href={directYtWatchUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center justify-center size-7 rounded-full bg-red-600/10 hover:bg-red-600/20 text-red-600 transition-colors cursor-pointer'
            title='Watch on YouTube'
          >
            <Youtube className='size-4' />
          </a>

          <Button
            size='icon'
            variant='ghost'
            className='size-7 rounded-full cursor-pointer'
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Video' : 'Minimize Player'}
          >
            {isMinimized ? (
              <ChevronUp className='size-4' />
            ) : (
              <ChevronDown className='size-4' />
            )}
          </Button>

          <Button
            size='icon'
            variant='ghost'
            className='size-7 rounded-full hover:bg-destructive/10 hover:text-destructive cursor-pointer'
            onClick={stopTrack}
            title='Stop Playback'
          >
            <X className='size-4' />
          </Button>
        </div>
      </div>

      {/* Embedded YouTube Player */}
      <div
        className={cn('relative mt-3 overflow-hidden rounded-xl bg-black transition-all duration-300', {
          'h-56 md:h-64 opacity-100': !isMinimized,
          'h-0 opacity-0 pointer-events-none mt-0': isMinimized,
        })}
      >
        <iframe
          src={embedUrl}
          title={`${activeTrack.artist} - ${activeTrack.title}`}
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
          className='absolute inset-0 h-full w-full border-0'
        />
      </div>

      {/* Cross-platform Listen Links */}
      <div className='mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs overflow-x-auto scrollbar-none'>
        <span className='text-[0.7rem] font-medium text-muted-foreground flex items-center gap-1 shrink-0'>
          <Volume2 className='size-3 text-emerald-500 animate-pulse' />
          Listen on:
        </span>
        <div className='flex items-center gap-1.5 shrink-0'>
          <a
            href={spotifyUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold transition-colors'
          >
            Spotify
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={appleMusicUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-semibold transition-colors'
          >
            Apple Music
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={ytMusicUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold transition-colors'
          >
            YouTube
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={jiosaavnUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-semibold transition-colors'
          >
            JioSaavn
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={amazonMusicUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold transition-colors'
          >
            Amazon
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={wynkUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold transition-colors'
          >
            Wynk
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={soundcloudUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold transition-colors'
          >
            SoundCloud
            <ExternalLink className='size-2.5' />
          </a>
        </div>
      </div>
    </div>
  )
}
