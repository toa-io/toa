import type { JWTPayload } from 'jose'
import type { Call, Observation, Query, Transition } from '@toa.io/core'
import type { Logs } from '@toa.io/extensions.telemetry'
import type { Entity } from './entity.js'
import type { Configuration } from './configuration.js'

export interface Context {
  fetch: Fetch
  local: {
    observe: Observation<Entity>
    enumerate: Observation<Entity[], never, Entity>
    terminate: Transition<void, void, Entity>
    transit: Call<Entity, TransitInput>
    ensure: Call<Entity>
    decode: Call<JWTPayload, string>
  }
  remote: {
    identity: {
      tokens: {
        revoke: Call<void, IdentityTokensRevokeInput>
      }
      roles: {
        principal: Call<void, { id: string }>
      }
    }
  }
  logs: Logs
  configuration: Configuration
}

export type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

export interface TransitInput {
  readonly authority: string
  readonly iss: string
  readonly sub: string
  readonly identity: string
}

interface IdentityTokensRevokeInput {
  query: Query
}
