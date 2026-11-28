import { useEffect, useReducer, useState } from 'react'
import { store, useShallowState } from '../../../store'
import { isDefined } from '../../../utils/misc'
import { cn } from '../../../utils/tw'
import { VOROFORCE_MODE, initVoroforce } from '../../../vf'
import {
  CELL_LIMIT,
  DEVICE_CLASS,
  OBSCURE_VISUAL_DEFECTS,
  VOROFORCE_PRESET,
} from '../../../vf/consts'
import {
  handleModeChange,
  revealVoroforceContainer,
} from '../../../vf/integrations/mode'
import { isMobileDevice } from '../../../vf/utils/device-class'
import { CoreSettingsWidget } from '../../common/core-settings/core-settings-widget'
import { DeviceClassWidget } from '../../common/device-class/device-class-widget'
import { FadeTransition } from '../../common/fade-transition'
import { Button } from '../../ui/button'

export const Intro = () => {
  const { preset, hasDeviceClass } = useShallowState((state) => ({
    preset: state.preset,
    hasDeviceClass: isDefined(state.deviceClass),
  }))

  const [initialPreset] = useState(preset)

  useEffect(() => {
    const state = store.getState()
    const isMobile = isMobileDevice()

    if (
      !isDefined(state.deviceClass) ||
      (isMobile && state.deviceClass !== DEVICE_CLASS.mobile) ||
      (!isMobile && state.deviceClass === DEVICE_CLASS.mobile)
    ) {
      state.setDeviceClass(
        isMobile ? DEVICE_CLASS.mobile : DEVICE_CLASS.high,
      )
    }
    if (
      !state.preset ||
      (isMobile && state.preset !== VOROFORCE_PRESET.mobile) ||
      (!isMobile && state.preset === VOROFORCE_PRESET.mobile)
    ) {
      state.setPreset(
        isMobile ? VOROFORCE_PRESET.mobile : VOROFORCE_PRESET.minimal,
      )
    }
    if (
      !state.cellLimit ||
      state.cellLimit === CELL_LIMIT.min ||
      (isMobile && state.cellLimit > CELL_LIMIT.xs)
    ) {
      state.setCellLimit(CELL_LIMIT.xs)
    }

    // Auto-advance within 500ms so visitors never experience a stalled black screen
    const timer = setTimeout(
      () => {
        revealVoroforceContainer()
        if (!store.getState().voroforce) {
          initVoroforce({ force: true })
        }
        if (!store.getState().playedIntro) {
          store.getState().setPlayedIntro(true)
          handleModeChange(VOROFORCE_MODE.preview)
        }
      },
      isMobile ? 300 : 500,
    )

    return () => clearTimeout(timer)
  }, [])

  const visible = useIntroVisible()

  return (
    <FadeTransition
      className={cn(
        'fixed inset-x-0 top-0 z-60 flex h-dvh w-full justify-center bg-background px-12 duration-500',
        {
          '!duration-0': visible,
          'pointer-events-none invisible opacity-0': !visible,
        },
      )}
      notEnteredClassName='pointer-events-none'
      visible={visible}
      transitionOptions={{
        initialEntered: visible,
        timeout: visible ? 0 : 500,
      }}
    >
      <div className='flex h-full flex-col items-stretch'>
        <div
          className={cn('h-1/3', {
            'max-lg:landscape:hidden [@media(min-aspect-ratio:2.5)]:hidden':
              !initialPreset,
          })}
        />
        <div
          className={cn('flex h-1/3 flex-col items-center justify-center', {
            'max-lg:landscape:h-1/2 max-lg:landscape:justify-start max-lg:landscape:pt-12 [@media(min-aspect-ratio:2.5)]:h-1/2 [@media(min-aspect-ratio:2.5)]:justify-start [@media(min-aspect-ratio:2.5)]:pt-12':
              !initialPreset,
          })}
        >
          <h1 className='font-black text-4xl leading-none md:text-5xl md:leading-none'>
            <span className='inline-flex'>
              <span className='max-md:hidden'>"</span>
              <i>There's nothing</i>
            </span>{' '}
            <span className='relative inline-flex'>
              <i>to listen to</i>
              <span className='max-md:hidden'>"</span>
              <span className='absolute bottom-0 left-full after:animate-ellipsis' />
            </span>
          </h1>
          <p className='mt-3 font-medium text-muted-foreground text-sm'>
            Spin through the timeless albums that defined generations.
          </p>
        </div>
        <div
          className={cn(
            'relative flex h-1/3 flex-col items-stretch justify-end gap-4 pb-12',
            {
              'max-lg:landscape:h-1/2 max-lg:landscape:pb-6 [@media(min-aspect-ratio:2.5)]:h-1/2':
                !initialPreset,
            },
          )}
        >
          {/* Mobile Instant Start Action */}
          <div
            className={cn(
              'fade-in mx-auto flex w-full max-w-xs animate-in flex-col items-center gap-2.5 pb-6 duration-500',
              !isMobileDevice && 'md:hidden',
            )}
          >
            <Button
              size='lg'
              onClick={(e) => {
                e.stopPropagation()
                const state = store.getState()
                state.setDeviceClass(DEVICE_CLASS.mobile)
                state.setPreset(VOROFORCE_PRESET.mobile)
                state.setCellLimit(CELL_LIMIT.xs)
                state.setPlayedIntro(true)
                handleModeChange(VOROFORCE_MODE.preview)
              }}
              className='h-12 w-full cursor-pointer rounded-xl bg-primary font-bold text-primary-foreground text-sm shadow-lg shadow-primary/20 transition-transform active:scale-95'
            >
              Start Listening
            </Button>
            <span className='text-center font-medium text-[11px] text-muted-foreground'>
              Tap any vinyl album to stream music
            </span>
          </div>

          <FadeTransition
            visible={!isMobileDevice && !hasDeviceClass}
            className='absolute inset-x-0 bottom-12 w-full duration-1000 max-md:hidden max-lg:landscape:bottom-6'
            transitionOptions={{
              timeout: 500,
            }}
          >
            <DeviceClassWidget />
            <MoviesDatasetLicenseInfo />
          </FadeTransition>
          <FadeTransition
            visible={!isMobileDevice && hasDeviceClass && !preset}
            className='absolute inset-x-0 bottom-12 w-full duration-1000 max-md:hidden max-lg:landscape:bottom-6'
            transitionOptions={{
              timeout: 500,
            }}
          >
            <CoreSettingsWidget
              submitLabel='Continue'
              submitVisibility='always'
            />
            <MoviesDatasetLicenseInfo />
          </FadeTransition>
        </div>
      </div>
    </FadeTransition>
  )
}

