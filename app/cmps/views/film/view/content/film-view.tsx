import { useEffect, useMemo, useRef, useState } from 'react'
import { Disc3, Music2, Pause, Play, Volume2 } from 'lucide-react'
import config from '../../../../../config'
import { useMediaQuery } from '../../../../../hooks/use-media-query'
import { store } from '../../../../../store'
import {
  playAlbumPreview,
  stopAlbumPreview,
} from '../../../../../utils/audio-synth'
import { down, orientation } from '../../../../../utils/mq'
import { cn } from '../../../../../utils/tw'
import type { Film } from '../../../../../vf'
import { AnimateDimensionsChange } from '../../../../common/animate-dimensions-change'
import { Badge } from '../../../../ui/badge'
import { Button } from '../../../../ui/button'
import { FilmPoster } from '../../shared/film-poster'
import { FilmRatingGauge } from '../../shared/film-rating-gauge'

export const FilmView = ({
  film,
  className = '',
}: { film?: Film; className?: string }) => {
  const isSmallScreen = useMediaQuery(down('md'))
  const isLandscape = useMediaQuery(orientation('landscape'))
  const [viewHovered, setViewHovered] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const filmRef = useRef<Film>(undefined)
  const ua = store((state) => state.ua)

  const [backdropHidden, setBackdropHidden] = useState(true)
  const [backdropErrored, setBackdropErrored] = useState(true)

  useEffect(() => {
    if (filmRef.current?.tmdbId !== film?.tmdbId) {
      setBackdropHidden(true)
      stopAlbumPreview()
      setIsPlaying(false)
    }
    filmRef.current = film
  }, [film])

  useEffect(() => {
    return () => {
      stopAlbumPreview()
    }
  }, [])

  const handleTogglePlay = () => {
    if (!film) return
    if (isPlaying) {
      stopAlbumPreview()
      setIsPlaying(false)
    } else {
      setIsPlaying(true)
      playAlbumPreview(film.tmdbId, (step) => {
        setCurrentStep(step)
      })
    }
  }

  const isIOS = useMemo(() => ua.getOS()?.name === 'iOS', [ua])

  if (!film) return null

  return (
    <AnimateDimensionsChange
      enabled={!(isSmallScreen && isLandscape)}
      axis='height'
      className='relative ease-linear max-lg:landscape:static'
      duration={300}
      delay={0}
      {...(!isSmallScreen && {
        onMouseEnter: () => setViewHovered(true),
        onMouseLeave: () => setViewHovered(false),
      })}
    >
      <div className={cn('landscape:h-full relative overflow-hidden', className)}>
        {/* Ambient album backdrop glow */}
        <div
          className={cn(
            'absolute inset-0 h-full w-full transition-colors duration-700',
            {
              '!bg-background': viewHovered,
              'bg-background/80 backdrop-blur-md':
                isSmallScreen || isIOS || backdropErrored || backdropHidden,
            },
          )}
        >
          {!isIOS && (
            <img
              className={cn(
                'h-full w-full object-cover object-center opacity-0 transition-opacity duration-700 filter blur-2xl scale-125 will-change-[opacity]',
                {
                  '!w-0 !h-0': backdropErrored,
                  '!opacity-25 dark:!opacity-20': !backdropHidden,
                },
              )}
              alt=''
              src={`${config.backdropBaseUrl}${film.backdrop}`}
              onLoad={() => {
                setBackdropHidden(false)
                setBackdropErrored(false)
              }}
              onError={() => {
                setBackdropErrored(true)
              }}
            />
          )}
        </div>

        <div className='relative z-1 flex h-full w-full flex-col p-4 md:p-6 lg:p-8 max-h-[85vh] overflow-y-auto'>
          {/* Main Album Header with Vinyl & Artwork */}
          <div className='flex flex-col md:flex-row gap-6 items-start'>
            {/* Album Sleeve & Vinyl Record Graphic */}
            <div className='relative group/vinyl shrink-0 mx-auto md:mx-0'>
              {/* Spinning Vinyl Record (slides out) */}
              <div
                className={cn(
                  'absolute top-2 left-6 h-36 w-36 md:h-44 md:w-44 rounded-full bg-neutral-950 border-4 border-neutral-800 shadow-2xl flex items-center justify-center transition-all duration-700 ease-out z-0',
                  {
                    'translate-x-12 md:translate-x-18 rotate-180': isPlaying,
                    'group-hover/vinyl:translate-x-8': !isPlaying,
                  },
                )}
              >
                {/* Vinyl Grooves */}
                <div className='absolute inset-2 rounded-full border border-neutral-700/40' />
                <div className='absolute inset-5 rounded-full border border-neutral-700/30' />
                <div className='absolute inset-8 rounded-full border border-neutral-700/20' />
                <div className='absolute inset-11 rounded-full border border-neutral-700/20' />

                {/* Center Disc Label with Rotating Vinyl Icon */}
                <div
                  className={cn(
                    'h-12 w-12 md:h-14 md:w-14 rounded-full bg-primary/90 flex items-center justify-center text-primary-foreground shadow-inner',
                    {
                      'animate-[spin_4s_linear_infinite]': isPlaying,
                    },
                  )}
                >
                  <Disc3 className='size-6 md:size-7' />
                </div>
              </div>

              {/* Album Cover Sleeve */}
              <div className='relative z-10 h-40 w-40 md:h-48 md:w-48 shadow-2xl rounded-lg overflow-hidden border border-border/50 bg-card'>
                <FilmPoster
                  film={film}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover/vinyl:scale-105'
                />
              </div>
            </div>

            {/* Album Details */}
            <div className='flex flex-col grow justify-between gap-3 w-full'>
              <div>
                <p className='text-xs md:text-sm font-black text-primary tracking-widest uppercase mb-1 flex items-center gap-1.5'>
                  <Music2 className='size-4' />
                  {film.artist}
                </p>
                <div className='flex items-start justify-between gap-4'>
                  <h2 className='font-black text-2xl md:text-3xl lg:text-4xl leading-tight text-foreground'>
                    {film.title}
                    {film.year && (
                      <span className='font-normal text-muted-foreground text-xl md:text-2xl ml-2'>
                        ({film.year})
                      </span>
                    )}
                  </h2>
                  <FilmRatingGauge value={film.rating} />
                </div>

                {film.tagline && (
                  <p className='text-sm md:text-base text-muted-foreground italic mt-2'>
                    "{film.tagline}"
                  </p>
                )}
              </div>

              {/* Genre Badges */}
              <div className='flex flex-wrap gap-1.5 my-2'>
                {film.genres?.map((genre) => (
                  <Badge
                    key={genre}
                    variant='secondary'
                    className='text-xs py-0.5 px-2 font-medium'
                  >
                    {genre}
                  </Badge>
                ))}
              </div>

              {/* Audio & Streaming Controls */}
              <div className='flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/40'>
                <Button
                  size='sm'
                  onClick={() => {
                    const firstTrack = film.tracks?.[0]?.title ?? film.title
                    store.getState().playTrack({
                      title: firstTrack,
                      artist: film.artist,
                      albumTitle: film.title,
                      videoId: film.youtubeId,
                      query: `${film.artist} ${firstTrack}`,
                    })
                  }}
                  className='cursor-pointer gap-2 font-bold transition-all shadow-md bg-red-600 hover:bg-red-700 text-white'
                >
                  <Play className='size-4 fill-white' /> Stream on YouTube
                </Button>

                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleTogglePlay}
                  className={cn(
                    'cursor-pointer gap-2 font-bold transition-all',
                    isPlaying
                      ? 'border-amber-500 text-amber-500'
                      : '',
                  )}
                >
                  {isPlaying ? (
                    <>
                      <Pause className='size-4' /> Synth Preview
                    </>
                  ) : (
                    <>
                      <Play className='size-4' /> Synth Preview
                    </>
                  )}
                </Button>

                {/* Animated Equalizer Waveform */}
                {isPlaying && (
                  <div className='flex items-center gap-1 h-5 px-2 bg-muted/60 rounded-md border border-border/40'>
                    <Volume2 className='size-3.5 text-primary mr-1' />
                    {[0, 1, 2, 3, 4, 5].map((i) => {
                      const h = [6, 14, 18, 10, 16, 8][(currentStep + i) % 6]
                      return (
                        <div
                          key={i}
                          className='w-1 bg-primary rounded-full transition-all duration-150'
                          style={{ height: `${h}px` }}
                        />
                      )
                    })}
                    <span className='text-[0.65rem] font-mono text-muted-foreground ml-1'>
                      LIVE SYNTH
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Album Overview & Story */}
          {film.overview && (
            <div className='mt-6 pt-4 border-t border-border/40'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2'>
                About this Record
              </h4>
              <p className='text-sm md:text-base leading-relaxed text-foreground/90'>
                {film.overview}
              </p>
            </div>
          )}

          {/* Tracklist Accordion / Section */}
          {film.tracks && film.tracks.length > 0 && (
            <div className='mt-6 pt-4 border-t border-border/40'>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between'>
                <span>Tracklist</span>
                <span className='font-normal text-muted-foreground/70'>
                  {film.tracks.length} tracks
                </span>
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2 text-xs md:text-sm font-medium'>
                {film.tracks.map((track) => {
                  const trackQuery = encodeURIComponent(`${film.artist} ${track.title}`.trim())
                  return (
                    <div
                      key={track.number}
                      className='group/track flex items-center justify-between p-2 rounded-lg hover:bg-muted/70 border border-transparent hover:border-border/60 transition-all cursor-pointer'
                      onClick={() => {
                        store.getState().playTrack({
                          title: track.title,
                          artist: film.artist,
                          albumTitle: film.title,
                          videoId: (track as any).videoId || film.youtubeId,
                          query: `${film.artist} ${track.title}`,
                        })
                      }}
                    >
                      <div className='flex items-center gap-2.5 truncate mr-2'>
                        <span className='font-mono text-xs text-muted-foreground w-4 text-right group-hover/track:hidden'>
                          {track.number}
                        </span>
                        <Play className='size-3.5 text-primary shrink-0 hidden group-hover/track:inline-block fill-primary' />
                        <span className='truncate text-foreground/90 font-medium group-hover/track:text-primary transition-colors'>
                          {track.title}
                        </span>
                      </div>

                      <div className='flex items-center gap-2 shrink-0'>
                        <div className='opacity-0 group-hover/track:opacity-100 flex items-center gap-1.5 transition-opacity'>
                          <a
                            href={`${config.spotifySearchUrl}${trackQuery}`}
                            target='_blank'
                            rel='noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            className='text-[0.65rem] px-1.5 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold'
                            title='Listen on Spotify'
                          >
                            SP
                          </a>
                          <a
                            href={`${config.appleMusicSearchUrl}${trackQuery}`}
                            target='_blank'
                            rel='noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            className='text-[0.65rem] px-1.5 py-0.5 rounded bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400 font-bold'
                            title='Listen on Apple Music'
                          >
                            AM
                          </a>
                        </div>
                        <span className='font-mono text-xs text-muted-foreground'>
                          {track.duration}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimateDimensionsChange>
  )
}
