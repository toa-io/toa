import { type Call, type Maybe, type Observation, type Query } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Maybe<Entity>>
    transit: Call<Output, Input>
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
  authority: string
  username: string
  password: string
}

export interface Input {
  authority: string
  username?: string
  password?: string
}

export interface Output {
  id: string
}

interface IdentityTokensRevokeInput {
  query: Query
}
