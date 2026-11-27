import { describe, expect, it } from 'vitest'
import type { VoroforceCell } from '../types'
import { Film, type FilmBatches, getCellFilm } from './films'

describe('getCellFilm & cell-to-film indexing', () => {
  it('maps cell.id directly to the batch record matching the shader tile index', async () => {
    const mockBatch = [
      {
        id: 0,
        title: 'Track 0',
        artist: 'Artist 0',
        vote_average: 9,
        vote_count: 10,
        poster_path: '/p0.jpg',
      },
      ...Array.from({ length: 215 }, (_, i) => ({
        id: i + 1,
        title: `Track ${i + 1}`,
        artist: `Artist ${i + 1}`,
        vote_average: 9.5,
        vote_count: 100,
        poster_path: `/p${i + 1}.jpg`,
      })),
    ]

    const batches: FilmBatches = new Map()
    batches.set(0, mockBatch)

    // Cell with id 42 (e.g. Jailer 2 in production)
    const cell42 = {
      id: 42,
      index: 5050,
      subgridIndex: 42,
    } as unknown as VoroforceCell

    const film42 = await getCellFilm(cell42, batches)
    expect(film42).toBeInstanceOf(Film)
    expect(film42?.title).toBe('Track 42')
    expect(film42?.tmdbId).toBe(42)

    // Cell with id 101 (e.g. Nayeon POP!)
    const cell101 = {
      id: 101,
      index: 101,
      subgridIndex: 101,
    } as unknown as VoroforceCell

    const film101 = await getCellFilm(cell101, batches)
    expect(film101).toBeInstanceOf(Film)
    expect(film101?.title).toBe('Track 101')
    expect(film101?.tmdbId).toBe(101)
  })

  it('prioritizes cell.id over stale subgridIndex to prevent preview card mismatches', async () => {
    const mockBatch = [
      ...Array.from({ length: 216 }, (_, i) => ({
        id: i,
        title: `Song ${i}`,
        artist: `Artist ${i}`,
        vote_average: 9,
        vote_count: 50,
        poster_path: `/p${i}.jpg`,
      })),
    ]

    const batches: FilmBatches = new Map()
    batches.set(0, mockBatch)

    // Suppose a stale subgridIndex 101 was attached to a cell whose actual shader ID is 42
    const cellWithMismatch = {
      id: 42,
      subgridIndex: 101,
      index: 141,
    } as unknown as VoroforceCell

    const film = await getCellFilm(cellWithMismatch, batches)
    // Must resolve to 42 (matching the shader's cellIdMapTexData texture mapping)
    expect(film?.tmdbId).toBe(42)
    expect(film?.title).toBe('Song 42')
  })

  it('handles wraps modulo 216 for repeat subgrids', async () => {
    const mockBatch = Array.from({ length: 216 }, (_, i) => ({
      id: i,
      title: `Song ${i}`,
      artist: `Artist ${i}`,
      vote_average: 8.5,
      vote_count: 20,
      poster_path: `/p${i}.jpg`,
    }))

    const batches: FilmBatches = new Map()
    batches.set(0, mockBatch)

    const wrappedCell = {
      id: 258, // 258 % 216 = 42
      index: 8000,
    } as unknown as VoroforceCell

    const film = await getCellFilm(wrappedCell, batches)
    expect(film?.tmdbId).toBe(42)
  })
})
