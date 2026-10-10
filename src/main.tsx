import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { reloadOnStaleChunk } from './lib/staleChunk'
import { reportUncaught } from './lib/errorReport'
import { useAppStore } from './store/app'

reloadOnStaleChunk()
reportUncaught(report => useAppStore.getState().setToast('Something went wrong.', report))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
