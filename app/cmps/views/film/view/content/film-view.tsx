import { Disc3, Music2, Play } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import config from '../../../../../config'
import { useMediaQuery } from '../../../../../hooks/use-media-query'
import { store } from '../../../../../store'
import type { ActiveTrack } from '../../../../../store/player-slice'
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

  const filmRef = useRef<Film>(undefined)
  const ua = store((state) => state.ua)
  const isPlaying = store(
    (state) =>
      state.playerOpen &&
      Boolean(
        state.activeTrack &&
          (state.activeTrack.albumTitle === film?.title ||
            state.activeTrack.title === film?.title),
      ),
  )

  const [backdropHidden, setBackdropHidden] = useState(true)
  const [backdropErrored, setBackdropErrored] = useState(true)

  useEffect(() => {
    if (filmRef.current?.tmdbId !== film?.tmdbId) {
      setBackdropHidden(true)
    }
    filmRef.current = film
  }, [film])

  const isIOS = useMemo(() => ua.getOS()?.name === 'iOS', [ua])

  const albumTracks: ActiveTrack[] = useMemo(() => {
    if (!film) return []
    if (film.tracks && film.tracks.length > 0) {
      return film.tracks.map((t) => ({
        title: t.title,
        artist: film.artist,
        albumTitle: film.title,
        cover: film.poster,
        videoId: t.videoId || film.youtubeId,
        audioUrl: t.audioUrl || film.audioUrl,
        query: `${film.artist} ${t.title}`,
      }))
    }
    const firstTitle = film.title
    return [
      {
        title: firstTitle,
        artist: film.artist,
        albumTitle: film.title,
        cover: film.poster,
        videoId: film.youtubeId,
        audioUrl: film.audioUrl,
        query: `${film.artist} ${firstTitle}`,
      },
    ]
  }, [film])

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
      <div
        className={cn('relative overflow-hidden landscape:h-full', className)}
      >
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
                'h-full w-full scale-125 object-cover object-center opacity-0 blur-2xl filter transition-opacity duration-700 will-change-[opacity]',
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

        <div className='relative z-1 flex h-full max-h-[85vh] w-full flex-col overflow-y-auto p-4 pb-16 md:p-6 md:pb-20 lg:p-8'>
          {/* Main Album Header with Vinyl & Artwork */}
          <div className='flex flex-col items-start gap-6 md:flex-row'>
            {/* Album Sleeve & Vinyl Record Graphic */}
            <div className='group/vinyl relative mx-auto shrink-0 md:mx-0'>
              {/* Spinning Vinyl Record (slides out) */}
              <div
                className={cn(
                  'absolute top-2 left-6 z-0 flex h-36 w-36 items-center justify-center rounded-full border-4 border-neutral-800 bg-neutral-950 shadow-2xl transition-all duration-700 ease-out md:h-44 md:w-44',
                  {
                    'translate-x-12 rotate-180 md:translate-x-18': isPlaying,
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
                    'flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-inner md:h-14 md:w-14',
                    {
                      'animate-[spin_4s_linear_infinite]': isPlaying,
                    },
                  )}
                >
                  <Disc3 className='size-6 md:size-7' />
                </div>
              </div>

              {/* Album Cover Sleeve */}
              <div className='relative z-10 h-40 w-40 overflow-hidden rounded-lg border border-border/50 bg-card shadow-2xl md:h-48 md:w-48'>
                <FilmPoster
                  film={film}
                  className='h-full w-full object-cover transition-transform duration-300 group-hover/vinyl:scale-105'
                />
              </div>
            </div>

            {/* Album Details */}
            <div className='flex w-full grow flex-col justify-between gap-3'>
              <div>
                <p className='mb-1 flex items-center gap-1.5 font-black text-primary text-xs uppercase tracking-widest md:text-sm'>
                  <Music2 className='size-4' />
                  {film.artist}
                </p>
                <div className='flex items-start justify-between gap-4'>
                  <h2 className='font-black text-2xl text-foreground leading-tight md:text-3xl lg:text-4xl'>
                    {film.title}
                    {film.year && (
                      <span className='ml-2 font-normal text-muted-foreground text-xl md:text-2xl'>
                        ({film.year})
                      </span>
                    )}
                  </h2>
                  <FilmRatingGauge value={film.rating} />
                </div>

                {film.tagline && (
                  <p className='mt-2 text-muted-foreground text-sm italic md:text-base'>
                    "{film.tagline}"
                  </p>
                )}
              </div>

              {/* Genre & Language Badges */}
              <div className='my-2 flex flex-wrap gap-1.5'>
                {film.language && (
                  <Badge
                    variant='default'
                    className='bg-primary px-2.5 py-0.5 font-bold text-primary-foreground text-xs'
                  >
                    {film.language}
                  </Badge>
                )}
                {film.genres?.map((genre) => (
                  <Badge
                    key={genre}
                    variant='secondary'
                    className='px-2 py-0.5 font-medium text-xs'
                  >
                    {genre}
                  </Badge>
                ))}
              </div>

              {/* Audio & Streaming Controls */}
              <div className='flex flex-wrap items-center gap-2.5 border-border/40 border-t pt-2'>
                <Button
                  size='sm'
                  onClick={() => {
                    store.getState().playPlaylist(albumTracks, 0)
                  }}
                  className='cursor-pointer gap-2 bg-red-600 font-bold text-white shadow-md transition-all hover:bg-red-700'
                >
                  <Play className='size-4 fill-white' /> Play Song
                </Button>
              </div>
            </div>
          </div>

          {/* Album Overview & Story */}
          {film.overview && (
            <div className='mt-6 border-border/40 border-t pt-4'>
              <h4 className='mb-2 font-bold text-muted-foreground text-xs uppercase tracking-wider'>
                About this Record
              </h4>
              <p className='text-foreground/90 text-sm leading-relaxed md:text-base'>
                {film.overview}
              </p>
            </div>
          )}

          {/* Tracklist Accordion / Section */}
          {film.tracks && film.tracks.length > 0 && (
            <div className='mt-6 border-border/40 border-t pt-4'>
              <h4 className='mb-3 flex items-center justify-between font-bold text-muted-foreground text-xs uppercase tracking-wider'>
                <span>Tracklist</span>
                <span className='font-normal text-muted-foreground/70'>
                  {film.tracks.length} tracks
                </span>
              </h4>
              <div className='grid grid-cols-1 gap-2 font-medium text-xs md:grid-cols-2 md:text-sm'>
                {film.tracks.map((track) => {
                  const trackQuery = encodeURIComponent(
                    `${film.artist} ${track.title}`.trim(),
                  )
                  return (
                    <div
                      key={track.number}
                      className='group/track flex cursor-pointer items-center justify-between rounded-lg border border-transparent p-2 transition-all hover:border-border/60 hover:bg-muted/70'
                      onClick={() => {
                        const trackIdx = film.tracks
                          ? film.tracks.findIndex(
                              (t) =>
                                t.number === track.number ||
                                t.title === track.title,
                            )
                          : 0
                        store
                          .getState()
                          .playPlaylist(
                            albumTracks,
                            trackIdx >= 0 ? trackIdx : 0,
                          )
                      }}
                    >
                      <div className='mr-2 flex items-center gap-2.5 truncate'>
                        <span className='w-4 text-right font-mono text-muted-foreground text-xs group-hover/track:hidden'>
                          {track.number}
                        </span>
                        <Play className='hidden size-3.5 shrink-0 fill-primary text-primary group-hover/track:inline-block' />
                        <span className='truncate font-medium text-foreground/90 transition-colors group-hover/track:text-primary'>
                          {track.title}
                        </span>
                      </div>

                      <div className='flex shrink-0 items-center gap-2'>
                        <div className='flex items-center gap-1.5 opacity-0 transition-opacity group-hover/track:opacity-100'>
                          <a
                            href={`${config.spotifySearchUrl}${trackQuery}`}
                            target='_blank'
                            rel='noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            className='rounded bg-emerald-500/10 px-1.5 py-0.5 font-bold text-[0.65rem] text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
                            title='Listen on Spotify'
                          >
                            SP
                          </a>
                          <a
                            href={`${config.appleMusicSearchUrl}${trackQuery}`}
                            target='_blank'
                            rel='noreferrer'
                            onClick={(e) => e.stopPropagation()}
                            className='rounded bg-pink-500/10 px-1.5 py-0.5 font-bold text-[0.65rem] text-pink-600 hover:bg-pink-500/20 dark:text-pink-400'
                            title='Listen on Apple Music'
                          >
                            AM
                          </a>
                        </div>
                        <span className='font-mono text-muted-foreground text-xs'>
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
