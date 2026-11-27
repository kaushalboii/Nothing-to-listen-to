import voroforce from '√/index'

import { store } from '../store'
import { CELL_LIMIT, VOROFORCE_PRESET } from './consts'
import { initVoroforceIntegrations } from './integrations'
import type { VoroforceInstance } from './types'
import { getVoroforceConfig, getVoroforceConfigUniforms } from './utils'
import { isMobileDevice } from './utils/device-class'

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

  const isMobile = isMobileDevice()

  if (!force && !state.preset) {
    state.setPreset(
      isMobile ? VOROFORCE_PRESET.mobile : VOROFORCE_PRESET.minimal,
    )
    state.setCellLimit(CELL_LIMIT.xs)
  } else if (!force && isMobile && state.cellLimit && state.cellLimit > CELL_LIMIT.xs) {
    state.setPreset(VOROFORCE_PRESET.mobile)
    state.setCellLimit(CELL_LIMIT.xs)
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
