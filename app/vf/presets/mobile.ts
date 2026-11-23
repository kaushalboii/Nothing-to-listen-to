import mediaConfig from '../config/media'
import { VOROFORCE_MODE } from '../consts'
import type { VoroforceInstance } from '../types'

export const controlModeConfigs: {
  [K in VOROFORCE_MODE]?: VoroforceInstance['controls']['config']
} = {
  [VOROFORCE_MODE.select]: {
    maxSpeed: 4,
    ease: 0.1,
    easePinned: 0.1,
    freezeOnShake: {
      enabled: false,
    },
    freezeOnJolt: {
      enabled: false,
    },
    zoom: {
      enabled: true,
      min: 1,
      max: 1.4,
    },
  },
}

const defaultControlsConfig = {
  debug: false,
  autoFocusCenter: {
    enabled: true,
    random: true,
  },
  maxSpeed: 5,
  ease: 0.075,
  easePinned: 0.075,
  freezeOnShake: {
    enabled: true,
  },
  freezeOnJolt: {
    enabled: true,
  },
  zoom: {
    enabled: true,
    min: 1,
    max: 1.2,
  },
}

const controlsConfig = Object.assign(
  {
    default: defaultControlsConfig,
    modes: controlModeConfigs,
  },
  defaultControlsConfig,
)

export default {
  cells: 216,
  multiThreading: {
    enabled: false,
    renderInParallel: false,
  },
  media: {
    ...mediaConfig,
    preload: 'first',
  },
  controls: controlsConfig,
  revealScreenDelay: {
    default: 200,
    modes: {
      [VOROFORCE_MODE.preview]: 150,
      [VOROFORCE_MODE.select]: 150,
      [VOROFORCE_MODE.intro]: 200,
    },
  },
  display: {
    renderer: {
      pixelRatio: 1.0,
    },
    scene: {
      main: {
        uniforms: {
          fPixelSearchRadiusMod: {
            transition: true,
            initial: {
              value: 1, // abusing uniform transition mechanics to get some initial help and avoid broken pixels
            },
            modes: {
              default: {
                value: 0,
              },
              [VOROFORCE_MODE.select]: {
                value: 0,
              },
            },
          },
          fBorderRoundnessMod: {
            value: 1,
            transition: true,
            modes: {
              default: {
                value: 1,
              },
              select: {
                value: 1,
              },
            },
          },
          fBorderThicknessMod: {
            transition: true,
            modes: {
              default: {
                value: 1.5,
              },
              [VOROFORCE_MODE.select]: {
                value: 1.5,
              },
            },
          },
          fBorderSmoothnessMod: {
            transition: true,
            modes: {
              default: {
                value: 1,
              },
              [VOROFORCE_MODE.select]: {
                value: 0.75,
              },
            },
          },
          fCenterForceBulgeStrength: {
            transition: true,
            targetFactor: 0.0125,
            initial: {
              value: 1,
            },
            modes: {
              default: {
                value: 0,
              },
              [VOROFORCE_MODE.preview]: {
                value: 1.125,
              },
              [VOROFORCE_MODE.select]: {
                value: 1.125,
              },
            },
          },
          fCenterForceBulgeRadius: {
            transition: true,
            targetFactor: 0.0125,
            initial: {
              value: 1,
            },
            modes: {
              default: {
                value: 0,
              },
              [VOROFORCE_MODE.preview]: {
                value: 1,
              },
              [VOROFORCE_MODE.select]: {
                value: 1.75,
              },
            },
          },
          fWeightOffsetScaleMod: {
            transition: false,
            modes: {
              default: {
                value: 0,
              },
              [VOROFORCE_MODE.select]: {
                value: 0,
              },
            },
          },
        },
      },
      post: {
        enabled: false,
      },
    },
  },
}
