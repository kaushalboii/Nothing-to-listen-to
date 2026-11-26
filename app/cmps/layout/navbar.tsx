import { Disc3, GithubIcon, Heart, Info, Radio, Search, Settings } from 'lucide-react'

import { useShallowState } from '@/store'
import config from '../../config'
import { cn } from '../../utils/tw'
import { VOROFORCE_PRESET } from '../../vf'
import { Button } from '../ui/button'
import { ThemeToggle } from './theme'

export const Navbar = () => {
  const {
    settingsOpen,
    toggleSettingsOpen,
    aboutOpen,
    toggleAboutOpen,
    searchOpen,
    toggleSearchOpen,
    favoritesOpen,
    toggleFavoritesOpen,
    jamModalOpen,
    toggleJamModalOpen,
    isJamConnected,
    isJamConnecting,
    jamRoomCode,
    hasFavorites,
    canChangeTheme,
  } = useShallowState((state) => ({
    settingsOpen: state.settingsOpen,
    toggleSettingsOpen: state.toggleSettingsOpen,
    aboutOpen: state.aboutOpen,
    toggleAboutOpen: state.toggleAboutOpen,
    searchOpen: state.searchOpen,
    toggleSearchOpen: state.toggleSearchOpen,
    favoritesOpen: state.favoritesOpen,
    toggleFavoritesOpen: state.toggleFavoritesOpen,
    jamModalOpen: state.jamModalOpen,
    toggleJamModalOpen: state.toggleJamModalOpen,
    isJamConnected: state.isJamConnected,
    isJamConnecting: state.isJamConnecting,
    jamRoomCode: state.jamRoomCode,
    hasFavorites:
      state.userConfig.favorites &&
      Object.keys(state.userConfig.favorites).length > 0,
    canChangeTheme:
      state.preset === VOROFORCE_PRESET.minimal ||
      state.preset === VOROFORCE_PRESET.mobile,
  }))

  const buttonClassnames =
    '!size-6 [&_svg]:!size-4 lg:!size-8 lg:[&_svg]:!size-5 pointer-events-auto rounded-full cursor-pointer'

  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-0 z-10 flex w-full flex-row items-center justify-between gap-1 p-3 md:top-0 md:bottom-auto md:z-60 md:px-9 md:py-9'>
      <div className='pointer-events-auto flex items-center gap-2.5 select-none'>
        <div className='flex size-7 lg:size-8 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-sm'>
          <Disc3 className='size-4 animate-[spin_8s_linear_infinite]' />
        </div>
        <span className='font-black text-xs md:text-sm tracking-tight text-foreground/90 hidden sm:inline-block'>
          Nothing to listen to
        </span>
      </div>
      <div className='flex flex-row items-center gap-1.5'>
      <Button
        variant='ghost'
        size='icon'
        onClick={toggleSearchOpen}
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
        onClick={toggleJamModalOpen}
        title={
          isJamConnected
            ? `In Jam Session (${jamRoomCode}) - 2/2 Synced`
            : 'Listen Together with a Friend (Jam)'
        }
        className={cn(buttonClassnames, 'relative', {
          'border border-emerald-500 bg-emerald-500/20 text-emerald-400': isJamConnected,
          'border border-amber-500/70 bg-amber-500/10 text-amber-500':
            isJamConnecting && !isJamConnected,
          'border border-foreground': jamModalOpen && !isJamConnected,
        })}
      >
        <Radio className={cn(isJamConnected && 'animate-pulse text-emerald-400')} />
        {isJamConnected && (
          <span className='absolute -top-0.5 -right-0.5 flex size-2'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75' />
            <span className='relative inline-flex size-2 rounded-full bg-emerald-500' />
          </span>
        )}
        {isJamConnecting && !isJamConnected && (
          <span className='absolute -top-0.5 -right-0.5 flex size-2'>
            <span className='relative inline-flex size-2 rounded-full bg-amber-500 animate-pulse' />
          </span>
        )}
      </Button>

      <Button
        variant='ghost'
        size='icon'
        onClick={toggleAboutOpen}
        onPointerDown={(event) => {
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
          onClick={toggleSettingsOpen}
          onPointerDown={(event) => {
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
            onClick={toggleFavoritesOpen}
            onPointerDown={(event) => {
              if (favoritesOpen) {
                event.preventDefault()
                event.stopPropagation()
              }
            }}
            className={cn(buttonClassnames, {
              'border border-foreground': favoritesOpen,
            })}
          >
            <Heart />
          </Button>
        )}
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
      <Button
        variant='ghost'
        size='icon'
        onClick={toggleSettingsOpen}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        className={cn(buttonClassnames, 'hidden md:inline-flex')}
      >
        <a
          href={config.sourceCodeUrl}
          target='_blank'
          rel='noreferrer noopener noreferer'
        >
          <GithubIcon />
        </a>
      </Button>
      </div>
    </div>
  )
}
