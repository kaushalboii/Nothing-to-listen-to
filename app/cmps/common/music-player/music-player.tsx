import {
  ChevronDown,
  Disc3,
  ExternalLink,
  ListPlus,
  Loader2,
  Pause,
  Play,
  Radio,
  SkipBack,
  SkipForward,
  Volume2,
  X,
  Youtube,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import config from '../../../config'
import { audioCache } from '../../../services/audio-cache'
import { jamService } from '../../../services/jam-session'
import { store, useShallowState } from '../../../store'
import { cn } from '../../../utils/tw'
import { Button } from '../../ui/button'
import { preloadNextTrackAudio, resolveAdFreeAudioStream } from './audio-stream'

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
    setStoreIsPlaying,
    stopTrack,
    playlist,
    playlistIndex,
    nextTrack,
    prevTrack,
    isJamConnected,
    isJamReconnecting,
    jamRoomCode,
    jamRole,
    allowGuestControl,
    jamLatency,
    jamParticipantCount,
    toggleJamModalOpen,
  } = useShallowState((state) => ({
    activeTrack: state.activeTrack,
    playerOpen: state.playerOpen,
    isMinimized: state.isMinimized,
    setIsMinimized: state.setIsMinimized,
    setStoreIsPlaying: state.setIsPlaying,
    stopTrack: state.stopTrack,
    playlist: state.playlist,
    playlistIndex: state.playlistIndex,
    nextTrack: state.nextTrack,
    prevTrack: state.prevTrack,
    isJamConnected: state.isJamConnected,
    isJamConnecting: state.isJamConnecting,
    isJamReconnecting: state.isJamReconnecting,
    jamRoomCode: state.jamRoomCode,
    jamRole: state.jamRole,
    allowGuestControl: state.allowGuestControl,
    jamLatency: state.jamLatency,
    jamParticipantCount: state.jamParticipantCount,
    toggleJamModalOpen: state.toggleJamModalOpen,
  }))

  const videoId =
    activeTrack?.videoId && activeTrack.videoId.length === 11
      ? activeTrack.videoId
      : FALLBACK_VIDEO_ID

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const [streamMode, setStreamMode] = useState<StreamMode>('resolving')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isOfflineCached, setIsOfflineCached] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Sync playback status with global store so navbar CD can reflect it
  useEffect(() => {
    setStoreIsPlaying(isPlaying)
  }, [isPlaying, setStoreIsPlaying])

  // Mobile swipe down to minimize gesture handler
  const touchStartY = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const deltaY = e.changedTouches[0].clientY - touchStartY.current
      if (deltaY > 50) {
        setIsMinimized(true)
      }
      touchStartY.current = null
    }
  }

  // Manage Blob URL memory cleanup
  const prevBlobUrlRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevBlobUrlRef.current && prevBlobUrlRef.current !== audioUrl) {
      audioCache.revokeBlobUrl(prevBlobUrlRef.current)
    }
    if (audioUrl?.startsWith('blob:')) {
      prevBlobUrlRef.current = audioUrl
    } else {
      prevBlobUrlRef.current = null
    }
  }, [audioUrl])

  // Listen Together (Jam) ultra-smooth playback synchronization
  useEffect(() => {
    const handleRemotePlay = (e: Event) => {
      const { currentTime: remoteTime } = (e as CustomEvent).detail
      const audio = audioRef.current

      if (audio) {
        // Calibrated one-way network transit time estimate in seconds
        const oneWaySec = (jamService.getLatency() || 40) / 1000
        const targetTime =
          (remoteTime !== undefined ? remoteTime : audio.currentTime) + oneWaySec
        const drift = Math.abs(audio.currentTime - targetTime)

        // Hard seek only if severely desynced (> 1.2s) to avoid buffer re-decode mute gap
        if (drift > 1.2) {
          audio.currentTime = targetTime
        }
        void audio.play()
        setIsPlaying(true)
      } else if (iframeRef.current?.contentWindow) {
        try {
          if (remoteTime !== undefined) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [remoteTime, true],
              }),
              '*',
            )
          }
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*',
          )
          setIsPlaying(true)
        } catch (_) {}
      }
    }

    const handleRemotePause = (e: Event) => {
      const { currentTime: remoteTime } = (e as CustomEvent).detail
      const audio = audioRef.current

      if (audio) {
        audio.pause()
        audio.playbackRate = 1.0 // Reset any micro-nudge rate on pause
        if (remoteTime !== undefined) {
          audio.currentTime = remoteTime
        }
        setIsPlaying(false)
      } else if (iframeRef.current?.contentWindow) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
            '*',
          )
          if (remoteTime !== undefined) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({
                event: 'command',
                func: 'seekTo',
                args: [remoteTime, true],
              }),
              '*',
            )
          }
          setIsPlaying(false)
        } catch (_) {}
      }
    }

    const handleRemoteSeek = (e: Event) => {
      const { currentTime: remoteTime } = (e as CustomEvent).detail
      if (audioRef.current && remoteTime !== undefined) {
        audioRef.current.currentTime = remoteTime
      }
      if (remoteTime !== undefined) {
        setCurrentTime(remoteTime)
      }
      if (iframeRef.current?.contentWindow && remoteTime !== undefined) {
        try {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: 'seekTo',
              args: [remoteTime, true],
            }),
              '*',
          )
        } catch (_) {}
      }
    }

    const handleRemoteHeartbeat = (e: Event) => {
      const {
        currentTime: remoteTime,
        isPlaying: remoteIsPlaying,
      } = (e as CustomEvent).detail
      const audio = audioRef.current
      if (!audio || remoteTime === undefined) return

      const oneWaySec = (jamService.getLatency() || 40) / 1000
      const expectedTime = remoteTime + (remoteIsPlaying ? oneWaySec : 0)

      if (remoteIsPlaying) {
        const drift = audio.currentTime - expectedTime

        // Severe desync (> 1.5s): hard seek back into sync
        if (Math.abs(drift) > 1.5) {
          audio.currentTime = expectedTime
          audio.playbackRate = 1.0
        } else if (drift < -0.07) {
          // Behind partner by 70ms-1500ms: micro-speed up by 2.5% to glide into sync without audio pop
          audio.playbackRate = 1.025
        } else if (drift > 0.07) {
          // Ahead of partner by 70ms-1500ms: micro-slow down by 2.5% to let partner catch up
          audio.playbackRate = 0.975
        } else {
          // In sync (< 70ms): return to 1.0x native speed
          if (audio.playbackRate !== 1.0) {
            audio.playbackRate = 1.0
          }
        }

        if (audio.paused) {
          void audio.play()
          setIsPlaying(true)
        }
      } else {
        audio.playbackRate = 1.0
        if (!audio.paused) {
          audio.pause()
          setIsPlaying(false)
        }
        if (Math.abs(audio.currentTime - remoteTime) > 0.1) {
          audio.currentTime = remoteTime
        }
      }
    }

    window.addEventListener('jam:play', handleRemotePlay)
    window.addEventListener('jam:pause', handleRemotePause)
    window.addEventListener('jam:seek', handleRemoteSeek)
    window.addEventListener('jam:heartbeat', handleRemoteHeartbeat)

    return () => {
      window.removeEventListener('jam:play', handleRemotePlay)
      window.removeEventListener('jam:pause', handleRemotePause)
      window.removeEventListener('jam:seek', handleRemoteSeek)
      window.removeEventListener('jam:heartbeat', handleRemoteHeartbeat)
    }
  }, [])

  // Broadcast host heartbeat every 2.5s while playing to keep listeners in sync
  useEffect(() => {
    if (!isJamConnected || jamRole !== 'host' || !isPlaying) return
    const interval = setInterval(() => {
      const time = audioRef.current?.currentTime ?? currentTime
      jamService.broadcastHeartbeat(time, isPlaying)
    }, 2500)
    return () => clearInterval(interval)
  }, [isJamConnected, jamRole, isPlaying, currentTime])

  // Resolve 100% ad-free direct audio stream with instant local CacheStorage playback
  useEffect(() => {
    if (!playerOpen || !activeTrack) {
      setStreamMode('resolving')
      setAudioUrl(null)
      setIsOfflineCached(false)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      return
    }

    if (activeTrack.audioUrl) {
      setAudioUrl(activeTrack.audioUrl)
      setStreamMode('audio')
      return
    }

    const controller = new AbortController()
    setStreamMode('resolving')
    setAudioUrl(null)
    setIsOfflineCached(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)

    void resolveAdFreeAudioStream(activeTrack, controller.signal).then(
      async (resolvedUrl) => {
        if (controller.signal.aborted) return
        if (resolvedUrl) {
          // Check if already in device cache for 0ms offline playback
          const cachedBlob = await audioCache.getCachedAudioBlobUrl(resolvedUrl)
          if (controller.signal.aborted) return

          if (cachedBlob) {
            setAudioUrl(cachedBlob)
            setIsOfflineCached(true)
            setStreamMode('audio')
          } else {
            setAudioUrl(resolvedUrl)
            setIsOfflineCached(false)
            setStreamMode('audio')
            // Cache on device asynchronously for future zero-network replays
            void audioCache
              .cacheAudio(resolvedUrl, activeTrack.title)
              .then((saved) => {
                if (saved) setIsOfflineCached(true)
              })
          }
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
    activeTrack?.audioUrl,
    playlistIndex,
  ])

  // Smart background prefetching for the next track in playlist (after 4s of playback)
  const hasPrefetchedNextRef = useRef(false)
  useEffect(() => {
    hasPrefetchedNextRef.current = false
  }, [playlistIndex, activeTrack?.title])

  useEffect(() => {
    if (!isPlaying || currentTime < 4 || hasPrefetchedNextRef.current) return
    if (playlist && playlist.length > 1) {
      const nextIdx = (playlistIndex + 1) % playlist.length
      const nextItem = playlist[nextIdx]
      if (nextItem) {
        hasPrefetchedNextRef.current = true
        void preloadNextTrackAudio(nextItem)
      }
    }
  }, [currentTime, isPlaying, playlist, playlistIndex])

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

    if (
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      activeTrack
    ) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: activeTrack.title,
          artist: activeTrack.artist,
          album: activeTrack.albumTitle || 'Nothing to Listen to',
          artwork: activeTrack.cover
            ? [
                { src: activeTrack.cover, sizes: '96x96', type: 'image/jpeg' },
                { src: activeTrack.cover, sizes: '128x128', type: 'image/jpeg' },
                { src: activeTrack.cover, sizes: '192x192', type: 'image/jpeg' },
                { src: activeTrack.cover, sizes: '256x256', type: 'image/jpeg' },
                { src: activeTrack.cover, sizes: '384x384', type: 'image/jpeg' },
                { src: activeTrack.cover, sizes: '512x512', type: 'image/jpeg' },
              ]
            : undefined,
        })
        navigator.mediaSession.playbackState = 'playing'

        navigator.mediaSession.setActionHandler('play', () => {
          void audio.play()
        })
        navigator.mediaSession.setActionHandler('pause', () => {
          audio.pause()
        })
        navigator.mediaSession.setActionHandler(
          'previoustrack',
          playlist.length > 1 ? prevTrack : null,
        )
        navigator.mediaSession.setActionHandler(
          'nexttrack',
          playlist.length > 1 ? nextTrack : null,
        )
        try {
          navigator.mediaSession.setActionHandler('seekto', (details) => {
            if (details.seekTime !== undefined && audioRef.current) {
              audioRef.current.currentTime = details.seekTime
              setCurrentTime(details.seekTime)
            }
          })
        } catch (_) {}
      } catch (_) {}
    }
  }, [streamMode, audioUrl, activeTrack, playlist.length, nextTrack, prevTrack])

  // Sync mobile lock-screen & system notification playbackState
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    }
  }, [isPlaying])

  // Sync mobile lock-screen scrubber position
  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      'setPositionState' in navigator.mediaSession &&
      duration > 0 &&
      Number.isFinite(duration) &&
      Number.isFinite(currentTime)
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: 1,
          position: Math.min(Math.max(0, currentTime), duration),
        })
      } catch (_) {}
    }
  }, [currentTime, duration])

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
      if ((window as any).YT?.Player && iframeRef.current) {
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

    if ((window as any).YT?.Player) {
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

  const query = encodeURIComponent(
    `${activeTrack.artist} ${activeTrack.title}`.trim(),
  )

  const directYtWatchUrl =
    activeTrack.videoId && activeTrack.videoId.length === 11
      ? `https://www.youtube.com/watch?v=${activeTrack.videoId}`
      : `https://www.youtube.com/results?search_query=${query}`

  const spotifyUrl = `${config.spotifySearchUrl}${query}`
  const appleMusicUrl = `${config.appleMusicSearchUrl}${query}`
  const ytMusicUrl = `${config.youtubeMusicSearchUrl}${query}`
  const jiosaavnUrl = `${config.jiosaavnSearchUrl}${query}`

  const canControlJam =
    !isJamConnected || jamRole === 'host' || allowGuestControl

  const togglePlayPause = () => {
    if (streamMode === 'audio') {
      const audio = audioRef.current
      if (!audio) return
      if (audio.paused) {
        void audio.play()
        if (isJamConnected && canControlJam) {
          jamService.broadcastPlay(audio.currentTime)
        }
      } else {
        audio.pause()
        if (isJamConnected && canControlJam) {
          jamService.broadcastPause(audio.currentTime)
        }
      }
    } else if (streamMode === 'youtube') {
      if (iframeRef.current?.contentWindow) {
        try {
          const nextPlaying = !isPlaying
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func: nextPlaying ? 'playVideo' : 'pauseVideo',
              args: [],
            }),
            '*',
          )
          setIsPlaying(nextPlaying)
          if (isJamConnected && canControlJam) {
            if (nextPlaying) {
              jamService.broadcastPlay(currentTime)
            } else {
              jamService.broadcastPause(currentTime)
            }
          }
        } catch (_) {}
      }
    }
  }

  if (!playerOpen || !activeTrack) return null

  return (
    <>
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

      {/* Full Expanded Player Modal (shown when not minimized) */}
      {!isMinimized && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={cn(
            'pointer-events-auto fixed z-70 overflow-hidden shadow-2xl transition-all duration-300 ease-out',
            'right-2 bottom-2 left-2 rounded-2xl border border-border bg-background/95 p-3 backdrop-blur-xl sm:right-4 sm:bottom-4 sm:left-4 sm:p-4 md:right-8 md:left-auto md:w-[480px]',
          )}
        >
          {/* Mobile swipe-down pull handle */}
          <div
            className='-mt-1 mb-2 flex w-full cursor-pointer justify-center py-1 sm:hidden'
            onClick={() => setIsMinimized(true)}
            title='Swipe down or tap to minimize'
          >
            <div className='h-1 w-10 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors' />
          </div>

          {/* Player Header / Controls Bar */}
          <div className='flex items-center justify-between gap-3'>
            <div className='flex min-w-0 items-center gap-3'>
              <div className='relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-700 bg-neutral-900 text-amber-500 shadow-md'>
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

              <div className='flex min-w-0 flex-col'>
                <div className='flex min-w-0 items-center gap-1.5'>
                  <p className='truncate font-black text-foreground text-sm leading-tight'>
                    {activeTrack.title}
                  </p>
                  {playlist && playlist.length > 1 && (
                    <span className='shrink-0 rounded-full bg-amber-500/10 px-1.5 py-0.5 font-bold text-[10px] text-amber-500'>
                      {playlistIndex + 1}/{playlist.length}
                    </span>
                  )}
                  {isOfflineCached && (
                    <span
                      className='inline-flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.2 font-bold text-[9px] text-emerald-500'
                      title='Lossless & Offline Cached (Zero Network Usage)'
                    >
                      <Zap className='size-2.5 text-emerald-400' />
                      <span>Cached</span>
                    </span>
                  )}
                </div>
                <p className='truncate font-semibold text-primary text-xs'>
                  {activeTrack.artist}
                </p>
              </div>
            </div>

            {/* Action Controls */}
            <div className='flex shrink-0 items-center gap-1'>
              {isJamConnected && (
                <button
                  type='button'
                  onClick={toggleJamModalOpen}
                  className='mr-1 flex cursor-pointer items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-bold text-[10px] text-emerald-500 transition-colors hover:bg-emerald-500/25'
                  title={`In Jam Session (${jamRoomCode}) • ${jamParticipantCount} connected${jamLatency ? ` • ${jamLatency}ms` : ''}`}
                >
                  <Radio className='size-3 animate-pulse text-emerald-400' />
                  <span className='hidden sm:inline'>Synced</span>
                  <span>{jamParticipantCount > 0 ? `${jamParticipantCount}` : '2+'}</span>
                </button>
              )}

              {isJamReconnecting && (
                <button
                  type='button'
                  onClick={toggleJamModalOpen}
                  className='mr-1 flex animate-pulse cursor-pointer items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-bold text-[10px] text-amber-500 transition-colors hover:bg-amber-500/25'
                  title='Reconnecting to partner...'
                >
                  <Loader2 className='size-3 animate-spin text-amber-400' />
                  <span className='hidden sm:inline'>Reconnecting</span>
                </button>
              )}

              {streamMode === 'audio' && (
                <Button
                  size='icon'
                  variant='ghost'
                  className='size-8 cursor-pointer rounded-full bg-primary text-primary-foreground hover:bg-primary/90'
                  onClick={togglePlayPause}
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className='size-4' />
                  ) : (
                    <Play className='ml-0.5 size-4' />
                  )}
                </Button>
              )}

              {playlist && playlist.length > 1 && (
                <>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7 cursor-pointer rounded-full hover:bg-primary/10'
                    onClick={prevTrack}
                    title='Previous Track'
                  >
                    <SkipBack className='size-3.5' />
                  </Button>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='size-7 cursor-pointer rounded-full hover:bg-primary/10'
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
                className='inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-red-600/10 text-red-600 transition-colors hover:bg-red-600/20'
                title='Watch on YouTube'
              >
                <Youtube className='size-4' />
              </a>

              {/* Add to Playlist Button */}
              <Button
                size='icon'
                variant='ghost'
                className='size-7 cursor-pointer rounded-full text-amber-500 hover:bg-amber-500/10'
                onClick={() => {
                  store.getState().setPlaylistsOpen(true)
                }}
                title='Add to Playlist (or view playlists)'
              >
                <ListPlus className='size-4' />
              </Button>

              {/* Dedicated Minimize Button (always available for 1-tap minimize on mobile & desktop) */}
              <Button
                size='icon'
                variant='ghost'
                className='size-7 cursor-pointer rounded-full hover:bg-primary/10'
                onClick={() => setIsMinimized(true)}
                title='Minimize Player'
              >
                <ChevronDown className='size-4' />
              </Button>

              <Button
                size='icon'
                variant='ghost'
                className='size-7 cursor-pointer rounded-full hover:bg-destructive/10 hover:text-destructive'
                onClick={stopTrack}
                title='Stop Playback'
              >
                <X className='size-4' />
              </Button>
            </div>
          </div>

          {/* Loading Indicator while resolving direct stream */}
          {streamMode === 'resolving' && (
            <div className='mt-3 flex items-center justify-center gap-2 rounded-xl bg-muted/40 py-3 text-muted-foreground text-xs'>
              <Loader2 className='size-4 animate-spin text-primary' />
              <span>Starting audio stream...</span>
            </div>
          )}

          {/* Scrubbable Audio Seek Bar (100% Ad-Free Direct Audio) */}
          {streamMode === 'audio' && (
            <div className='mt-3 flex items-center gap-2.5'>
              <span className='w-9 font-medium text-[11px] text-muted-foreground tabular-nums'>
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
                  if (isJamConnected && canControlJam) {
                    jamService.broadcastSeek(nextTime)
                  }
                }}
                aria-label='Seek audio position'
                className='h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted accent-primary'
              />
              <span className='w-9 text-right font-medium text-[11px] text-muted-foreground tabular-nums'>
                {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Cross-platform Listen Links */}
          <div className='mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-border/40 border-t pt-2 text-xs'>
            <span className='flex shrink-0 items-center gap-1 font-semibold text-[0.7rem] text-muted-foreground'>
              <Volume2 className='size-3 animate-pulse text-emerald-500' />
              Listen:
            </span>
            <div className='flex flex-wrap items-center justify-end gap-1.5'>
              <a
                href={spotifyUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-[11px] text-emerald-600 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400'
              >
                Spotify
                <ExternalLink className='size-2.5' />
              </a>
              <a
                href={appleMusicUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex shrink-0 items-center gap-1 rounded-full bg-pink-500/10 px-2 py-0.5 font-semibold text-[11px] text-pink-600 transition-colors hover:bg-pink-500/20 dark:text-pink-400'
              >
                Apple Music
                <ExternalLink className='size-2.5' />
              </a>
              <a
                href={ytMusicUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex shrink-0 items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 font-semibold text-[11px] text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400'
              >
                YouTube
                <ExternalLink className='size-2.5' />
              </a>
              <a
                href={jiosaavnUrl}
                target='_blank'
                rel='noreferrer'
                className='inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 font-semibold text-[11px] text-teal-600 transition-colors hover:bg-teal-500/20 dark:text-teal-400'
              >
                JioSaavn
                <ExternalLink className='size-2.5' />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Persistent YouTube Fallback Embed (mounted off-screen when minimized so music doesn't stop) */}
      {streamMode === 'youtube' && (
        <div
          className={cn(
            'overflow-hidden rounded-xl bg-black transition-all duration-300',
            !isMinimized
              ? 'fixed z-71 right-4 bottom-20 left-4 sm:right-6 sm:bottom-24 sm:left-auto sm:w-[448px] md:right-10 md:bottom-24 md:w-[448px] h-48 sm:h-56'
              : 'pointer-events-none fixed -left-[9999px] h-1 w-1 opacity-0',
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
    </>
  )
}
