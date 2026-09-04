export * from './toa.d.ts'

// What a manifest does not state belongs here, and every run keeps it.

import type { Logs } from '@toa.io/extensions.telemetry'
import type { AuthenticateOutput, Component, Configuration, DecryptOutput } from './toa.js'

/** Who the token is for, as it travels: the claim set the gateway is written against. */
export type Identity = AuthenticateOutput['identity']

/** A key as it is configured: the secret and the form it is used in. */
export type ConfiguredKey = Configuration['keys'][number]

/** A key as `identity.keys` keeps it. */
export interface Key {
  id: string
  key: string
  label: string
}

/** A key issued for one identity, which revoking it invalidates every token under. */
export interface CustomKey extends Key {
  identity: string
  revokedAt?: number
}

/** What a token carries, before it is encoded. */
export interface Claims {
  identity: Identity
  iss: string
  iat: string
  exp?: string
}

/** The same, as JWE writes the times. */
export interface JWEClaims extends Omit<Claims, 'iat' | 'exp'> {
  iat: number
  exp?: number
}

/** What this component is given: its own operations, and the two it reads keys and roles from. */
export interface Context {
  local: Component
  remote: {
    identity: {
      keys: {
        observe: (request: { query: { id?: string, criteria?: string } }) => Promise<CustomKey | null>
        create: (request: {
          input: { identity: string, label?: string, expires?: number }
        }) => Promise<Key>
      }
      roles: {
        list: (request: { query: { criteria: string, limit?: number } }) => Promise<string[]>
      }
    }
  }
  configuration: Configuration
  logs: Logs
}

export type { DecryptOutput }
