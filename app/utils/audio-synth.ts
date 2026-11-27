/**
 * Interactive Web Audio Synthesizer for Music Previews
 * Generates genre-tailored harmonic chord progressions and melodies
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    void audioCtx.resume()
  }
  return audioCtx
}

// Frequencies for musical notes (C3 to B5)
const NOTE_FREQS: Record<string, number> = {
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
}

// Musical chord progressions for different genre vibes
const SCALES = [
  ['C3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5'], // Ambient / Synth-Pop
  ['A3', 'E4', 'A4', 'C5', 'E5', 'G5', 'A5'], // Rock / Minor
  ['F3', 'C4', 'F4', 'A4', 'C5', 'E5', 'G5'], // Soul / R&B Major 7
  ['D3', 'A3', 'D4', 'F4', 'A4', 'C5', 'F5'], // Jazz / Melancholy
  ['G3', 'D4', 'G4', 'B4', 'D5', 'F5', 'G5'], // Funk / Dominant
]

let activeOscillators: { stop: () => void }[] = []
let isPlaying = false
let playbackInterval: NodeJS.Timeout | null = null

export const playAlbumPreview = (
  albumId: number,
  onTick?: (step: number) => void,
) => {
  stopAlbumPreview()
  try {
    const ctx = getAudioContext()
    isPlaying = true

    const scale = SCALES[albumId % SCALES.length]
    let step = 0

    // Master volume
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.18, ctx.currentTime)
    masterGain.connect(ctx.destination)

    // Play a recurring arpeggio sequence
    const playNote = (
      freq: number,
      duration: number,
      type: OscillatorType = 'sine',
    ) => {
      if (!isPlaying) return
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)

      // Envelope ADSR
      gain.gain.setValueAtTime(0.001, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

      osc.connect(gain)
      gain.connect(masterGain)

      osc.start()
      osc.stop(ctx.currentTime + duration)

      activeOscillators.push({
        stop: () => {
          try {
            osc.stop()
          } catch {}
        },
      })
    }

    const intervalTime = 260
    playbackInterval = setInterval(() => {
      if (!isPlaying) return
      const noteIdx = step % scale.length
      const noteName = scale[noteIdx]
      const freq = NOTE_FREQS[noteName] ?? 440

      // Bass note on downbeats
      if (step % 4 === 0) {
        const bassNote = scale[0]
        playNote(NOTE_FREQS[bassNote] ?? 130.81, 0.8, 'triangle')
      }

      // Arpeggio melody note
      playNote(freq, 0.45, albumId % 2 === 0 ? 'sine' : 'triangle')
      onTick?.(step)
      step++
    }, intervalTime)

    return true
  } catch (err) {
    console.error('Audio synthesizer error:', err)
    return false
  }
}

export const stopAlbumPreview = () => {
  isPlaying = false
  if (playbackInterval) {
    clearInterval(playbackInterval)
    playbackInterval = null
  }
  for (const osc of activeOscillators) {
    try {
      osc.stop()
    } catch {}
  }
  activeOscillators = []
}

export const isAlbumPreviewPlaying = () => isPlaying
