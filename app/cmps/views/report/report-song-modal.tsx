import React, { useState, useEffect } from 'react'
import { Check, Copy, ExternalLink, Mail, PlusCircle, Sparkles, X } from 'lucide-react'
import { useShallowState } from '@/store'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'

export const ReportSongModal = () => {
  const { reportOpen, setReportOpen, reportInitialQuery } = useShallowState((state) => ({
    reportOpen: state.reportOpen,
    setReportOpen: state.setReportOpen,
    reportInitialQuery: state.reportInitialQuery,
  }))

  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  // Sync initial query when opened from empty search
  useEffect(() => {
    if (reportOpen) {
      if (reportInitialQuery) {
        setQuery(reportInitialQuery)
      }
      setSubmitted(false)
      setCopied(false)
    }
  }, [reportOpen, reportInitialQuery])

  if (!reportOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    const isUrl = trimmed.includes('youtube.com') || trimmed.includes('youtu.be')
    const effectiveLink = isUrl ? trimmed : ''
    const effectiveTitle = isUrl ? 'Auto-Extract from YouTube Link' : trimmed

    const issueTitle = `[Song Request]: ${effectiveTitle}`
    const issueBody = `### Song Title\n\n${effectiveTitle}\n\n### Artist, Singer, Composer, or Movie\n\n_No response_\n\n### Primary Language / Genre\n\nAuto-Detect\n\n### YouTube, Spotify, or Apple Music Link\n\n${effectiveLink || '_No response_'}\n\n---\n*Submitted via Nothing to Listen To Web App*`

    const issueUrl = `https://github.com/kaushalboii/Nothing-to-listen-to/issues/new?title=${encodeURIComponent(
      issueTitle
    )}&labels=song-request,automated&body=${encodeURIComponent(issueBody)}`

    window.open(issueUrl, '_blank', 'noopener,noreferrer')
    setSubmitted(true)
  }

  const handleCopyDetails = () => {
    const text = `Song Request:\nSong / YouTube Link: ${query}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in-0 duration-200'
      onClick={() => setReportOpen(false)}
    >
      <div
        className='relative w-full max-w-lg overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-5 sm:p-7 shadow-2xl shadow-black/40 backdrop-blur-xl flex flex-col gap-4 text-foreground'
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setReportOpen(false)}
          className='absolute top-4 right-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer'
          title='Close (Esc)'
        >
          <X className='size-4' />
        </button>

        {/* Header */}
        <div className='flex items-center gap-3'>
          <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary'>
            <PlusCircle className='size-5' />
          </div>
          <div>
            <h2 className='text-base sm:text-lg font-bold tracking-tight'>
              Request / Add Song
            </h2>
            <p className='text-xs text-muted-foreground'>
              Automated ingestion pipeline verifies &amp; adds tracks live
            </p>
          </div>
        </div>

        {/* Automated Notice Banner */}
        <div className='flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground'>
          <Sparkles className='size-4 shrink-0 text-primary mt-0.5' />
          <div>
            <span className='font-semibold text-foreground'>
              Instant Auto-Detection:
            </span>{' '}
            Just enter any song title or YouTube video link. Our bot will automatically verify official streaming on Spotify &amp; Apple Music, download artwork, and deploy it to the 3D galaxy.
          </div>
        </div>

        {submitted ? (
          <div className='flex flex-col items-center justify-center py-6 text-center gap-3 animate-in fade-in'>
            <div className='size-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500'>
              <Check className='size-6' />
            </div>
            <h3 className='font-bold text-base text-foreground'>Request Opened on GitHub!</h3>
            <p className='text-xs text-muted-foreground max-w-sm'>
              Submit the pre-filled issue on GitHub to trigger the automated bot immediately. The song will be verified and added to the 3D galaxy within seconds.
            </p>
            <div className='flex gap-2 mt-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  setSubmitted(false)
                  setQuery('')
                }}
                className='text-xs cursor-pointer'
              >
                Request Another Song
              </Button>
              <Button
                size='sm'
                onClick={() => setReportOpen(false)}
                className='text-xs cursor-pointer'
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
            {/* Single Input Field: Song Title or YouTube Video Link */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='song-query' className='text-xs font-semibold'>
                Song Title or YouTube Video Link <span className='text-primary'>*</span>
              </Label>
              <Input
                id='song-query'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g. Shape of You OR https://www.youtube.com/watch?v=...'
                autoFocus
                className='h-10 text-xs sm:text-sm rounded-lg bg-background/50 border-border/80 px-3'
              />
              <p className='text-[11px] text-muted-foreground'>
                Enter any song title or paste a direct YouTube video link.
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center justify-between pt-2 border-t border-border/40 mt-1'>
              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={handleCopyDetails}
                  className='text-[11px] h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer'
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
                    `Song Request: ${query || 'New Song'}`
                  )}&body=${encodeURIComponent(
                    `Song / YouTube Link: ${query}`
                  )}`}
                  className='inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors'
                  title='Email request directly'
                >
                  <Mail className='size-3' /> Email
                </a>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setReportOpen(false)}
                  className='text-xs h-8 cursor-pointer'
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  size='sm'
                  disabled={!query.trim()}
                  className='flex items-center gap-1.5 text-xs h-8 px-3.5 bg-primary text-primary-foreground font-semibold shadow-sm cursor-pointer'
                >
                  <span>Submit Song Request</span>
                  <ExternalLink className='size-3' />
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
