import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Youtube,
} from 'lucide-react'
import config from '../../../config'
import { useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { Button } from '../../ui/button'
import { resolveAdFreeAudioStream } from './audio-stream'

const FALLBACK_VIDEO_ID = 'ZdMZ40GSVmc' // Anirudh - Badass (Leo)

type StreamMode = 'resolving' | 'audio' | 'youtube'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export const MusicPlayer = () => {
  const {
    activeTrack,
    playerOpen,
    isMinimized,
    setIsMinimized,
    stopTrack,
    playlist,
    playlistIndex,
    nextTrack,
    prevTrack,
  } = useShallowState((state) => ({
    activeTrack: state.activeTrack,
    playerOpen: state.playerOpen,
    isMinimized: state.isMinimized,
    setIsMinimized: state.setIsMinimized,
    stopTrack: state.stopTrack,
    playlist: state.playlist,
    playlistIndex: state.playlistIndex,
    nextTrack: state.nextTrack,
    prevTrack: state.prevTrack,
  }))

  const videoId =
    activeTrack?.videoId && activeTrack.videoId.length === 11
      ? activeTrack.videoId
      : FALLBACK_VIDEO_ID

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const [streamMode, setStreamMode] = useState<StreamMode>('resolving')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Resolve 100% ad-free direct audio stream first; fall back silently to YouTube only if unavailable
  useEffect(() => {
    if (!playerOpen || !activeTrack) {
      setStreamMode('resolving')
      setAudioUrl(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }

    const controller = new AbortController()
    setStreamMode('resolving')
    setAudioUrl(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    void resolveAdFreeAudioStream(activeTrack, controller.signal).then(
      (resolvedUrl) => {
        if (controller.signal.aborted) return
        if (resolvedUrl) {
          setAudioUrl(resolvedUrl)
          setStreamMode('audio')
        } else {
          setStreamMode('youtube')
        }
      },
    )

    return () => {
      controller.abort()
    }
  }, [
    playerOpen,
    activeTrack?.title,
    activeTrack?.artist,
    activeTrack?.videoId,
    playlistIndex,
  ])

  // Start native audio playback & register mobile lock-screen Media Session controls
  useEffect(() => {
    const audio = audioRef.current
    if (streamMode !== 'audio' || !audioUrl || !audio) return

    audio.currentTime = 0
    const playPromise = audio.play()
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && activeTrack) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: activeTrack.title,
          artist: activeTrack.artist,
          album: activeTrack.albumTitle,
          artwork: activeTrack.cover
            ? [{ src: activeTrack.cover, sizes: '600x600', type: 'image/jpeg' }]
            : undefined,
        })
        navigator.mediaSession.setActionHandler('play', () => void audio.play())
        navigator.mediaSession.setActionHandler('pause', () => audio.pause())
        navigator.mediaSession.setActionHandler(
          'previoustrack',
          playlist.length > 1 ? prevTrack : null,
        )
        navigator.mediaSession.setActionHandler(
          'nexttrack',
          playlist.length > 1 ? nextTrack : null,
        )
      } catch (_) {}
    }
  }, [streamMode, audioUrl, activeTrack, playlist.length, nextTrack, prevTrack])

  // Dual-layer YouTube listener (active only when falling back to YouTube embed)
  useEffect(() => {
    if (streamMode !== 'youtube') return

    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.youtube-nocookie.com' &&
        event.origin !== 'https://www.youtube.com'
      ) {
        return
      }

      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data

        const isEnded =
          (data?.event === 'infoDelivery' && data?.info?.playerState === 0) ||
          (data?.event === 'onStateChange' &&
            (data?.info === 0 || data?.info === '0' || data?.data === 0)) ||
          data?.info?.playerState === 0 ||
          data?.playerState === 0

        const isError =
          data?.event === 'onError' ||
          (data?.event === 'infoDelivery' &&
            typeof data?.info?.errorCode === 'number')

        if (isEnded || isError) {
          nextTrack()
        }
      } catch (_) {}
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [streamMode, nextTrack])

  useEffect(() => {
    if (streamMode !== 'youtube') return
    let player: any = null

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player && iframeRef.current) {
        try {
          player = new (window as any).YT.Player(iframeRef.current, {
            events: {
              onStateChange: (event: any) => {
                if (event?.data === 0) {
                  nextTrack()
                }
              },
              onError: () => {
                nextTrack()
              },
            },
          })
        } catch (_) {}
      }
    }

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer()
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script')
        tag.id = 'yt-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      const prevOnReady = (window as any).onYouTubeIframeAPIReady
      ;(window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prevOnReady === 'function') prevOnReady()
        initPlayer()
      }
    }

    return () => {
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy()
        } catch (_) {}
      }
    }
  }, [streamMode, videoId, playlistIndex, nextTrack])

  const handleIframeLoad = () => {
    try {
      const win = iframeRef.current?.contentWindow
      if (win) {
        win.postMessage(JSON.stringify({ event: 'listening' }), '*')
        win.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'addEventListener',
            args: ['onStateChange'],
          }),
          '*',
        )
      }
    } catch (_) {}
  }

  const originParam =
    typeof window !== 'undefined' && window.location.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}&widget_referrer=${encodeURIComponent(window.location.href)}`
      : ''
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1&controls=1&modestbranding=1&iv_load_policy=3${originParam}`

  if (!playerOpen || !activeTrack) return null

  const query = encodeURIComponent(`${activeTrack.artist} ${activeTrack.title}`.trim())

  const directYtWatchUrl =
    activeTrack.videoId && activeTrack.videoId.length === 11
      ? `https://www.youtube.com/watch?v=${activeTrack.videoId}`
      : `https://www.youtube.com/results?search_query=${query}`

  const spotifyUrl = `${config.spotifySearchUrl}${query}`
  const appleMusicUrl = `${config.appleMusicSearchUrl}${query}`
  const ytMusicUrl = `${config.youtubeMusicSearchUrl}${query}`
  const jiosaavnUrl = `${config.jiosaavnSearchUrl}${query}`

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }

  return (
    <div
      className={cn(
        'pointer-events-auto fixed z-70 transition-all duration-300 ease-out shadow-2xl overflow-hidden',
        isMinimized
          ? 'bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-8 md:w-[480px] rounded-2xl bg-background/95 border border-border backdrop-blur-xl p-3'
          : 'bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-8 md:w-[480px] rounded-2xl bg-background/95 border border-border backdrop-blur-xl p-3 sm:p-4',
      )}
    >
      {/* Hidden native HTML5 audio element for seamless background & lockscreen playback */}
      {streamMode === 'audio' && audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          autoPlay
          playsInline
          preload='auto'
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onEnded={() => {
            if (playlist.length > 1) {
              nextTrack()
            } else {
              setIsPlaying(false)
            }
          }}
          onError={() => {
            setStreamMode('youtube')
          }}
        />
      )}

      {/* Player Header / Controls Bar */}
      <div className='flex items-center justify-between gap-3'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='relative flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 text-amber-500 shadow-md overflow-hidden'>
            {activeTrack.cover ? (
              <img
                src={activeTrack.cover}
                alt={activeTrack.title}
                className={cn(
                  'size-full object-cover',
                  (streamMode === 'youtube' || isPlaying) &&
                    'animate-[spin_8s_linear_infinite]',
                )}
              />
            ) : (
              <Disc3
                className={cn(
                  'size-6',
                  (streamMode === 'youtube' || isPlaying) &&
                    'animate-[spin_4s_linear_infinite]',
                )}
              />
            )}
          </div>

          <div className='min-w-0 flex flex-col'>
            <div className='flex items-center gap-1.5 min-w-0'>
              <p className='truncate font-black text-sm text-foreground leading-tight'>
                {activeTrack.title}
              </p>
              {playlist && playlist.length > 1 && (
                <span className='shrink-0 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full'>
                  {playlistIndex + 1}/{playlist.length}
                </span>
              )}
            </div>
            <p className='truncate text-xs font-semibold text-primary'>
              {activeTrack.artist}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className='flex items-center gap-1 shrink-0'>
          {streamMode === 'audio' && (
            <Button
              size='icon'
              variant='ghost'
              className='size-8 rounded-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90'
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className='size-4' />
              ) : (
                <Play className='size-4 ml-0.5' />
              )}
            </Button>
          )}

          {playlist && playlist.length > 1 && (
            <>
              <Button
                size='icon'
                variant='ghost'
                className='size-7 rounded-full cursor-pointer hover:bg-primary/10'
                onClick={prevTrack}
                title='Previous Track'
              >
                <SkipBack className='size-3.5' />
              </Button>
              <Button
                size='icon'
                variant='ghost'
                className='size-7 rounded-full cursor-pointer hover:bg-primary/10'
                onClick={nextTrack}
                title='Next Track'
              >
                <SkipForward className='size-3.5' />
              </Button>
            </>
          )}

          <a
            href={directYtWatchUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center justify-center size-7 rounded-full bg-red-600/10 hover:bg-red-600/20 text-red-600 transition-colors cursor-pointer'
            title='Watch on YouTube'
          >
            <Youtube className='size-4' />
          </a>

          {streamMode === 'youtube' && (
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
          )}

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

      {/* Loading Indicator while resolving direct stream */}
      {streamMode === 'resolving' && (
        <div className='mt-3 flex items-center justify-center gap-2 rounded-xl bg-muted/40 py-3 text-xs text-muted-foreground'>
          <Loader2 className='size-4 animate-spin text-primary' />
          <span>Starting audio stream...</span>
        </div>
      )}

      {/* Scrubbable Audio Seek Bar (100% Ad-Free Direct Audio) */}
      {streamMode === 'audio' && (
        <div className='mt-3 flex items-center gap-2.5'>
          <span className='w-9 text-[11px] font-medium tabular-nums text-muted-foreground'>
            {formatTime(currentTime)}
          </span>
          <input
            type='range'
            min={0}
            max={duration || 100}
            value={Math.min(currentTime, duration || 100)}
            onChange={(e) => {
              const nextTime = Number(e.target.value)
              setCurrentTime(nextTime)
              if (audioRef.current) {
                audioRef.current.currentTime = nextTime
              }
            }}
            aria-label='Seek audio position'
            className='h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary'
          />
          <span className='w-9 text-right text-[11px] font-medium tabular-nums text-muted-foreground'>
            {formatTime(duration)}
          </span>
        </div>
      )}

      {/* YouTube Fallback Embed (only used automatically if track isn't in audio catalog) */}
      {streamMode === 'youtube' && (
        <div
          className={cn(
            'relative mt-3 overflow-hidden rounded-xl bg-black transition-all duration-300',
            {
              'h-48 sm:h-56 md:h-64 opacity-100': !isMinimized,
              'h-0 opacity-0 pointer-events-none mt-0': isMinimized,
            },
          )}
        >
          <iframe
            key={`${videoId}-${playlistIndex}`}
            ref={iframeRef}
            src={embedUrl}
            onLoad={handleIframeLoad}
            title={`${activeTrack.artist} - ${activeTrack.title}`}
            referrerPolicy='strict-origin-when-cross-origin'
            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            allowFullScreen
            className='absolute inset-0 h-full w-full border-0'
          />
        </div>
      )}

      {/* Cross-platform Listen Links */}
      <div className='mt-2.5 pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-1.5 text-xs'>
        <span className='text-[0.7rem] font-semibold text-muted-foreground flex items-center gap-1 shrink-0'>
          <Volume2 className='size-3 text-emerald-500 animate-pulse' />
          Listen:
        </span>
        <div className='flex flex-wrap items-center gap-1.5 justify-end'>
          <a
            href={spotifyUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] transition-colors shrink-0'
          >
            Spotify
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={appleMusicUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-semibold text-[11px] transition-colors shrink-0'
          >
            Apple Music
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={ytMusicUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold text-[11px] transition-colors shrink-0'
          >
            YouTube
            <ExternalLink className='size-2.5' />
          </a>
          <a
            href={jiosaavnUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-semibold text-[11px] transition-colors shrink-0'
          >
            JioSaavn
            <ExternalLink className='size-2.5' />
          </a>
        </div>
      </div>
    </div>
  )
}
