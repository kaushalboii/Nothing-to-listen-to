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

const PEER_PREFIX = 'ntlt-v1-'

/**
 * High-reliability STUN servers for WebRTC NAT traversal.
 * Twilio and Cloudflare STUN reliably generate srflx (server-reflexive) public candidates
 * across cellular mobile data (Jio, Airtel, Vodafone, T-Mobile) and symmetric NATs.
 */
export const RTC_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:global.stun.twilio.com:3478' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
]

const PEER_BROKER_CONFIG = {
  host: '0.peerjs.com',
  port: 443,
  path: '/',
  secure: true,
  pingInterval: 5000,
  config: {
    iceServers: RTC_ICE_SERVERS,
    sdpSemantics: 'unified-plan',
  },
  debug: 1,
}

function resolvePeerConstructor(): typeof Peer {
  const mod = Peer as unknown as { default?: typeof Peer; Peer?: typeof Peer }
  if (typeof Peer === 'function') return Peer
  if (typeof mod.default === 'function') return mod.default
  if (typeof mod.Peer === 'function') return mod.Peer
  return Peer
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
  private visibilityListenerAttached = false

  constructor() {
    this.setupVisibilityListeners()
  }

  private setupVisibilityListeners() {
    if (typeof document === 'undefined' || this.visibilityListenerAttached)
      return
    this.visibilityListenerAttached = true

    const handleReconnectOnVisible = () => {
      if (document.visibilityState === 'visible') {
        const activePeer = this.peer
        if (activePeer?.disconnected && !activePeer.destroyed) {
          try {
            activePeer.reconnect()
          } catch (_) {}
        }
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
    const PeerClass = resolvePeerConstructor()

    return new Promise<string>((resolve, reject) => {
      let isSettled = false

      try {
        const peer = new PeerClass(hostPeerId, PEER_BROKER_CONFIG)
        this.peer = peer

        peer.on('open', () => {
          if (isSettled) return
          isSettled = true
          // Host is created and now waiting for partner; not "connecting"
          this.isConnecting = false
          this.emitStatus()
          resolve(code)
        })

        peer.on('disconnected', () => {
          // Auto-reconnect if signaling connection was briefly lost
          const activePeer = this.peer
          if (activePeer && !activePeer.destroyed) {
            try {
              activePeer.reconnect()
            } catch (_) {}
          }
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
          if (!isSettled) {
            isSettled = true
            this.cleanup()
            if (err.type === 'unavailable-id') {
              reject(
                new Error(
                  `Room code ${code} is currently in use or closing. Please try a different code or wait 10 seconds.`,
                ),
              )
            } else {
              this.emitStatus(err.message || 'Connection error')
              reject(err)
            }
          } else {
            this.emitStatus(err.message || 'Broker connection warning')
          }
        })
      } catch (err: unknown) {
        if (!isSettled) {
          isSettled = true
          this.cleanup()
          reject(err)
        }
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
    const PeerClass = resolvePeerConstructor()

    return new Promise<void>((resolve, reject) => {
      let isSettled = false

      // 25-second timeout to allow full ICE candidate gathering across cellular networks
      const timeoutTimer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true
          this.cleanup()
          const errMsg = `Could not connect to room "${code}". Make sure your friend has the room open with a new code and both of you have refreshed to the latest version.`
          this.emitStatus(errMsg)
          reject(new Error(errMsg))
        }
      }, 25000)

      const safeResolve = () => {
        if (!isSettled) {
          isSettled = true
          clearTimeout(timeoutTimer)
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

      try {
        const peer = new PeerClass(guestPeerId, PEER_BROKER_CONFIG)
        this.peer = peer

        peer.on('open', () => {
          const conn = peer.connect(hostPeerId, {
            reliable: true,
          })

          this.setupConnection(conn, safeResolve, safeReject)
        })

        peer.on('disconnected', () => {
          const activePeer = this.peer
          if (activePeer && !activePeer.destroyed) {
            try {
              activePeer.reconnect()
            } catch (_) {}
          }
        })

        peer.on('error', (err: { type?: string; message?: string }) => {
          const errMsg =
            err.type === 'peer-unavailable'
              ? `Room ${code} was not found. Please verify the code and make sure the host has the room open on their screen.`
              : err.message || 'Failed to connect to room'
          safeReject(new Error(errMsg))
        })
      } catch (err: unknown) {
        safeReject(
          err instanceof Error
            ? err
            : new Error('Failed to initialize connection service'),
        )
      }
    })
  }

  private setupConnection(
    conn: DataConnection,
    onReady?: () => void,
    onError?: (err: Error) => void,
  ) {
    this.partnerConn = conn

    // Monitor underlying RTCPeerConnection states
    const pc = conn.peerConnection
    if (pc) {
      pc.addEventListener('iceconnectionstatechange', () => {
        if (pc.iceConnectionState === 'failed') {
          this.emitStatus('Network connection failed. Retrying...')
          onError?.(
            new Error('WebRTC connection failed (firewall or NAT block).'),
          )
        }
      })
      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed') {
          onError?.(new Error('Connection dropped.'))
        }
      })
    }

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
      } else {
        // Guest sends immediate ping to calculate latency
        this.send({ type: 'PING', sentAt: Date.now() })
      }

      this.callbacks.onPartnerConnected?.()
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
      const errMsg = err?.message || 'Connection error'
      this.emitStatus(errMsg)
      onError?.(new Error(errMsg))
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
