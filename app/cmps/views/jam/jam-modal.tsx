import { useShallowState } from '@/store'
import {
  AlertCircle,
  Check,
  Copy,
  Headphones,
  Link,
  Loader2,
  LogOut,
  Radio,
  RefreshCw,
  Share2,
  Sparkles,
  Volume2,
  Users,
  X,
  Zap,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { JamSessionService, jamService } from '../../../services/jam-session'
import { cn } from '../../../utils/tw'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Switch } from '../../ui/switch'

const VIBE_EMOJIS = ['❤️', '🔥', '🎵', '⚡', '💃', '🙌', '✨', '🎸']

export const JamModal = () => {
  const {
    jamModalOpen,
    setJamModalOpen,
    isJamConnected,
    isJamConnecting,
    isJamReconnecting,
    jamRoomCode,
    jamRole,
    jamError,
    jamLatency,
    jamParticipantCount,
    allowGuestControl,
    setAllowGuestControl,
    createJamRoom,
    joinJamRoom,
    leaveJamRoom,
    sendJamReaction,
    activeTrack,
    setJamError,
  } = useShallowState((state) => ({
    jamModalOpen: state.jamModalOpen,
    setJamModalOpen: state.setJamModalOpen,
    isJamConnected: state.isJamConnected,
    isJamConnecting: state.isJamConnecting,
    isJamReconnecting: state.isJamReconnecting,
    jamRoomCode: state.jamRoomCode,
    jamRole: state.jamRole,
    jamError: state.jamError,
    jamLatency: state.jamLatency,
    jamParticipantCount: state.jamParticipantCount,
    allowGuestControl: state.allowGuestControl,
    setAllowGuestControl: state.setAllowGuestControl,
    createJamRoom: state.createJamRoom,
    joinJamRoom: state.joinJamRoom,
    leaveJamRoom: state.leaveJamRoom,
    sendJamReaction: state.sendJamReaction,
    activeTrack: state.activeTrack,
    setJamError: state.setJamError,
  }))

  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  const [inputCode, setInputCode] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Session restoration on initial app mount (runs once)
  useEffect(() => {
    const restored = jamService.tryRestoreSession()
    if (restored) {
      setJamModalOpen(true)
    }
  }, [setJamModalOpen])

  // URL Hash / Search param auto-detection (e.g. #jam=NTLT-8K92 or ?jam=NTLT-8K92)
  useEffect(() => {
    const handleUrlJam = () => {
      const hash = window.location.hash
      const params = new URLSearchParams(window.location.search)
      let codeParam: string | null = null

      if (hash.includes('jam=')) {
        codeParam = hash.split('jam=')[1]?.split('&')[0]
      } else if (params.get('jam')) {
        codeParam = params.get('jam')
      }

      if (codeParam && !isJamConnected && !isJamConnecting) {
        const cleaned = JamSessionService.cleanRoomCode(codeParam)
        setInputCode(cleaned)
        setActiveTab('join')
        setJamModalOpen(true)
      }
    }

    handleUrlJam()
    window.addEventListener('hashchange', handleUrlJam)
    return () => window.removeEventListener('hashchange', handleUrlJam)
  }, [isJamConnected, isJamConnecting, setJamModalOpen])

  if (!jamModalOpen) return null

  const getInviteUrl = (code: string) => {
    const base = window.location.origin + window.location.pathname
    return `${base}#jam=${encodeURIComponent(code)}`
  }

  const handleCopyLink = () => {
    if (!jamRoomCode) return
    const url = getInviteUrl(jamRoomCode)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }

  const handleCopyCode = () => {
    if (!jamRoomCode) return
    navigator.clipboard.writeText(jamRoomCode).then(() => {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    })
  }

  const handleNativeShare = () => {
    if (!jamRoomCode) return
    const url = getInviteUrl(jamRoomCode)
    const shareText = `Listen to songs together in sync with me on Nothing to Listen to!\nJoin my private session: ${url}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: 'Nothing to Listen to — Listen Together',
          text: shareText,
          url,
        })
        .catch(() => {})
    } else {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
      window.open(waUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCreate = async () => {
    setJamError(null)
    try {
      await createJamRoom()
    } catch (_) {}
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputCode.trim()
    if (!trimmed) return
    setJamError(null)
    try {
      await joinJamRoom(trimmed)
    } catch (_) {}
  }

  return (
    <div
      className='fade-in-0 fixed inset-0 z-80 flex animate-in items-center justify-center bg-background/80 p-3 backdrop-blur-md duration-200 sm:p-6'
      onClick={() => setJamModalOpen(false)}
    >
      <div
        className='relative flex w-full max-w-md flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-5 text-foreground shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-6'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type='button'
          onClick={() => setJamModalOpen(false)}
          className='absolute top-4 right-4 cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          title='Close'
        >
          <X className='size-4' />
        </button>

        {/* Modal Header */}
        <div className='flex items-center gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500'>
            <Radio className='size-5 animate-pulse' />
          </div>
          <div>
            <div className='flex items-center gap-2'>
              <h2 className='font-bold text-base tracking-tight sm:text-lg'>
                Listen Together (Jam)
              </h2>
              {isJamConnected && (
                <span className='inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-bold text-[10px] text-emerald-400'>
                  <Users className='size-2.5' /> {jamParticipantCount > 1 ? `${jamParticipantCount} Connected` : 'Group Jam'}
                </span>
              )}
            </div>
            <p className='text-muted-foreground text-xs'>
              Real-time audio sync for friends & groups across the internet
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {jamError && (
          <div className='fade-in flex animate-in items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive text-xs'>
            <AlertCircle className='mt-0.5 size-4 shrink-0' />
            <div className='flex-1'>{jamError}</div>
            <button
              type='button'
              onClick={() => setJamError(null)}
              className='cursor-pointer hover:opacity-75'
            >
              <X className='size-3.5' />
            </button>
          </div>
        )}

        {/* CASE 1: Connected State (Active Session) or Reconnecting */}
        {isJamConnected || (jamRoomCode && isJamReconnecting) ? (
          <div className='flex flex-col gap-4'>
            {/* Connection Banner */}
            <div
              className={cn(
                'flex flex-col gap-2 rounded-xl border p-3.5',
                isJamReconnecting
                  ? 'border-amber-500/25 bg-amber-500/10'
                  : 'border-emerald-500/25 bg-emerald-500/10',
              )}
            >
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {isJamReconnecting ? (
                    <>
                      <Loader2 className='size-3.5 animate-spin text-amber-500' />
                      <span className='font-bold text-amber-400 text-xs'>
                        Reconnecting to Session...
                      </span>
                    </>
                  ) : (
                    <>
                      <span className='size-2 animate-ping rounded-full bg-emerald-500' />
                      <span className='font-bold text-emerald-400 text-xs'>
                        Connected ({jamParticipantCount > 0 ? jamParticipantCount : 2} Listeners in Sync)
                      </span>
                    </>
                  )}
                </div>
                <div className='flex items-center gap-1.5 font-medium text-[11px] text-muted-foreground tabular-nums'>
                  <Zap className='size-3 text-amber-500' />
                  {isJamReconnecting
                    ? 'Auto-recovering...'
                    : jamLatency
                      ? `${jamLatency}ms latency`
                      : 'Direct Relay'}
                </div>
              </div>

              <div className='flex items-center justify-between border-emerald-500/20 border-t pt-2 text-xs'>
                <span className='text-muted-foreground'>Room Code:</span>
                <div className='flex items-center gap-2 font-bold font-mono text-foreground'>
                  <span>{jamRoomCode}</span>
                  <button
                    type='button'
                    onClick={handleCopyCode}
                    className='cursor-pointer text-muted-foreground hover:text-foreground'
                    title='Copy Code'
                  >
                    {copiedCode ? (
                      <Check className='size-3.5 text-emerald-400' />
                    ) : (
                      <Copy className='size-3.5' />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Now Playing in Sync Preview */}
            <div className='flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 p-3'>
              <div className='flex min-w-0 items-center gap-2.5'>
                <Volume2 className='size-4 shrink-0 animate-pulse text-amber-500' />
                <div className='flex min-w-0 flex-col'>
                  <span className='font-bold text-[10px] text-muted-foreground uppercase tracking-wider'>
                    Synchronized Audio
                  </span>
                  <span className='truncate font-bold text-foreground text-xs'>
                    {activeTrack
                      ? activeTrack.title
                      : 'Ready — select any song to play'}
                  </span>
                </div>
              </div>
              <span className='shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-semibold text-[10px] text-emerald-400'>
                In Sync
              </span>
            </div>

            {/* Quick Vibes / Reactions Bar */}
            <div className='flex flex-col gap-1.5'>
              <span className='font-semibold text-[11px] text-muted-foreground'>
                Send Live Vibe to Everyone:
              </span>
              <div className='flex items-center justify-between gap-1'>
                {VIBE_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type='button'
                    onClick={() => sendJamReaction(emoji)}
                    className='flex size-9 cursor-pointer items-center justify-center rounded-xl bg-muted/40 text-lg transition-transform hover:border hover:border-amber-500/40 hover:bg-muted active:scale-125'
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Host DJ Controls */}
            {jamRole === 'host' && (
              <div className='flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 p-3 text-xs'>
                <div className='flex flex-col'>
                  <span className='font-semibold text-foreground'>
                    Collaborative DJ Mode
                  </span>
                  <span className='text-[11px] text-muted-foreground'>
                    Allow listeners to change songs and seek
                  </span>
                </div>
                <Switch
                  checked={allowGuestControl}
                  onCheckedChange={setAllowGuestControl}
                />
              </div>
            )}

            {/* Leave Room Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={leaveJamRoom}
              className='flex w-full cursor-pointer items-center justify-center gap-1.5 border-destructive/30 text-destructive text-xs hover:bg-destructive/10'
            >
              <LogOut className='size-3.5' /> Leave Session
            </Button>
          </div>
        ) : (
          /* CASE 2: Not Connected (Create or Join) */
          <div className='flex flex-col gap-4'>
            {/* Tab Switcher */}
            <div className='grid grid-cols-2 rounded-xl bg-muted/50 p-1 font-semibold text-xs'>
              <button
                type='button'
                onClick={() => setActiveTab('create')}
                className={cn(
                  'cursor-pointer rounded-lg py-1.5 text-center transition-all',
                  activeTab === 'create'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Create Room
              </button>
              <button
                type='button'
                onClick={() => setActiveTab('join')}
                className={cn(
                  'cursor-pointer rounded-lg py-1.5 text-center transition-all',
                  activeTab === 'join'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Join Room
              </button>
            </div>

            {/* TAB 1: Create Room */}
            {activeTab === 'create' && (
              <div className='flex flex-col gap-3.5'>
                {jamRoomCode ? (
                  /* Room Created & Waiting for Partner */
                  <div className='flex flex-col gap-3'>
                    <div className='flex flex-col items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center'>
                      <span className='font-bold text-[11px] text-amber-500 uppercase tracking-wider'>
                        Your Private Room Code
                      </span>
                      <div className='flex items-center gap-2'>
                        <span className='font-black font-mono text-2xl text-foreground tracking-widest'>
                          {jamRoomCode}
                        </span>
                        <button
                          type='button'
                          onClick={handleCopyCode}
                          className='cursor-pointer rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                          title='Copy Code'
                        >
                          {copiedCode ? (
                            <Check className='size-4 text-emerald-400' />
                          ) : (
                            <Copy className='size-4' />
                          )}
                        </button>
                      </div>
                      <div className='flex items-center gap-1.5 text-muted-foreground text-xs'>
                        <Loader2 className='size-3.5 animate-spin text-amber-500' />
                        <span>Waiting for listeners to join...</span>
                      </div>
                      <span className='text-[10px] text-muted-foreground/75'>
                        Share this code with friends — 4, 8, or more can all listen together!
                      </span>
                    </div>

                    {/* Share Action Buttons */}
                    <div className='grid grid-cols-2 gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleCopyLink}
                        className='flex cursor-pointer items-center justify-center gap-1.5 text-xs'
                      >
                        {copiedLink ? (
                          <>
                            <Check className='size-3.5 text-emerald-400' />{' '}
                            Copied!
                          </>
                        ) : (
                          <>
                            <Link className='size-3.5' /> Copy Link
                          </>
                        )}
                      </Button>
                      <Button
                        size='sm'
                        onClick={handleNativeShare}
                        className='flex cursor-pointer items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs hover:bg-emerald-700'
                      >
                        <Share2 className='size-3.5' /> Share Invite
                      </Button>
                    </div>

                    <div className='flex items-center justify-center gap-1.5 px-2 text-center text-[11px] text-muted-foreground'>
                      <Users className='size-3 shrink-0 text-emerald-500' />
                      <span>
                        Multi-user group listening unlocked! Share with 4 or more friends.
                      </span>
                    </div>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={leaveJamRoom}
                      className='cursor-pointer text-muted-foreground text-xs hover:text-destructive'
                    >
                      Cancel Room
                    </Button>
                  </div>
                ) : (
                  /* Initial Create Button */
                  <div className='flex flex-col gap-3'>
                    <div className='flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-muted-foreground text-xs'>
                      <Sparkles className='mt-0.5 size-4 shrink-0 text-primary' />
                      <div>
                        <strong className='text-foreground'>
                          How it works:
                        </strong>{' '}
                        Create a private room and send the 1-click link to a
                        friend on mobile or desktop. As soon as they join, you
                        stream songs together in perfect sync!
                      </div>
                    </div>

                    <Button
                      onClick={handleCreate}
                      disabled={isJamConnecting}
                      className='flex h-10 w-full cursor-pointer items-center justify-center gap-2 font-bold text-xs'
                    >
                      {isJamConnecting ? (
                        <>
                          <Loader2 className='size-4 animate-spin' /> Generating
                          Private Room...
                        </>
                      ) : (
                        <>
                          <Radio className='size-4' /> Create Private Room
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Join Room */}
            {activeTab === 'join' && (
              <form onSubmit={handleJoin} className='flex flex-col gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <label
                    htmlFor='room-code-input'
                    className='font-medium text-muted-foreground text-xs'
                  >
                    Enter Room Code or Invite:
                  </label>
                  <Input
                    id='room-code-input'
                    placeholder='e.g. NTLT-7A9B or 7A9B'
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className='h-10 font-mono text-sm uppercase tracking-wider'
                    autoFocus
                  />
                </div>

                <Button
                  type='submit'
                  disabled={!inputCode.trim() || isJamConnecting}
                  className='flex h-10 w-full cursor-pointer items-center justify-center gap-2 font-bold text-xs'
                >
                  {isJamConnecting ? (
                    <>
                      <Loader2 className='size-4 animate-spin' /> Connecting to
                      Room...
                    </>
                  ) : (
                    <>
                      <Headphones className='size-4' /> Connect &amp; Listen
                      Together
                    </>
                  )}
                </Button>

                {/* Cancel Connecting Button */}
                {isJamConnecting && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={leaveJamRoom}
                    className='cursor-pointer text-muted-foreground text-xs hover:text-foreground'
                  >
                    Cancel Connection
                  </Button>
                )}

                {/* Retry Button if an error occurred */}
                {jamError && !isJamConnecting && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleJoin}
                    className='flex cursor-pointer items-center justify-center gap-2 border-amber-500/40 text-amber-500 text-xs hover:bg-amber-500/10'
                  >
                    <RefreshCw className='size-3.5' /> Retry Connection
                  </Button>
                )}

                <p className='text-center text-[11px] text-muted-foreground'>
                  If your friend sent you an invite link, opening it will
                  auto-fill the room code.
                </p>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
