const env = import.meta.env as unknown as {
  VITE_TELEMETRY_ENABLED?: string
  VITE_TELEMETRY_ENDPOINT?: string
  VITE_APP_VERSION?: string
}

export default {
  backdropBaseUrl: '',
  posterBaseUrl: '',
  sourceCodeUrl: 'https://github.com/kaushalboii/Nothing-to-listen-to',
  spotifySearchUrl: 'https://open.spotify.com/search/',
  appleMusicSearchUrl: 'https://music.apple.com/search?term=',
  youtubeMusicSearchUrl: 'https://music.youtube.com/search?q=',
  lastfmSearchUrl: 'https://www.last.fm/search?q=',
  contactEmail: 'contact@nothingtolisten.to',
  disableUI: false,
  telemetry: {
    enabled:
      env?.VITE_TELEMETRY_ENABLED === '1' ||
      env?.VITE_TELEMETRY_ENABLED === 'true',
    endpoint: env?.VITE_TELEMETRY_ENDPOINT || undefined,
    appVersion: env?.VITE_APP_VERSION || undefined,
  },
}
