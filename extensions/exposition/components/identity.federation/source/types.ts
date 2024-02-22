import { type Call, type Observation, type Query } from '@toa.io/types'
import type { Schemas } from './schemas'

export interface Context {
  local: {
    observe: Observation<Entity & { id: string }>
    transit: Call<TransitOutput, TransitInput>
  }
  remote: {
    identity: {
      tokens: {
        revoke: Call<void, IdentityTokensRevokeInput>
      }
    }
  }
  configuration: Required<Schemas>['configuration']
}

export type Entity = Required<Schemas>['entity']

export interface TransitInput {
  readonly iss: string
  readonly sub: string
}

export interface TransitOutput {
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

export interface AuthenticateOutput {
  identity: {
    id: string
  }
}
