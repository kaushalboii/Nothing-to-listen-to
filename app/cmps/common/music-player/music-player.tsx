import { useCallback, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Volume2,
  X,
  Youtube,
} from 'lucide-react'
import config from '../../../config'
import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { Button } from '../../ui/button'

const FALLBACK_VIDEO_ID = 'ZdMZ40GSVmc' // Anirudh - Badass (Leo)

export type PlayerEngineId = 'piped' | 'invidious' | 'youtube'

interface PlayerEngineOption {
  id: PlayerEngineId
  name: string
  badgeLabel: string
  description: string
  getEmbedUrl: (id: string) => string
}

const PLAYER_ENGINES: PlayerEngineOption[] = [
  {
    id: 'piped',
    name: 'Piped (Ad-Free)',
    badgeLabel: '🛡️ 100% Ad-Free (Piped)',
    description: 'Ad-free privacy engine: completely strips YouTube pre-roll ads and trackers at source',
    getEmbedUrl: (id: string) => `https://piped.video/embed/${id}?autoplay=1`,
  },
  {
    id: 'invidious',
    name: 'Invidious (Ad-Free)',
    badgeLabel: '🛡️ 100% Ad-Free (Invidious)',
    description: 'Open-source ad-stripped video mirror (zero ads, zero tracking)',
    getEmbedUrl: (id: string) => `https://yewtu.be/embed/${id}?autoplay=1&playsinline=1`,
  },
  {
    id: 'youtube',
    name: 'Direct YouTube',
    badgeLabel: '▶️ Official YouTube',
    description: 'Official YouTube CDN (uses your logged-in YouTube Premium account or browser extensions)',
    getEmbedUrl: (id: string) => `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&playsinline=1&controls=1`,
  },
]

export const MusicPlayer = () => {
  const { activeTrack, playerOpen, isMinimized, setIsMinimized, stopTrack } =
    useShallowState((state) => ({
      activeTrack: state.activeTrack,
      playerOpen: state.playerOpen,
      isMinimized: state.isMinimized,
      setIsMinimized: state.setIsMinimized,
      stopTrack: state.stopTrack,
    }))

  // Persistent engine preference (defaults to 100% ad-free Piped engine)
  const [engineId, setEngineId] = useState<PlayerEngineId>(() => {
    try {
      const saved = localStorage.getItem('ntlt_player_engine')
      if (saved === 'piped' || saved === 'invidious' || saved === 'youtube') {
        return saved
      }
    } catch {
      // ignore
    }
    return 'piped'
  })

  const handleCycleEngine = useCallback(() => {
    setEngineId((curr) => {
      const next: PlayerEngineId =
        curr === 'piped' ? 'invidious' : curr === 'invidious' ? 'youtube' : 'piped'
      try {
        localStorage.setItem('ntlt_player_engine', next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // Hook rules: all hooks must be declared before any early return
  if (!playerOpen || !activeTrack) return null

  const query = encodeURIComponent(`${activeTrack.artist} ${activeTrack.title}`.trim())
  const videoId = activeTrack.videoId && activeTrack.videoId.length === 11
    ? activeTrack.videoId
    : FALLBACK_VIDEO_ID

  const activeEngine =
    PLAYER_ENGINES.find((e) => e.id === engineId) ?? PLAYER_ENGINES[0]
  const embedUrl = activeEngine.getEmbedUrl(videoId)

  const directYtWatchUrl = activeTrack.videoId && activeTrack.videoId.length === 11
    ? `https://www.youtube.com/watch?v=${activeTrack.videoId}`
    : `https://www.youtube.com/results?search_query=${query}`

  const spotifyUrl = `${config.spotifySearchUrl}${query}`
  const appleMusicUrl = `${config.appleMusicSearchUrl}${query}`
  const ytMusicUrl = `${config.youtubeMusicSearchUrl}${query}`
  const jiosaavnUrl = `${config.jiosaavnSearchUrl}${query}`

  const isAdFree = engineId !== 'youtube'

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

        {/* Action Controls & Engine Switcher */}
        <div className='flex items-center gap-1.5 shrink-0'>
          <button
            onClick={handleCycleEngine}
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer select-none border shadow-sm',
              isAdFree
                ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-emerald-500/30'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50',
            )}
            title={`Active Engine: ${activeEngine.name}. ${activeEngine.description}. Click to switch engine (Piped 🛡️ / Invidious 🛡️ / YouTube ▶️).`}
          >
            <ShieldCheck className={cn('size-3.5', isAdFree ? 'text-emerald-500' : 'text-muted-foreground')} />
            <span>{activeEngine.badgeLabel}</span>
            <RefreshCw className='size-2.5 opacity-60 ml-0.5' />
          </button>

          <a
            href={directYtWatchUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center justify-center size-7 rounded-full bg-red-600/10 hover:bg-red-600/20 text-red-600 transition-colors cursor-pointer'
            title='Watch directly on YouTube website'
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

      {/* Embedded Stream Player */}
      <div
        className={cn('relative mt-3 overflow-hidden rounded-xl bg-black transition-all duration-300', {
          'h-56 md:h-64 opacity-100': !isMinimized,
          'h-0 opacity-0 pointer-events-none mt-0': isMinimized,
        })}
      >
        <iframe
          key={`${engineId}-${videoId}`}
          src={embedUrl}
          title={`${activeTrack.artist} - ${activeTrack.title}`}
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
          allowFullScreen
          className='absolute inset-0 h-full w-full border-0'
        />
      </div>

      {/* Cross-platform Listen Links (Essential clean buttons without overflow) */}
      <div className='mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs'>
        <span className='text-[0.7rem] font-medium text-muted-foreground flex items-center gap-1 shrink-0'>
          <Volume2 className='size-3 text-emerald-500 animate-pulse' />
          Listen on:
        </span>
        <div className='flex items-center gap-1.5 shrink-0'>
          <a
            href={spotifyUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold transition-colors'
          >
            Spotify
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={appleMusicUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-semibold transition-colors'
          >
            Apple Music
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={ytMusicUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold transition-colors'
          >
            YouTube
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={jiosaavnUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-semibold transition-colors'
          >
            JioSaavn
            <ExternalLink className='size-2.5' />
          </a>
        </div>
      </div>
    </div>
  )
}
