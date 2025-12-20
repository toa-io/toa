import { type Call, type Maybe, type Observation, type Query } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Maybe<Entity>>
    transit: Call<IdOutput, TransitInput>
    create: Call<IdOutput, TransitInput>
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
    readonly username: string[]
    readonly password: string[]
  }
}

export interface Entity {
  id: string
  authority: string
  username: string
  password: string
  readonly _version: number
}

export interface TransitInput {
  authority: string
  username?: string
  password?: string
  inception?: boolean
}

export interface AddInput {
  id: string
  authority: string
  username: string
  password: string
}

export interface IdOutput {
  id: string
}

interface IdentityTokensRevokeInput {
  query: Query
}
