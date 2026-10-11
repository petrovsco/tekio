import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Btn } from './Button'
import { dismissSplash } from '../../lib/splash'
import { reportError, type ErrorReport } from '../../lib/errorReport'

// Without a boundary, any render error unmounts the whole tree and leaves a
// white page with nothing to tap. This is the floor under everything: a line
// saying what happened and the one action that fixes it. The error is sent on
// its own (RFC 0103), and the screen says so.

interface State { error: Error | null; report: ErrorReport | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, report: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  // The splash sits above the whole app; left up, it would hide this message.
  componentDidCatch(error: Error, info: ErrorInfo) {
    dismissSplash()
    this.setState({ report: reportError(error, 'render', { componentStack: info.componentStack ?? undefined }) })
  }

  render() {
    if (!this.state.error) return this.props.children
    const { report } = this.state
    return (
      <div className="min-h-svh flex flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-ink">Something went wrong loading this screen.</p>
        <p className="text-xs text-ink-3 max-w-[320px]">{this.state.error.message}</p>
        <div className="flex items-center gap-3">
          <Btn onClick={() => window.location.reload()}>Reload</Btn>
          {report && <span className="text-xs text-ink-2">Reported</span>}
        </div>
      </div>
    )
  }
}