const MoviesDatasetLicenseInfo = () => (
  <span className='inline-flex text-xxs text-zinc-600 leading-none dark:text-zinc-300'>
    An interactive WebGL galaxy celebrating 60+ years of legendary vinyl &
    recorded music.
  </span>
)

const DEFAULT_REVEAL_SCREEN_DELAY = 1200
const DEFAULT_PREVIEW_MODE_REVEAL_SCREEN_DELAY = 600

let hideScreen = false

function useIntroVisible() {
  const { playedIntro, preset, voroforceMediaPreloaded, revealScreenDelay } =
    useShallowState((state) => ({
      playedIntro: state.playedIntro,
      preset: state.preset,
      voroforceMediaPreloaded: state.voroforceMediaPreloaded,
      revealScreenDelay: state.config?.revealScreenDelay
        ? (state.config.revealScreenDelay.modes?.[state.mode] ??
          state.config.revealScreenDelay.default)
        : state.mode === VOROFORCE_MODE.preview
          ? DEFAULT_PREVIEW_MODE_REVEAL_SCREEN_DELAY
          : DEFAULT_REVEAL_SCREEN_DELAY,
    }))

  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  // Fail-safe: Ensure screen is revealed within 500ms max under all conditions
  useEffect(() => {
    const safetyTimer = setTimeout(
      () => {
        hideScreen = false
        if (!store.getState().voroforceMediaPreloaded) {
          revealVoroforceContainer()
        }
        forceUpdate()
      },
      isMobileDevice() ? 250 : 500,
    )
    return () => clearTimeout(safetyTimer)
  }, [])

  if (OBSCURE_VISUAL_DEFECTS) {
    useEffect(() => {
      const initialDelay = isMobileDevice()
        ? Math.min(revealScreenDelay, 150)
        : Math.min(revealScreenDelay, 300)
      const timeoutId = setTimeout(() => {
        hideScreen = false
        forceUpdate()
      }, initialDelay)
      return () => clearTimeout(timeoutId)
    }, [revealScreenDelay])

    useEffect(() => {
      let timeout: NodeJS.Timeout
      let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0

      const onResize = () => {
        const currentWidth = window.innerWidth
        if (isMobileDevice() || Math.abs(currentWidth - lastWidth) < 50) {
          lastWidth = currentWidth
          return
        }
        lastWidth = currentWidth
        hideScreen = true
        forceUpdate()
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          hideScreen = false
          forceUpdate()
        }, 150)
      }
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
      }
    }, [])
  }

  // If intro has already been played or preset exists, intro is not visible
  if (playedIntro && preset) {
    return hideScreen
  }

  const introRequired = !playedIntro || !preset
  return introRequired || hideScreen || !voroforceMediaPreloaded
}
