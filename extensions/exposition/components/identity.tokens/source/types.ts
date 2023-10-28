import { type Call, type Maybe, type Observation } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Entity>
    decrypt: Call<Maybe<DecryptOutput>, string>
  }
  configuration: Configuration
}

export interface Configuration {
  readonly key0: string
  readonly key1?: string
  readonly lifetime: number
  readonly refresh: number
}

export interface Entity {
  identity: string
  revokedAt: number
}

export interface Identity extends Record<string, any> {
  id: string
}

export interface AuthenticateOutput {
  identity: Identity
  refresh: boolean
}

export interface EncryptInput {
  identity: Identity
  lifetime?: number
}

export interface DecryptOutput {
  identity: Identity
  iat: string
  exp?: string
  refresh: boolean
}

export interface Claim {
  identity: Identity
  iat: string
  exp?: string
}
