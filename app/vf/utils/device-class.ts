import { getGPUTier } from 'detect-gpu'
import { store } from '../../store'
import { down, matchMediaQuery } from '../../utils/mq'
import { DEVICE_CLASS } from '../consts'

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false

  // 1. UA check (standard mobile browser)
  const ua = store.getState().ua?.getDevice()
  if (ua?.is('mobile') || ua?.is('tablet')) {
    return true
  }
  if (store.getState().deviceClass === DEVICE_CLASS.mobile) {
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
      return true
    }
    // Chromium navigator.userAgentData
    if ((navigator as any).userAgentData?.mobile) {
      return true
    }
  }

  // 3. Physical Touchscreen check - All smartphones & tablets have touch screens
  const hasTouch =
    typeof navigator !== 'undefined' &&
    (navigator.maxTouchPoints > 0 || 'ontouchstart' in window)

  // Desktops without touchscreens can never be mobile
  if (!hasTouch) return false

  // 4. WebGL GPU renderer check - Detects physical mobile GPU (Adreno / Mali / Immortalis / Apple GPU)
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
        if (/adreno|mali|immortalis|xclipse|powervr/i.test(renderer)) {
          return true
        }
        if (renderer.includes('apple') && hasTouch) {
          return true
        }
      }
    }
  } catch (_) {}

  // 5. Mobile orientation properties (window.orientation exists almost exclusively on mobile devices)
  if (hasTouch && typeof (window as any).orientation !== 'undefined') {
    return true
  }

  // 6. Screen dimensions & aspect ratio
  if (typeof window.screen !== 'undefined') {
    const minDim = Math.min(window.screen.width, window.screen.height)
    const maxDim = Math.max(window.screen.width, window.screen.height)

    // Physical smartphone screen is always <= 600px width in portrait
    if (minDim <= 600) return true

    // Portrait orientation on a touchscreen device is virtually always a phone/tablet
    if (window.screen.height > window.screen.width && hasTouch) {
      return true
    }

    // Phone aspect ratio (taller than 1.7:1)
    if (maxDim / (minDim || 1) >= 1.7 && hasTouch) {
      return true
    }
  }

  // 7. Small viewport or coarse pointer
  const isCoarsePointer =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(any-pointer: coarse)').matches)

  if (hasTouch && isCoarsePointer && (window.innerWidth <= 1024 || window.screen.width <= 1024)) {
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
