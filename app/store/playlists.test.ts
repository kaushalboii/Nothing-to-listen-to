import { beforeEach, describe, expect, it } from 'vitest'
import { store } from './index'

describe('Playlists Management', () => {
  beforeEach(() => {
    store.getState().setUserConfig({
      ...store.getState().userConfig,
      playlists: undefined,
    })
    store.getState().setPlaylistsOpen(false)
  })

  it('allows creating up to 3 playlists', () => {
    const p1 = {
      id: 'pl_1',
      name: 'Hits',
      createdAt: Date.now(),
      tracks: [],
    }
    const p2 = {
      id: 'pl_2',
      name: 'Chill',
      createdAt: Date.now(),
      tracks: [],
    }
    const p3 = {
      id: 'pl_3',
      name: 'Workout',
      createdAt: Date.now(),
      tracks: [],
    }

    store.getState().setUserConfig({
      ...store.getState().userConfig,
      playlists: [p1, p2, p3],
    })

    const config = store.getState().userConfig
    expect(config.playlists).toHaveLength(3)
    expect(config.playlists?.[0].name).toBe('Hits')
    expect(config.playlists?.[1].name).toBe('Chill')
    expect(config.playlists?.[2].name).toBe('Workout')
  })

  it('supports unlimited songs per playlist and track removal', () => {
    const tracks = Array.from({ length: 25 }, (_, i) => ({
      tmdbId: i + 1,
      title: `Song ${i + 1}`,
      artist: `Artist ${i + 1}`,
      albumTitle: `Album ${i + 1}`,
    }))

    const playlist = {
      id: 'pl_large',
      name: 'Big Mix',
      createdAt: Date.now(),
      tracks,
    }

    store.getState().setUserConfig({
      ...store.getState().userConfig,
      playlists: [playlist],
    })

    expect(store.getState().userConfig.playlists?.[0].tracks).toHaveLength(25)

    // Remove track with tmdbId 5
    const updatedTracks = tracks.filter((t) => t.tmdbId !== 5)
    store.getState().setUserConfig({
      ...store.getState().userConfig,
      playlists: [{ ...playlist, tracks: updatedTracks }],
    })

    expect(store.getState().userConfig.playlists?.[0].tracks).toHaveLength(24)
    expect(
      store
        .getState()
        .userConfig.playlists?.[0].tracks.some((t) => t.tmdbId === 5),
    ).toBe(false)
  })

  it('plays playlist tracks through playerSlice', () => {
    const tracks = [
      {
        id: 101,
        title: 'Track A',
        artist: 'Artist A',
        albumTitle: 'Album A',
        query: 'Artist A Track A',
      },
      {
        id: 102,
        title: 'Track B',
        artist: 'Artist B',
        albumTitle: 'Album B',
        query: 'Artist B Track B',
      },
    ]

    store.getState().playPlaylist(tracks, 1)

    const state = store.getState()
    expect(state.playlist).toHaveLength(2)
    expect(state.playlistIndex).toBe(1)
    expect(state.activeTrack?.title).toBe('Track B')
    expect(state.isPlaying).toBe(true)
    expect(state.playerOpen).toBe(true)
  })

  it('toggles playlists modal state cleanly', () => {
    expect(store.getState().playlistsOpen).toBe(false)
    store.getState().togglePlaylistsOpen()
    expect(store.getState().playlistsOpen).toBe(true)
    store.getState().setPlaylistsOpen(false)
    expect(store.getState().playlistsOpen).toBe(false)
  })
})
