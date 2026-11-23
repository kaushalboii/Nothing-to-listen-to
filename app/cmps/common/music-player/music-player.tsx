import { useEffect, useRef } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  ExternalLink,
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

const FALLBACK_VIDEO_ID = 'ZdMZ40GSVmc' // Anirudh - Badass (Leo)

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

  const videoId = activeTrack?.videoId && activeTrack.videoId.length === 11
    ? activeTrack.videoId
    : FALLBACK_VIDEO_ID

  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Dual-layer YouTube listener: postMessage + official window.YT API for 100% reliable track completion
  useEffect(() => {
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
  }, [nextTrack])

  // Official window.YT.Player bridge for track transitions
  useEffect(() => {
    let player: any = null

    const initPlayer = () => {
      if ((window as any).YT && (window as any).YT.Player && iframeRef.current) {
        try {
          player = new (window as any).YT.Player(iframeRef.current, {
            events: {
              onStateChange: (event: any) => {
                // 0 = YT.PlayerState.ENDED
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
  }, [videoId, playlistIndex, nextTrack])

  // When iframe loads, notify YouTube embed to start listening for state change events
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

  // Privacy-Enhanced Ad-Shielded YouTube Player (Zero 3rd-party proxies, cookies stripped to prevent mobile ad tracking)
  const originParam =
    typeof window !== 'undefined' && window.location.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}&widget_referrer=${encodeURIComponent(window.location.href)}`
      : ''
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1&controls=1&modestbranding=1&iv_load_policy=3${originParam}`

  if (!playerOpen || !activeTrack) return null

  const query = encodeURIComponent(`${activeTrack.artist} ${activeTrack.title}`.trim())

  const directYtWatchUrl = activeTrack.videoId && activeTrack.videoId.length === 11
    ? `https://www.youtube.com/watch?v=${activeTrack.videoId}`
    : `https://www.youtube.com/results?search_query=${query}`

  const spotifyUrl = `${config.spotifySearchUrl}${query}`
  const appleMusicUrl = `${config.appleMusicSearchUrl}${query}`
  const ytMusicUrl = `${config.youtubeMusicSearchUrl}${query}`
  const jiosaavnUrl = `${config.jiosaavnSearchUrl}${query}`

  return (
    <div
      className={cn(
        'pointer-events-auto fixed z-70 transition-all duration-300 ease-out shadow-2xl overflow-hidden',
        isMinimized
          ? 'bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-8 md:w-[480px] rounded-2xl bg-background/95 border border-border backdrop-blur-xl p-3'
          : 'bottom-2 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 md:left-auto md:right-8 md:w-[480px] rounded-2xl bg-background/95 border border-border backdrop-blur-xl p-3 sm:p-4',
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

      {/* Official YouTube Embed Player */}
      <div
        className={cn('relative mt-3 overflow-hidden rounded-xl bg-black transition-all duration-300', {
          'h-48 sm:h-56 md:h-64 opacity-100': !isMinimized,
          'h-0 opacity-0 pointer-events-none mt-0': isMinimized,
        })}
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

      {/* Cross-platform Listen Links (Clean responsive layout with zero overflow) */}
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
