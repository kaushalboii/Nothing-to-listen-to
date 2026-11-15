import { Disc3, Flame, GithubIcon, Heart, Info, PlusCircle, Search, Settings } from 'lucide-react'

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
    reportOpen,
    toggleReportOpen,
    setReportInitialQuery,
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
    reportOpen: state.reportOpen,
    toggleReportOpen: state.toggleReportOpen,
    setReportInitialQuery: state.setReportInitialQuery,
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
        variant='outline'
        size='sm'
        onClick={toggleSearchOpen}
        title='🔥 Latest Releases of Today & This Week'
        className='pointer-events-auto flex items-center gap-1.5 h-6 lg:h-8 px-2 lg:px-3 rounded-full text-xs font-bold border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shadow-sm cursor-pointer'
      >
        <Flame className='size-3.5 fill-amber-500 text-amber-500 animate-pulse' />
        <span className='hidden sm:inline'>New This Week</span>
      </Button>
      <Button
        variant='outline'
        size='sm'
        onClick={() => {
          setReportInitialQuery('')
          toggleReportOpen()
        }}
        title='🎵 Request / Report Missing Song (Automated Ingestion)'
        className={cn(
          'pointer-events-auto flex items-center gap-1.5 h-6 lg:h-8 px-2 lg:px-3 rounded-full text-xs font-semibold border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary shadow-sm cursor-pointer',
          { 'border-foreground bg-primary/30': reportOpen }
        )}
      >
        <PlusCircle className='size-3.5' />
        <span className='hidden md:inline'>Request Song</span>
      </Button>
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
