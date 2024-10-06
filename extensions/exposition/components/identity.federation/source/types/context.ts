import { type Call, type Observation, type Query } from '@toa.io/types'
import type { Entity } from './entity'
import type { Configuration } from './configuration'

export interface Context {
  local: {
    observe: Observation<Entity>
    transit: Call<TransitOutput, TransitInput>
    ensure: Call<EnsureOutput>
    decode: Call<IdToken, string>
  }
  remote: {
    identity: {
      tokens: {
        revoke: Call<void, IdentityTokensRevokeInput>
      }
    }
  }
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

export interface JwtHeader {
  typ?: string
  alg: string
  kid?: string
}

/**
 * @see {@link https://openid.net/specs/openid-connect-core-1_0.html#IDToken}
 */
export interface IdToken {
  iss: string
  sub: string
  aud: string | string[]
  exp: number
  iat: number
  nbf?: number
}
