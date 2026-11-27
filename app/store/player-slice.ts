import type { StateCreator } from 'zustand'
import { jamService } from '../services/jam-session'
import { isRemoteTrackSyncActive } from './jam-slice'

export interface ActiveTrack {
  id?: number
  title: string
  artist: string
  albumTitle: string
  cover?: string
  videoId?: string
  audioUrl?: string
  query: string
}

function isGuestUnauthorized(): boolean {
  if (jamService.isConnected()) {
    const role = jamService.getRole()
    if (role === 'guest' && !jamService.getAllowGuestControl()) {
      return true
    }
  }
  return false
}

function maybeBroadcastTrack(
  track: ActiveTrack,
  playlist?: ActiveTrack[],
  playlistIndex?: number,
) {
  if (jamService.isConnected() && !isRemoteTrackSyncActive()) {
    const role = jamService.getRole()
    if (role === 'host' || jamService.getAllowGuestControl()) {
      jamService.broadcastTrack(track, playlist, playlistIndex)
    }
  }
}

export interface PlayerSlice {
  activeTrack: ActiveTrack | null
  playerOpen: boolean
  isMinimized: boolean
  isPlaying: boolean
  isDocked: boolean
  playlist: ActiveTrack[]
  playlistIndex: number
  setActiveTrack: (track: ActiveTrack | null) => void
  setPlayerOpen: (open: boolean) => void
  setIsMinimized: (minimized: boolean) => void
  setIsPlaying: (isPlaying: boolean) => void
  setIsDocked: (docked: boolean) => void
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
  isPlaying: false,
  isDocked: false,
  playlist: [],
  playlistIndex: 0,
  setActiveTrack: (activeTrack) => set({ activeTrack }),
  setPlayerOpen: (playerOpen) => set({ playerOpen }),
  setIsMinimized: (isMinimized) =>
    set({ isMinimized, ...(isMinimized ? {} : { isDocked: false }) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsDocked: (isDocked) => set({ isDocked }),
  playTrack: (track) => {
    if (isGuestUnauthorized()) return
    maybeBroadcastTrack(track, [track], 0)
    set({
      activeTrack: track,
      playerOpen: true,
      isMinimized: false,
      isDocked: false,
      isPlaying: true,
      playlist: [track],
      playlistIndex: 0,
    })
  },
  playPlaylist: (tracks, startIndex = 0) => {
    if (isGuestUnauthorized()) return
    if (!tracks || tracks.length === 0) return
    const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1))
    const currentTrack = tracks[validIndex]
    maybeBroadcastTrack(currentTrack, tracks, validIndex)
    set({
      playlist: tracks,
      playlistIndex: validIndex,
      activeTrack: currentTrack,
      playerOpen: true,
      isMinimized: false,
      isDocked: false,
      isPlaying: true,
    })
  },
  nextTrack: () => {
    if (isGuestUnauthorized()) return
    const { playlist, playlistIndex } = get()
    if (!playlist || playlist.length <= 1) return
    const nextIdx = (playlistIndex + 1) % playlist.length
    const nextItem = playlist[nextIdx]
    maybeBroadcastTrack(nextItem, playlist, nextIdx)
    set({
      playlistIndex: nextIdx,
      activeTrack: nextItem,
    })
  },
  prevTrack: () => {
    if (isGuestUnauthorized()) return
    const { playlist, playlistIndex } = get()
    if (!playlist || playlist.length <= 1) return
    const prevIdx = (playlistIndex - 1 + playlist.length) % playlist.length
    const prevItem = playlist[prevIdx]
    maybeBroadcastTrack(prevItem, playlist, prevIdx)
    set({
      playlistIndex: prevIdx,
      activeTrack: prevItem,
    })
  },
  stopTrack: () => {
    if (jamService.isConnected() && !isRemoteTrackSyncActive()) {
      const role = jamService.getRole()
      if (role === 'host' || jamService.getAllowGuestControl()) {
        jamService.broadcastPause(0)
      }
    }
    set({
      activeTrack: null,
      playerOpen: false,
      isMinimized: false,
      isDocked: false,
      isPlaying: false,
      playlist: [],
      playlistIndex: 0,
    })
  },
})
