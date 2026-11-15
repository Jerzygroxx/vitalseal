import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

/**
 * Keeps a purely decorative part of the UI (the space backdrop) from taking the whole app
 * down if it throws: on error it renders nothing and the app carries on.
 */
export class SafeBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
