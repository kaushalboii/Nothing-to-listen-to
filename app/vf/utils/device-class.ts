import { getGPUTier } from 'detect-gpu'
import { store } from '../../store'
import { down, matchMediaQuery } from '../../utils/mq'
import { DEVICE_CLASS } from '../consts'

let cachedIsMobile: boolean | null = null

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  if (cachedIsMobile !== null) return cachedIsMobile

  // 1. UA check (standard mobile browser)
  const ua = store.getState().ua?.getDevice()
  if (ua?.is('mobile') || ua?.is('tablet')) {
    cachedIsMobile = true
    return true
  }
  if (store.getState().deviceClass === DEVICE_CLASS.mobile) {
    cachedIsMobile = true
    return true
  }

  // 2. UA string regex (in case ua-parser missed mobile/tablet in desktop mode)
  if (typeof navigator !== 'undefined') {
    const rawUA = navigator.userAgent || ''
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        rawUA,
      )
    ) {
      cachedIsMobile = true
      return true
    }
    // Chromium navigator.userAgentData
    if ((navigator as any).userAgentData?.mobile) {
      cachedIsMobile = true
      return true
    }
  }

  // 3. WebGL GPU renderer check - Detects physical mobile GPU (Adreno / Mali / Immortalis / Apple GPU)
  // even when mobile browser spoofs desktop User-Agent in "Desktop site" mode!
  try {
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (gl) {
      const dbg = (gl as WebGLRenderingContext).getExtension(
        'WEBGL_debug_renderer_info',
      )
      if (dbg) {
        const renderer = (
          (gl as WebGLRenderingContext).getParameter(
            dbg.UNMASKED_RENDERER_WEBGL,
          ) || ''
        ).toLowerCase()
        if (
          /adreno|mali|immortalis|xclipse|powervr|apple\s+a\d+/i.test(renderer)
        ) {
          cachedIsMobile = true
          return true
        }
      }
    }
  } catch (_) {}

  // 4. Touchscreen & screen ergonomics
  const hasTouch =
    'ontouchstart' in window ||
    (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(any-pointer: coarse)').matches)
  const hasNoHover =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(hover: none)').matches

  const screenMinDim =
    typeof window.screen !== 'undefined'
      ? Math.min(window.screen.width, window.screen.height)
      : 9999

  // Mobile phone screen dimensions or touch coarse pointer without mouse hover
  if (hasTouch && (screenMinDim < 768 || (isCoarsePointer && hasNoHover))) {
    cachedIsMobile = true
    return true
  }

  // 5. Small viewport fallback
  if (window.innerWidth < 768) {
    cachedIsMobile = true
    return true
  }

  cachedIsMobile = false
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
