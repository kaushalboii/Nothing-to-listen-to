import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'
import ErrorBoundary from './cmps/common/error-boundary'
import config from './config'
import { animateDocTitleSuffix } from './utils/anim'
import { initTelemetry } from './utils/telemetry/init-telemetry'
import { initVoroforce } from './vf'
import { Voroforce } from './voroforce'
import './styles.css'

initTelemetry()

const bootstrap = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const disableUIOverrideParam = urlParams.get('disableUI')
  const rootEl = document.getElementById('root')
  if (!rootEl) return

  if (!config.disableUI && !disableUIOverrideParam) {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
          <Voroforce />
        </ErrorBoundary>
      </StrictMode>,
    )
  } else {
    void initVoroforce({ force: true })
  }
  animateDocTitleSuffix()
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}
