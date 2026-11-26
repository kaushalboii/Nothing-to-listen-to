import Peer, { type DataConnection } from 'peerjs'
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

const PEER_PREFIX = 'ntlt-v1-'
const STUN_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

export class JamSessionService {
  private peer: Peer | null = null
  private partnerConn: DataConnection | null = null
  private role: JamRole | null = null
  private roomCode: string | null = null
  private callbacks: JamCallbacks = {}
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private isConnecting = false
  private latency: number | null = null
  private allowGuestControl = false

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
    return Boolean(this.partnerConn?.open)
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
   * Generates a 4-to-6 alphanumeric room code like NTLT-7A9B
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

  private getPeerIdFromCode(code: string): string {
    const clean = code.toLowerCase().replace(/[^a-z0-9]/g, '')
    return `${PEER_PREFIX}${clean}`
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
    this.isConnecting = true
    this.emitStatus()

    const hostPeerId = this.getPeerIdFromCode(code)

    return new Promise<string>((resolve, reject) => {
      try {
        const peer = new Peer(hostPeerId, {
          config: STUN_CONFIG,
          debug: 1,
        })
        this.peer = peer

        peer.on('open', () => {
          this.isConnecting = true
          this.emitStatus()
          resolve(code)
        })

        // Incoming connection from guest
        peer.on('connection', (conn) => {
          // Strict 2-user enforcement: if already connected with a partner, reject any additional connection
          if (this.partnerConn?.open) {
            conn.on('open', () => {
              conn.send({
                type: 'ROOM_FULL',
                message:
                  'This room is full! Private listening sessions are strictly 2 users.',
              } as JamMessage)
              setTimeout(() => conn.close(), 500)
            })
            return
          }

          this.setupConnection(conn)
        })

        peer.on('error', (err: { type?: string; message?: string }) => {
          // If peer ID is already taken, try with another code
          if (err.type === 'unavailable-id') {
            this.cleanup()
            reject(
              new Error(
                `Room code ${code} is already in use. Please try a different code.`,
              ),
            )
          } else {
            this.emitStatus(err.message || 'Connection error')
            reject(err)
          }
        })
      } catch (err: unknown) {
        this.cleanup()
        reject(err)
      }
    })
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
    this.emitStatus()

    const hostPeerId = this.getPeerIdFromCode(code)
    const guestPeerId = `${PEER_PREFIX}guest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`

    return new Promise<void>((resolve, reject) => {
      try {
        const peer = new Peer(guestPeerId, {
          config: STUN_CONFIG,
          debug: 1,
        })
        this.peer = peer

        peer.on('open', () => {
          const conn = peer.connect(hostPeerId, {
            reliable: true,
          })

          this.setupConnection(conn, () => {
            resolve()
          })
        })

        peer.on('error', (err: { type?: string; message?: string }) => {
          this.cleanup()
          const errMsg =
            err.type === 'peer-unavailable'
              ? `Room ${code} was not found. Please check the code and make sure the host has the room open.`
              : err.message || 'Failed to connect to room'
          this.emitStatus(errMsg)
          reject(new Error(errMsg))
        })
      } catch (err: unknown) {
        this.cleanup()
        reject(err)
      }
    })
  }

  private setupConnection(conn: DataConnection, onReady?: () => void) {
    this.partnerConn = conn

    conn.on('open', () => {
      this.isConnecting = false
      this.emitStatus()
      this.startPingLoop()

      if (this.role === 'host') {
        // Send initial permissions
        this.send({
          type: 'PERMISSIONS',
          allowGuestControl: this.allowGuestControl,
        })
      }

      onReady?.()
    })

    conn.on('data', (data: unknown) => {
      this.handleIncomingMessage(data as JamMessage)
    })

    conn.on('close', () => {
      this.partnerConn = null
      this.stopPingLoop()
      this.latency = null
      this.emitStatus('Partner disconnected')
    })

    conn.on('error', (err) => {
      this.emitStatus(err.message || 'Connection error')
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
    if (this.partnerConn?.open) {
      try {
        this.partnerConn.send(msg)
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
    // Ping every 4 seconds to measure network latency
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'PING', sentAt: Date.now() })
      }
    }, 4000)
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
    if (this.partnerConn) {
      try {
        this.partnerConn.close()
      } catch (_) {}
      this.partnerConn = null
    }
    if (this.peer) {
      try {
        this.peer.destroy()
      } catch (_) {}
      this.peer = null
    }
    this.role = null
    this.roomCode = null
    this.isConnecting = false
    this.latency = null
    this.emitStatus()
  }
}

export const jamService = new JamSessionService()
