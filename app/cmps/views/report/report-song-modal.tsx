import React, { useState, useEffect } from 'react'
import { Check, Copy, ExternalLink, Mail, PlusCircle, Sparkles, X } from 'lucide-react'
import { useShallowState } from '@/store'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'

const LANGUAGES = [
  'Tamil',
  'Telugu',
  'Hindi',
  'Malayalam',
  'Punjabi',
  'English',
  'K-Pop',
  'Latin',
  'Japanese',
  'Other',
]

export const ReportSongModal = () => {
  const { reportOpen, setReportOpen, reportInitialQuery } = useShallowState((state) => ({
    reportOpen: state.reportOpen,
    setReportOpen: state.setReportOpen,
    reportInitialQuery: state.reportInitialQuery,
  }))

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [language, setLanguage] = useState('Tamil')
  const [link, setLink] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  // Sync initial query when opened from empty search
  useEffect(() => {
    if (reportOpen) {
      if (reportInitialQuery) {
        setTitle(reportInitialQuery)
      }
      setSubmitted(false)
      setCopied(false)
    }
  }, [reportOpen, reportInitialQuery])

  if (!reportOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isUrlInTitle = title.includes('youtube.com') || title.includes('youtu.be')
    const effectiveLink = isUrlInTitle ? title.trim() : link.trim()
    const effectiveTitle = isUrlInTitle
      ? 'Auto-Extract from YouTube Link'
      : (title.trim() || (effectiveLink ? 'Auto-Extract from YouTube Link' : ''))

    if (!effectiveTitle && !effectiveLink) return

    const issueTitle = `[Song Request]: ${effectiveTitle}`
    const issueBody = `### Song Title\n\n${effectiveTitle}\n\n### Artist, Singer, Composer, or Movie\n\n${artist.trim() || '_No response_'}\n\n### Primary Language / Genre\n\n${language}\n\n### YouTube, Spotify, or Apple Music Link\n\n${effectiveLink || '_No response_'}\n\n---\n*Submitted via Nothing to Listen To Web App*`

    const issueUrl = `https://github.com/kaushalboii/Nothing-to-listen-to/issues/new?title=${encodeURIComponent(
      issueTitle
    )}&labels=song-request,automated&body=${encodeURIComponent(issueBody)}`

    window.open(issueUrl, '_blank', 'noopener,noreferrer')
    setSubmitted(true)
  }

  const handleCopyDetails = () => {
    const text = `Song Request:\nTitle: ${title}\nArtist/Movie: ${artist}\nLanguage: ${language}\nLink: ${link}`
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
              Request / Report Missing Song
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
              Automated Verification Engine:
            </span>{' '}
            Our GitHub Actions bot automatically cross-references Spotify &amp; Apple Music,
            downloads official artwork, updates the 3D Voronoi galaxy, and deploys it live.
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
                  setTitle('')
                  setArtist('')
                  setLink('')
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
          <form onSubmit={handleSubmit} className='flex flex-col gap-3.5'>
            {/* Song Title Input */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='song-title' className='text-xs font-semibold'>
                Song Title or YouTube Video Link <span className='text-primary'>*</span>
              </Label>
              <Input
                id='song-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g. Annakiliye OR paste https://www.youtube.com/watch?v=...'
                autoFocus
                className='h-9 text-xs rounded-lg bg-background/50 border-border/80'
              />
            </div>

            {/* Artist / Movie Input */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='song-artist' className='text-xs font-semibold'>
                Movie, Artist, Singer, or Composer <span className='text-muted-foreground font-normal'>(Recommended)</span>
              </Label>
              <Input
                id='song-artist'
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder='e.g. OM, Kanguva, Sai Abhyankkar, Anirudh, Smith Asher'
                className='h-9 text-xs rounded-lg bg-background/50 border-border/80'
              />
            </div>

            {/* Language Selection */}
            <div className='flex flex-col gap-1.5'>
              <Label className='text-xs font-semibold'>Primary Language / Region</Label>
              <div className='flex flex-wrap gap-1.5'>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type='button'
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer border ${
                      language === lang
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional YouTube / Spotify Link */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='song-link' className='text-xs font-semibold'>
                YouTube or Spotify Link <span className='text-muted-foreground font-normal'>(Optional)</span>
              </Label>
              <Input
                id='song-link'
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder='https://www.youtube.com/watch?v=... or https://open.spotify.com/track/...'
                className='h-9 text-xs rounded-lg bg-background/50 border-border/80'
              />
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
                    `Song Request: ${title || 'New Song'}`
                  )}&body=${encodeURIComponent(
                    `Song Title: ${title}\nArtist/Movie: ${artist}\nLanguage: ${language}\nLink: ${link}`
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
                  disabled={!title.trim()}
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
