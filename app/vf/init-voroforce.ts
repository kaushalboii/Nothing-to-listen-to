import voroforce from '√/index'

import { store } from '../store'
import { DEVICE_CLASS, VOROFORCE_PRESET } from './consts'
import { initVoroforceIntegrations } from './integrations'
import type { VoroforceInstance } from './types'
import { getVoroforceConfig, getVoroforceConfigUniforms } from './utils'

export const initVoroforce = ({
  // biome-ignore lint/style/noNonNullAssertion: exists
  container = document.getElementById('voroforce')!,
  force,
}: {
  container?: HTMLElement
  force?: boolean
} = {}) => {
  const state = store.getState()
  if (state.voroforce) return // already initialized

  if (!force && !state.preset) {
    const isMobile =
      state.ua?.getDevice()?.is('mobile') ||
      state.deviceClass === DEVICE_CLASS.mobile ||
      (typeof window !== 'undefined' &&
        ('ontouchstart' in window || window.innerWidth < 768))
    if (isMobile) {
      state.setPreset(VOROFORCE_PRESET.mobile)
    } else {
      return
    }
  }

  const config = getVoroforceConfig(store.getState())
  store.setState({
    container,
    voroforce: voroforce(container, config) as VoroforceInstance,
    config,
    configUniforms: getVoroforceConfigUniforms(config, state.mode, state.theme),
  })
  initVoroforceIntegrations()
}
