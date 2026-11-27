import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JamSessionService } from './jam-session'

describe('JamSessionService', () => {
  let service: JamSessionService

  beforeEach(() => {
    service = new JamSessionService()
  })

  it('generates a valid 4-character room code prefixed with NTLT-', () => {
    const code = JamSessionService.generateRoomCode()
    expect(code).toMatch(/^NTLT-[A-Z0-9]{4}$/)
  })

  it('generates unique room codes', () => {
    const code1 = JamSessionService.generateRoomCode()
    const code2 = JamSessionService.generateRoomCode()
    expect(code1).not.toBe(code2)
  })

  it('normalizes room codes without prefix', () => {
    expect(JamSessionService.cleanRoomCode('7a9b')).toBe('NTLT-7A9B')
    expect(JamSessionService.cleanRoomCode('8k42')).toBe('NTLT-8K42')
  })

  it('normalizes room codes already containing prefix', () => {
    expect(JamSessionService.cleanRoomCode('ntlt-7a9b')).toBe('NTLT-7A9B')
    expect(JamSessionService.cleanRoomCode('NTLT-7A9B')).toBe('NTLT-7A9B')
  })

  it('cleans unexpected characters and whitespace from room codes', () => {
    expect(JamSessionService.cleanRoomCode('  ntlt - 7a 9b  ')).toBe(
      'NTLT-7A9B',
    )
    expect(JamSessionService.cleanRoomCode('7#a$9@b')).toBe('NTLT-7A9B')
  })

  it('handles status change callbacks correctly', () => {
    const statusFn = vi.fn()
    service.setCallbacks({ onStatusChange: statusFn })

    service.emitStatus('Custom Error')
    expect(statusFn).toHaveBeenCalledWith(
      expect.objectContaining({
        isConnected: false,
        error: 'Custom Error',
      }),
    )
  })

  it('cleans up and resets all session state upon cleanup()', () => {
    const statusFn = vi.fn()
    service.setCallbacks({ onStatusChange: statusFn })

    service.cleanup()
    expect(service.isConnected()).toBe(false)
    expect(service.getRole()).toBeNull()
    expect(service.getRoomCode()).toBeNull()
    expect(statusFn).toHaveBeenCalledWith(
      expect.objectContaining({
        isConnected: false,
        role: null,
        roomCode: null,
      }),
    )
    expect(service.getLatency()).toBe(40)
    expect(service.getClockOffset()).toBe(0)
  })

  it('calculates latency and clock offset from PONG message', () => {
    expect(service.getLatency()).toBe(40)
    expect(service.getClockOffset()).toBe(0)

    const now = Date.now()
    const origSentAt = now - 100 // 100ms RTT -> ~50ms one-way latency
    const recvAt = now - 40 // remote timestamp

    // Simulate incoming PONG message
    ;(service as any).handleIncomingMessage({
      type: 'PONG',
      senderId: 'remote-peer',
      origSentAt,
      recvAt,
    })

    expect(service.getLatency()).toBeGreaterThanOrEqual(45)
    expect(service.getLatency()).toBeLessThanOrEqual(55)
    expect(service.getClockOffset()).toBeDefined()
  })

  it('supports multi-user group sessions with 4+ listeners', () => {
    // Host creates room
    ;(service as any).role = 'host'
    ;(service as any).roomCode = 'NTLT-TEST'
    ;(service as any).activeGuests = new Map()

    expect(service.getParticipantCount()).toBe(1)
    expect(service.isConnected()).toBe(false)

    // Guest 1 joins
    ;(service as any).handleIncomingMessage({
      type: 'HELLO',
      senderId: 'guest-1',
      role: 'guest',
      sentAt: Date.now(),
    })
    expect(service.getParticipantCount()).toBe(2)
    expect(service.isConnected()).toBe(true)

    // Guest 2 joins
    ;(service as any).handleIncomingMessage({
      type: 'HELLO',
      senderId: 'guest-2',
      role: 'guest',
      sentAt: Date.now(),
    })
    expect(service.getParticipantCount()).toBe(3)

    // Guest 3 joins
    ;(service as any).handleIncomingMessage({
      type: 'HELLO',
      senderId: 'guest-3',
      role: 'guest',
      sentAt: Date.now(),
    })
    expect(service.getParticipantCount()).toBe(4)

    // Guest 4 joins (5 total listeners including host)
    ;(service as any).handleIncomingMessage({
      type: 'HELLO',
      senderId: 'guest-4',
      role: 'guest',
      sentAt: Date.now(),
    })
    expect(service.getParticipantCount()).toBe(5)

    // Guest 2 leaves
    ;(service as any).handleIncomingMessage({
      type: 'LEAVE',
      senderId: 'guest-2',
      sentAt: Date.now(),
    })
    expect(service.getParticipantCount()).toBe(4)
  })

  it('updates participant count on guest when receiving PARTICIPANTS message', () => {
    ;(service as any).role = 'guest'
    ;(service as any).roomCode = 'NTLT-TEST'
    ;(service as any).partnerConnected = true

    ;(service as any).handleIncomingMessage({
      type: 'PARTICIPANTS',
      senderId: 'host-1',
      count: 6,
      sentAt: Date.now(),
    })

    expect(service.getParticipantCount()).toBe(6)
  })
})
