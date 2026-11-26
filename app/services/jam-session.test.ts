import { describe, expect, it } from 'vitest'
import { JamSessionService } from './jam-session'

describe('JamSessionService', () => {
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
})
