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
  playlist: ActiveTrack[]
  playlistIndex: number
  setActiveTrack: (track: ActiveTrack | null) => void
  setPlayerOpen: (open: boolean) => void
  setIsMinimized: (minimized: boolean) => void
  playTrack: (track: ActiveTrack) => void
  playPlaylist: (tracks: ActiveTrack[], startIndex?: number) => void
  nextTrack: () => void
  prevTrack: () => void
  stopTrack: () => void
}

export const createPlayerSlice: StateCreator<
  PlayerSlice,
  [],
  [],
  PlayerSlice
> = (set, get) => ({
  activeTrack: null,
  playerOpen: false,
  isMinimized: false,
  playlist: [],
  playlistIndex: 0,
  setActiveTrack: (activeTrack) => set({ activeTrack }),
  setPlayerOpen: (playerOpen) => set({ playerOpen }),
  setIsMinimized: (isMinimized) => set({ isMinimized }),
  playTrack: (track) =>
    set({
      activeTrack: track,
      playerOpen: true,
      isMinimized: false,
      playlist: [track],
      playlistIndex: 0,
    }),
  playPlaylist: (tracks, startIndex = 0) => {
    if (!tracks || tracks.length === 0) return
    const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1))
    set({
      playlist: tracks,
      playlistIndex: validIndex,
      activeTrack: tracks[validIndex],
      playerOpen: true,
      isMinimized: false,
    })
  },
  nextTrack: () => {
    const { playlist, playlistIndex } = get()
    if (!playlist || playlist.length <= 1) return
    const nextIdx = (playlistIndex + 1) % playlist.length
    set({
      playlistIndex: nextIdx,
      activeTrack: playlist[nextIdx],
    })
  },
  prevTrack: () => {
    const { playlist, playlistIndex } = get()
    if (!playlist || playlist.length <= 1) return
    const prevIdx = (playlistIndex - 1 + playlist.length) % playlist.length
    set({
      playlistIndex: prevIdx,
      activeTrack: playlist[prevIdx],
    })
  },
  stopTrack: () =>
    set({
      activeTrack: null,
      playerOpen: false,
      playlist: [],
      playlistIndex: 0,
    }),
})

