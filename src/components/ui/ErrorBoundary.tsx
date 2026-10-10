import { Component, lazy, Suspense } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Btn } from './Button'
import { dismissSplash } from '../../lib/splash'
import { reportError, type ErrorReport } from '../../lib/errorReport'

const ReportNoteSheet = lazy(() => import('./ReportNoteSheet'))

// Without a boundary, any render error unmounts the whole tree and leaves a
// white page with nothing to tap. This is the floor under everything: a line
// saying what happened and the one action that fixes it. The error is sent on
// its own (RFC 0103); the screen says so and offers a note.

interface State { error: Error | null; report: ErrorReport | null; noting: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, report: null, noting: false }

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
    const { report, noting } = this.state
    return (
      <div className="min-h-svh flex flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-ink">Something went wrong loading this screen.</p>
        <p className="text-xs text-ink-3 max-w-[320px]">{this.state.error.message}</p>
        <div className="flex items-center gap-3">
          <Btn onClick={() => window.location.reload()}>Reload</Btn>
          {report && (
            <span className="text-xs text-ink-2">
              Reported ·{' '}
              <button onClick={() => this.setState({ noting: true })} className="underline cursor-pointer">
                Add a note
              </button>
            </span>
          )}
        </div>
        {report && noting && (
          <Suspense fallback={null}>
            <ReportNoteSheet report={report} onClose={() => this.setState({ noting: false })} />
          </Suspense>
        )}
      </div>
    )
  }
}
