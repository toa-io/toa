import type { Call, Maybe, Observation } from '@toa.io/types'

export interface Context {
  local: {
    observe: Observation<Entity>
    decrypt: Call<Maybe<DecryptOutput>, string>
  }
  configuration: Configuration
}

export interface Configuration {
  readonly keys: Record<string, string>
  readonly lifetime: number
  readonly refresh: number
}

export interface Entity {
  revokedAt?: number
}

export interface Identity extends Record<string, any> {
  id: string
  permissions?: Record<string, [string]>
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
  scopes?: string[]
  permissions?: Record<string, [string]>
}

export interface DecryptOutput {
  iss: string
  iat: string
  exp?: string
  identity: Identity
  refresh: boolean
}

export interface Claims {
  identity: Identity
  iss: string
  iat: string
  exp?: string
}

export interface Key {
  name: string
  value: string
}
