import { connect } from 'itty-sockets'
import type { ActiveTrack } from '../store/player-slice'

export type JamRole = 'host' | 'guest'

export type JamMessage =
  | {
    type: 'HELLO'
    senderId: string
    role: JamRole
    resume?: boolean
    sentAt: number
  }
  | {
    type: 'WELCOME'
    senderId: string
    hostTrack?: ActiveTrack | null
    playlist?: ActiveTrack[]
    playlistIndex?: number
    currentTime?: number
    isPlaying?: boolean
    allowGuestControl?: boolean
    participantCount?: number
    sentAt: number
  }
  | {
    type: 'PARTICIPANTS'
    senderId: string
    count: number
    sentAt: number
  }
  | {
    type: 'LEAVE'
    senderId: string
    sentAt: number
  }
  | {
    type: 'REJECT'
    reason: 'ROOM_FULL'
    message: string
    sentAt: number
  }
  | {
    type: 'SYNC_TRACK'
    senderId: string
    track: ActiveTrack
    playlist?: ActiveTrack[]
    playlistIndex?: number
    currentTime?: number
    isPlaying?: boolean
    sentAt: number
  }
  | {
    type: 'PLAY'
    senderId: string
    currentTime: number
    sentAt: number
  }
  | {
    type: 'PAUSE'
    senderId: string
    currentTime: number
    sentAt: number
  }
  | {
    type: 'SEEK'
    senderId: string
    currentTime: number
    sentAt: number
  }
  | {
    type: 'HEARTBEAT'
    senderId: string
    currentTime: number
    isPlaying: boolean
    sentAt: number
  }
  | {
    type: 'HEARTBEAT_ACK'
    senderId: string
    sentAt: number
  }
  | {
    type: 'PING'
    senderId: string
    sentAt: number
  }
  | {
    type: 'PONG'
    senderId: string
    origSentAt: number
    recvAt?: number
  }
  | {
    type: 'REACTION'
    senderId: string
    emoji: string
    sentAt: number
  }
  | {
    type: 'PERMISSIONS'
    senderId: string
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
    isReconnecting: boolean
    role: JamRole | null
    roomCode: string | null
    error: string | null
    latency: number | null
    participantCount: number
  }) => void
  onPartnerConnected?: () => void
  onPartnerDisconnected?: () => void
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
  getCurrentTrackState?: () => {
    track: ActiveTrack | null
    playlist: ActiveTrack[]
    playlistIndex: number
    currentTime: number
    isPlaying: boolean
  }
}

const ROOM_CHANNEL_PREFIX = 'ntlt-v2-jam-'
const SESSION_STORAGE_KEY = 'ntlt_jam_session_v2'

type IttySocketInstance = ReturnType<typeof connect>

