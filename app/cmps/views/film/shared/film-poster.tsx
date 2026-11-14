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
          'aspect-square flex flex-col items-center justify-center rounded-lg bg-zinc-900 border border-zinc-700/50 shadow-inner relative overflow-hidden group select-none',
          className,
        )}
      >
        <div className='absolute inset-2 rounded-full border border-zinc-700/40 pointer-events-none' />
        <div className='absolute inset-6 rounded-full border border-zinc-800 pointer-events-none' />
        <div className='w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg'>
          <div className='w-3 h-3 rounded-full bg-zinc-950 border border-zinc-600' />
        </div>
        <span className='mt-2 px-2 text-[11px] font-medium text-zinc-400 text-center line-clamp-1 max-w-[85%]'>
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
        'aspect-square object-cover rounded-md shadow-md transition-opacity duration-300',
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
