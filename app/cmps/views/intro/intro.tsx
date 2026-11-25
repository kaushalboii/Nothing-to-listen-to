import { useEffect, useReducer, useState } from 'react'
import { store, useShallowState } from '../../../store'
import { isDefined } from '../../../utils/misc'
import { cn } from '../../../utils/tw'
import { VOROFORCE_MODE } from '../../../vf'
import { CELL_LIMIT, DEVICE_CLASS, OBSCURE_VISUAL_DEFECTS, VOROFORCE_PRESET } from '../../../vf/consts'
import { Button } from '../../ui/button'
import { CoreSettingsWidget } from '../../common/core-settings/core-settings-widget'
import { DeviceClassWidget } from '../../common/device-class/device-class-widget'
import { FadeTransition } from '../../common/fade-transition'

const isMobileDevice =
  typeof window !== 'undefined' &&
  ('ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    window.innerWidth < 768)

export const Intro = () => {
  const { preset, hasDeviceClass } = useShallowState((state) => ({
    preset: state.preset,
    hasDeviceClass: isDefined(state.deviceClass),
  }))

  const [initialPreset] = useState(preset)

  useEffect(() => {
    if (isMobileDevice) {
      const state = store.getState()
      if (!isDefined(state.deviceClass)) {
        state.setDeviceClass(DEVICE_CLASS.mobile)
      }
      if (!state.preset || state.preset === VOROFORCE_PRESET.minimal) {
        state.setPreset(VOROFORCE_PRESET.mobile)
      }
      if (
        !state.cellLimit ||
        state.cellLimit === CELL_LIMIT.min ||
        state.cellLimit > CELL_LIMIT.xs
      ) {
        state.setCellLimit(CELL_LIMIT.xs)
      }
    }
  }, [])

  const visible = useIntroVisible()

  return (
    <FadeTransition
      className={cn(
        'fixed inset-x-0 top-0 z-60 flex h-dvh w-full justify-center bg-background px-12 duration-700',
        {
          '!duration-0': visible,
        },
      )}
      visible={visible}
      transitionOptions={{
        initialEntered: visible,
        timeout: visible ? 0 : 700,
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
          <p className='mt-3 text-sm text-muted-foreground font-medium'>
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
              'flex flex-col items-center gap-2.5 w-full max-w-xs mx-auto pb-6 animate-in fade-in duration-500',
              !isMobileDevice && 'md:hidden',
            )}
          >
            <Button
              size='lg'
              onClick={() => {
                const state = store.getState()
                state.setDeviceClass(DEVICE_CLASS.mobile)
                state.setPreset(VOROFORCE_PRESET.mobile)
                state.setCellLimit(CELL_LIMIT.xs)
                state.setPlayedIntro(true)
              }}
              className='w-full h-12 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 cursor-pointer active:scale-95 transition-transform'
            >
              Start Listening
            </Button>
            <span className='text-[11px] text-muted-foreground text-center font-medium'>
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
    An interactive WebGL galaxy celebrating 60+ years of legendary vinyl & recorded music.
  </span>
)

const DEFAULT_REVEAL_SCREEN_DELAY = 1200
const DEFAULT_PREVIEW_MODE_REVEAL_SCREEN_DELAY = 600

let hideScreen =
  OBSCURE_VISUAL_DEFECTS &&
  (!isMobileDevice || !store.getState().playedIntro || !store.getState().preset)

function useIntroVisible() {
  const { introRequired, voroforceMediaPreloaded, revealScreenDelay } =
    useShallowState((state) => ({
      introRequired: !state.playedIntro || !state.preset,
      voroforceMediaPreloaded: state.voroforceMediaPreloaded,
      revealScreenDelay: state.config?.revealScreenDelay
        ? (state.config.revealScreenDelay.modes?.[state.mode] ??
          state.config.revealScreenDelay.default)
        : state.mode === VOROFORCE_MODE.preview
          ? DEFAULT_PREVIEW_MODE_REVEAL_SCREEN_DELAY
          : DEFAULT_REVEAL_SCREEN_DELAY,
    }))

  if (OBSCURE_VISUAL_DEFECTS) {
    const [, forceUpdate] = useReducer((x) => x + 1, 0)
    // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
    useEffect(() => {
      const initialDelay = isMobileDevice
        ? Math.min(revealScreenDelay, 250)
        : revealScreenDelay
      const timeoutId = setTimeout(() => {
        hideScreen = false
        forceUpdate()
      }, initialDelay)
      return () => clearTimeout(timeoutId)
    }, [revealScreenDelay])

    useEffect(() => {
      if (isMobileDevice) {
        const mobileSafetyTimer = setTimeout(() => {
          hideScreen = false
          forceUpdate()
        }, 1500)
        return () => clearTimeout(mobileSafetyTimer)
      }
    }, [])

    useEffect(() => {
      let timeout: NodeJS.Timeout
      let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0

      const onResize = () => {
        const currentWidth = window.innerWidth
        // On mobile and touch devices, scrolling triggers window resize due to dynamic address bar expand/collapse.
        // Never obscure the screen on mobile or when width hasn't significantly changed (>= 50px).
        if (isMobileDevice || Math.abs(currentWidth - lastWidth) < 50) {
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
        }, Math.min(revealScreenDelay, 300))
      }
      window.addEventListener('resize', onResize)
      return () => {
        window.removeEventListener('resize', onResize)
      }
    }, [revealScreenDelay])
  }

  return introRequired || hideScreen || !voroforceMediaPreloaded
}
