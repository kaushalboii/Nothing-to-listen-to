import { store } from '@/store'
import { baseLatticeConfig } from '../config'
import { updateUniformsByMode } from '../utils'

import { VOROFORCE_MODE } from '../consts'
import type { VoroforceCell } from '../types'
import { updateControlsByMode } from './controls'

export const revealVoroforceContainer = () => {
  // store.getState().container.classList.remove('opacity-0')
  store.setState({
    voroforceMediaPreloaded: true,
  })
}

let afterModeChangeTimeout: NodeJS.Timeout

export const handleModeChange = (mode: VOROFORCE_MODE): void => {
  const {
    setMode,
    voroforce,
    configUniforms: {
      main: mainUniforms,
      post: postUniforms,
      transitioning: transitioningUniforms,
    },
    config: {
      simulation: { forceStepModeConfigs },
      controls: controlsConfig,
    },
  } = store.getState()

  if (!voroforce?.simulation || !voroforce?.controls) return

  const { simulation, controls } = voroforce

  setMode(mode)

  updateControlsByMode(controls, mode, controlsConfig)
  updateUniformsByMode(mainUniforms, mode, transitioningUniforms)
  updateUniformsByMode(postUniforms, mode, transitioningUniforms)

  // when switching modes, temporarily up the neighbor searches in the shader to max supported level (voronoi cell propagation speed limits in shader)
  // updateUniforms(mainUniforms, {
  //   iForcedMaxNeighborLevel: 3,
  // })

  const forceStepConfig = forceStepModeConfigs[mode]
  if (forceStepConfig.parameters.velocityDecayTransitionEnterMode) {
    // when switching from select to preview mode, need to up velocityDecay during the transition (voronoi cell propagation speed limits in shader)
    forceStepConfig.parameters.velocityDecay =
      forceStepConfig.parameters.velocityDecayTransitionEnterMode

    simulation.updateForceStepConfig(forceStepConfig)

    clearTimeout(afterModeChangeTimeout)
    afterModeChangeTimeout = setTimeout(() => {
      // we revert back to default neighbor level as using max is extremely expensive
      // updateUniforms(mainUniforms, {
      //   iForcedMaxNeighborLevel: 0,
      // })

      // revert to default velocityDecay after the transition (voronoi cell propagation speed limits in shader, see above)
      forceStepConfig.parameters.velocityDecay =
        forceStepConfig.parameters.velocityDecayBase
      simulation.updateForceStepConfigParameters(forceStepConfig.parameters)
    }, forceStepConfig.parameters.transitionEnterModeDuration ?? 2000)
  } else {
    simulation.updateForceStepConfig(forceStepConfig)
  }
}
const handleIntro = () => {
  const { voroforce, setPlayedIntro } = store.getState()

  if (!voroforce?.controls || !voroforce?.dimensions) return

  const { controls, dimensions } = voroforce

  setTimeout(() => {
    if (!voroforce) return

    voroforce.config.lattice = {
      ...baseLatticeConfig,
      rows: voroforce.config.lattice.rows,
      cols: voroforce.config.lattice.cols,
    }
    voroforce.resize()

    revealVoroforceContainer()
    setPlayedIntro(true)

    setTimeout(() => {
      handleModeChange(VOROFORCE_MODE.preview)

      controls.targetPointer = {
        x:
          dimensions.get('width') / 2 +
          (0.5 - Math.random()) * 0.05 * dimensions.get('width'),
        y:
          dimensions.get('height') / 2 +
          (0.5 - Math.random()) * 0.05 * dimensions.get('height'),
      }
    }, 3000)
  }, 1000)
}

export const handleMode = () => {
  const { mode: initialMode, voroforce, config } = store.getState()

  if (!voroforce?.loader || !voroforce?.ticker) return

  const { loader, ticker } = voroforce

  // Safety net: Guarantee the loading veil lifts even on slow or constrained mobile devices
  const safetyTimeout = setTimeout(() => {
    revealVoroforceContainer()
    const { playedIntro, setPlayedIntro, voroforce: vf } = store.getState()
    if (vf?.config?.lattice?.targetCellSizeViewportPercentage) {
      vf.config.lattice = {
        ...baseLatticeConfig,
        rows: vf.config.lattice.rows,
        cols: vf.config.lattice.cols,
      }
      vf.resize()
    }
    if (!playedIntro) {
      setPlayedIntro(true)
      handleModeChange(VOROFORCE_MODE.preview)
    }
  }, 2500)

  if (initialMode === VOROFORCE_MODE.intro) {
    if (config.media.enabled && loader.loadingMediaLayers !== 0) {
      loader.listenOnce('idle', () => {
        clearTimeout(safetyTimeout)
        // media will be uploaded on next tick
        ticker.listenOnce('tick', handleIntro)
      })
    } else {
      clearTimeout(safetyTimeout)
      handleIntro()
    }
  } else {
    if (config.media.enabled && config.media.preload) {
      loader.listenOnce('preloaded', () => {
        clearTimeout(safetyTimeout)
        // media will be uploaded to gpu on the next tick
        ticker.listenOnce('tick', revealVoroforceContainer)
      })
    } else {
      clearTimeout(safetyTimeout)
      revealVoroforceContainer()
    }
  }

  if (voroforce.controls) {
    voroforce.controls.listen('selected', (async ({
      cell,
    }: { cell: VoroforceCell }) => {
      const mode = store.getState().mode
      if (mode === VOROFORCE_MODE.intro) return
      const newMode = cell ? VOROFORCE_MODE.select : VOROFORCE_MODE.preview
      if (newMode === mode) return
      handleModeChange(newMode)
    }) as unknown as EventListener)
  }
}
