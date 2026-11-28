import voroforce from '√/index'

import { store } from '../store'
import { CELL_LIMIT, DEVICE_CLASS, VOROFORCE_PRESET } from './consts'
import { initVoroforceIntegrations } from './integrations'
import type { VoroforceInstance } from './types'
import { getVoroforceConfig, getVoroforceConfigUniforms } from './utils'
import { isMobileDevice } from './utils/device-class'

export const initVoroforce = ({
  // biome-ignore lint/style/noNonNullAssertion: exists
  container = document.getElementById('voroforce')!,
  force = false,
}: {
  container?: HTMLElement
  force?: boolean
} = {}) => {
  const state = store.getState()
  if (!force && state.voroforce) return // already initialized

  const isMobile = isMobileDevice()

  if (isMobile) {
    if (state.preset !== VOROFORCE_PRESET.mobile) {
      state.setPreset(VOROFORCE_PRESET.mobile)
    }
    if (!state.cellLimit || state.cellLimit > CELL_LIMIT.min) {
      state.setCellLimit(CELL_LIMIT.min)
    }
    if (state.deviceClass !== DEVICE_CLASS.mobile) {
      state.setDeviceClass(DEVICE_CLASS.mobile)
    }
  } else {
    // Desktop: auto-recover if state was previously stuck on mobile or repeated cells
    if (state.preset === VOROFORCE_PRESET.mobile || !state.preset) {
      state.setPreset(VOROFORCE_PRESET.minimal)
    }
    if (!state.cellLimit || state.cellLimit > CELL_LIMIT.min) {
      state.setCellLimit(CELL_LIMIT.min)
    }
    if (state.deviceClass === DEVICE_CLASS.mobile || !state.deviceClass) {
      state.setDeviceClass(DEVICE_CLASS.high)
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
