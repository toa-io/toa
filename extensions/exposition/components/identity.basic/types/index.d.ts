export * from './toa.d.ts'

// What a manifest does not state belongs here, and every run keeps it.

import type { Query, CodedError } from '@toa.io/core/types'
import type { Component, Configuration } from './toa.d.ts'

/** Credentials whose Identity is granted the `system` role. */
export type Principal = NonNullable<Configuration['principal']>

/** What this component is given: its own operations, and the ones it calls. */
export interface Context {
  local: Component
  remote: {
    identity: {
      tokens: { revoke: (request: { query: Query }) => Promise<null | CodedError> }
      keys: {
        revoke: (request: { input: { identity: string } }) => Promise<null | CodedError>
      }
      roles: {
        principal: (request: { input: { id: string } }) => Promise<null | CodedError>
      }
    }
  }
  configuration: Configuration
}
