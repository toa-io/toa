import type { JWTPayload } from 'jose'
import type { Call, Observation, Query, telemetry } from '@toa.io/types'
import type { Entity } from './entity'
import type { Configuration } from './configuration'

export interface Context {
  local: {
    observe: Observation<Entity>
    transit: Call<TransitOutput, TransitInput>
    ensure: Call<EnsureOutput>
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

export interface TransitInput {
  readonly authority: string
  readonly iss: string
  readonly sub: string
}

export interface TransitOutput {
  id: string
}

export interface EnsureOutput {
  id: string
}

interface IdentityTokensRevokeInput {
  query: Query
}
