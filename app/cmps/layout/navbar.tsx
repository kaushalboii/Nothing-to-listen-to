import {
  Disc3,
  GithubIcon,
  Heart,
  Info,
  ListMusic,
  Radio,
  Search,
  Settings,
} from 'lucide-react'

import { useShallowState } from '@/store'
import config from '../../config'
import { cn } from '../../utils/tw'
import { VOROFORCE_PRESET } from '../../vf'
import { Button } from '../ui/button'
import { ThemeToggle } from './theme'

export const Navbar = () => {
  const {
    activeTrack,
    isPlaying,
    playerOpen,
    isMinimized,
    setPlayerOpen,
    setIsMinimized,
    settingsOpen,
    toggleSettingsOpen,
    aboutOpen,
    toggleAboutOpen,
    searchOpen,
    toggleSearchOpen,
    favoritesOpen,
    toggleFavoritesOpen,
    playlistsOpen,
    togglePlaylistsOpen,
    playlistsCount,
    jamModalOpen,
    toggleJamModalOpen,
    isJamConnected,
    isJamConnecting,
    isJamReconnecting,
    jamRoomCode,
    hasFavorites,
    canChangeTheme,
  } = useShallowState((state) => ({
    activeTrack: state.activeTrack,
    isPlaying: state.isPlaying,
    playerOpen: state.playerOpen,
    isMinimized: state.isMinimized,
    setPlayerOpen: state.setPlayerOpen,
    setIsMinimized: state.setIsMinimized,
    settingsOpen: state.settingsOpen,
    toggleSettingsOpen: state.toggleSettingsOpen,
    aboutOpen: state.aboutOpen,
    toggleAboutOpen: state.toggleAboutOpen,
    searchOpen: state.searchOpen,
    toggleSearchOpen: state.toggleSearchOpen,
    favoritesOpen: state.favoritesOpen,
    toggleFavoritesOpen: state.toggleFavoritesOpen,
    playlistsOpen: state.playlistsOpen,
    togglePlaylistsOpen: state.togglePlaylistsOpen,
    playlistsCount: state.userConfig.playlists?.length ?? 0,
    jamModalOpen: state.jamModalOpen,
    toggleJamModalOpen: state.toggleJamModalOpen,
    isJamConnected: state.isJamConnected,
    isJamConnecting: state.isJamConnecting,
    isJamReconnecting: state.isJamReconnecting,
    jamRoomCode: state.jamRoomCode,
    hasFavorites:
      state.userConfig.favorites &&
      Object.keys(state.userConfig.favorites).length > 0,
    canChangeTheme:
      state.preset === VOROFORCE_PRESET.minimal ||
      state.preset === VOROFORCE_PRESET.mobile,
  }))

  const handleDiscClick = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e?.currentTarget) {
      e.currentTarget.blur()
    }
    if (!activeTrack) return
    if (!playerOpen) {
      setPlayerOpen(true)
      setIsMinimized(false)
      return
    }
    setIsMinimized(!isMinimized)
  }

  const buttonClassnames =
    '!size-6 [&_svg]:!size-4 lg:!size-8 lg:[&_svg]:!size-5 pointer-events-auto rounded-full cursor-pointer'

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-0 z-50 flex w-full flex-row items-center justify-between gap-1 p-3 md:top-0 md:bottom-auto md:z-60 md:px-9 md:py-9'>
      <div className='pointer-events-auto flex select-none items-center gap-2'>
        <button
          type='button'
          onClick={handleDiscClick}
          title={
            activeTrack
              ? `${activeTrack.title} - ${activeTrack.artist} (${!playerOpen || isMinimized ? 'Click to expand player' : 'Click to minimize'})`
              : 'Nothing to listen to'
          }
          className={cn(
            'group flex select-none items-center gap-2 rounded-full p-1 transition-all duration-200 outline-none -m-1 text-left',
            activeTrack
              ? 'cursor-pointer hover:bg-amber-500/10 active:scale-95'
              : 'cursor-default',
          )}
        >
          {/* Animated Amber / Yellow CD Icon with Cover & Grooves */}
          <div
            className={cn(
              'relative flex size-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 lg:size-8 overflow-hidden shadow-sm',
              activeTrack
                ? 'border-amber-500/70 bg-neutral-900 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-500',
            )}
          >
            {activeTrack?.cover ? (
              <>
                <img
                  src={activeTrack.cover}
                  alt={activeTrack.title}
                  className={cn(
                    'size-full rounded-full object-cover',
                    isPlaying ? 'animate-[spin_4s_linear_infinite]' : 'opacity-90',
                  )}
                />
                <div className='absolute size-2 rounded-full border border-amber-500/70 bg-neutral-950/90' />
                <div className='absolute size-1 rounded-full bg-amber-500' />
              </>
            ) : (
              <Disc3
                className={cn(
                  'size-4 text-amber-500',
                  isPlaying
                    ? 'animate-[spin_4s_linear_infinite]'
                    : activeTrack
                      ? ''
                      : 'animate-[spin_8s_linear_infinite]',
                )}
              />
            )}

            {/* Glowing pulse ring when playing */}
            {isPlaying && (
              <span className='pointer-events-none absolute -inset-0.5 animate-ping rounded-full border border-amber-500/40 opacity-40' />
            )}
          </div>

          {/* Scrolling Song Title Ticker when activeTrack exists */}
          {activeTrack ? (
            <div className='flex flex-col min-w-0 max-w-[125px] xs:max-w-[165px] sm:max-w-[210px] md:max-w-[260px] overflow-hidden'>
              <div className='relative w-full overflow-hidden whitespace-nowrap mask-fade-edges'>
                <div
                  className={cn(
                    'flex w-max gap-6 will-change-transform',
                    isPlaying
                      ? 'animate-[marquee_12s_linear_infinite]'
                      : '[animation-play-state:paused]',
                  )}
                >
                  <span className='font-bold text-xs text-amber-400 group-hover:text-amber-300'>
                    {activeTrack.title} • {activeTrack.artist}
                  </span>
                  <span
                    className='font-bold text-xs text-amber-400 group-hover:text-amber-300'
                    aria-hidden='true'
                  >
                    {activeTrack.title} • {activeTrack.artist}
                  </span>
                </div>
              </div>
              <span className='truncate font-medium text-[10px] text-muted-foreground leading-tight'>
                {isPlaying ? 'Playing' : 'Paused'} • {!playerOpen || isMinimized ? 'Tap to expand' : 'Tap to minimize'}
              </span>
            </div>
          ) : (
            <span className='hidden font-black text-foreground/90 text-xs tracking-tight sm:inline-block md:text-sm'>
              Nothing to listen to
            </span>
          )}
        </button>
      </div>
      <div className='flex flex-row items-center gap-1.5'>
        <Button
          variant='ghost'
          size='icon'
          onClick={(e) => {
            e.currentTarget.blur()
            toggleSearchOpen()
          }}
          title='Search songs (Cmd+K)'
          className={cn(buttonClassnames, {
            'border border-foreground bg-primary/20': searchOpen,
          })}
        >
          <Search />
        </Button>

        {/* Listen Together (Jam) Button */}
        <Button
          variant='ghost'
          size='icon'
          onClick={(e) => {
            e.currentTarget.blur()
            toggleJamModalOpen()
          }}
          title={
            isJamConnected
              ? `In Jam Session (${jamRoomCode}) - 2/2 Synced`
              : isJamReconnecting
                ? `Reconnecting to Jam Session (${jamRoomCode})...`
                : 'Listen Together with a Friend (Jam)'
          }
          className={cn(buttonClassnames, 'relative', {
            'border border-emerald-500 bg-emerald-500/20 text-emerald-400':
              isJamConnected,
            'border border-amber-500/70 bg-amber-500/10 text-amber-500':
              (isJamConnecting || isJamReconnecting) && !isJamConnected,
            'border border-foreground': jamModalOpen && !isJamConnected,
          })}
        >
          <Radio
            className={cn(isJamConnected && 'animate-pulse text-emerald-400')}
          />
          {isJamConnected && (
            <span className='-top-0.5 -right-0.5 absolute flex size-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
              <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
            </span>
          )}
          {(isJamConnecting || isJamReconnecting) && !isJamConnected && (
            <span className='-top-0.5 -right-0.5 absolute flex size-2'>
              <span className='relative inline-flex size-2 animate-pulse rounded-full bg-amber-500' />
            </span>
          )}
        </Button>

        <Button
          variant='ghost'
          size='icon'
          onClick={(e) => {
            e.currentTarget.blur()
            toggleAboutOpen()
          }}
          onPointerDown={(event) => {
            event.currentTarget.blur()
            if (aboutOpen) {
              event.preventDefault()
              event.stopPropagation()
            }
          }}
          className={cn(buttonClassnames, {
            'border border-foreground': aboutOpen,
          })}
        >
          <Info />
        </Button>
        <div className='flex flex-row gap-1'>
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.currentTarget.blur()
              toggleSettingsOpen()
            }}
            onPointerDown={(event) => {
              event.currentTarget.blur()
              if (settingsOpen) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            className={cn(buttonClassnames, {
              'border border-foreground': settingsOpen,
            })}
          >
            <Settings />
          </Button>
          {hasFavorites && (
            <Button
              variant='ghost'
              size='icon'
              onClick={(e) => {
                e.currentTarget.blur()
                toggleFavoritesOpen()
              }}
              onPointerDown={(event) => {
                event.currentTarget.blur()
                if (favoritesOpen) {
                  event.preventDefault()
                  event.stopPropagation()
                }
              }}
              title='Favorites'
              className={cn(buttonClassnames, {
                'border border-foreground': favoritesOpen,
              })}
            >
              <Heart />
            </Button>
          )}
          <Button
            variant='ghost'
            size='icon'
            onClick={(e) => {
              e.currentTarget.blur()
              togglePlaylistsOpen()
            }}
            onPointerDown={(event) => {
              event.currentTarget.blur()
              if (playlistsOpen) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            title={`Playlists (${playlistsCount}/3)`}
            className={cn(buttonClassnames, {
              'border border-amber-500 bg-amber-500/10 text-amber-500':
                playlistsOpen,
            })}
          >
            <ListMusic className={cn(playlistsCount > 0 && 'text-amber-500')} />
          </Button>
        </div>

        <ThemeToggle
          className={cn(buttonClassnames, 'hidden md:inline-flex', {
            'md:hidden': !canChangeTheme,
          })}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
          }}
        />
        <a
          href={config.sourceCodeUrl}
          target='_blank'
          rel='noreferrer noopener'
          title='Source code on GitHub'
          className={cn(
            buttonClassnames,
            'hidden md:inline-flex items-center justify-center hover:bg-accent hover:text-accent-foreground text-foreground transition-colors',
          )}
        >
          <GithubIcon />
        </a>
      </div>
    </div>
  )
}
