export * from './toa.js'

// What a manifest does not state belongs here, and every run keeps it.

import type { Query, RemoteError } from '@toa.io/core'
import type { Component, Configuration } from './toa.js'

/** Credentials whose Identity is granted the `system` role. */
export type Principal = NonNullable<Configuration['principal']>

/** What this component is given: its own operations, and the two it revokes through. */
export interface Context {
  local: Component
  remote: {
    identity: {
      tokens: { revoke: (request: { query: Query }) => Promise<null | RemoteError> }
      keys: { revoke: (request: { input: { identity: string } }) => Promise<null | RemoteError> }
    }
  }
  configuration: Configuration
}
