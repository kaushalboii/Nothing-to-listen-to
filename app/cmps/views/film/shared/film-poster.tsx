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
    title: Film['title']
    poster?: Film['poster']
  }
  onPointerOver?: PointerEventHandler<HTMLImageElement>
  className?: string
}) => {
  const [hidden, setHidden] = useState(false)
  const rawBase = import.meta.env.BASE_URL || '/'
  const normalizedBase = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase

  const src =
    film.poster?.startsWith('http')
      ? film.poster
      : film.poster?.startsWith('/')
        ? `${normalizedBase}${film.poster}`
        : `${config.posterBaseUrl}${film.poster ?? ''}`

  return (
    <img
      src={src}
      crossOrigin='anonymous'
      alt={film.title}
      className={cn(
        'aspect-square object-cover rounded-md shadow-md',
        className,
        {
          '!w-0 !h-0 !aspect-none !basis-0': hidden,
        },
      )}
      onLoad={() => {
        setHidden(false)
      }}
      onError={() => {
        setHidden(true)
      }}
      onPointerOver={onPointerOver}
    />
  )
}

export const AlbumCover = FilmPoster
