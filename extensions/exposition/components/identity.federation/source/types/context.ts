import { type Call, type Observation, type Query } from '@toa.io/types'
import type { Entity } from './entity'
import type { Configuration } from './configuration'

export interface Context {
  local: {
    observe: Observation<Entity & { id: string }>
    transit: Call<TransitOutput, TransitInput>
    ensure: Call<EnsureOutput>
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
  aud: string
  exp: number
  iat: number
  nbf?: number
}

export interface AuthenticateInput {
  authority: string
  credentials: string
}

export interface AuthenticateOutput {
  identity: {
    id: string
  }
}
