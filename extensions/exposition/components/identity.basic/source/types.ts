import { type Call, type Observation, type Query } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Entity>
    transit: Call<TransitOutput, TransitInput>
  }
  remote: {
    identity: {
      tokens: {
        revoke: Call<unknown, IdentityTokensRevokeInput>
      }
    }
  }
  configuration: {
    readonly rounds: number
    readonly pepper: string
  }
}

interface Entity {
  id: string
  username: string
  password: string
}

export interface TransitInput {
  id: string
  username?: string
  password?: string
}

interface TransitOutput {
  id: string
}

interface IdentityTokensRevokeInput {
  query: Query
}
