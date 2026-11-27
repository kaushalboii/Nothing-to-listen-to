import { beforeEach, describe, expect, it } from 'vitest'
import { audioCache } from './audio-cache'

describe('AudioCacheManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('detects data saver mode correctly', () => {
    expect(typeof audioCache.isDataSaverActive()).toBe('boolean')
  })

  it('reports cached count as 0 initially', async () => {
    const count = await audioCache.getCachedCount()
    expect(count).toBe(0)
  })

  it('handles isCached for empty or invalid url gracefully', async () => {
    const cached = await audioCache.isCached('')
    expect(cached).toBe(false)
  })

  it('handles getCachedAudioBlobUrl for non-cached url safely', async () => {
    const blobUrl = await audioCache.getCachedAudioBlobUrl(
      'https://example.com/audio.m4a',
    )
    expect(blobUrl).toBeNull()
  })

  it('handles revoking blob url without error', () => {
    expect(() =>
      audioCache.revokeBlobUrl('blob:http://localhost/test-uuid'),
    ).not.toThrow()
  })
})
