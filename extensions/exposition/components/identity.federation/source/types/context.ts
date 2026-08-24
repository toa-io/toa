import type { JWTPayload } from 'jose'
import type { Call, Observation, Query, telemetry, Transition } from '@toa.io/types'
import type { Entity } from './entity'
import type { Configuration } from './configuration'

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
    }
  }
  logs: telemetry.Logs
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
