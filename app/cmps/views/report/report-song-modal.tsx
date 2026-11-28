import { useShallowState } from '@/store'
import {
  Check,
  Copy,
  ExternalLink,
  Mail,
  Play,
  PlusCircle,
  Sparkles,
  X,
} from 'lucide-react'
import type React from 'react'
import { useEffect, useState } from 'react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'

function extractYouTubeId(urlOrText: string): string | null {
  const trimmed = urlOrText.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
  )
  return match ? match[1] : null
}

export const ReportSongModal = () => {
  const {
    reportOpen,
    setReportOpen,
    reportInitialQuery,
    playTrack,
    userConfig,
    setUserConfig,
  } = useShallowState((state) => ({
    reportOpen: state.reportOpen,
    setReportOpen: state.setReportOpen,
    reportInitialQuery: state.reportInitialQuery,
    playTrack: state.playTrack,
    userConfig: state.userConfig,
    setUserConfig: state.setUserConfig,
  }))

  const [query, setQuery] = useState('')
  const [submittedMode, setSubmittedMode] = useState<
    'instant' | 'requested' | null
  >(null)
  const [copied, setCopied] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Sync initial query when opened from empty search
  useEffect(() => {
    if (reportOpen) {
      if (reportInitialQuery) {
        setQuery(reportInitialQuery)
      }
      setSubmittedMode(null)
      setCopied(false)
      setIsSubmitting(false)
    }
  }, [reportOpen, reportInitialQuery])

  if (!reportOpen) return null

  const handleInstantPlayAndQueue = (mode: 'instant' | 'requested') => {
    const trimmed = query.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    const vid = extractYouTubeId(trimmed)
    const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    const trackTitle = vid && isUrl ? 'Requested Song' : trimmed

    // 1. Immediately trigger playback in player
    playTrack({
      title: trackTitle,
      artist: 'User Requested',
      albumTitle: 'Community Tracks',
      videoId: vid ?? undefined,
      query: trimmed,
    })

    // 2. Save directly into user's persistent library
    const favKey = vid ? `yt_${vid}` : `req_${Date.now()}`
    const updatedFavs: Record<string, any> = { ...(userConfig.favorites ?? {}) }
    updatedFavs[favKey] = {
      tmdbId: Date.now(),
      title: trackTitle,
      artist: 'User Requested',
      poster:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
      tracks: [
        {
          number: 1,
          title: trackTitle,
          duration: '3:30',
          videoId: vid ?? undefined,
        },
      ],
    } as any
    setUserConfig({ ...userConfig, favorites: updatedFavs })

    // 3. Dispatch automated request in background
    if (mode === 'requested') {
      try {
        fetch('https://formspree.io/f/mqaevepn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            title: trackTitle,
            query: trimmed,
            videoId: vid,
            timestamp: new Date().toISOString(),
            source: 'Nothing to Listen To In-App Auto-Request',
          }),
        }).catch(() => {})
      } catch {}
    }

    setIsSubmitting(false)
    setSubmittedMode(mode)
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleInstantPlayAndQueue('requested')
  }

  const handleCopyDetails = () => {
    const text = `Song Request:\nSong / YouTube Link: ${query}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleOpenGitHubFallback = () => {
    const trimmed = query.trim()
    const isUrl =
      trimmed.includes('youtube.com') || trimmed.includes('youtu.be')
    const effectiveLink = isUrl ? trimmed : ''
    const effectiveTitle = isUrl ? 'Auto-Extract from YouTube Link' : trimmed

    const issueTitle = `[Song Request]: ${effectiveTitle}`
    const issueBody = `### Song Title\n\n${effectiveTitle}\n\n### Artist, Singer, Composer, or Movie\n\n_No response_\n\n### Primary Language / Genre\n\nAuto-Detect\n\n### YouTube, Spotify, or Apple Music Link\n\n${effectiveLink || '_No response_'}\n\n---\n*Submitted via Nothing to Listen To Web App*`

    const issueUrl = `https://github.com/kaushalboii/Nothing-to-listen-to/issues/new?title=${encodeURIComponent(
      issueTitle,
    )}&labels=song-request,automated&body=${encodeURIComponent(issueBody)}`

    window.open(issueUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className='fade-in-0 fixed inset-0 z-50 flex animate-in items-center justify-center bg-background/80 p-3 backdrop-blur-md duration-200 sm:p-6'
      onClick={() => setReportOpen(false)}
    >
      <div
        className='relative flex w-full max-w-lg flex-col gap-4 overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-5 text-foreground shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setReportOpen(false)}
          className='absolute top-4 right-4 cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          title='Close (Esc)'
        >
          <X className='size-4' />
        </button>

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary'>
            <PlusCircle className='size-5' />
          </div>
          <div>
            <h2 className='font-bold text-base tracking-tight sm:text-lg'>
              Request &amp; Play Song Instantly
            </h2>
            <p className='text-muted-foreground text-xs'>
              Instant in-app playback with zero-wait automated catalog sync
            </p>
          </div>
        </div>

        {/* Instant Auto-Detection Banner */}
        <div className='flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-muted-foreground text-xs'>
          <Sparkles className='mt-0.5 size-4 shrink-0 text-primary' />
          <div>
            <span className='font-semibold text-foreground'>
              Instant 0-Wait Playback:
            </span>{' '}
            Enter any song title or YouTube link. The song will{' '}
            <strong className='text-primary'>play immediately</strong> and be
            saved to your favorites. Our background bot handles permanent 3D
            galaxy catalog sync automatically.
          </div>
        </div>

        {submittedMode ? (
          <div className='fade-in flex animate-in flex-col items-center justify-center gap-3 py-6 text-center'>
            <div className='flex size-12 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500'>
              <Check className='size-6' />
            </div>
            <h3 className='font-bold text-base text-foreground'>
              Now Playing &amp; Saved to Your Library!
            </h3>
            <p className='max-w-sm text-muted-foreground text-xs'>
              {submittedMode === 'requested'
                ? 'Your song is now playing and your request has been automatically sent to the catalog bot. No GitHub login required!'
                : 'Your song is now playing in the music player and has been saved to your personal favorites.'}
            </p>
            <div className='mt-3 flex flex-wrap items-center justify-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setSubmittedMode(null)
                  setQuery('')
                }}
                className='cursor-pointer text-xs'
              >
                Add Another Song
              </Button>
              <Button
                size='sm'
                onClick={() => setReportOpen(false)}
                className='cursor-pointer text-xs'
              >
                Enjoy Music
              </Button>
              <button
                type='button'
                onClick={handleOpenGitHubFallback}
                className='ml-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-4 hover:underline'
              >
                <span>Track on GitHub (Optional)</span>
                <ExternalLink className='size-2.5' />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className='flex flex-col gap-4'>
            {/* Single Input Field: Song Title or YouTube Video Link */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='song-query' className='font-semibold text-xs'>
                Song Title or YouTube Video Link{' '}
                <span className='text-primary'>*</span>
              </Label>
              <Input
                id='song-query'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. Shape of You OR https://www.youtube.com/watch?v=...'
                autoFocus
                className='h-10 rounded-lg border-border/80 bg-background/50 px-3 text-xs sm:text-sm'
              />
              <p className='text-[11px] text-muted-foreground'>
                Supports song names, YouTube URLs, or direct video IDs.
              </p>
            </div>

            {/* Action Buttons */}
            <div className='mt-1 flex flex-col gap-2.5 border-border/40 border-t pt-3'>
              <div className='flex items-center justify-end gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setReportOpen(false)}
                  className='h-9 cursor-pointer text-xs'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={!query.trim() || isSubmitting}
                  className='flex h-9 cursor-pointer items-center gap-1.5 bg-primary px-4 font-semibold text-primary-foreground text-xs shadow-md transition-all hover:bg-primary/90'
                >
                  <Play className='size-3.5 fill-current' />
                  <span>Play Instantly &amp; Request</span>
                </Button>
              </div>

              {/* Secondary options */}
              <div className='flex items-center justify-between pt-1'>
                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleCopyDetails}
                    className='h-7 cursor-pointer px-2 text-[11px] text-muted-foreground hover:text-foreground'
                    title='Copy request text to clipboard'
                  >
                    {copied ? (
                      <span className='flex items-center gap-1 text-emerald-500'>
                        <Check className='size-3' /> Copied
                      </span>
                    ) : (
                      <span className='flex items-center gap-1'>
                        <Copy className='size-3' /> Copy
                      </span>
                    )}
                  </Button>
                  <a
                    href={`mailto:contact.nothingtolisten@gmail.com?subject=${encodeURIComponent(
                      `Song Request: ${query || 'New Song'}`,
                    )}&body=${encodeURIComponent(
                      `Song / YouTube Link: ${query}`,
                    )}`}
                    className='inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground'
                    title='Email request directly'
                  >
                    <Mail className='size-3' /> Email
                  </a>
                </div>

                <button
                  type='button'
                  onClick={handleOpenGitHubFallback}
                  className='inline-flex items-center gap-1 text-[11px] text-muted-foreground underline-offset-4 hover:underline'
                  title='Open GitHub issue manually'
                >
                  <span>Manual GitHub Issue</span>
                  <ExternalLink className='size-2.5' />
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
