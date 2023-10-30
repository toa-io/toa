import { type Call, type Maybe, type Observation, type Query } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Maybe<Entity>>
    transit: Call<TransitOutput, TransitInput>
  }
  remote: {
    identity: {
      tokens: {
        revoke: Call<void, IdentityTokensRevokeInput>
      }
    }
  }
  configuration: {
    readonly rounds: number
    readonly pepper: string
    readonly principal?: string
    readonly username: string | string[]
    readonly password: string | string[]
  }
}

export interface Entity {
  readonly id: string
  readonly _version: number
  username: string
  password: string
}

export interface TransitInput {
  username?: string
  password?: string
}

export interface TransitOutput {
  id: string
}

interface IdentityTokensRevokeInput {
  query: Query
}