function generateClientId(role: JamRole): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${role}_${Date.now()}_${rand}`
}

export class JamSessionService {
  private socket: IttySocketInstance | null = null
  private role: JamRole | null = null
  private roomCode: string | null = null
  private clientId = ''
  private callbacks: JamCallbacks = {}

  private isConnecting = false
  private isReconnecting = false
  private partnerConnected = false
  private latency: number | null = null
  private clockOffset = 0
  private allowGuestControl = false
  private participantCount = 0

  // Multi-user guest tracking (mapping guestId -> lastSeen timestamp)
  private activeGuests = new Map<string, number>()

  // Heartbeat & reconnect intervals
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null
  private watchdogInterval: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private lastPartnerMessageAt = 0

  private visibilityListenerAttached = false
  private userExplicitlyLeft = false

  constructor() {
    this.setupLifecycleListeners()
  }

  private setupLifecycleListeners() {
    if (typeof window === 'undefined' || this.visibilityListenerAttached) return
    this.visibilityListenerAttached = true

    const handleResume = () => {
      if (document.visibilityState === 'visible' || navigator.onLine) {
        if (this.roomCode && this.role && !this.userExplicitlyLeft) {
          if (!this.partnerConnected || !this.socket) {
            this.triggerAutoReconnect()
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleResume)
    window.addEventListener('focus', handleResume)
    window.addEventListener('online', handleResume)
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
    if (this.role === 'host') {
      return this.activeGuests.size > 0
    }
    return this.partnerConnected
  }

  public getParticipantCount(): number {
    if (!this.roomCode) return 0
    if (this.role === 'host') {
      return 1 + this.activeGuests.size
    }
    if (this.role === 'guest') {
      return this.partnerConnected ? Math.max(2, this.participantCount) : 1
    }
    return 1
  }

  public getLatency(): number {
    return this.latency ?? 40
  }

  public getClockOffset(): number {
    return this.clockOffset
  }

  public getAllowGuestControl(): boolean {
    return this.allowGuestControl
  }

  public setAllowGuestControl(allow: boolean) {
    this.allowGuestControl = allow
    if (this.role === 'host' && this.isConnected()) {
      this.send({
        type: 'PERMISSIONS',
        senderId: this.clientId,
        allowGuestControl: allow,
      })
    }
  }

  public static generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return `NTLT-${code}`
  }

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

  private saveSession() {
    if (typeof sessionStorage === 'undefined') return
    try {
      if (this.roomCode && this.role && !this.userExplicitlyLeft) {
        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            roomCode: this.roomCode,
            role: this.role,
            clientId: this.clientId,
          }),
        )
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    } catch { }
  }

  public tryRestoreSession(): boolean {
    if (this.roomCode || this.partnerConnected || this.isConnecting)
      return false
    if (typeof sessionStorage === 'undefined') return false
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY)
      if (!raw) return false
      const data = JSON.parse(raw)
      if (data?.roomCode && (data?.role === 'host' || data?.role === 'guest')) {
        this.roomCode = data.roomCode
        this.role = data.role
        this.clientId = data.clientId || generateClientId(this.role!)
        this.userExplicitlyLeft = false
        if (this.role === 'host') {
          void this.createRoom(this.roomCode || undefined)
        } else {
          void this.joinRoom(this.roomCode!)
        }
        return true
      }
    } catch { }
    return false
  }

  /**
   * Host creates a room for group listening (multi-user).
   */
  public async createRoom(customCode?: string): Promise<string> {
    this.cleanupNetwork()
    this.userExplicitlyLeft = false

    const code = customCode
      ? JamSessionService.cleanRoomCode(customCode)
      : JamSessionService.generateRoomCode()
    this.roomCode = code
    this.role = 'host'
    this.clientId = this.clientId || generateClientId('host')
    this.isConnecting = false
    this.isReconnecting = false
    this.partnerConnected = false
    this.activeGuests.clear()
    this.participantCount = 1
    this.emitStatus()
    this.saveSession()

    this.initHostSocket(code)
    return code
  }

  private initHostSocket(code: string) {
    const channel = this.getChannelFromCode(code)
    const socket = connect(channel, {
      as: 'host',
      announce: true,
      list: true,
    })
    this.socket = socket

    socket.on('*', (data) => {
      if (data?.type === 'join' || data?.type === 'leave') return
      this.handleIncomingMessage(data as unknown as JamMessage)
    })

    socket.on('close', () => {
      if (!this.userExplicitlyLeft && this.roomCode) {
        this.triggerAutoReconnect()
      }
    })

    socket.on('error', () => {
      if (!this.userExplicitlyLeft && this.roomCode) {
        this.triggerAutoReconnect()
      }
    })

    this.startWatchdog()
  }

  /**
   * Guest joins an existing room.
   */
  public async joinRoom(roomCodeInput: string): Promise<void> {
    this.cleanupNetwork()
    this.userExplicitlyLeft = false

    const code = JamSessionService.cleanRoomCode(roomCodeInput)
    this.roomCode = code
    this.role = 'guest'
    this.clientId = this.clientId || generateClientId('guest')
    this.isConnecting = true
    this.isReconnecting = false
    this.partnerConnected = false
    this.emitStatus()
    this.saveSession()

    const channel = this.getChannelFromCode(code)
    const socket = connect(channel, {
      as: 'guest',
      announce: true,
      list: true,
    })
    this.socket = socket

    return new Promise<void>((resolve, reject) => {
      let isSettled = false

      // 12-second connect timeout
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
          this.isReconnecting = false
          this.emitStatus()
          this.startPingLoop()
          this.startWatchdog()
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

      socket.on('open', () => {
        // Send initial HELLO handshake to Host
        this.send({
          type: 'HELLO',
          senderId: this.clientId,
          role: 'guest',
          sentAt: Date.now(),
        })
      })

      // Also send HELLO on join in case socket opened quickly
      socket.on('join', () => {
        this.send({
          type: 'HELLO',
          senderId: this.clientId,
          role: 'guest',
          sentAt: Date.now(),
        })
      })

      socket.on('*', (data) => {
        if (data?.type === 'join' || data?.type === 'leave') return
        const msg = data as unknown as JamMessage
        if (!msg) return

        if (msg.type === 'WELCOME') {
          safeResolve()
          this.handleIncomingMessage(msg)
        } else if (msg.type === 'REJECT' || msg.type === 'ROOM_FULL') {
          const reason =
            msg.type === 'REJECT' ? msg.message : msg.message || 'Room is full'
          safeReject(new Error(reason))
        } else {
          this.handleIncomingMessage(msg)
        }
      })

      socket.on('close', () => {
        if (!isSettled) {
          // Retry before giving up
          this.triggerAutoReconnect()
        } else if (!this.userExplicitlyLeft) {
          this.triggerAutoReconnect()
        }
      })

      socket.on('error', (err) => {
        if (!isSettled) {
          safeReject(new Error(err?.message || 'Connection failed'))
        } else {
          this.triggerAutoReconnect()
        }
      })
    })
  }

  private handleIncomingMessage(msg: JamMessage) {
    if (!msg || typeof msg !== 'object') return
    // Ignore self-echoes broadcast by itty.ws
    if ('senderId' in msg && msg.senderId === this.clientId) return
    this.lastPartnerMessageAt = Date.now()

    // Host tracks guest activity whenever any message is received from a guest
    if (this.role === 'host' && 'senderId' in msg && msg.senderId) {
      this.activeGuests.set(msg.senderId, Date.now())
    }

    // Host handling of guest handshake
    if (this.role === 'host') {
      if (msg.type === 'HELLO') {
        const incomingGuestId = msg.senderId
        this.activeGuests.set(incomingGuestId, Date.now())
        this.partnerConnected = true
        this.isConnecting = false
        this.isReconnecting = false
        this.startPingLoop()
        this.startHeartbeatLoop()

        const count = this.getParticipantCount()
        this.emitStatus()

        // Send state to newly joined guest
        const current = this.callbacks.getCurrentTrackState?.()
        this.send({
          type: 'WELCOME',
          senderId: this.clientId,
          hostTrack: current?.track ?? null,
          playlist: current?.playlist,
          playlistIndex: current?.playlistIndex,
          currentTime: current?.currentTime,
          isPlaying: current?.isPlaying,
          allowGuestControl: this.allowGuestControl,
          participantCount: count,
          sentAt: Date.now(),
        })

        // Notify all participants in the room about updated count
        this.send({
          type: 'PARTICIPANTS',
          senderId: this.clientId,
          count,
          sentAt: Date.now(),
        })

        this.callbacks.onPartnerConnected?.()
        return
      }

      if (msg.type === 'LEAVE') {
        const guestId = msg.senderId
        this.activeGuests.delete(guestId)
        if (this.activeGuests.size === 0) {
          this.partnerConnected = false
          this.callbacks.onPartnerDisconnected?.()
        }
        const count = this.getParticipantCount()
        this.emitStatus()
        this.send({
          type: 'PARTICIPANTS',
          senderId: this.clientId,
          count,
          sentAt: Date.now(),
        })
        return
      }
    }

    // Guest handling of host Welcome
    if (this.role === 'guest' && msg.type === 'WELCOME') {
      this.partnerConnected = true
      this.isConnecting = false
      this.isReconnecting = false
      if (msg.participantCount !== undefined) {
        this.participantCount = msg.participantCount
      }
      this.emitStatus()
      this.startPingLoop()

      if (msg.allowGuestControl !== undefined) {
        this.allowGuestControl = msg.allowGuestControl
        this.callbacks.onPermissionsChange?.(msg.allowGuestControl)
      }

      if (msg.hostTrack) {
        this.callbacks.onRemoteTrack?.(
          msg.hostTrack,
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
      }
      return
    }

    switch (msg.type) {
      case 'PARTICIPANTS':
        if (msg.count !== undefined) {
          this.participantCount = msg.count
          this.emitStatus()
        }
        break

      case 'REJECT':
      case 'ROOM_FULL':
        this.cleanup()
        this.emitStatus(
          msg.message || 'Unable to join Jam room.',
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
        this.send({
          type: 'HEARTBEAT_ACK',
          senderId: this.clientId,
          sentAt: Date.now(),
        })
        this.callbacks.onRemoteHeartbeat?.(
          msg.currentTime,
          msg.isPlaying,
          msg.sentAt,
        )
        break

      case 'HEARTBEAT_ACK':
        if (this.role === 'host' && msg.senderId) {
          this.activeGuests.set(msg.senderId, Date.now())
        }
        break

      case 'PING':
        if (this.role === 'host') {
          this.send({
            type: 'PONG',
            senderId: this.clientId,
            origSentAt: msg.sentAt,
            recvAt: Date.now(),
          })
        }
        break

      case 'PONG': {
        const now = Date.now()
        const rtt = now - msg.origSentAt
        this.latency = Math.max(1, Math.round(rtt / 2))
        if (msg.recvAt !== undefined) {
          // Cristian's algorithm clock synchronization offset
          this.clockOffset = msg.recvAt - (msg.origSentAt + this.latency)
        }
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
      } catch (_) { }
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
      senderId: this.clientId,
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
      senderId: this.clientId,
      currentTime,
      sentAt: Date.now(),
    })
  }

  public broadcastPause(currentTime: number) {
    this.send({
      type: 'PAUSE',
      senderId: this.clientId,
      currentTime,
      sentAt: Date.now(),
    })
  }

  public broadcastSeek(currentTime: number) {
    this.send({
      type: 'SEEK',
      senderId: this.clientId,
      currentTime,
      sentAt: Date.now(),
    })
  }

  public broadcastHeartbeat(currentTime: number, isPlaying: boolean) {
    this.send({
      type: 'HEARTBEAT',
      senderId: this.clientId,
      currentTime,
      isPlaying,
      sentAt: Date.now(),
    })
  }

  public broadcastReaction(emoji: string) {
    this.send({
      type: 'REACTION',
      senderId: this.clientId,
      emoji,
      sentAt: Date.now(),
    })
  }

  private startPingLoop() {
    this.stopPingLoop()
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'PING',
          senderId: this.clientId,
          sentAt: Date.now(),
        })
      }
    }, 3000)
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private startHeartbeatLoop() {
    this.stopHeartbeatLoop()
    this.heartbeatInterval = setInterval(() => {
      if (this.role === 'host') {
        // Prune inactive guests who haven't pinged or heartbeat-acked in > 15s
        const now = Date.now()
        let countChanged = false
        for (const [guestId, lastSeen] of this.activeGuests.entries()) {
          if (now - lastSeen > 15000) {
            this.activeGuests.delete(guestId)
            countChanged = true
          }
        }
        if (countChanged) {
          if (this.activeGuests.size === 0) {
            this.partnerConnected = false
            this.callbacks.onPartnerDisconnected?.()
          }
          const count = this.getParticipantCount()
          this.emitStatus()
          this.send({
            type: 'PARTICIPANTS',
            senderId: this.clientId,
            count,
            sentAt: Date.now(),
          })
        }

        if (this.isConnected()) {
          const current = this.callbacks.getCurrentTrackState?.()
          if (current) {
            this.broadcastHeartbeat(current.currentTime, current.isPlaying)
          }
        }
      }
    }, 2500)
  }

  private stopHeartbeatLoop() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * Health watchdog: Detects silent network drops and attempts auto-reconnect.
   */
  private startWatchdog() {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval)
    this.lastPartnerMessageAt = Date.now()

    this.watchdogInterval = setInterval(() => {
      if (!this.roomCode || this.userExplicitlyLeft) return

      // If connected but no partner message for > 12s, check socket health
      if (this.partnerConnected) {
        const idleTime = Date.now() - this.lastPartnerMessageAt
        if (idleTime > 12000) {
          this.triggerAutoReconnect()
        }
      }
    }, 4000)
  }

  private stopWatchdog() {
    if (this.watchdogInterval) {
      clearInterval(this.watchdogInterval)
      this.watchdogInterval = null
    }
  }

  /**
   * Automatic background reconnection with exponential backoff.
   */
  private triggerAutoReconnect() {
    if (this.userExplicitlyLeft || !this.roomCode || !this.role) return
    if (this.reconnectTimer) return

    this.isReconnecting = true
    this.partnerConnected = false
    this.emitStatus()

    const delay = Math.min(1000 * 1.5 ** this.reconnectAttempts, 5000)
    this.reconnectAttempts++

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      if (this.userExplicitlyLeft || !this.roomCode) return

      try {
        if (this.socket) {
          this.socket.close()
          this.socket = null
        }
      } catch (_) { }

      const channel = this.getChannelFromCode(this.roomCode)
      const socket = connect(channel, {
        as: this.role === 'host' ? 'host' : 'guest',
        announce: true,
        list: true,
      })
      this.socket = socket

      socket.on('*', (data) => {
        if (data?.type === 'join' || data?.type === 'leave') return
        this.reconnectAttempts = 0
        this.handleIncomingMessage(data as unknown as JamMessage)
      })

      socket.on('open', () => {
        if (this.role === 'guest') {
          this.send({
            type: 'HELLO',
            senderId: this.clientId,
            role: 'guest',
            resume: true,
            sentAt: Date.now(),
          })
        }
      })
    }, delay)
  }

  public emitStatus(errorOverride?: string | null) {
    this.callbacks.onStatusChange?.({
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      isReconnecting: this.isReconnecting,
      role: this.role,
      roomCode: this.roomCode,
      error: errorOverride ?? null,
      latency: this.latency,
      participantCount: this.getParticipantCount(),
    })
  }

  private cleanupNetwork() {
    this.stopPingLoop()
    this.stopHeartbeatLoop()
    this.stopWatchdog()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.socket) {
      try {
        this.socket.close()
      } catch (_) { }
      this.socket = null
    }
  }

  public cleanup() {
    this.userExplicitlyLeft = true
    if (this.socket && this.roomCode && this.role === 'guest') {
      try {
        this.send({
          type: 'LEAVE',
          senderId: this.clientId,
          sentAt: Date.now(),
        })
      } catch (_) { }
    }
    this.cleanupNetwork()
    this.partnerConnected = false
    this.role = null
    this.roomCode = null
    this.isConnecting = false
    this.isReconnecting = false
    this.latency = null
    this.clockOffset = 0
    this.participantCount = 0
    this.activeGuests.clear()
    this.reconnectAttempts = 0
    this.saveSession()
    this.emitStatus()
  }
}

export const jamService = new JamSessionService()
