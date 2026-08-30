import type { Input } from '../../../../../io'
import type { Component } from './Component'

/**
 * The authenticated identity, or nothing when the request carries none.
 *
 * Anonymous requests therefore share one quota between them; `ip` is the component
 * that tells them apart.
 */
export class Identity implements Component {
  public get (context: Input): string {
    return (context as AuthenticatedContext).identity?.id ?? ''
  }
}

// declared here rather than imported from `auth`, the way `cache` does it
interface AuthenticatedContext extends Input {
  identity?: { id?: string } | null
}
