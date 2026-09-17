import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Opt-in local review instrumentation; excluded from production builds.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('review')) {
  import('./review-metrics.js');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
