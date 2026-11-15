import React, { useState, useEffect } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  PlusCircle,
  Sparkles,
  X,
} from 'lucide-react'
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
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('ntlt_github_token') || ''
    } catch {
      return ''
    }
  })
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [createdIssueNum, setCreatedIssueNum] = useState<number | null>(null)
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
      setSubmitError(null)
      setCreatedIssueNum(null)
    }
  }, [reportOpen, reportInitialQuery])

  if (!reportOpen) return null

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSubmitError(null)
    const cleanToken = token.trim()

    // If no token is saved or provided, reveal the token input so the user can paste it once
    if (!cleanToken) {
      setShowTokenInput(true)
      return
    }

    const issueTitle = `[Song Request]: ${title.trim()}`
    const issueBody = `### Song Title\n\n${title.trim()}\n\n### Artist, Singer, Composer, or Movie\n\n${artist.trim() || '_No response_'}\n\n### Primary Language / Genre\n\n${language}\n\n### YouTube, Spotify, or Apple Music Link\n\n${link.trim() || '_No response_'}\n\n---\n*Submitted via Nothing to Listen To Web App*`

    setIsSubmitting(true)
    try {
      const res = await fetch('https://api.github.com/repos/kaushalboii/Nothing-to-listen-to/issues', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ['song-request', 'automated'],
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.message || `GitHub returned status ${res.status}`)
      }

      const data = await res.json()
      try {
        localStorage.setItem('ntlt_github_token', cleanToken)
      } catch {}

      setCreatedIssueNum(data.number)
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenGitHubFallback = () => {
    const issueTitle = `[Song Request]: ${title.trim()}`
    const issueBody = `### Song Title\n\n${title.trim()}\n\n### Artist, Singer, Composer, or Movie\n\n${artist.trim() || '_No response_'}\n\n### Primary Language / Genre\n\n${language}\n\n### YouTube, Spotify, or Apple Music Link\n\n${link.trim() || '_No response_'}\n\n---\n*Submitted via Nothing to Listen To Web App*`

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
              100% Automated Workflow:
            </span>{' '}
            Submitting triggers our GitHub Actions Python engine. It automatically verifies
            the song on Spotify &amp; Apple Music, generates album artwork, updates the
            3D Voronoi galaxy, and deploys it live.
          </div>
        </div>

        {submitted ? (
          <div className='flex flex-col items-center justify-center py-6 text-center gap-3 animate-in fade-in'>
            <div className='size-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500'>
              <Check className='size-6' />
            </div>
            <h3 className='font-bold text-base text-foreground'>
              {createdIssueNum ? `🚀 Request #${createdIssueNum} Auto-Submitted!` : 'Request Formatted & Submitted!'}
            </h3>
            <p className='text-xs text-muted-foreground max-w-sm'>
              The GitHub Actions engine has received <strong>&quot;{title}&quot;</strong> and is now verifying on Spotify &amp; Apple Music, generating textures, and pushing to the live 3D web gallery.
            </p>
            <div className='flex items-center gap-2 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20'>
              <span className='size-2 rounded-full bg-emerald-500 animate-ping' />
              Processing in GitHub Actions... Live in seconds!
            </div>
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
          <form onSubmit={handleDirectSubmit} className='flex flex-col gap-3.5'>
            {submitError && (
              <div className='p-2.5 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive text-xs'>
                {submitError}
              </div>
            )}

            {/* Song Title Input */}
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='song-title' className='text-xs font-semibold'>
                Song Title <span className='text-primary'>*</span>
              </Label>
              <Input
                id='song-title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='e.g. FA FA FA, Annakiliye, Fire Song, Veezha Veera'
                required
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

            {/* Token Input for 100% Direct In-App Auto-Submit */}
            {(showTokenInput || token) && (
              <div className='flex flex-col gap-1.5 p-3 rounded-xl border border-primary/20 bg-primary/5 animate-in fade-in'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='gh-token' className='text-xs font-semibold flex items-center gap-1.5 text-primary'>
                    <KeyRound className='size-3.5' />
                    <span>GitHub Personal Access Token (Saved in browser)</span>
                  </Label>
                  <a
                    href='https://github.com/settings/tokens/new?scopes=public_repo&description=Nothing-to-listen-to-Song-Submit'
                    target='_blank'
                    rel='noreferrer'
                    className='text-[10px] text-primary/80 hover:underline inline-flex items-center gap-0.5'
                  >
                    <span>Get token (public_repo)</span>
                    <ExternalLink className='size-2.5' />
                  </a>
                </div>
                <Input
                  id='gh-token'
                  type='password'
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder='ghp_... (paste once to enable 100% in-app submit without navigating)'
                  className='h-8 text-xs rounded-lg bg-background/80 border-border/80 font-mono'
                />
                <p className='text-[10px] text-muted-foreground'>
                  Stored securely in your browser&apos;s localStorage. Enables 1-click submit directly without leaving this page.
                </p>
              </div>
            )}

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
                {!token && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleOpenGitHubFallback}
                    className='text-[11px] h-8 px-2.5 cursor-pointer text-muted-foreground hover:text-foreground'
                    title='Open issue form in GitHub tab'
                  >
                    <span>Open GitHub Form</span>
                    <ExternalLink className='size-3 ml-1' />
                  </Button>
                )}

                <Button
                  type='submit'
                  size='sm'
                  disabled={!title.trim() || isSubmitting}
                  className='flex items-center gap-1.5 text-xs h-8 px-3.5 bg-primary text-primary-foreground font-semibold shadow-sm cursor-pointer'
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='size-3.5 animate-spin' />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className='size-3.5' />
                      <span>Auto-Submit to Bot</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
