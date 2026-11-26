import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'

import { type FilmDataSlice, createFilmDataSlice } from './film-data-slice'
import { type JamSlice, createJamSlice } from './jam-slice'
import { type PlayerSlice, createPlayerSlice } from './player-slice'
import { type UiSlice, createUiSlice } from './ui-slice'
import { type VoroforceSlice, createEngineSlice } from './voroforce-slice'

export type StoreState = UiSlice & VoroforceSlice & FilmDataSlice & PlayerSlice & JamSlice

export const store = create(
  subscribeWithSelector<StoreState>((...a) => ({
    ...createUiSlice(...a),
    ...createEngineSlice(...a),
    ...createFilmDataSlice(...a),
    ...createPlayerSlice(...a),
    ...createJamSlice(...a),
  })),
)

export const useShallowState = <U>(selector: (state: StoreState) => U) =>
  store(useShallow(selector))

// Re-export slice types for convenience
export type { FilmDataSlice, VoroforceSlice, UiSlice, PlayerSlice, JamSlice }

// Export selectors
export * from './selectors'
