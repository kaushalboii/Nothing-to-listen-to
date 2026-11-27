import { getGPUTier } from 'detect-gpu'
import { store } from '../../store'
import { down, matchMediaQuery } from '../../utils/mq'
import { DEVICE_CLASS } from '../consts'

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false

  // 1. UA check (standard mobile browser)
  const ua = store.getState().ua?.getDevice()
  if (ua?.is('mobile') || ua?.is('tablet')) return true
  if (store.getState().deviceClass === DEVICE_CLASS.mobile) return true

  // 2. Physical hardware screen check (detects mobile phone even in "Desktop site" mode!)
  const screenMinDim =
    typeof window.screen !== 'undefined'
      ? Math.min(window.screen.width, window.screen.height)
      : 9999
  const hasTouch =
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) ||
    (typeof window.matchMedia === 'function' &&
      window.matchMedia('(pointer: coarse)').matches)

  // Every mobile smartphone has a physical screen width < 600px regardless of desktop site zoom
  if (hasTouch && screenMinDim < 600) return true

  // 3. Viewport width check
  if (window.innerWidth < 768) return true

  return false
}

export const estimateDeviceClass = async () => {
  const { estimatedDeviceClass: initialEstimatedDeviceClass } =
    store.getState()

  let estimatedDeviceClass = initialEstimatedDeviceClass

  if (isMobileDevice()) {
    return DEVICE_CLASS.mobile
  }

  const isSmallScreen = matchMediaQuery(down('md')).matches
  if (isSmallScreen) {
    estimatedDeviceClass = DEVICE_CLASS.low
  } else {
    const gpuTier = await getGPUTier()
    switch (gpuTier.tier) {
      case 3:
        estimatedDeviceClass = DEVICE_CLASS.high
        break
      case 2:
        estimatedDeviceClass = DEVICE_CLASS.mid
        break
      default:
        estimatedDeviceClass = DEVICE_CLASS.low
    }
  }

  return estimatedDeviceClass
}
