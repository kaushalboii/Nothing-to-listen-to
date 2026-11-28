import { mergeConfigs } from '√'
import baseConfig from '../config'
import presets from '../presets'

import type { THEME } from '../../consts'
import type { StoreState } from '../../store'
import {
  CELL_LIMIT,
  DEFAULT_VOROFORCE_PRESET,
  type VOROFORCE_MODE,
  VOROFORCE_PRESET,
} from '../consts'
import type { VoroforceCell, VoroforceInstance } from '../types'
import { isMobileDevice } from './device-class'
import type { Film } from './films'
import type { ConfigUniform } from './uniforms'

export type CustomLink = {
  name: string
  baseUrl: string
  slug: boolean
  property: 'title' | 'tmdbId' | 'imdbId'
}

export type PlaylistTrack = {
  tmdbId: number
  title: string
  artist?: string
  albumTitle?: string
  poster?: string
  videoId?: string
  audioUrl?: string
}

export type UserPlaylist = {
  id: string
  name: string
  createdAt: number
  tracks: PlaylistTrack[]
}

export type UserConfig = {
  cells?: number
  devTools?: boolean
  customLinks?: CustomLink[]
  favorites?: {
    [key: Film['tmdbId']]: {
      cellId: VoroforceCell['id']
      title: Film['title']
      artist?: string
      year: Film['year']
      tagline: Film['tagline']
      tmdbId: Film['tmdbId']
      imdbId?: Film['imdbId']
      poster?: Film['poster']
      youtubeId?: string
    }
  }
  playlists?: UserPlaylist[]
}

const handleCustomLinkParam = (
  customLinkBase64Param: string,
  state: StoreState,
) => {
  const { userConfig, setUserConfig } = state
  try {
    const customLink = JSON.parse(window.atob(customLinkBase64Param))
    userConfig.customLinks = [...(userConfig.customLinks ?? [])]
    const sameNameIndex = userConfig.customLinks.findIndex(
      ({ name }) => name === customLink.name,
    )
    if (sameNameIndex !== -1) {
      userConfig.customLinks[sameNameIndex] = customLink
    } else {
      userConfig.customLinks.push(customLink)
    }
    setUserConfig(userConfig)
    window.history.replaceState({}, document.title, '/')
  } catch (e) {}
}

export const getVoroforceConfig = (state: StoreState) => {
  const { userConfig, preset: initialPreset, cellLimit, mode } = state
  const urlParams = new URLSearchParams(window.location.search)
  const presetOverrideParam = urlParams.get('preset') as VOROFORCE_PRESET
  const cellsOverrideParam = urlParams.get('cells')
  const customLinkBase64Param = urlParams.get('customLinkBase64')

  const isMobile = isMobileDevice()

  let preset = initialPreset
  if (presetOverrideParam && VOROFORCE_PRESET[presetOverrideParam]) {
    preset = presetOverrideParam
  }

  if (!preset) {
    preset = isMobile ? VOROFORCE_PRESET.mobile : DEFAULT_VOROFORCE_PRESET
  }

  // Mobile hardware (including when in "Desktop site" mode) must always use mobile preset
  if (isMobile) {
    preset = VOROFORCE_PRESET.mobile
  }

  let config = mergeConfigs(
    baseConfig,
    (presets as unknown as Record<VOROFORCE_PRESET, typeof baseConfig>)[preset],
  )
  if (config.modes?.[mode]) {
    config = mergeConfigs(config, config.modes?.[mode])
  }

  if (customLinkBase64Param) {
    handleCustomLinkParam(customLinkBase64Param, state)
  }

  config.cells = cellsOverrideParam
    ? Number.parseInt(cellsOverrideParam)
    : (cellLimit ?? CELL_LIMIT.min)

  if (isMobile) {
    const isDesktopModeOnMobile =
      typeof window !== 'undefined' && window.innerWidth >= 768

    // In mobile mode, display all 216 unique albums with 0 repeats
    const maxCells = isDesktopModeOnMobile ? 2500 : CELL_LIMIT.min
    const requestedCells = cellsOverrideParam
      ? Number.parseInt(cellsOverrideParam)
      : (cellLimit ?? config.cells)

    config.cells = cellsOverrideParam
      ? requestedCells
      : Math.min(requestedCells, maxCells)

    if (config.multiThreading) {
      config.multiThreading.enabled = false
      config.multiThreading.renderInParallel = false
    }
    config.fpsCap = 60
    config.idleFpsCap = 30
    config.adaptiveFPS = true
    config.display = config.display || {}
    config.display.renderer = config.display.renderer || {}

    // In desktop mode on mobile, window.innerWidth is ~980px. A DPR of 1.0 already gives a 980px width,
    // which matches native 1080p mobile screen resolution perfectly without fragment shader overload.
    // In normal mobile mode (window.innerWidth ~390px), 1.5 DPR gives razor-sharp textures.
    const mobileDPR = isDesktopModeOnMobile ? 1.0 : 1.5
    config.display.renderer.pixelRatio = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      mobileDPR,
    )
    config.display.renderer.powerPreference = 'default'
  } else {
    config.display = config.display || {}
    config.display.renderer = config.display.renderer || {}
    config.display.renderer.pixelRatio = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      1.6,
    )
    config.adaptiveFPS = true
  }

  if ('devTools' in userConfig) {
    config.devTools.enabled = !!userConfig.devTools
  }

  return config
}

const processVoroforceStageConfigUniforms = (
  stageConfigUniforms: Record<string, ConfigUniform>,
  transitioning: Map<string, ConfigUniform>,
  mode: VOROFORCE_MODE,
  theme: THEME,
) => {
  return new Map<string, ConfigUniform>(
    Object.entries(stageConfigUniforms).map(([key, uniform]) => {
      if (typeof uniform.value === 'undefined') {
        const uniformValue = uniform.modes
          ? typeof uniform.modes?.[mode]?.value !== 'undefined'
            ? uniform.modes[mode].value
            : (uniform.modes?.default?.value ?? 0)
          : typeof uniform.themes?.[theme]?.value !== 'undefined'
            ? uniform.themes[theme].value
            : (uniform.themes?.default?.value ?? 0)

        if (
          uniform.transition &&
          typeof uniform.initial?.value === 'number' &&
          typeof uniformValue === 'number'
        ) {
          uniform.value = uniform.initial.value

          uniform.targetValue = uniformValue
          if (!transitioning.has(key)) {
            transitioning.set(key, uniform)
          }
        } else {
          uniform.value = uniformValue as number
        }
      }
      return [key, uniform]
    }),
  )
}

export const getVoroforceConfigUniforms = (
  config: VoroforceInstance['config'],
  mode: VOROFORCE_MODE,
  theme: THEME,
) => {
  const {
    display: {
      scene: {
        main: { uniforms: mainConfigUniforms = {} },
        post: { uniforms: postConfigUniforms = {} },
      },
    },
  } = config

  const transitioning = new Map<string, ConfigUniform>()

  return {
    main: processVoroforceStageConfigUniforms(
      mainConfigUniforms,
      transitioning,
      mode,
      theme,
    ),
    post: processVoroforceStageConfigUniforms(
      postConfigUniforms,
      transitioning,
      mode,
      theme,
    ),
    transitioning,
  }
}
