import { connect } from 'itty-sockets'
import type { ActiveTrack } from '../store/player-slice'

export type JamRole = 'host' | 'guest'

export type JamMessage =
  | {
      type: 'SYNC_TRACK'
      track: ActiveTrack
      playlist?: ActiveTrack[]
      playlistIndex?: number
      currentTime?: number
      isPlaying?: boolean
      sentAt: number
    }
  | {
      type: 'PLAY'
      currentTime: number
      sentAt: number
    }
  | {
      type: 'PAUSE'
      currentTime: number
      sentAt: number
    }
  | {
      type: 'SEEK'
      currentTime: number
      sentAt: number
    }
  | {
      type: 'HEARTBEAT'
      currentTime: number
      isPlaying: boolean
      sentAt: number
    }
  | {
      type: 'PING'
      sentAt: number
    }
  | {
      type: 'PONG'
      origSentAt: number
    }
  | {
      type: 'REACTION'
      emoji: string
      sentAt: number
    }
  | {
      type: 'PERMISSIONS'
      allowGuestControl: boolean
    }
  | {
      type: 'ROOM_FULL'
      message: string
    }

export interface JamCallbacks {
  onStatusChange?: (status: {
    isConnected: boolean
    isConnecting: boolean
    role: JamRole | null
    roomCode: string | null
    error: string | null
    latency: number | null
  }) => void
  onPartnerConnected?: () => void
  onRemoteTrack?: (
    track: ActiveTrack,
    playlist?: ActiveTrack[],
    playlistIndex?: number,
  ) => void
  onRemotePlay?: (currentTime: number, sentAt: number) => void
  onRemotePause?: (currentTime: number) => void
  onRemoteSeek?: (currentTime: number) => void
  onRemoteHeartbeat?: (
    currentTime: number,
    isPlaying: boolean,
    sentAt: number,
  ) => void
  onRemoteReaction?: (emoji: string) => void
  onPermissionsChange?: (allowGuestControl: boolean) => void
}

const ROOM_CHANNEL_PREFIX = 'ntlt-v2-jam-'

type IttySocketInstance = ReturnType<typeof connect>

export class JamSessionService {
  private socket: IttySocketInstance | null = null
  private role: JamRole | null = null
  private roomCode: string | null = null
  private callbacks: JamCallbacks = {}
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private isConnecting = false
  private partnerConnected = false
  private latency: number | null = null
  private allowGuestControl = false
  private visibilityListenerAttached = false

  constructor() {
    this.setupVisibilityListeners()
  }

