import { useShallowState } from '@/store'
import type { ActiveTrack } from '@/store/player-slice'
import {
  Check,
  Edit2,
  FolderPlus,
  ListMusic,
  ListPlus,
  Music,
  Play,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../../../utils/tw'
import type { PlaylistTrack, UserPlaylist } from '../../../vf/utils/config'
import { Modal } from '../../common/modal'
import { Button } from '../../ui/button'
import { ScrollArea } from '../../ui/scroll-area'

export const Playlists = () => {
  const {
    open,
    setOpen,
    userConfig,
    setUserConfig,
    activeTrack,
    playPlaylist,
  } = useShallowState((state) => ({
    open: state.playlistsOpen,
    setOpen: state.setPlaylistsOpen,
    userConfig: state.userConfig,
    setUserConfig: state.setUserConfig,
    activeTrack: state.activeTrack,
    playPlaylist: state.playPlaylist,
  }))

  const playlists: UserPlaylist[] = useMemo(
    () => userConfig.playlists ?? [],
    [userConfig.playlists],
  )

  const [activePlaylistId, setActivePlaylistId] = useState<string>('')
  const [isCreating, setIsCreating] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Default active playlist to first if not set or deleted
  const currentPlaylist = useMemo(() => {
    if (playlists.length === 0) return null
    return (
      playlists.find((p) => p.id === activePlaylistId) || playlists[0]
    )
  }, [playlists, activePlaylistId])

  const canCreateMore = playlists.length < 3

  const handleCreatePlaylist = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = newPlaylistName.trim()
    if (!trimmed || !canCreateMore) return

    const newPlaylist: UserPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: trimmed,
      createdAt: Date.now(),
      tracks: [],
    }

    const nextPlaylists = [...playlists, newPlaylist]
    setUserConfig({
      ...userConfig,
      playlists: nextPlaylists,
    })

    setActivePlaylistId(newPlaylist.id)
    setNewPlaylistName('')
    setIsCreating(false)
  }

  const handleDeletePlaylist = (id: string) => {
    const nextPlaylists = playlists.filter((p) => p.id !== id)
    setUserConfig({
      ...userConfig,
      playlists: nextPlaylists.length > 0 ? nextPlaylists : undefined,
    })
    if (activePlaylistId === id) {
      setActivePlaylistId(nextPlaylists[0]?.id || '')
    }
  }

  const handleStartRename = (playlist: UserPlaylist) => {
    setEditingPlaylistId(playlist.id)
    setEditingName(playlist.name)
  }

  const handleSaveRename = (id: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) {
      setEditingPlaylistId(null)
      return
    }

    const nextPlaylists = playlists.map((p) =>
      p.id === id ? { ...p, name: trimmed } : p,
    )
    setUserConfig({
      ...userConfig,
      playlists: nextPlaylists,
    })
    setEditingPlaylistId(null)
  }

  const handleRemoveTrack = (playlistId: string, trackTmdbId: number) => {
    const nextPlaylists = playlists.map((p) => {
      if (p.id !== playlistId) return p
      return {
        ...p,
        tracks: p.tracks.filter((t) => t.tmdbId !== trackTmdbId),
      }
    })
    setUserConfig({
      ...userConfig,
      playlists: nextPlaylists,
    })
  }

  const handleAddActiveTrack = (playlistId: string) => {
    if (!activeTrack) return
    const targetPlaylist = playlists.find((p) => p.id === playlistId)
    if (!targetPlaylist) return

    const trackTmdbId =
      activeTrack.id ??
      Number.parseInt(
        Math.abs(
          activeTrack.title
            .split('')
            .reduce((acc, c) => acc + c.charCodeAt(0), 0),
        ).toString(),
      )

    // Check if already in playlist
    if (targetPlaylist.tracks.some((t) => t.tmdbId === trackTmdbId)) {
      return
    }

    const newTrack: PlaylistTrack = {
      tmdbId: trackTmdbId,
      title: activeTrack.title,
      artist: activeTrack.artist,
      albumTitle: activeTrack.albumTitle,
      poster: activeTrack.cover,
      videoId: activeTrack.videoId,
      audioUrl: activeTrack.audioUrl,
    }

    const nextPlaylists = playlists.map((p) => {
      if (p.id !== playlistId) return p
      return {
        ...p,
        tracks: [...p.tracks, newTrack],
      }
    })

    setUserConfig({
      ...userConfig,
      playlists: nextPlaylists,
    })
  }

  const handlePlayAll = () => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return
    const activeTracks: ActiveTrack[] = currentPlaylist.tracks.map((t) => ({
      id: t.tmdbId,
      title: t.title,
      artist: t.artist ?? 'Various Artists',
      albumTitle: t.albumTitle ?? t.title,
      cover: t.poster,
      videoId: t.videoId,
      audioUrl: t.audioUrl,
      query: `${t.artist ?? ''} ${t.title}`.trim(),
    }))
    playPlaylist(activeTracks, 0)
  }

  const handlePlayOne = (index: number) => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return
    const activeTracks: ActiveTrack[] = currentPlaylist.tracks.map((t) => ({
      id: t.tmdbId,
      title: t.title,
      artist: t.artist ?? 'Various Artists',
      albumTitle: t.albumTitle ?? t.title,
      cover: t.poster,
      videoId: t.videoId,
      audioUrl: t.audioUrl,
      query: `${t.artist ?? ''} ${t.title}`.trim(),
    }))
    playPlaylist(activeTracks, index)
  }

  return (
    <Modal
      rootProps={{
        open: open,
        onClose: () => setOpen(false),
      }}
      overlay
      footer={
        <div className='flex w-full flex-row items-center justify-between gap-3 p-4 md:gap-6 md:p-6'>
          <div className='flex items-center gap-2.5'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Close
            </Button>
            {currentPlaylist && currentPlaylist.tracks.length > 0 && (
              <Button
                className='cursor-pointer gap-2 bg-amber-500 font-bold text-neutral-950 shadow-md hover:bg-amber-400'
                onClick={handlePlayAll}
              >
                <Play className='size-4 fill-neutral-950' /> Play All (
                {currentPlaylist.tracks.length})
              </Button>
            )}
          </div>
          {currentPlaylist && currentPlaylist.tracks.length > 0 && (
            <Button
              variant='outline'
              onClick={() => {
                const nextPlaylists = playlists.map((p) =>
                  p.id === currentPlaylist.id ? { ...p, tracks: [] } : p,
                )
                setUserConfig({
                  ...userConfig,
                  playlists: nextPlaylists,
                })
              }}
            >
              Clear playlist
            </Button>
          )}
        </div>
      }
    >
      <ScrollArea
        className='not-landscape:w-full bg-background/60 lg:w-full landscape:h-full'
        innerClassName='max-h-[calc(100vh-var(--spacing)*12)]'
      >
        <div className='flex min-h-64 w-full flex-col gap-4 p-3.5 pb-18 md:gap-5 md:p-6 md:pb-24 lg:flex lg:pt-16 lg:pb-24'>
          {/* Header section with playlist tabs & count */}
          <div className='flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-3'>
            <div className='flex items-center gap-2'>
              <ListMusic className='size-5 text-amber-500' />
              <h2 className='font-black text-lg text-foreground tracking-tight'>
                Playlists
              </h2>
              <span className='rounded-full bg-amber-500/10 px-2 py-0.5 font-bold text-amber-500 text-xs'>
                {playlists.length}/3 Playlists
              </span>
            </div>

            {canCreateMore && !isCreating && (
              <Button
                size='sm'
                variant='outline'
                onClick={() => setIsCreating(true)}
                className='h-7 gap-1.5 rounded-full border-amber-500/40 text-amber-500 text-xs hover:bg-amber-500/10'
              >
                <Plus className='size-3.5' /> New Playlist
              </Button>
            )}
          </div>

          {/* New Playlist Creator Inline Form */}
          {isCreating && (
            <form
              onSubmit={handleCreatePlaylist}
              className='flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 p-2.5'
            >
              <input
                type='text'
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder='Playlist name (e.g. Chill Beats, Late Night)...'
                maxLength={40}
                autoFocus
                className='flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-foreground text-sm outline-none focus:border-amber-500'
              />
              <Button
                type='submit'
                size='sm'
                disabled={!newPlaylistName.trim()}
                className='h-8 bg-amber-500 font-bold text-neutral-950 hover:bg-amber-400'
              >
                Create
              </Button>
              <Button
                type='button'
                size='icon'
                variant='ghost'
                onClick={() => {
                  setIsCreating(false)
                  setNewPlaylistName('')
                }}
                className='size-8'
              >
                <X className='size-4' />
              </Button>
            </form>
          )}

          {/* Playlist Tabs Selector */}
          {playlists.length > 0 && (
            <div className='flex flex-wrap items-center gap-2'>
              {playlists.map((pl) => {
                const isSelected =
                  currentPlaylist && currentPlaylist.id === pl.id
                const isEditing = editingPlaylistId === pl.id

                if (isEditing) {
                  return (
                    <div
                      key={pl.id}
                      className='flex items-center gap-1.5 rounded-full border border-amber-500 bg-background px-2 py-1'
                    >
                      <input
                        type='text'
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(pl.id)
                          if (e.key === 'Escape') setEditingPlaylistId(null)
                        }}
                        maxLength={40}
                        autoFocus
                        className='w-28 rounded bg-transparent px-1 text-xs outline-none'
                      />
                      <button
                        type='button'
                        onClick={() => handleSaveRename(pl.id)}
                        className='cursor-pointer text-emerald-500 hover:text-emerald-400'
                      >
                        <Check className='size-3.5' />
                      </button>
                      <button
                        type='button'
                        onClick={() => setEditingPlaylistId(null)}
                        className='cursor-pointer text-muted-foreground hover:text-foreground'
                      >
                        <X className='size-3.5' />
                      </button>
                    </div>
                  )
                }

                return (
                  <div
                    key={pl.id}
                    className={cn(
                      'group flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-all',
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-500 shadow-sm'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                    )}
                  >
                    <button
                      type='button'
                      onClick={() => setActivePlaylistId(pl.id)}
                      className='flex cursor-pointer items-center gap-1.5 font-bold text-xs'
                    >
                      <span>{pl.name}</span>
                      <span className='rounded-full bg-foreground/10 px-1.5 py-0.2 text-[10px]'>
                        {pl.tracks.length}
                      </span>
                    </button>
                    <button
                      type='button'
                      onClick={() => handleStartRename(pl)}
                      title='Rename playlist'
                      className='cursor-pointer text-muted-foreground/60 transition-colors hover:text-foreground'
                    >
                      <Edit2 className='size-3' />
                    </button>
                    <button
                      type='button'
                      onClick={() => handleDeletePlaylist(pl.id)}
                      title='Delete playlist'
                      className='cursor-pointer text-muted-foreground/60 transition-colors hover:text-destructive'
                    >
                      <Trash2 className='size-3' />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Quick-add Currently Playing Song Bar */}
          {currentPlaylist && activeTrack && (
            <div className='flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-2.5'>
              <div className='flex min-w-0 items-center gap-2'>
                <div className='size-8 shrink-0 overflow-hidden rounded-md border border-border bg-neutral-900'>
                  {activeTrack.cover ? (
                    <img
                      src={activeTrack.cover}
                      alt={activeTrack.title}
                      className='size-full object-cover'
                    />
                  ) : (
                    <Music className='m-1.5 size-5 text-muted-foreground' />
                  )}
                </div>
                <div className='min-w-0'>
                  <p className='truncate font-bold text-xs text-foreground'>
                    {activeTrack.title}
                  </p>
                  <p className='truncate text-[10px] text-muted-foreground'>
                    {activeTrack.artist}
                  </p>
                </div>
              </div>
              <Button
                size='sm'
                variant='outline'
                onClick={() => handleAddActiveTrack(currentPlaylist.id)}
                disabled={currentPlaylist.tracks.some(
                  (t) =>
                    t.title.toLowerCase() === activeTrack.title.toLowerCase(),
                )}
                className='shrink-0 gap-1.5 rounded-full border-amber-500/40 text-amber-500 text-xs hover:bg-amber-500/10'
              >
                <ListPlus className='size-3.5' />
                {currentPlaylist.tracks.some(
                  (t) =>
                    t.title.toLowerCase() === activeTrack.title.toLowerCase(),
                )
                  ? 'In Playlist'
                  : 'Add Playing Song'}
              </Button>
            </div>
          )}

          {/* Current Playlist Content / Song List */}
          {currentPlaylist ? (
            currentPlaylist.tracks.length > 0 ? (
              <div className='flex flex-col gap-2'>
                {currentPlaylist.tracks.map((track, index) => (
                  <div
                    key={`${track.tmdbId}-${index}`}
                    className='group flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 p-2.5 transition-colors hover:border-amber-500/30 hover:bg-muted/40'
                  >
                    <div
                      className='flex min-w-0 flex-1 cursor-pointer items-center gap-3'
                      onClick={() => handlePlayOne(index)}
                    >
                      <div className='relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-neutral-900 shadow-sm'>
                        {track.poster ? (
                          <img
                            src={track.poster}
                            alt={track.title}
                            className='size-full object-cover'
                          />
                        ) : (
                          <Music className='size-5 text-muted-foreground' />
                        )}
                        <div className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
                          <Play className='size-5 fill-white text-white' />
                        </div>
                      </div>
                      <div className='min-w-0 flex-1'>
                        <p className='truncate font-bold text-foreground text-sm group-hover:text-amber-400'>
                          {track.title}
                        </p>
                        <p className='truncate text-muted-foreground text-xs'>
                          {track.artist || track.albumTitle || 'Various Artists'}
                        </p>
                      </div>
                    </div>

                    <div className='flex shrink-0 items-center gap-1.5'>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() => handlePlayOne(index)}
                        title='Play this track'
                        className='size-8 text-amber-500 hover:bg-amber-500/10'
                      >
                        <Play className='size-4 fill-amber-500' />
                      </Button>
                      <Button
                        size='icon'
                        variant='ghost'
                        onClick={() =>
                          handleRemoveTrack(currentPlaylist.id, track.tmdbId)
                        }
                        title='Remove from playlist'
                        className='size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                      >
                        <Trash2 className='size-4' />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 text-center'>
                <div className='flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500'>
                  <Music className='size-6' />
                </div>
                <div className='max-w-xs'>
                  <p className='font-bold text-foreground text-sm'>
                    No songs in this playlist yet
                  </p>
                  <p className='mt-1 text-muted-foreground text-xs'>
                    Add unlimited songs using the "+ Playlist" button on any
                    album or from the music player!
                  </p>
                </div>
                {activeTrack && (
                  <Button
                    size='sm'
                    onClick={() => handleAddActiveTrack(currentPlaylist.id)}
                    className='gap-1.5 rounded-full bg-amber-500 font-bold text-neutral-950 hover:bg-amber-400'
                  >
                    <ListPlus className='size-4' /> Add "{activeTrack.title}"
                  </Button>
                )}
              </div>
            )
          ) : (
            /* Empty State: No Playlists Created Yet */
            <div className='flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-12 text-center'>
              <div className='flex size-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500'>
                <FolderPlus className='size-6' />
              </div>
              <div className='max-w-xs'>
                <p className='font-bold text-foreground text-sm'>
                  Create Your First Playlist
                </p>
                <p className='mt-1 text-muted-foreground text-xs'>
                  You can create up to 3 custom playlists with unlimited songs
                  each to play whatever you like.
                </p>
              </div>
              {!isCreating && (
                <Button
                  size='sm'
                  onClick={() => setIsCreating(true)}
                  className='gap-1.5 rounded-full bg-amber-500 font-bold text-neutral-950 hover:bg-amber-400'
                >
                  <Plus className='size-4' /> Create Playlist (1/3)
                </Button>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </Modal>
  )
}
