import { Smartphone } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { THEME } from '../../../consts'
import { useMediaQuery } from '../../../hooks/use-media-query'
import { useShallowState } from '../../../store'
import { isDefined } from '../../../utils/misc'
import { down } from '../../../utils/mq'
import { cn } from '../../../utils/tw'
import { VOROFORCE_PRESET } from '../../../vf'
import {
  CELL_LIMIT,
  DEVICE_CLASS,
  PRESET_ITEMS,
  type PresetItem,
} from '../../../vf/consts'
import { Button, type ButtonProps } from '../../ui/button'
import { AnimateDimensionsChange } from '../animate-dimensions-change'
import { FadeTransition } from '../fade-transition'
import { CellLimitSelector } from './cell-limit-selector'
import { PresetSelector } from './preset-selector'

export function CoreSettingsWidget({
  className = '',
  onSubmit,
  submitLabel = 'Apply',
  submitProps,
  submitVisibility = 'dirty',
  hideSelectorsOnMobile = false,
}: {
  className?: string
  onSubmit?: () => void
  submitLabel?: string | ReactNode
  submitProps?: ButtonProps
  submitVisibility?: 'dirty' | 'always'
  hideSelectorsOnMobile?: boolean
}) {
  const {
    storeDeviceClass,
    estimatedDeviceClass,
    setStorePreset,
    storePreset,
    setStoreCellLimit,
    storeCellLimit,
    theme,
    setTheme,
    setPlayedIntro,
  } = useShallowState((state) => ({
    setStorePreset: state.setPreset,
    storePreset: state.preset,
    setStoreCellLimit: state.setCellLimit,
    storeCellLimit: state.cellLimit,
    storeDeviceClass: state.deviceClass,
    estimatedDeviceClass: state.estimatedDeviceClass,
    theme: state.theme,
    setTheme: state.setTheme,
    setPlayedIntro: state.setPlayedIntro,
  }))

  const isSmallScreen = useMediaQuery(down('md'))
  const isMobile =
    isSmallScreen ||
    (typeof window !== 'undefined' && window.innerWidth < 768)

  const rawDeviceClass = isDefined(storeDeviceClass)
    ? storeDeviceClass
    : estimatedDeviceClass

  // Self-heal stale mobile class on desktop screens
  const deviceClass =
    !isMobile &&
    (rawDeviceClass === DEVICE_CLASS.mobile || !isDefined(rawDeviceClass))
      ? DEVICE_CLASS.high
      : rawDeviceClass

  const [preset, setPreset] = useState<VOROFORCE_PRESET | undefined>(
    storePreset && (!isMobile ? storePreset !== VOROFORCE_PRESET.mobile : true)
      ? storePreset
      : (isMobile
        ? VOROFORCE_PRESET.mobile
        : isDefined(deviceClass) && deviceClass !== DEVICE_CLASS.mobile
          ? (
              PRESET_ITEMS.filter(
                (p) => !Array.isArray(p) && p.id !== VOROFORCE_PRESET.mobile,
              ) as PresetItem[]
            ).find((p) =>
              isDefined(p.recommendedDeviceClass)
                ? p.recommendedDeviceClass <= deviceClass
                : true,
            )?.id ?? VOROFORCE_PRESET.depth
          : VOROFORCE_PRESET.depth),
  )

  const [cellLimit, setCellLimit] = useState<CELL_LIMIT | undefined>(
    storeCellLimit && (!isMobile ? true : storeCellLimit <= CELL_LIMIT.xs)
      ? storeCellLimit
      : CELL_LIMIT.min,
  )

  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  return (
    <AnimateDimensionsChange
      axis='height'
      className='overflow-visible'
      innerClassName={cn('flex flex-col gap-4', className)}
    >
      {isMobile ? (
        <div className='flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3.5 text-xs'>
          <div className='flex items-center gap-2.5'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400'>
              <Smartphone className='h-4 w-4' />
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-zinc-100'>Mobile Galaxy</span>
              <span className='text-xxs text-zinc-400'>
                3D Spherical Galaxy (5,000 albums)
              </span>
            </div>
          </div>
          <span className='rounded-full bg-amber-500/20 px-2.5 py-1 font-bold text-amber-400 text-xxs'>
            5,000
          </span>
        </div>
      ) : (
        <>
          <PresetSelector
            className={cn(hideSelectorsOnMobile && 'max-md:hidden')}
            value={preset}
            onValueChange={(value: VOROFORCE_PRESET) => {
              setPreset(value)
              setIsDirty(value !== storePreset || cellLimit !== storeCellLimit)
            }}
            deviceClass={deviceClass}
          />
          <CellLimitSelector
            className={cn(hideSelectorsOnMobile && 'max-md:hidden')}
            value={cellLimit}
            onValueChange={(value: CELL_LIMIT) => {
              setCellLimit(value)
              setIsDirty(preset !== storePreset || value !== storeCellLimit)
            }}
            deviceClass={deviceClass}
          />
        </>
      )}
      <FadeTransition
        transitionOptions={{
          initialEntered: submitVisibility === 'always',
          timeout: 0,
        }}
        visible={submitVisibility === 'always' || isDirty}
      >
        <Button
          onClick={() => {
            if (isSubmitted) return
            setIsSubmitted(true)
            const newPreset = isMobile
              ? VOROFORCE_PRESET.mobile
              : isDefined(preset)
                ? preset
                : VOROFORCE_PRESET.minimal
            if (
              theme === THEME.light &&
              newPreset !== VOROFORCE_PRESET.minimal
            ) {
              setTheme(THEME.dark)
            }
            setStorePreset(newPreset)
            setStoreCellLimit(
              isMobile
                ? CELL_LIMIT.xs
                : isDefined(cellLimit)
                  ? cellLimit
                  : CELL_LIMIT.sm,
            )
            setPlayedIntro(true)
            onSubmit?.()
          }}
          size='lg'
          disabled={!isMobile && (!isDefined(preset) || !isDefined(cellLimit))}
          {...submitProps}
          className={cn(
            'w-full cursor-pointer text-lg',
            submitProps?.className,
          )}
        >
          {submitLabel}
        </Button>
      </FadeTransition>
    </AnimateDimensionsChange>
  )
}
