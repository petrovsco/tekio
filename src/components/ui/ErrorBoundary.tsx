import { Component } from 'react'
import type { ReactNode } from 'react'
import { Btn } from './Button'

// Without a boundary, any render error unmounts the whole tree and leaves a
// white page with nothing to tap. This is the floor under everything: a line
// saying what happened and the one action that fixes it.

interface State { error: Error | null }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="min-h-svh flex flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-sm text-ink">Something went wrong loading this screen.</p>
        <p className="text-xs text-ink-3 max-w-[320px]">{this.state.error.message}</p>
        <Btn onClick={() => window.location.reload()}>Reload</Btn>
      </div>
    )
  }
}
