import type { StateCreator } from 'zustand'
import { type JamRole, jamService } from '../services/jam-session'
import type { PlayerSlice } from './player-slice'

export interface JamSlice {
  jamModalOpen: boolean
  setJamModalOpen: (jamModalOpen: boolean) => void
  toggleJamModalOpen: () => void
  isJamConnected: boolean
  isJamConnecting: boolean
  isJamReconnecting: boolean
  jamRoomCode: string | null
  jamRole: JamRole | null
  jamError: string | null
  setJamError: (error: string | null) => void
  jamLatency: number | null
  jamParticipantCount: number
  allowGuestControl: boolean
  setAllowGuestControl: (allow: boolean) => void
  remoteReaction: { emoji: string; id: number } | null
  clearRemoteReaction: () => void

  createJamRoom: (customCode?: string) => Promise<string>
  joinJamRoom: (code: string) => Promise<void>
  leaveJamRoom: () => void
  sendJamReaction: (emoji: string) => void
}

let reactionCounter = 0
let isApplyingRemoteTrack = false

export const createJamSlice: StateCreator<
  JamSlice & PlayerSlice,
  [],
  [],
  JamSlice
> = (set, get) => {
  // Initialize callbacks from jamService
  jamService.setCallbacks({
    getCurrentTrackState: () => {
      const state = get()
      const audioEl =
        typeof document !== 'undefined' ? document.querySelector('audio') : null
      const currentTime = audioEl ? audioEl.currentTime : 0
      const isPlaying = audioEl ? !audioEl.paused : false
      return {
        track: state.activeTrack,
        playlist: state.playlist,
        playlistIndex: state.playlistIndex,
        currentTime,
        isPlaying,
      }
    },
    onStatusChange: (status) => {
      set({
        isJamConnected: status.isConnected,
        isJamConnecting: status.isConnecting,
        isJamReconnecting: status.isReconnecting,
        jamRole: status.role,
        jamRoomCode: status.roomCode,
        jamError: status.error,
        jamLatency: status.latency,
        jamParticipantCount: status.participantCount,
      })
    },
    onPartnerConnected: () => {
      const state = get()
      // If host has an active track when partner joins, broadcast it immediately so both are in sync
      if (state.jamRole === 'host' && state.activeTrack) {
        const audioEl =
          typeof document !== 'undefined'
            ? document.querySelector('audio')
            : null
        const currentTime = audioEl ? audioEl.currentTime : 0
        const isPlaying = audioEl ? !audioEl.paused : false
        jamService.broadcastTrack(
          state.activeTrack,
          state.playlist,
          state.playlistIndex,
          currentTime,
          isPlaying,
        )
      }
    },
    onRemoteTrack: (track, playlist, playlistIndex = 0) => {
      isApplyingRemoteTrack = true
      try {
        set({
          activeTrack: track,
          playerOpen: true,
          isMinimized: false,
          playlist: playlist && playlist.length > 0 ? playlist : [track],
          playlistIndex: playlistIndex,
        })
      } finally {
        setTimeout(() => {
          isApplyingRemoteTrack = false
        }, 100)
      }
    },
    onRemotePlay: (currentTime, sentAt) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('jam:play', {
            detail: { currentTime, sentAt },
          }),
        )
      }
    },
    onRemotePause: (currentTime) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('jam:pause', {
            detail: { currentTime },
          }),
        )
      }
    },
    onRemoteSeek: (currentTime) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('jam:seek', {
            detail: { currentTime },
          }),
        )
      }
    },
    onRemoteHeartbeat: (currentTime, isPlaying, sentAt) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('jam:heartbeat', {
            detail: { currentTime, isPlaying, sentAt },
          }),
        )
      }
    },
    onRemoteReaction: (emoji) => {
      reactionCounter++
      set({
        remoteReaction: { emoji, id: reactionCounter },
      })
    },
    onPermissionsChange: (allowGuestControl) => {
      set({ allowGuestControl })
    },
  })

  return {
    jamModalOpen: false,
    setJamModalOpen: (jamModalOpen) => set({ jamModalOpen }),
    toggleJamModalOpen: () => set({ jamModalOpen: !get().jamModalOpen }),
    isJamConnected: false,
    isJamConnecting: false,
    isJamReconnecting: false,
    jamRoomCode: null,
    jamRole: null,
    jamError: null,
    setJamError: (jamError) => set({ jamError }),
    jamLatency: null,
    jamParticipantCount: 0,
    allowGuestControl: false,
    remoteReaction: null,
    setAllowGuestControl: (allowGuestControl) => {
      jamService.setAllowGuestControl(allowGuestControl)
      set({ allowGuestControl })
    },
    clearRemoteReaction: () => set({ remoteReaction: null }),

    createJamRoom: async (customCode?: string) => {
      set({ jamError: null, isJamConnecting: true })
      try {
        const code = await jamService.createRoom(customCode)
        return code
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : 'Failed to create room'
        set({
          jamError: errMsg,
          isJamConnecting: false,
        })
        throw err
      }
    },

    joinJamRoom: async (code: string) => {
      set({ jamError: null, isJamConnecting: true })
      try {
        await jamService.joinRoom(code)
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error ? err.message : 'Failed to join room'
        set({
          jamError: errMsg,
          isJamConnecting: false,
        })
        throw err
      }
    },

    leaveJamRoom: () => {
      jamService.cleanup()
      set({
        isJamConnected: false,
        isJamConnecting: false,
        isJamReconnecting: false,
        jamRoomCode: null,
        jamRole: null,
        jamError: null,
        jamLatency: null,
        allowGuestControl: false,
        remoteReaction: null,
      })
    },

    sendJamReaction: (emoji: string) => {
      jamService.broadcastReaction(emoji)
      // Also show locally
      reactionCounter++
      set({
        remoteReaction: { emoji, id: reactionCounter },
      })
    },
  }
}

export function isRemoteTrackSyncActive(): boolean {
  return isApplyingRemoteTrack
}
