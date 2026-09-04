export * from './toa.d.ts'

// What a manifest does not state belongs here, and every run keeps it.

import type { Query } from '@toa.io/core'
import type { Logs } from '@toa.io/extensions.telemetry'
import type { Stash } from '@toa.io/extensions.stash'
import type { Component, Configuration } from './toa.js'

/** A client as `identity.clients` describes it. */
export interface Client {
  client_id: string
  client_name?: string
  redirect_uris: string[]
  permitted?: boolean
}

/** What is held against an authorization code until it is redeemed. */
export interface Code {
  identity: string
  client: string
  redirect: string
  challenge: string
  scope: string[]
  resource: string[]
}

/** What this component is given: its own operations, and the three it grants through. */
export interface Context {
  stash: Stash
  logs: Logs
  local: Component
  remote: {
    identity: {
      clients: {
        describe: (request: {
          input: { authority: string, id: string, redirect?: string }
        }) => Promise<Client>
      }
      tokens: {
        issue: (request: {
          input: {
            authority: string
            identity: string
            label: string
            lifetime?: number
            scopes?: string[]
            permissions?: Record<string, string[]>
          }
        }) => Promise<{ kid: string, exp?: number, token: string }>
      }
      keys: {
        disable: (request: { query: Query }) => Promise<null>
      }
    }
  }
  configuration: Configuration
}

export type { Query }
