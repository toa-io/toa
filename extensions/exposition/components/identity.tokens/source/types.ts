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
  revokedAt?: number
}

export interface Identity extends Record<string, any> {
  id: string
}

export interface AuthenticateInput {
  authority: string
  credentials: string
}

export interface AuthenticateOutput {
  identity: Identity
  refresh: boolean
}

export interface EncryptInput {
  authority: string
  identity: Identity
  lifetime?: number
}

export interface DecryptOutput {
  authority: string
  identity: Identity
  iat: string
  exp?: string
  refresh: boolean
}

export interface Claims {
  identity: Identity
  iss: string
  iat: string
  exp?: string
}
