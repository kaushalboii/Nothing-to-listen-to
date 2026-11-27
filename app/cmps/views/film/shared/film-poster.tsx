import { type PointerEventHandler, useState } from 'react'
import config from '../../../../config'
import { cn } from '../../../../utils/tw'
import type { Film } from '../../../../vf'

export const FilmPoster = ({
  film,
  onPointerOver,
  className = '',
}: {
  film: {
    tmdbId?: number
    title: Film['title']
    poster?: Film['poster']
  }
  onPointerOver?: PointerEventHandler<HTMLImageElement>
  className?: string
}) => {
  const [useLocalFallback, setUseLocalFallback] = useState(false)
  const [hasError, setHasError] = useState(false)
  const rawBase = import.meta.env.BASE_URL || '/'
  const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

  let src = ''
  if (useLocalFallback) {
    src = `${normalizedBase}/media/single/${film.tmdbId ?? 0}.jpg`
  } else if (film.poster?.startsWith('http')) {
    src = film.poster
  } else if (film.poster?.startsWith('/')) {
    src = `${normalizedBase}${film.poster}`
  } else if (film.poster) {
    src = `${config.posterBaseUrl}${film.poster}`
  } else {
    src = `${normalizedBase}/media/single/${film.tmdbId ?? 0}.jpg`
  }

  if (hasError || !src) {
    return (
      <div
        className={cn(
          'group relative flex aspect-square select-none flex-col items-center justify-center overflow-hidden rounded-lg border border-zinc-700/50 bg-zinc-900 shadow-inner',
          className,
        )}
      >
        <div className='pointer-events-none absolute inset-2 rounded-full border border-zinc-700/40' />
        <div className='pointer-events-none absolute inset-6 rounded-full border border-zinc-800' />
        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 shadow-lg'>
          <div className='h-3 w-3 rounded-full border border-zinc-600 bg-zinc-950' />
        </div>
        <span className='mt-2 line-clamp-1 max-w-[85%] px-2 text-center font-medium text-[11px] text-zinc-400'>
          {film.title}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      crossOrigin='anonymous'
      alt={film.title}
      className={cn(
        'aspect-square rounded-md object-cover shadow-md transition-opacity duration-300',
        className,
      )}
      onError={() => {
        if (!useLocalFallback) {
          setUseLocalFallback(true)
        } else {
          setHasError(true)
        }
      }}
      onPointerOver={onPointerOver}
    />
  )
}

export const AlbumCover = FilmPoster