  private setupVisibilityListeners() {
    if (typeof document === 'undefined' || this.visibilityListenerAttached) {
      return
    }
    this.visibilityListenerAttached = true

    const handleReconnectOnVisible = () => {
      if (document.visibilityState === 'visible' && this.socket) {
        try {
          const s = this.socket as unknown as { reconnect?: () => void }
          s.reconnect?.()
        } catch (_) {}
      }
    }

    document.addEventListener('visibilitychange', handleReconnectOnVisible)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleReconnectOnVisible)
    }
  }

  public setCallbacks(callbacks: JamCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks }
  }

  public getRole(): JamRole | null {
    return this.role
  }

  public getRoomCode(): string | null {
    return this.roomCode
  }

  public isConnected(): boolean {
    return this.partnerConnected
  }

  public getAllowGuestControl(): boolean {
    return this.allowGuestControl
  }

  public setAllowGuestControl(allow: boolean) {
    this.allowGuestControl = allow
    if (this.role === 'host' && this.isConnected()) {
      this.send({ type: 'PERMISSIONS', allowGuestControl: allow })
    }
  }

  /**
   * Generates a 4-character alphanumeric room code like NTLT-7A9B
   */
  public static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `NTLT-${code}`
  }

  /**
   * Standardizes code input to clean format: e.g. "ntlt-7a9b" or "7A9B" -> "NTLT-7A9B"
   */
  public static cleanRoomCode(input: string): string {
    const raw = input
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]/g, '')
    if (raw.startsWith('NTLT')) {
      const rest = raw.slice(4)
      return rest ? `NTLT-${rest}` : raw
    }
    return `NTLT-${raw}`
  }

  private getChannelFromCode(code: string): string {
    const clean = code.toLowerCase().replace(/[^a-z0-9]/g, '')
    return `${ROOM_CHANNEL_PREFIX}${clean}`
  }

  /**
   * Creates a private room as Host (Max capacity: 2 users)
   */
  public async createRoom(customCode?: string): Promise<string> {
    this.cleanup()

    const code = customCode
      ? JamSessionService.cleanRoomCode(customCode)
      : JamSessionService.generateRoomCode()
    this.roomCode = code
    this.role = 'host'
    this.isConnecting = false
    this.partnerConnected = false
    this.emitStatus()

    const channel = this.getChannelFromCode(code)
    const socket = connect(channel, {
      as: 'host',
      announce: true,
      list: true,
    })
    this.socket = socket

    socket.on('join', ({ alias, total }) => {
      // Strict 2-user enforcement: if total > 2, reject additional guests
      if (total && total > 2 && alias !== 'host') {
        socket.send({
          type: 'ROOM_FULL',
          message: 'This room is full! Private sessions are strictly 2 users.',
        } as JamMessage)
        return
      }

      if (alias === 'guest') {
        this.partnerConnected = true
        this.isConnecting = false
        this.emitStatus()
        this.startPingLoop()

        // Send initial permissions to partner
        this.send({
          type: 'PERMISSIONS',
          allowGuestControl: this.allowGuestControl,
        })

        this.callbacks.onPartnerConnected?.()
      }
    })

    socket.on('leave', ({ alias }) => {
      if (alias === 'guest') {
        this.partnerConnected = false
        this.stopPingLoop()
        this.latency = null
        this.emitStatus('Partner disconnected')
      }
    })

    socket.on('message', ({ message, alias }) => {
      if (alias === 'guest') {
        this.handleIncomingMessage(message as JamMessage)
      }
    })

    socket.on('error', (err) => {
      this.emitStatus(err?.message || 'Network error')
    })

    return code
  }

  /**
   * Joins an existing room as Guest
   */
  public async joinRoom(roomCodeInput: string): Promise<void> {
    this.cleanup()

    const code = JamSessionService.cleanRoomCode(roomCodeInput)
    this.roomCode = code
    this.role = 'guest'
    this.isConnecting = true
    this.partnerConnected = false
    this.emitStatus()

    const channel = this.getChannelFromCode(code)
    const socket = connect(channel, {
      as: 'guest',
      announce: true,
      list: true,
    })
    this.socket = socket

    return new Promise<void>((resolve, reject) => {
      let isSettled = false

      // 12-second timeout
      const timeoutTimer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true
          this.cleanup()
          const errMsg = `Could not connect to room "${code}". Make sure your friend has the room open and check the code.`
          this.emitStatus(errMsg)
          reject(new Error(errMsg))
        }
      }, 12000)

      const safeResolve = () => {
        if (!isSettled) {
          isSettled = true
          clearTimeout(timeoutTimer)
          this.partnerConnected = true
          this.isConnecting = false
          this.emitStatus()
          this.startPingLoop()
          this.send({ type: 'PING', sentAt: Date.now() })
          this.callbacks.onPartnerConnected?.()
          resolve()
        }
      }

      const safeReject = (err: Error) => {
        if (!isSettled) {
          isSettled = true
          clearTimeout(timeoutTimer)
          this.cleanup()
          this.emitStatus(err.message)
          reject(err)
        }
      }

      socket.on('join', ({ users, total }) => {
        if (total && total > 2) {
          safeReject(
            new Error(
              'This room is full! Private listening sessions are strictly 2 users.',
            ),
          )
          return
        }

        const hasHost = users?.some((u) => u.alias === 'host')
        if (hasHost) {
          safeResolve()
        }
      })

      socket.on('message', ({ message, alias }) => {
        if (alias === 'host') {
          safeResolve()
          this.handleIncomingMessage(message as JamMessage)
        }
      })

      socket.on('leave', ({ alias }) => {
        if (alias === 'host') {
          this.partnerConnected = false
          this.stopPingLoop()
          this.latency = null
          this.emitStatus('Host disconnected')
        }
      })

      socket.on('error', (err) => {
        safeReject(new Error(err?.message || 'Connection error'))
      })
    })
  }

  private handleIncomingMessage(msg: JamMessage) {
    if (!msg || typeof msg !== 'object') return

    switch (msg.type) {
      case 'ROOM_FULL':
        this.cleanup()
        this.emitStatus(
          msg.message || 'Room is already full (maximum 2 listeners).',
        )
        break

      case 'SYNC_TRACK':
        this.callbacks.onRemoteTrack?.(
          msg.track,
          msg.playlist,
          msg.playlistIndex,
        )
        if (msg.currentTime !== undefined) {
          if (msg.isPlaying) {
            this.callbacks.onRemotePlay?.(msg.currentTime, msg.sentAt)
          } else {
            this.callbacks.onRemotePause?.(msg.currentTime)
          }
        }
        break

      case 'PLAY':
        this.callbacks.onRemotePlay?.(msg.currentTime, msg.sentAt)
        break

      case 'PAUSE':
        this.callbacks.onRemotePause?.(msg.currentTime)
        break

      case 'SEEK':
        this.callbacks.onRemoteSeek?.(msg.currentTime)
        break

      case 'HEARTBEAT':
        this.callbacks.onRemoteHeartbeat?.(
          msg.currentTime,
          msg.isPlaying,
          msg.sentAt,
        )
        break

      case 'PING':
        this.send({ type: 'PONG', origSentAt: msg.sentAt })
        break

      case 'PONG': {
        const rtt = Date.now() - msg.origSentAt
        this.latency = Math.max(1, Math.round(rtt / 2))
        this.emitStatus()
        break
      }

      case 'REACTION':
        this.callbacks.onRemoteReaction?.(msg.emoji)
        break

      case 'PERMISSIONS':
        this.allowGuestControl = msg.allowGuestControl
        this.callbacks.onPermissionsChange?.(msg.allowGuestControl)
        break
    }
  }

  public send(msg: JamMessage) {
    if (this.socket) {
      try {
        this.socket.send(msg)
      } catch (_) {}
    }
  }

  public broadcastTrack(
    track: ActiveTrack,
    playlist?: ActiveTrack[],
    playlistIndex?: number,
    currentTime?: number,
    isPlaying?: boolean,
  ) {
    this.send({
      type: 'SYNC_TRACK',
      track,
      playlist,
      playlistIndex,
      currentTime,
      isPlaying,
      sentAt: Date.now(),
    })
  }

  public broadcastPlay(currentTime: number) {
    this.send({
      type: 'PLAY',
      currentTime,
      sentAt: Date.now(),
    })
  }

  public broadcastPause(currentTime: number) {
    this.send({
      type: 'PAUSE',
      currentTime,
      sentAt: Date.now(),
    })
  }

  public broadcastSeek(currentTime: number) {
    this.send({
      type: 'SEEK',
      currentTime,
      sentAt: Date.now(),
    })
  }

  public broadcastHeartbeat(currentTime: number, isPlaying: boolean) {
    this.send({
      type: 'HEARTBEAT',
      currentTime,
      isPlaying,
      sentAt: Date.now(),
    })
  }

  public broadcastReaction(emoji: string) {
    this.send({
      type: 'REACTION',
      emoji,
      sentAt: Date.now(),
    })
  }

  private startPingLoop() {
    this.stopPingLoop()
    // Ping every 3 seconds to measure real-time latency
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'PING', sentAt: Date.now() })
      }
    }, 3000)
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  public emitStatus(errorOverride?: string | null) {
    this.callbacks.onStatusChange?.({
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      role: this.role,
      roomCode: this.roomCode,
      error: errorOverride ?? null,
      latency: this.latency,
    })
  }

  public cleanup() {
    this.stopPingLoop()
    if (this.socket) {
      try {
        this.socket.close()
      } catch (_) {}
      this.socket = null
    }
    this.partnerConnected = false
    this.role = null
    this.roomCode = null
    this.isConnecting = false
    this.latency = null
    this.emitStatus()
  }
}

export const jamService = new JamSessionService()
