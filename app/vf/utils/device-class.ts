import { getGPUTier } from 'detect-gpu'
import { store } from '../../store'
import { down, matchMediaQuery } from '../../utils/mq'
import { DEVICE_CLASS } from '../consts'

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false

  // 1. Definite Desktop OS check:
  // macOS (Macintosh, MacIntel), Windows, and Linux desktops are NOT mobile!
  if (typeof navigator !== 'undefined') {
    const rawUA = navigator.userAgent || ''
    const platform = (navigator as any).platform || ''

    const isExplicitMobileUA =
      /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(rawUA)
    const isMacintosh =
      /Macintosh|MacIntel/i.test(rawUA) || /Mac/i.test(platform)
    const isIPad =
      isMacintosh &&
      typeof navigator.maxTouchPoints === 'number' &&
      navigator.maxTouchPoints > 1 &&
      !/Chrome/i.test(rawUA)

    // A real Mac desktop/laptop is NEVER a mobile device
    if (isMacintosh && !isIPad && !isExplicitMobileUA) {
      return false
    }

    // Windows or Linux desktop
    if (
      /Windows NT|X11; Linux x86_64/i.test(rawUA) &&
      !isExplicitMobileUA
    ) {
      return false
    }

    if (isExplicitMobileUA) {
      return true
    }

    if ((navigator as any).userAgentData?.mobile) {
      return true
    }
  }

  // 2. Viewport dimension check: wide screens (>= 1024px) are desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    return false
  }

  // 3. UA check (standard mobile browser via ua-parser)
  const ua = store.getState().ua?.getDevice()
  if (ua?.is('mobile') || ua?.is('tablet')) {
    return true
  }

  // 4. Physical Touchscreen check - All smartphones & tablets have touch screens
  const hasTouch =
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

  // Desktops without touchscreens can never be mobile
  if (!hasTouch) return false

  // 5. Mobile GPU check (Adreno, Mali, Immortalis, PowerVR)
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
        if (/adreno|mali|immortalis|xclipse|powervr/i.test(renderer)) {
          return true
        }
      }
    }
  } catch (_) {}

  // 6. Mobile orientation properties (window.orientation exists almost exclusively on mobile devices)
  if (hasTouch && typeof (window as any).orientation !== 'undefined') {
    return true
  }

  // 7. Screen dimensions & aspect ratio
  if (typeof window.screen !== 'undefined') {
    const minDim = Math.min(window.screen.width, window.screen.height)
    const maxDim = Math.max(window.screen.width, window.screen.height)

    // Physical smartphone screen is always <= 600px width in portrait
    if (minDim <= 600) return true

    // Phone aspect ratio (taller than 1.7:1) with touch on small screen
    if (maxDim / (minDim || 1) >= 1.7 && hasTouch && minDim < 768) {
      return true
    }
  }

  // 8. Small viewport or coarse pointer
  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(any-pointer: coarse)').matches)

  if (hasTouch && isCoarsePointer && window.innerWidth < 768) {
    return true
  }

  if (window.innerWidth < 768) {
    return true
  }

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
