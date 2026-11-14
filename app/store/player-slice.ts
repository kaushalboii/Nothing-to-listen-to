import type { StateCreator } from 'zustand'

export interface ActiveTrack {
  id?: number
  title: string
  artist: string
  albumTitle: string
  cover?: string
  videoId?: string
  query: string
}

export interface PlayerSlice {
  activeTrack: ActiveTrack | null
  playerOpen: boolean
  isMinimized: boolean
  setActiveTrack: (track: ActiveTrack | null) => void
  setPlayerOpen: (open: boolean) => void
  setIsMinimized: (minimized: boolean) => void
  playTrack: (track: ActiveTrack) => void
  stopTrack: () => void
}

export const createPlayerSlice: StateCreator<
  PlayerSlice,
  [],
  [],
  PlayerSlice
> = (set) => ({
  activeTrack: null,
  playerOpen: false,
  isMinimized: false,
  setActiveTrack: (activeTrack) => set({ activeTrack }),
  setPlayerOpen: (playerOpen) => set({ playerOpen }),
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  playTrack: (track) => set({ activeTrack: track, playerOpen: true, isMinimized: false }),
  stopTrack: () => set({ activeTrack: null, playerOpen: false }),
})

